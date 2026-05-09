import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Square, Upload, FileAudio, X } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface LiveRecordingProps {
  patientProfileId: string;
  patientName: string;
  onComplete: (data: any) => void;
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = API_URL.replace(/\/$/, "");

console.log("Using API URL:", BASE_URL);
const TRANSCRIBE_URL = `${BASE_URL}/api/transcribe`;
console.log("Url for transcription:", TRANSCRIBE_URL);

type TranscribeResponse = {
  success: boolean;
  text?: string;
  language?: string;
  words?: unknown[];
  error?: string;
  details?: string;
};

const getSupportedMimeType = (): string => {
  const types = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/wav",
    "",
  ];
  for (const mime of types) {
    if (
      !mime ||
      (window.MediaRecorder && MediaRecorder.isTypeSupported?.(mime))
    ) {
      console.log("Using MIME type:", mime || "default");
      return mime;
    }
  }
  return "";
};

export default function LiveRecording({
  patientProfileId,
  patientName,
  onComplete,
  onLogout: _onLogout,
}: LiveRecordingProps) {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>(
    Array(30).fill(10)
  );
  const [mimeType, setMimeType] = useState<string>("");

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    } catch {}
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

  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Your browser does not support audio recording.");
        return;
      }
      chunksRef.current = [];
      setDuration(0);
      setUploadedFile(null);
      setIsUploadMode(false);

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
      if (audioTracks.length === 0) throw new Error("No audio track found");
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      source.connect(analyser);

      const selectedMime = getSupportedMimeType();
      setMimeType(selectedMime);

      const options: MediaRecorderOptions = selectedMime
        ? { mimeType: selectedMime, audioBitsPerSecond: 128000 }
        : { audioBitsPerSecond: 128000 };
      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onerror = () => {
        toast.error("Recording error.");
        stopAllAudio();
        setIsRecording(false);
      };
      recorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      startWaveform();
    } catch (err: any) {
      let message = "Could not start recording.";
      if (err?.name === "NotAllowedError") {
        message = "Microphone access denied.";
      } else if (err?.name === "NotFoundError") {
        message = "No microphone found.";
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
    const fd = new FormData();
    fd.append("audio", blob, "recording.webm");
    const res = await fetch(TRANSCRIBE_URL, { method: "POST", body: fd });
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Non-JSON response:", text.slice(0, 200));
      throw new Error(
        "Transcription server returned non-JSON. Check backend route."
      );
    }
    const data = (await res.json()) as TranscribeResponse;
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

  const processAndNavigate = async (blob: Blob, durationSec: number) => {
    setIsTranscribing(true);
    try {
      if (blob.size === 0) {
        toast.error("No audio data. Please try again.");
        setIsTranscribing(false);
        return;
      }

      const { text, language, words } = await transcribeBlob(blob);
      if (!text.trim()) {
        toast.error("No speech detected in the audio.");
        setIsTranscribing(false);
        return;
      }

      let consultation: any = null;
      try {
        consultation = await saveConsultation({
          patientProfileId,
          transcript: text,
          durationSeconds: durationSec,
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
        duration: durationSec,
        transcript: text,
        language,
        words,
        saved: !!consultation,
        consultationId: consultation?.id,
        createdAt: consultation?.created_at || new Date().toISOString(),
      };

      onComplete(payload);
      navigate("/doctor/transcript");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current) return;

    try {
      const recorder = recorderRef.current;
      const stopPromise = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });
      if (recorder.state === "recording") recorder.requestData();
      recorder.stop();
      setIsRecording(false);
      await stopPromise;

      const effectiveMime = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: effectiveMime });
      stopAllAudio();

      await processAndNavigate(blob, duration);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to transcribe audio");
      setIsTranscribing(false);
    }
  };

  // ── Upload handlers ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/ogg",
      "audio/webm",
      "audio/mp4",
      "audio/m4a",
      "audio/x-m4a",
      "audio/flac",
      "audio/aac",
      "video/webm",
      "video/mp4",
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|webm|m4a|mp4|flac|aac)$/i)) {
      toast.error(
        "Unsupported file format. Please upload MP3, WAV, OGG, WebM, M4A, or FLAC."
      );
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 50MB.");
      return;
    }

    setUploadedFile(file);
    setIsUploadMode(true);
    toast.success(`File "${file.name}" selected.`);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setIsUploadMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadAndTranscribe = async () => {
    if (!uploadedFile) {
      toast.error("No file selected.");
      return;
    }

    // Try to get audio duration
    let durationSec = 0;
    try {
      const audioUrl = URL.createObjectURL(uploadedFile);
      const audio = new Audio(audioUrl);
      await new Promise<void>((resolve) => {
        audio.onloadedmetadata = () => {
          durationSec = Math.round(audio.duration);
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
      });
    } catch {
      // duration stays 0
    }

    const blob = new Blob([uploadedFile], { type: uploadedFile.type });
    await processAndNavigate(blob, durationSec);
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
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
    setUploadedFile(null);
    setIsUploadMode(false);
    navigate("/doctor/dashboard");
  };

  useEffect(() => {
    return () => {
      try {
        if (recorderRef.current?.state === "recording")
          recorderRef.current.stop();
      } catch {}
      stopAllAudio();
    };
  }, []);

  const initials = safePatientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="dl-page">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="page-header-title">Live Consultation</h1>
              <p className="page-header-sub">
                Recording for {safePatientName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="page-content">
        <div className="lr-card">
          {/* Patient strip */}
          <div className="lr-patient-strip">
            <div className="lr-patient-avatar">{initials}</div>
            <div className="lr-patient-info">
              <span className="lr-patient-label">Patient</span>
              <span className="lr-patient-name">{safePatientName}</span>
            </div>
          </div>

          {/* Recording area */}
          <div className="lr-recording-area">
            {/* Mic / Stop button */}
            <div className="lr-mic-wrap">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={isTranscribing || isUploadMode}
                  className="lr-mic-btn"
                  aria-label="Start recording"
                >
                  <Mic className="lr-mic-icon" />
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  disabled={isTranscribing}
                  className="lr-mic-btn lr-mic-btn-recording"
                  aria-label="Stop recording"
                >
                  <Square className="lr-stop-icon" />
                </button>
              )}
            </div>

            {/* Status */}
            <div className="lr-status">
              {isTranscribing ? (
                <>
                  <div className="lr-status-row">
                    <span className="lr-dot lr-dot-indigo" />
                    <span className="lr-status-text">
                      Transcribing audio...
                    </span>
                  </div>
                  <p className="lr-status-sub">
                    Please wait while we generate and save the transcript.
                  </p>
                </>
              ) : isRecording ? (
                <>
                  <div className="lr-status-row">
                    <span className="lr-dot lr-dot-red" />
                    <span className="lr-status-text">
                      Recording in progress...
                    </span>
                  </div>
                  <p className="lr-duration">{formatDuration(duration)}</p>
                </>
              ) : (
                <p className="lr-status-idle">
                  Click the microphone to start recording
                </p>
              )}
            </div>

            {/* Waveform */}
            {isRecording && (
              <div className="lr-waveform">
                {waveformHeights.map((height, idx) => (
                  <div
                    key={idx}
                    className="lr-waveform-bar"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Upload Section ── */}
          {!isRecording && (
            <div className="lr-upload-section">
              <div className="lr-upload-divider">
                <span className="lr-upload-divider-line" />
                <span className="lr-upload-divider-text">
                  or upload a recording
                </span>
                <span className="lr-upload-divider-line" />
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.webm,.m4a,.mp4,.flac,.aac"
                onChange={handleFileSelect}
                className="lr-file-input-hidden"
              />

              {!uploadedFile ? (
                <button
                  onClick={handleTriggerUpload}
                  disabled={isTranscribing}
                  className="lr-upload-drop-zone"
                >
                  <div className="lr-upload-drop-icon">
                    <Upload className="lr-upload-icon-svg" />
                  </div>
                  <div className="lr-upload-drop-text">
                    <span className="lr-upload-drop-title">
                      Upload Audio File
                    </span>
                    <span className="lr-upload-drop-sub">
                      MP3, WAV, OGG, WebM, M4A, FLAC — Max 50MB
                    </span>
                  </div>
                </button>
              ) : (
                <div className="lr-upload-file-card">
                  <div className="lr-upload-file-info">
                    <div className="lr-upload-file-icon">
                      <FileAudio className="lr-upload-file-icon-svg" />
                    </div>
                    <div className="lr-upload-file-meta">
                      <span className="lr-upload-file-name">
                        {uploadedFile.name}
                      </span>
                      <span className="lr-upload-file-size">
                        {formatFileSize(uploadedFile.size)}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="lr-upload-remove-btn"
                      title="Remove file"
                      disabled={isTranscribing}
                    >
                      <X className="lr-upload-remove-icon" />
                    </button>
                  </div>
                  <Button
                    onClick={handleUploadAndTranscribe}
                    disabled={isTranscribing}
                    className="lr-upload-transcribe-btn"
                  >
                    {isTranscribing ? (
                      <>
                        <span className="lr-upload-spinner" />
                        Transcribing...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Transcribe Uploaded Audio
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Security note */}
          <div className="lr-security-note">
            <p className="lr-security-text">
              <span className="lr-security-bold">MedScribe AI</span> securely
              captures and transcribes your consultation. All data is encrypted
              in transit.
            </p>
          </div>

          {/* Actions */}
          <div className="lr-actions">
            {isRecording && (
              <Button
                onClick={handleStopRecording}
                disabled={isTranscribing}
                className="lr-stop-btn"
              >
                Stop Recording & Transcribe
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isTranscribing}
              className="lr-cancel-btn"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}