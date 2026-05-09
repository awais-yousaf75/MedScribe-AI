import io
from groq import Groq

# Initialized in main.py lifespan
groq_client: Groq = None


async def transcribe_audio(
    audio_bytes:  bytes,
    filename:     str,
    content_type: str,
    language:     str  = "en",
    stt_model:    str  = "whisper-large-v3-turbo",
) -> dict:
    """
    Transcribe audio bytes using Groq Whisper STT.
    Returns a dict with 'transcript', 'language', and 'duration'.
    """
    if groq_client is None:
        raise RuntimeError("Groq client not initialized")

    # Groq expects a file-like object with a name
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename  # Groq uses the extension to detect format

    transcription = groq_client.audio.transcriptions.create(
        file           = (filename, audio_file, content_type),
        model          = stt_model,
        language       = language,
        response_format = "verbose_json",  # gives us language + duration too
    )

    return {
        "transcript": transcription.text.strip(),
        "language":   getattr(transcription, "language", language),
        "duration":   getattr(transcription, "duration",  None),
    }