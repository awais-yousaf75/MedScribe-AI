import asyncio
import os
import json
from dotenv import load_dotenv

load_dotenv()

from services.llm_service import init_llm, EXTRACTION_PROMPT, get_chain
from services.processors import extract_medical_data, clean_json
from services.rag_engine import build_vector_store
from knowledge_base.medical_kb import MEDICAL_KNOWLEDGE_BASE

async def main():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("No API key")
        return
    
    print("Init LLM...")
    init_llm(api_key, "llama-3.1-8b-instant")
    
    print("Init Vector Store...")
    build_vector_store(MEDICAL_KNOWLEDGE_BASE, "all-MiniLM-L6-v2")
    
    transcript = """
    Doctor: Good morning, Awais. How are you feeling today?
    Patient: My head has been hurting really bad for the last 3 days.
    Doctor: I see. Are you taking anything for it?
    Patient: No, nothing so far.
    Doctor: Okay. I am going to prescribe you Paracetamol 500mg, take it twice a day for 5 days.
    Patient: Okay, doctor. Thank you.
    """
    
    print("Extracting...")
    result = await extract_medical_data(transcript)
    print("Result:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
