import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import fetch from "node-fetch";
import dotenv from "dotenv";
import FormData from "form-data";
import { Router } from "express";

const router = Router();

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.ELEVENLABS_API_KEY) {
  console.error("❌ ELEVENLABS_API_KEY is not set in environment variables");
  process.exit(1);
}

// Configure multer with file size limit
const upload = multer({
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
});

// Health check endpoint
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
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

// ElevenLabs transcription response interface
interface ElevenLabsTranscriptionResponse {
  text: string;
  language_code: string;
  words?: unknown[];
}

// Transcription endpoint
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
    console.log(`📥 Received file: ${file.originalname}, size: ${file.size} bytes`);

    
      const audioBuffer: Buffer = file.buffer;
      const mimeType: string | undefined = file.mimetype;
      const ext = getExtension(mimeType);

      console.log(
        `📝 Received audio: ${audioBuffer.length} bytes, Type: ${mimeType}`
      );

      // Build form data
      const formData = new FormData();
      formData.append("file", audioBuffer, {
        filename: `recording.${ext}`,
        contentType: mimeType || "audio/webm",
      });
      formData.append("model_id", "scribe_v1");
      formData.append("language_code", "en"); // Force English
      formData.append("diarize", "true");     // Enable diarization

      console.log("📤 Sending audio to ElevenLabs (language: en)...");

      const response = await fetch(
        "https://api.elevenlabs.io/v1/speech-to-text",
        {
          method: "POST",
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
            ...formData.getHeaders(),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ ElevenLabs API Error:", response.status, errorText);

        return res.status(response.status).json({
          success: false,
          error: "Transcription failed",
          details: errorText,
        });
      }

      // Parse response and assert type
      const rawData: unknown = await response.json();
      const data = rawData as ElevenLabsTranscriptionResponse;

      console.log("✅ Transcription:", data.text);
      console.log("🌍 Language:", data.language_code);

      res.json({
        success: true,
        text: data.text,
        language: data.language_code,
        words: data.words,
      });
    } catch (err) {
      const error = err as Error;
      console.error("❌ Error:", error.message);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);



export default router;