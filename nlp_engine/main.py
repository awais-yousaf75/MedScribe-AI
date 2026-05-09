# ============================================================
# MedScribe AI — NLP Engine (Local)
# Run: python main.py
# ============================================================
import os
import time
import json
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional



# ── Load environment ───────────────────────────────────────
load_dotenv()

GROQ_API_KEY    = os.getenv("GROQ_API_KEY",    "")
PORT            = int(os.getenv("PORT",         "8000"))
GROQ_STT_MODEL  = os.getenv("GROQ_STT_MODEL",  "whisper-large-v3-turbo")
GROQ_LLM_MODEL  = os.getenv("GROQ_LLM_MODEL",  "llama-3.3-70b-versatile")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL",  "all-MiniLM-L6-v2")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not set in nlp-engine/.env")

# ── Import services ────────────────────────────────────────
from groq import Groq
import services.groq_stt    as stt_service
import services.rag_engine  as rag
import services.llm_service as llm_service
import services.processors  as proc
from knowledge_base.medical_kb import MEDICAL_KNOWLEDGE_BASE

# ── Startup / Shutdown ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize all services once at startup"""
    print("\n🚀 MedScribe AI NLP Engine starting...")

    # 1. Groq clients
    stt_service.groq_client = Groq(api_key=GROQ_API_KEY)
    print(f"✅ Groq STT client ready: {GROQ_STT_MODEL}")

    # 2. Groq LLM
    llm_service.init_llm(api_key=GROQ_API_KEY, model=GROQ_LLM_MODEL)

    # 3. FAISS vector store
    rag.build_vector_store(MEDICAL_KNOWLEDGE_BASE, EMBEDDING_MODEL)

    print(f"\n✅ Engine ready on http://localhost:{PORT}")
    print(f"   Docs: http://localhost:{PORT}/docs\n")

    yield  # App runs here

    # Cleanup (if needed)
    print("👋 Engine shutting down")


# ── FastAPI App ────────────────────────────────────────────
app = FastAPI(
    title="MedScribe AI — NLP Engine",
    description="Local Groq-powered medical documentation engine",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React frontend
        "http://localhost:5000",   # Express backend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request Models ─────────────────────────────────────────
class ExtractionRequest(BaseModel):
    transcript:      str
    consultation_id: Optional[str] = None

class NotesRequest(BaseModel):
    transcript:      str
    extracted_data:  Optional[dict] = None
    consultation_id: Optional[str]  = None

class PrescriptionRequest(BaseModel):
    transcript:      str
    extracted_data:  dict
    consultation_id: Optional[str] = None

class QARequest(BaseModel):
    transcript: str
    question:   str

class PipelineRequest(BaseModel):
    transcript:              str
    consultation_id:         Optional[str] = None
    generate_notes:          bool          = True
    generate_prescription:   bool          = True

# ─────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status":  "healthy",
        "engine":  "MedScribe AI NLP Engine v2.0 (Local)",
        "stt":     {"provider": "Groq", "model": GROQ_STT_MODEL},
        "llm":     {"provider": "Groq", "model": GROQ_LLM_MODEL},
        "embeddings": {"model": EMBEDDING_MODEL, "store": "FAISS"},
        "knowledge_base": {"documents": len(MEDICAL_KNOWLEDGE_BASE)},
        "timestamp": time.time(),
    }


@app.post("/transcribe")
async def transcribe(
    audio:    UploadFile = File(...),
    language: str        = Form(default="en"),
):
    audio_bytes = await audio.read()

    if not audio_bytes:
        raise HTTPException(400, "Empty audio file")
    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(413, f"File too large: {len(audio_bytes)/1024/1024:.1f}MB (max 25MB)")

    print(f"📨 Transcribe: {audio.filename} | {len(audio_bytes)/1024:.1f}KB")

    try:
        result = await stt_service.transcribe_audio(
            audio_bytes  = audio_bytes,
            filename     = audio.filename or "recording.webm",
            content_type = audio.content_type or "audio/webm",
            language     = language,
            stt_model    = GROQ_STT_MODEL,
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/extract")
async def extract(request: ExtractionRequest):
    if not request.transcript.strip():
        raise HTTPException(400, "Transcript is empty")
    if len(request.transcript) > 50000:
        raise HTTPException(400, "Transcript too long (max 50,000 chars)")

    print(f"📨 Extract: {len(request.transcript)} chars")

    start     = time.time()
    extracted = await proc.extract_medical_data(request.transcript)
    elapsed   = round(time.time() - start, 2)

    return {
        "success":                  True,
        "consultation_id":          request.consultation_id,
        "extracted_data":           extracted,
        "processing_time_seconds":  elapsed,
        "model":                    GROQ_LLM_MODEL,
    }


@app.post("/notes")
async def notes(request: NotesRequest):
    if not request.transcript.strip():
        raise HTTPException(400, "Transcript is empty")

    print(f"📨 Notes: consultation={request.consultation_id}")
    start = time.time()

    extracted = request.extracted_data
    if not extracted:
        extracted = await proc.extract_medical_data(request.transcript)

    soap_notes = await proc.generate_soap_notes(
        request.transcript, extracted, GROQ_LLM_MODEL
    )

    return {
        "success":                 True,
        "consultation_id":         request.consultation_id,
        "notes":                   soap_notes,
        "extracted_data":          extracted,
        "processing_time_seconds": round(time.time() - start, 2),
        "model":                   GROQ_LLM_MODEL,
    }


@app.post("/prescription")
async def prescription(request: PrescriptionRequest):
    if not request.transcript.strip():
        raise HTTPException(400, "Transcript is empty")

    print(f"📨 Prescription: consultation={request.consultation_id}")
    start = time.time()

    rx = await proc.generate_prescription(request.transcript, request.extracted_data)

    return {
        "success":                 True,
        "consultation_id":         request.consultation_id,
        "prescription":            rx,
        "processing_time_seconds": round(time.time() - start, 2),
        "model":                   GROQ_LLM_MODEL,
    }


@app.post("/ask")
async def ask(request: QARequest):
    if not request.transcript.strip():
        raise HTTPException(400, "Transcript is empty")
    if not request.question.strip():
        raise HTTPException(400, "Question is empty")

    print(f"📨 Q&A: '{request.question[:60]}'")
    start  = time.time()
    answer = await proc.answer_question(request.transcript, request.question)

    return {
        "success":                 True,
        "question":                request.question,
        "answer":                  answer,
        "processing_time_seconds": round(time.time() - start, 2),
        "model":                   GROQ_LLM_MODEL,
    }


@app.post("/pipeline")
async def pipeline(request: PipelineRequest):
    if not request.transcript.strip():
        raise HTTPException(400, "Transcript is empty")

    print(f"📨 Pipeline: notes={request.generate_notes} rx={request.generate_prescription}")
    start  = time.time()
    result = {"success": True, "consultation_id": request.consultation_id}

    # Step 1: Extract
    extracted = await proc.extract_medical_data(request.transcript)
    result["extracted_data"] = extracted

    # Step 2: SOAP Notes
    result["notes"] = (
        await proc.generate_soap_notes(request.transcript, extracted, GROQ_LLM_MODEL)
        if request.generate_notes else None
    )

    # Step 3: Prescription
    result["prescription"] = (
        await proc.generate_prescription(request.transcript, extracted)
        if request.generate_prescription and extracted.get("medications")
        else None
    )

    result["total_processing_time_seconds"] = round(time.time() - start, 2)
    result["model"] = GROQ_LLM_MODEL
    print(f"✅ Pipeline done: {result['total_processing_time_seconds']}s")

    return result


# ── Entry point ────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=PORT,
        reload=True,       # Auto-restart on code changes during dev
        log_level="info",
    )