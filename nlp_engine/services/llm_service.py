# ============================================================
# LLM Service — Groq LLaMA + Prompt Templates
# ============================================================
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

# Shared LLM instance (initialized at startup)
llm: ChatGroq = None


def init_llm(api_key: str, model: str) -> None:
    """Initialize Groq LLM — called once at startup"""
    global llm
    llm = ChatGroq(
        api_key=api_key,
        model_name=model,
        temperature=0.1,
        max_tokens=1500,
    )
    print(f"✅ Groq LLM ready: {model}")


# ── Prompt Templates ───────────────────────────────────────

EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are MedScribe AI, a clinical documentation specialist.
Extract structured medical information from a doctor-patient consultation transcript.

Medical Knowledge Context:
{context}

STRICT RULES:
1. Extract ALL medical data mentioned: symptoms, vitals, diagnoses, medications.
2. If a doctor mentions a medication name, extract it even if dose is missing.
3. Use null for missing specific fields like dose but keep the medication name.
4. Never infer or hallucinate medical data not in the transcript.
5. Return ONLY valid JSON — no markdown, no preamble, no explanation."""),

    ("human", """Extract all medical information from this transcript.

TRANSCRIPT:
{transcript}

Return this exact JSON (no markdown, no extra text):
{{
  "patient_info": {{
    "chief_complaint": "string or null",
    "age_mentioned": "string or null",
    "gender_mentioned": "string or null"
  }},
  "symptoms": [
    {{
      "name": "string",
      "duration": "string or null",
      "severity": "string or null",
      "location": "string or null",
      "onset": "string or null"
    }}
  ],
  "vital_signs": {{
    "blood_pressure": "string or null",
    "heart_rate": "string or null",
    "temperature": "string or null",
    "spo2": "string or null",
    "weight": "string or null"
  }},
  "diagnoses": [
    {{
      "name": "string",
      "icd10_code": "string or null",
      "type": "primary or differential",
      "confidence": "confirmed or suspected or possible"
    }}
  ],
  "medications": [
    {{
      "name": "string",
      "generic_name": "string or null",
      "dose": "string or null",
      "frequency": "string or null",
      "duration": "string or null",
      "route": "string or null",
      "instructions": "string or null",
      "status": "new or continue or stop"
    }}
  ],
  "investigations": [
    {{
      "name": "string",
      "type": "lab or imaging or other",
      "status": "ordered or resulted",
      "result": "string or null"
    }}
  ],
  "allergies": ["string"],
  "past_medical_history": ["string"],
  "follow_up": {{
    "timing": "string or null",
    "instructions": "string or null",
    "red_flags": ["string"]
  }}
}}""")
])


SOAP_NOTES_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are MedScribe AI, a clinical documentation specialist.
Generate a professional SOAP note from the consultation data provided.

Medical References:
{context}

RULES:
- Use proper medical terminology
- Only document what is in the transcript
- Mark missing critical items as [NOT DOCUMENTED]
- Be concise — stay under 800 words total"""),

    ("human", """Generate a SOAP note from:

TRANSCRIPT:
{transcript}

EXTRACTED DATA:
{extracted_data}

Format:

**SUBJECTIVE:**
Chief Complaint: [CC]
History of Present Illness: [HPI]
Past Medical History: [PMH]
Allergies: [list or NKDA]

**OBJECTIVE:**
Vital Signs: [all documented vitals]
Physical Examination: [findings or NOT DOCUMENTED]

**ASSESSMENT:**
Primary Diagnosis: [with ICD-10 if available]
Clinical Reasoning: [brief]

**PLAN:**
Medications: [numbered list with dosing]
Investigations: [if ordered]
Follow-up: [timing and instructions]

---
*AI-Generated — Requires physician review*
*MedScribe AI | {model_name}*""")
])


PRESCRIPTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are MedScribe AI, a clinical documentation specialist.
Generate a structured prescription from consultation data.

Drug Reference:
{context}

SAFETY RULES:
1. NEVER add medications not mentioned in the transcript or medications list
2. Include dosing for every medication
3. Return ONLY valid JSON — no markdown, no explanation"""),

    ("human", """Generate prescription from:

TRANSCRIPT:
{transcript}

PRESCRIBED MEDICATIONS:
{medications}

DIAGNOSES:
{diagnoses}

PATIENT ALLERGIES:
{allergies}

Return this exact JSON (no markdown):
{{
  "medications": [
    {{
      "name": "string",
      "generic_name": "string or null",
      "brand_examples": ["string"],
      "strength": "string or null",
      "dosage_form": "tablet or capsule or syrup or injection or inhaler or cream",
      "dose": "string",
      "route": "oral or IV or IM or topical or inhaled",
      "frequency": "string",
      "duration": "string",
      "quantity_to_dispense": "string or null",
      "instructions": "string",
      "warnings": ["string"],
      "allergy_flag": "string or null"
    }}
  ],
  "investigations_ordered": ["string"],
  "follow_up": "string or null",
  "prescriber_notes": "string or null",
  "allergy_summary": "string"
}}""")
])


QA_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are MedScribe AI, helping doctors review consultation records.
Answer questions about the consultation based on the transcript only.

Medical Context:
{context}

RULES:
- Answer based on transcript content only
- If not mentioned, say "Not discussed in this consultation"
- Be concise and clinically precise"""),

    ("human", """TRANSCRIPT:
{transcript}

QUESTION: {question}

Answer:""")
])


def get_chain(prompt: ChatPromptTemplate):
    """Build a simple LLM chain from a prompt template"""
    return prompt | llm | StrOutputParser()