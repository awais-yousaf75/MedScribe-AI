// ============================================================
// NLP Proxy Routes — Backend ↔ NLP Engine (FastAPI)
// All routes require authenticated doctor role.
// Proxies JSON requests to the Groq-powered NLP engine.
// ============================================================
import { Router, Request, Response } from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { authMiddleware, requireApprovedRole } from "../middleware/auth";

dotenv.config();

const router = Router();

// NLP Engine base URL
const NLP_ENGINE_URL = (
  process.env.NLP_ENGINE_URL || "http://localhost:8000"
).replace(/\/$/, "");

// ── Helper: proxy a JSON request to the NLP engine ────────
async function proxyToNLP(
  nlpPath: string,
  body: Record<string, unknown>,
  res: Response
): Promise<void> {
  try {
    const url = `${NLP_ENGINE_URL}${nlpPath}`;
    console.log(`🔀 Proxying to NLP Engine: POST ${url}`);

    const nlpRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = nlpRes.headers.get("content-type") || "";

    if (!nlpRes.ok) {
      // Forward the NLP engine's error response
      const errorBody = contentType.includes("application/json")
        ? await nlpRes.json()
        : await nlpRes.text();

      console.error(
        `❌ NLP Engine error on ${nlpPath}:`,
        nlpRes.status,
        errorBody
      );

      res.status(nlpRes.status).json({
        success: false,
        error: "NLP Engine processing failed",
        details:
          typeof errorBody === "string"
            ? errorBody
            : (errorBody as any)?.detail || JSON.stringify(errorBody),
      });
      return;
    }

    // Forward the successful JSON response as-is
    const data = await nlpRes.json();
    res.json(data);
  } catch (err) {
    const error = err as Error;
    console.error(`❌ NLP proxy error on ${nlpPath}:`, error.message);

    // NLP engine is down
    if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("fetch failed")
    ) {
      res.status(503).json({
        success: false,
        error:
          "NLP Engine is not running. Start it with: cd nlp_engine && python main.py",
        details: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// ── All NLP routes require authenticated & approved doctor ──
router.use(authMiddleware, requireApprovedRole("doctor"));

// ─────────────────────────────────────────────────────────
// GET /api/nlp/health — Check NLP engine status
// ─────────────────────────────────────────────────────────
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const nlpRes = await fetch(`${NLP_ENGINE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await nlpRes.json();
    res.json({ success: true, nlp_engine: data });
  } catch (err) {
    const error = err as Error;
    res.status(503).json({
      success: false,
      error: "NLP Engine is unreachable",
      details: error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/nlp/extract
// Body: { transcript: string, consultation_id?: string }
// Returns: extracted medical data (symptoms, diagnoses, etc.)
// ─────────────────────────────────────────────────────────
router.post("/extract", async (req: Request, res: Response) => {
  const { transcript, consultation_id } = req.body as {
    transcript?: string;
    consultation_id?: string;
  };

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({
      success: false,
      error: "transcript is required and cannot be empty",
    });
  }

  await proxyToNLP("/extract", { transcript, consultation_id }, res);
});

// ─────────────────────────────────────────────────────────
// POST /api/nlp/notes
// Body: { transcript: string, extracted_data?: object, consultation_id?: string }
// Returns: SOAP notes
// ─────────────────────────────────────────────────────────
router.post("/notes", async (req: Request, res: Response) => {
  const { transcript, extracted_data, consultation_id } = req.body as {
    transcript?: string;
    extracted_data?: Record<string, unknown>;
    consultation_id?: string;
  };

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({
      success: false,
      error: "transcript is required and cannot be empty",
    });
  }

  await proxyToNLP(
    "/notes",
    { transcript, extracted_data: extracted_data || null, consultation_id },
    res
  );
});

// ─────────────────────────────────────────────────────────
// POST /api/nlp/prescription
// Body: { transcript: string, extracted_data: object, consultation_id?: string }
// Returns: structured prescription JSON
// ─────────────────────────────────────────────────────────
router.post("/prescription", async (req: Request, res: Response) => {
  const { transcript, extracted_data, consultation_id } = req.body as {
    transcript?: string;
    extracted_data?: Record<string, unknown>;
    consultation_id?: string;
  };

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({
      success: false,
      error: "transcript is required and cannot be empty",
    });
  }

  if (!extracted_data || typeof extracted_data !== "object") {
    return res.status(400).json({
      success: false,
      error: "extracted_data is required (run /extract first)",
    });
  }

  await proxyToNLP(
    "/prescription",
    { transcript, extracted_data, consultation_id },
    res
  );
});

// ─────────────────────────────────────────────────────────
// POST /api/nlp/ask
// Body: { transcript: string, question: string }
// Returns: AI answer based on transcript + medical KB
// ─────────────────────────────────────────────────────────
router.post("/ask", async (req: Request, res: Response) => {
  const { transcript, question } = req.body as {
    transcript?: string;
    question?: string;
  };

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({
      success: false,
      error: "transcript is required and cannot be empty",
    });
  }

  if (!question || !question.trim()) {
    return res.status(400).json({
      success: false,
      error: "question is required and cannot be empty",
    });
  }

  await proxyToNLP("/ask", { transcript, question }, res);
});

// ─────────────────────────────────────────────────────────
// POST /api/nlp/pipeline
// Body: {
//   transcript: string,
//   consultation_id?: string,
//   generate_notes?: boolean (default true),
//   generate_prescription?: boolean (default true)
// }
// Returns: extracted_data + notes + prescription in one call
// ─────────────────────────────────────────────────────────
router.post("/pipeline", async (req: Request, res: Response) => {
  const {
    transcript,
    consultation_id,
    generate_notes = true,
    generate_prescription = true,
  } = req.body as {
    transcript?: string;
    consultation_id?: string;
    generate_notes?: boolean;
    generate_prescription?: boolean;
  };

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({
      success: false,
      error: "transcript is required and cannot be empty",
    });
  }

  await proxyToNLP(
    "/pipeline",
    { transcript, consultation_id, generate_notes, generate_prescription },
    res
  );
});

export default router;
