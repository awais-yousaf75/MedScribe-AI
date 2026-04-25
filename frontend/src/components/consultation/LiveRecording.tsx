import { useEffect, useRef, useState } from "react";
import { Mic, Square, User as UserIcon } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import ConsultationTopNav from "./ConsultationTopNav";

interface LiveRecordingProps {
  patientProfileId: string;
  patientName: string;
  onComplete: (data: any) => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = API_URL.replace(/\/$/, "");

console.log("Using API URL:", BASE_URL);
const TRANSCRIBE_URL ="http://localhost:5000/api/transcribe";
console.log("Url for transcription:", TRANSCRIBE_URL);

type TranscribeResponse = {
  success: boolean;
  text?: string;
  language?: string;
  words?: unknown[];
  error?: string;
  details?: string;
};

// Best-supported MIME type helper (from your sample)
const getSupportedMimeType = (): string => {
  const types = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/wav",
    "", // fallback
  ];

  for (const mime of types) {
    // @ts-ignore
    if (!mime || (window.MediaRecorder && MediaRecorder.isTypeSupported?.(mime))) {
      console.log("✅ Using MIME type:", mime || "default");
      return mime;
    }
  }
  return "";
};

export default function LiveRecording({
  patientProfileId,
  patientName,
  onComplete,
  onNavigate,
  onLogout,
}: LiveRecordingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>(
    Array(30).fill(10)
  );
  const [mimeType, setMimeType] = useState<string>("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const safePatientName = patientName?.trim() || "New Patient";

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const stopAllAudio = () => {
    try {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      analyserRef.current?.disconnect();
      analyserRef.current = null;

      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } catch {
      // ignore
    }
  };

  const startWaveform = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      const bars = 30;
      const step = Math.max(1, Math.floor(bufferLength / bars));
      const heights = Array.from({ length: bars }, (_, i) => {
        const idx = i * step;
        const v = dataArray[idx] ?? 0;
        return Math.max(10, Math.min(100, Math.round((v / 255) * 100)));
      });
      setWaveformHeights(heights);
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
  };

  // UPDATED: use robust recording logic from sample
  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Your browser does not support audio recording.");
        return;
      }

      // reset chunks & timer
      chunksRef.current = [];
      setDuration(0);

      console.log("🎤 Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
        } as MediaTrackConstraints,
        video: false,
      });

      const audioTracks = stream.getAudioTracks();
      console.log("✅ Microphone access granted");
      console.log("🎙️ Audio tracks:", audioTracks.length);
      if (audioTracks.length === 0) {
        throw new Error("No audio track found");
      }

      streamRef.current = stream;

      // Audio context + analyser for waveform
      const audioCtx = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      source.connect(analyser);

      // Get best MIME type
      const selectedMime = getSupportedMimeType();
      setMimeType(selectedMime);

      console.log("🎵 Creating MediaRecorder with MIME:", selectedMime || "default");
      const options: MediaRecorderOptions =
        selectedMime
          ? { mimeType: selectedMime, audioBitsPerSecond: 128000 }
          : { audioBitsPerSecond: 128000 };

      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        console.log("📦 Chunk received:", e.data?.size, "bytes");
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = (event) => {
        console.error("❌ MediaRecorder error:", (event as any).error);
        toast.error("Recording error.");
        stopAllAudio();
        setIsRecording(false);
      };

      // we handle transcription ourselves after manual stop
      recorder.start(100); // collect data every 100ms
      setIsRecording(true);
      console.log("🔴 Recording started, state:", recorder.state);

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      startWaveform();
    } catch (err: any) {
      console.error("❌ Failed to start recording:", err);
      let message = "Could not start recording.";
      if (err?.name === "NotAllowedError") {
        message =
          "Microphone access denied. Please allow microphone access in browser settings.";
      } else if (err?.name === "NotFoundError") {
        message = "No microphone found. Please connect a microphone.";
      } else if (err?.name === "NotReadableError") {
        message = "Microphone is in use by another application.";
      } else if (err?.name === "OverconstrainedError") {
        message = "Microphone doesn't support required settings.";
      } else if (err?.message) {
        message = err.message;
      }
      toast.error(message);
      stopAllAudio();
      setIsRecording(false);
    }
  };

  const transcribeBlob = async (blob: Blob) => {
    console.log("📡 Sending audio to:", TRANSCRIBE_URL);

    const fd = new FormData();
    fd.append("audio", blob, "recording.webm");

    console.log("Sending transcription request...");
    const res = await fetch(TRANSCRIBE_URL, { method: "POST", body: fd });


    console.log("Transcribe response status:", res.status);

    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("❌ Non-JSON response from /api/transcribe:", text.slice(0, 200));
      throw new Error(
        "Transcription server returned non-JSON (likely 404/HTML). " +
          "Check that the backend route is /api/transcribe and the server is running."
      );
    }

    const data = (await res.json()) as TranscribeResponse;
    console.log("Transcribe response data:", data);

    if (!res.ok || !data.success) {
      throw new Error(data.details || data.error || "Transcription failed");
    }

    return {
      text: data.text || "",
      language: data.language || "unknown",
      words: data.words || [],
    };
  };

  const saveConsultation = async (params: {
    patientProfileId: string;
    transcript: string;
    durationSeconds: number;
    language?: string;
    words?: unknown[];
  }) => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${BASE_URL}/api/doctor/consultations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientProfileId: params.patientProfileId,
        transcript: params.transcript,
        durationSeconds: params.durationSeconds,
        language: params.language,
        words: params.words,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save consultation");
    return data.consultation;
  };

  // UPDATED: use requestData() before stopping, and use actual mime type
  const handleStopRecording = async () => {
    if (!recorderRef.current) return;
    setIsTranscribing(true);

    try {
      const recorder = recorderRef.current;

      const stopPromise = new Promise<void>((resolve) => {
        recorder.onstop = () => {
          console.log("⏹️ MediaRecorder stopped");
          resolve();
        };
      });

      // Flush final chunk before stopping
      if (recorder.state === "recording") {
        recorder.requestData();
      }

      recorder.stop();
      setIsRecording(false);
      await stopPromise;

      const effectiveMime =
        recorder.mimeType || mimeType || "audio/webm";
      console.log("📊 Using blob MIME type:", effectiveMime);

      const blob = new Blob(chunksRef.current, {
        type: effectiveMime,
      });
      console.log("📦 Created blob:", blob.size, "bytes,", blob.type);

      stopAllAudio();

      if (blob.size === 0) {
        toast.error("No audio captured. Please try again.");
        setIsTranscribing(false);
        return;
      }

      const { text, language, words } = await transcribeBlob(blob);
      if (!text.trim()) {
        toast.error("No speech detected in the recording.");
        setIsTranscribing(false);
        return;
      }

      let consultation: any = null;
      try {
        consultation = await saveConsultation({
          patientProfileId,
          transcript: text,
          durationSeconds: duration,
          language,
          words,
        });
        toast.success("Consultation saved and transcript generated.");
      } catch (err: any) {
        console.error("Save consultation error:", err);
        toast.error(err.message || "Transcript generated but not saved.");
      }

      const payload = {
        patientProfileId,
        patientName: safePatientName,
        duration,
        transcript: text,
        language,
        words,
        saved: !!consultation,
        consultationId: consultation?.id,
        createdAt: consultation?.created_at || new Date().toISOString(),
      };

      onComplete(payload);
      onNavigate("transcript");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCancel = () => {
    try {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
    } catch {}
    stopAllAudio();
    setIsRecording(false);
    setIsTranscribing(false);
    onNavigate("doctor-dashboard");
  };

  useEffect(() => {
    return () => {
      try {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      } catch {}
      stopAllAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <ConsultationTopNav
        onNavigate={onNavigate}
        onLogout={onLogout}
        doctorName="Dr. Ahmed Hassan"
        doctorSubtitle="Internal Medicine"
      />

      <div className="max-w-[1000px] mx-auto p-8">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl">Live Consultation — MedScribe AI</h2>
            <p className="text-muted-foreground">
              Record audio, then securely generate and save a transcript.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 space-y-8">
            <div className="flex items-center justify-center gap-3 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="text-lg">{safePatientName}</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex justify-center">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    disabled={isTranscribing}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center shadow-2xl hover:scale-105 transition-transform disabled:opacity-60"
                  >
                    <Mic className="w-16 h-16 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    disabled={isTranscribing}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center shadow-2xl animate-pulse disabled:opacity-60"
                  >
                    <Square className="w-12 h-12 text-white" />
                  </button>
                )}
              </div>

              <div className="text-center space-y-2">
                {isTranscribing ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
                      <p className="text-lg">Transcribing audio...</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we generate and save the transcript.
                    </p>
                  </>
                ) : isRecording ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <p className="text-lg">Recording in progress...</p>
                    </div>
                    <p className="text-3xl text-[#2563EB]">{formatDuration(duration)}</p>
                  </>
                ) : (
                  <p className="text-lg text-muted-foreground">
                    Click microphone to start recording
                  </p>
                )}
              </div>

              {isRecording && (
                <div className="flex items-center justify-center gap-1 h-32">
                  {waveformHeights.map((height, idx) => (
                    <div
                      key={idx}
                      className="w-2 bg-gradient-to-t from-[#2563EB] to-[#14B8A6] rounded-full transition-all duration-200"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
              <p className="text-sm text-[#2563EB]">
                <span className="font-semibold">MedScribe AI</span> securely captures and transcribes
                your consultation. All data is encrypted in transit.
              </p>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              {isRecording && (
                <Button
                  onClick={handleStopRecording}
                  disabled={isTranscribing}
                  className="px-8 h-12 bg-gradient-to-r from-[#2563EB] to-[#14B8A6] hover:opacity-90 disabled:opacity-60"
                >
                  Stop Recording & Transcribe
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleCancel}
                className="px-8 h-12 rounded-xl"
                disabled={isTranscribing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}