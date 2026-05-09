# ============================================================
# Processing Services — RAG + LLM pipelines
# ============================================================
import json
import re
import time

from services.rag_engine import retrieve_context
from services.llm_service import (
    get_chain,
    EXTRACTION_PROMPT,
    SOAP_NOTES_PROMPT,
    PRESCRIPTION_PROMPT,
    QA_PROMPT,
    llm,
)


def clean_json(raw: str) -> str:
    """Strip markdown fences and extract clean JSON"""
    cleaned = re.sub(r"```(?:json)?\s*\n?", "", raw)
    cleaned = cleaned.replace("```", "").strip()
    start   = cleaned.find("{")
    end     = cleaned.rfind("}") + 1
    if start != -1 and end > start:
        cleaned = cleaned[start:end]
    return cleaned.strip()


async def extract_medical_data(transcript: str) -> dict:
    context = retrieve_context(
        f"medical history symptoms diagnosis medications {transcript[:400]}"
    )
    chain     = get_chain(EXTRACTION_PROMPT)
    raw       = await chain.ainvoke({"context": context, "transcript": transcript})
    try:
        return json.loads(clean_json(raw))
    except json.JSONDecodeError as e:
        print(f"⚠️  Extraction parse error: {e} | raw[:200]: {raw[:200]}")
        return {
            "error":       "parse_failed",
            "symptoms":    [], "diagnoses": [], "medications": [],
            "vital_signs": {}, "investigations": [], "allergies": [],
            "follow_up":   {"timing": None, "instructions": None, "red_flags": []},
        }


async def generate_soap_notes(
    transcript: str,
    extracted_data: dict,
    model_name: str,
) -> str:
    diagnoses_text = " ".join(
        d.get("name", "") for d in extracted_data.get("diagnoses", [])
    )
    context = retrieve_context(f"SOAP note clinical documentation {diagnoses_text}")
    chain   = get_chain(SOAP_NOTES_PROMPT)
    return await chain.ainvoke({
        "context":        context,
        "transcript":     transcript,
        "extracted_data": json.dumps(extracted_data, indent=2),
        "model_name":     model_name,
    })


async def generate_prescription(transcript: str, extracted_data: dict) -> dict:
    medications = extracted_data.get("medications", [])
    diagnoses   = extracted_data.get("diagnoses",   [])
    allergies   = extracted_data.get("allergies",   [])

    if not medications:
        return {
            "medications":            [],
            "investigations_ordered": [],
            "note":                   "No medications prescribed in this consultation",
            "allergy_summary":        f"Allergies: {', '.join(allergies) or 'None documented'}",
        }

    med_names  = " ".join(m.get("name", "") for m in medications)
    diag_names = " ".join(d.get("name", "") for d in diagnoses)

    # ── RAG lookup 1: Drug dosing & prescription reference ──
    drug_context = retrieve_context(
        f"prescription medications dosing warnings {med_names}"
    )

    # ── RAG lookup 2: Do's & don'ts, patient counselling ────
    # This ensures do's/don'ts are always populated from the
    # knowledge base even if the transcript has no such discussion
    dos_donts_context = retrieve_context(
        f"do's don'ts patient advice counselling lifestyle warnings "
        f"side effects instructions {med_names} {diag_names}"
    )

    # ── RAG lookup 3: Lifestyle advice for diagnosis ─────────
    lifestyle_context = retrieve_context(
        f"lifestyle advice diet exercise smoking alcohol {diag_names}"
    )

    # Merge all three contexts for the LLM
    combined_context = (
        f"{drug_context}\n\n"
        f"--- Patient Counselling, Do's & Don'ts ---\n{dos_donts_context}\n\n"
        f"--- Lifestyle & General Advice ---\n{lifestyle_context}"
    )

    chain = get_chain(PRESCRIPTION_PROMPT)
    raw   = await chain.ainvoke({
        "context":     combined_context,
        "transcript":  transcript,
        "medications": json.dumps(medications, indent=2),
        "diagnoses":   json.dumps(diagnoses,   indent=2),
        "allergies":   json.dumps(allergies),
    })

    try:
        result = json.loads(clean_json(raw))

        # ── Post-processing: ensure every medication has do's & don'ts ──
        # If LLM left dos_and_donts empty for any medication,
        # fill it from a targeted knowledge base lookup
        for med in result.get("medications", []):
            dd = med.get("dos_and_donts", {})
            has_dos   = bool(dd.get("dos"))
            has_donts = bool(dd.get("donts"))

            if not has_dos or not has_donts:
                print(f"⚠️  dos_and_donts missing for {med.get('name')} — fetching from KB")
                kb_context = retrieve_context(
                    f"do's don'ts advice instructions warnings {med.get('name', '')} "
                    f"patient counselling side effects"
                )
                # Ask LLM specifically for this one medication's do's & don'ts
                fallback_chain = get_chain(PRESCRIPTION_PROMPT)
                fallback_raw   = await fallback_chain.ainvoke({
                    "context":     kb_context,
                    "transcript":  transcript,
                    "medications": json.dumps([med], indent=2),
                    "diagnoses":   json.dumps(diagnoses, indent=2),
                    "allergies":   json.dumps(allergies),
                })
                try:
                    fallback = json.loads(clean_json(fallback_raw))
                    fallback_meds = fallback.get("medications", [])
                    if fallback_meds:
                        fb_dd = fallback_meds[0].get("dos_and_donts", {})
                        if not has_dos:
                            med.setdefault("dos_and_donts", {})["dos"]   = fb_dd.get("dos", [])
                        if not has_donts:
                            med.setdefault("dos_and_donts", {})["donts"] = fb_dd.get("donts", [])
                except (json.JSONDecodeError, IndexError):
                    print(f"⚠️  Fallback parse failed for {med.get('name')}")

        # ── Post-processing: ensure general_lifestyle_advice exists ──
        if not result.get("general_lifestyle_advice"):
            print("⚠️  general_lifestyle_advice missing — fetching from KB")
            result["general_lifestyle_advice"] = _get_lifestyle_advice_from_kb(
                med_names, diag_names
            )

        return result

    except json.JSONDecodeError:
        return {"error": "parse_failed", "medications": medications}


def _get_lifestyle_advice_from_kb(med_names: str, diag_names: str) -> dict:
    """
    Synchronous fallback: pull lifestyle do's & don'ts directly
    from the knowledge base without an extra LLM call.
    Returns a structured dict with 'dos' and 'donts' lists.
    """
    context = retrieve_context(
        f"lifestyle advice diet exercise smoking alcohol do's don'ts "
        f"patient counselling {med_names} {diag_names}",
        k=3,
    )

    # Parse out Do's and Don'ts sentences from the retrieved KB text
    dos, donts = [], []
    for line in context.splitlines():
        line = line.strip()
        if not line:
            continue
        lower = line.lower()
        if lower.startswith("do'") or lower.startswith("- do") or lower.startswith("do:"):
            dos.append(line.lstrip("- "))
        elif lower.startswith("don't") or lower.startswith("- don't") or lower.startswith("avoid"):
            donts.append(line.lstrip("- "))

    # Provide generic fallbacks if parsing found nothing
    if not dos:
        dos = [
            "Follow the prescribed medication schedule consistently",
            "Maintain a balanced diet and stay well hydrated",
            "Attend all scheduled follow-up appointments",
            "Report any new or worsening symptoms to your doctor",
        ]
    if not donts:
        donts = [
            "Do not stop medications without consulting your doctor",
            "Avoid alcohol unless cleared by your doctor",
            "Do not self-medicate or adjust doses on your own",
            "Avoid smoking — it worsens most medical conditions",
        ]

    return {"dos": dos, "donts": donts}


async def answer_question(transcript: str, question: str) -> str:
    context = retrieve_context(question, k=3)
    chain   = get_chain(QA_PROMPT)
    return await chain.ainvoke({
        "context":    context,
        "transcript": transcript,
        "question":   question,
    })