# ============================================================
# Processing Services — RAG + LLM pipelines
# ============================================================
import json
import re

from services.rag_engine import retrieve_context
from services.llm_service import (
    get_chain,
    EXTRACTION_PROMPT,
    SOAP_NOTES_PROMPT,
    PRESCRIPTION_PROMPT,
    QA_PROMPT,
)

# Max chars sent to LLM to stay under token limits
# llama-3.3-70b-versatile has 6000 TPM on free tier
# ~4 chars per token → 1500 tokens for transcript = 6000 chars safe limit
MAX_TRANSCRIPT_CHARS = 4000


def clean_json(raw: str) -> str:
    """Strip markdown fences and extract clean JSON"""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw)
    cleaned = cleaned.replace("```", "").strip()
    start = cleaned.find("{")
    end   = cleaned.rfind("}") + 1
    if start != -1 and end > start:
        cleaned = cleaned[start:end]
    return cleaned.strip()


def truncate_transcript(transcript: str, max_chars: int = MAX_TRANSCRIPT_CHARS) -> str:
    """Truncate transcript to stay within token limits"""
    if len(transcript) <= max_chars:
        return transcript
    print(f"⚠️  Transcript truncated: {len(transcript)} → {max_chars} chars")
    return transcript[:max_chars] + "\n[...transcript truncated for length...]"


async def extract_medical_data(transcript: str) -> dict:
    # Use only first 200 chars for RAG query — just for context retrieval
    rag_query = f"medical history symptoms diagnosis medications {transcript[:200]}"
    context   = retrieve_context(rag_query)

    # Truncate transcript before sending to LLM
    truncated = truncate_transcript(transcript)

    chain = get_chain(EXTRACTION_PROMPT)
    raw   = await chain.ainvoke({
        "context":    context,
        "transcript": truncated,
    })

    # Debug log
    try:
        with open("debug_extract.log", "a", encoding="utf-8") as f:
            f.write("\n" + "=" * 50 + "\n")
            f.write(f"TRANSCRIPT LENGTH (original): {len(transcript)}\n")
            f.write(f"TRANSCRIPT LENGTH (sent to LLM): {len(truncated)}\n")
            f.write(f"RAW LLM OUTPUT:\n{raw}\n")
            f.write("=" * 50 + "\n")
    except Exception as e:
        print(f"Failed to write debug log: {e}")

    try:
        data = json.loads(clean_json(raw))

        # Normalize common LLM field name variations
        if "medication" in data and "medications" not in data:
            data["medications"] = data.pop("medication")
        if "diagnosis" in data and "diagnoses" not in data:
            data["diagnoses"] = data.pop("diagnosis")
        if "symptom" in data and "symptoms" not in data:
            data["symptoms"] = data.pop("symptom")

        # Ensure required arrays always exist
        data.setdefault("medications",         [])
        data.setdefault("diagnoses",           [])
        data.setdefault("symptoms",            [])
        data.setdefault("investigations",      [])
        data.setdefault("allergies",           [])
        data.setdefault("past_medical_history",[])
        data.setdefault("vital_signs",         {})
        data.setdefault("follow_up", {
            "timing": None,
            "instructions": None,
            "red_flags": [],
        })

        # Ensure medications are always dicts with a name field
        cleaned_meds = []
        for m in data["medications"]:
            if isinstance(m, str) and m.strip():
                cleaned_meds.append({"name": m, "dose": None,
                                     "frequency": None, "duration": None,
                                     "route": None, "instructions": None,
                                     "status": "new"})
            elif isinstance(m, dict) and m.get("name"):
                cleaned_meds.append(m)
        data["medications"] = cleaned_meds

        return data

    except json.JSONDecodeError as e:
        print(f"⚠️  Extraction parse error: {e} | raw[:300]: {raw[:300]}")
        return {
            "error":               "parse_failed",
            "symptoms":            [],
            "diagnoses":           [],
            "medications":         [],
            "vital_signs":         {},
            "investigations":      [],
            "allergies":           [],
            "past_medical_history":[],
            "follow_up": {
                "timing": None,
                "instructions": None,
                "red_flags": [],
            },
        }


async def generate_soap_notes(
    transcript: str,
    extracted_data: dict,
    model_name: str,
) -> str:
    diagnoses_text = " ".join(
        d.get("name", "") for d in extracted_data.get("diagnoses", [])
    )
    context = retrieve_context(
        f"SOAP note clinical documentation {diagnoses_text}"
    )
    chain = get_chain(SOAP_NOTES_PROMPT)

    truncated = truncate_transcript(transcript)

    return await chain.ainvoke({
        "context":        context,
        "transcript":     truncated,
        "extracted_data": json.dumps(extracted_data, indent=2)[:1000],
        "model_name":     model_name,
    })


async def generate_prescription(transcript: str, extracted_data: dict) -> dict:
    medications = extracted_data.get("medications", [])
    diagnoses   = extracted_data.get("diagnoses",   [])
    allergies   = extracted_data.get("allergies",   [])

    med_names  = " ".join(
        m.get("name", "") if isinstance(m, dict) else str(m)
        for m in medications
    )
    diag_names = " ".join(
        d.get("name", "") if isinstance(d, dict) else str(d)
        for d in diagnoses
    )

    # RAG context for drug dosing
    drug_context = retrieve_context(
        f"prescription medications dosing warnings {med_names} {diag_names}",
        k=3,
    )

    chain = get_chain(PRESCRIPTION_PROMPT)

    truncated = truncate_transcript(transcript, max_chars=2000)

    raw = await chain.ainvoke({
        "context":     drug_context,
        "transcript":  truncated,
        "medications": json.dumps(medications, indent=2),
        "diagnoses":   json.dumps(diagnoses,   indent=2),
        "allergies":   json.dumps(allergies),
    })

    try:
        result = json.loads(clean_json(raw))

        # Ensure required fields exist
        result.setdefault("medications",           medications)
        result.setdefault("investigations_ordered",[])
        result.setdefault("follow_up",             None)
        result.setdefault("prescriber_notes",      None)
        result.setdefault("allergy_summary",
            ", ".join(allergies) if allergies else "No known allergies")

        return result

    except json.JSONDecodeError as e:
        print(f"⚠️  Prescription parse error: {e} | raw[:300]: {raw[:300]}")
        # Return a valid fallback so frontend doesn't break
        return {
            "medications":           medications,
            "investigations_ordered":[],
            "follow_up":             None,
            "prescriber_notes":      "AI generation failed — please fill manually",
            "allergy_summary":
                ", ".join(allergies) if allergies else "No known allergies",
            "error":                 "parse_failed",
        }


async def answer_question(transcript: str, question: str) -> str:
    context = retrieve_context(question, k=3)
    chain   = get_chain(QA_PROMPT)

    truncated = truncate_transcript(transcript, max_chars=2000)

    return await chain.ainvoke({
        "context":    context,
        "transcript": truncated,
        "question":   question,
    })