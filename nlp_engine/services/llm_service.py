# ============================================================
# LLM Service — Groq Llama + Prompt Templates
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
        temperature=0.2,
        max_tokens=4096,
    )
    print(f"✅ Groq LLM ready: {model}")


# ── Prompt Templates ───────────────────────────────────────

EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are MedScribe AI, a clinical documentation specialist.
Extract structured medical information from a doctor-patient consultation transcript.

Medical Knowledge Context:
{context}

STRICT RULES:
1. Extract ONLY information explicitly stated in the transcript
2. Never infer or hallucinate medical data
3. Use null for missing fields — never guess
4. Return ONLY valid JSON — no markdown, no explanation"""),

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
      "character": "string or null",
      "onset": "string or null",
      "aggravating_factors": "string or null",
      "relieving_factors": "string or null"
    }}
  ],
  "vital_signs": {{
    "blood_pressure": "string or null",
    "heart_rate": "string or null",
    "respiratory_rate": "string or null",
    "temperature": "string or null",
    "spo2": "string or null",
    "weight": "string or null",
    "height": "string or null",
    "bmi": "string or null",
    "blood_glucose": "string or null"
  }},
  "diagnoses": [
    {{
      "name": "string",
      "icd10_code": "string or null",
      "type": "primary or differential or rule_out",
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
      "status": "new or continue or stop or change"
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
  "social_history": {{
    "smoking": "string or null",
    "alcohol": "string or null",
    "occupation": "string or null",
    "other": "string or null"
  }},
  "follow_up": {{
    "timing": "string or null",
    "instructions": "string or null",
    "red_flags": ["string"]
  }},
  "referrals": [
    {{
      "specialty": "string",
      "reason": "string or null",
      "urgency": "routine or urgent or emergency"
    }}
  ]
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
- Use standard abbreviations (PRN, BD, TDS, PO, etc.)"""),

    ("human", """Generate a complete SOAP note from:

TRANSCRIPT:
{transcript}

EXTRACTED DATA:
{extracted_data}

Format:

**SUBJECTIVE:**
Chief Complaint: [CC]
History of Present Illness: [HPI]
Past Medical History: [PMH]
Current Medications: [list]
Allergies: [list or NKDA]
Social History: [relevant]

**OBJECTIVE:**
Vital Signs: [all documented vitals]
Physical Examination: [findings or NOT DOCUMENTED]
Investigations/Results: [results if discussed]

**ASSESSMENT:**
Primary Diagnosis: [with ICD-10]
Differential Diagnoses: [if mentioned]
Clinical Reasoning: [brief]

**PLAN:**
Medications:
[numbered list with full dosing]

Investigations Ordered:
[numbered list]

Referrals: [if any]
Patient Education: [what patient was told]
Follow-up: [timing and instructions]
Red Flags to Return: [emergency warning signs]

---
*AI-Generated — Requires physician review and countersignature*
*MedScribe AI | {model_name}*""")
])


PRESCRIPTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are MedScribe AI, a clinical documentation specialist.
Generate a structured prescription from consultation data.

Drug Reference:
{context}

SAFETY RULES:
1. NEVER add medications not in the transcript
2. Include complete dosing for every medication
3. Flag missing details as [VERIFY WITH DOCTOR]
4. Return ONLY valid JSON — no markdown"""),

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
  "prescription_date": "[TO BE COMPLETED BY PHYSICIAN]",
  "medications": [
    {{
      "name": "string",
      "generic_name": "string",
      "brand_examples": ["string"],
      "strength": "string",
      "dosage_form": "tablet or capsule or syrup or injection or inhaler or cream or drops",
      "dose": "string",
      "route": "oral or IV or IM or topical or sublingual or inhaled",
      "frequency": "string",
      "duration": "string",
      "quantity_to_dispense": "string",
      "refills": "0",
      "instructions": "string",
      "warnings": ["string"],
      "allergy_flag": "string or null"
    }}
  ],
  "investigations_ordered": ["string"],
  "follow_up": "string",
  "prescriber_notes": "string or null",
  "allergy_summary": "string"
}}""")
])


QA_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are MedScribe AI, helping doctors review consultation records.
Answer questions about the consultation based on the transcript.

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