import { Request, Response } from "express";
import multer from "multer";
import fetch from "node-fetch";
import dotenv from "dotenv";
import FormData from "form-data";
import { Router } from "express";

const router = Router();

// Load environment variables
dotenv.config();

// NLP Engine URL (Groq-powered FastAPI service)
const NLP_ENGINE_URL = (
  process.env.NLP_ENGINE_URL || "http://localhost:8000"
).replace(/\/$/, "");

console.log(`🔗 NLP Engine URL: ${NLP_ENGINE_URL}`);

// Configure multer with file size limit
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 25MB
  },
});

// Health check endpoint — also pings the NLP engine
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const nlpRes = await fetch(`${NLP_ENGINE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    const nlpHealth = await nlpRes.json();

    res.json({
      status: "ok",
      nlp_engine: nlpHealth,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.json({
      status: "ok",
      nlp_engine: { status: "unreachable" },
      timestamp: new Date().toISOString(),
    });
  }
});

// Helper: determine file extension from MIME type
const getExtension = (mime?: string): string => {
  if (!mime) return "webm";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
};

// NLP Engine transcription response interface
interface NLPTranscriptionResponse {
  success: boolean;
  transcript: string;
  language: string;
  duration: number | null;
}

// Transcription endpoint — proxies audio to NLP Engine (Groq Whisper)
router.post(
  "/transcribe",
  upload.single("audio"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      console.log("🚀 /transcribe called");

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "No audio file uploaded",
        });
      }

      console.log(
        `📥 Received file: ${file.originalname}, size: ${file.size} bytes`
      );

      const audioBuffer: Buffer = file.buffer;
      const mimeType: string | undefined = file.mimetype;
      const ext = getExtension(mimeType);

      console.log(
        `📝 Received audio: ${audioBuffer.length} bytes, Type: ${mimeType}`
      );

      // Build form data for the NLP Engine
      const formData = new FormData();
      formData.append("audio", audioBuffer, {
        filename: `recording.${ext}`,
        contentType: mimeType || "audio/webm",
      });
      formData.append("language", "en");

      console.log(`📤 Sending audio to NLP Engine: ${NLP_ENGINE_URL}/transcribe`);

      const response = await fetch(`${NLP_ENGINE_URL}/transcribe`, {
        method: "POST",
        headers: {
          ...formData.getHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ NLP Engine transcription error:",
          response.status,
          errorText
        );

        return res.status(response.status).json({
          success: false,
          error: "Transcription failed",
          details: errorText,
        });
      }

      // Parse NLP Engine response
      const rawData: unknown = await response.json();
      const data = rawData as NLPTranscriptionResponse;

      console.log("✅ Transcription:", data.transcript?.slice(0, 80), "...");
      console.log("🌍 Language:", data.language);
      console.log("⏱️  Duration:", data.duration, "seconds");

      // Map to the shape the frontend expects (text, language, words)
      res.json({
        success: true,
        text: data.transcript,
        language: data.language,
        duration: data.duration,
        words: [], // Groq Whisper doesn't return word-level timestamps in this mode
      });
    } catch (err) {
      const error = err as Error;
      console.error("❌ Transcription proxy error:", error.message);

      // Distinguish NLP engine connection errors from other failures
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("fetch failed")
      ) {
        return res.status(503).json({
          success: false,
          error:
            "NLP Engine is not running. Start it with: cd nlp_engine && python main.py",
          details: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;