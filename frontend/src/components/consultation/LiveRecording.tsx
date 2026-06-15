import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic, Square, Upload, FileAudio, X,
  Loader2, ShieldCheck, ArrowRight, Radio,
} from "lucide-react";
import { toast } from "sonner";

interface LiveRecordingProps {
  patientProfileId: string;
  patientName: string;
  onComplete: (data: any) => void;
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = API_URL.replace(/\/$/, "");

const TRANSCRIBE_URL = `${BASE_URL}/api/transcribe`;

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
    "audio/mp4", "audio/webm;codecs=opus", "audio/webm",
    "audio/ogg;codecs=opus", "audio/ogg", "audio/wav", "",
  ];
  for (const mime of types) {
    if (!mime || (window.MediaRecorder && MediaRecorder.isTypeSupported?.(mime))) return mime;
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
  const [isRecording,    setIsRecording]    = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration,       setDuration]       = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>(Array(40).fill(4));
  const [mimeType,       setMimeType]       = useState<string>("");
  const [uploadedFile,   setUploadedFile]   = useState<File | null>(null);
  const [activeTab,      setActiveTab]      = useState<"record" | "upload">("record");

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const recorderRef   = useRef<MediaRecorder | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const chunksRef     = useRef<BlobPart[]>([]);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef   = useRef<AudioContext | null>(null);
  const analyserRef   = useRef<AnalyserNode | null>(null);
  const rafRef        = useRef<number | null>(null);

  const safePatientName = patientName?.trim() || "New Patient";

  useEffect(() => {
    if (!patientProfileId) {
      toast.error("Please select a patient before starting a consultation.");
      navigate("/doctor/patients");
    }
  }, [patientProfileId, navigate]);

  useEffect(() => {
    return () => {
      try { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); } catch {}
      stopAllAudio();
    };
  }, []);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const stopAllAudio = () => {
    try {
      if (rafRef.current)   cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      analyserRef.current?.disconnect();
      analyserRef.current = null;
      if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    } catch {}
  };

  const startWaveform = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    analyser.fftSize = 128;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const bars = 40;
    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      const step = Math.max(1, Math.floor(bufferLength / bars));
      const heights = Array.from({ length: bars }, (_, i) => {
        const v = dataArray[i * step] ?? 0;
        return Math.max(4, Math.min(100, Math.round((v / 255) * 100)));
      });
      setWaveformHeights(heights);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
  };

  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Your browser does not support audio recording."); return;
      }
      chunksRef.current = [];
      setDuration(0);
      setUploadedFile(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 44100, channelCount: 1 } as MediaTrackConstraints,
        video: false,
      });
      if (stream.getAudioTracks().length === 0) throw new Error("No audio track found");
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source  = audioCtx.createMediaStreamSource(stream);
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

      recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onerror = () => { toast.error("Recording error."); stopAllAudio(); setIsRecording(false); };
      recorder.start(100);
      setIsRecording(true);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      startWaveform();
    } catch (err: any) {
      const msgs: Record<string, string> = {
        NotAllowedError:    "Microphone access denied. Please allow microphone access in your browser.",
        NotFoundError:      "No microphone found. Please connect a microphone.",
        NotReadableError:   "Microphone is in use by another application.",
        OverconstrainedError: "Microphone doesn't support required settings.",
      };
      toast.error(msgs[err?.name] || err?.message || "Could not start recording.");
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
      throw new Error("Transcription server returned non-JSON. Check backend route.");
    }
    const data = (await res.json()) as TranscribeResponse;
    if (!res.ok || !data.success) throw new Error(data.details || data.error || "Transcription failed");
    return { text: data.text || "", language: data.language || "unknown", words: data.words || [] };
  };

  const saveConsultation = async (params: {
    patientProfileId: string; transcript: string; durationSeconds: number; language?: string; words?: unknown[];
  }) => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${BASE_URL}/api/doctor/consultations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save consultation");
    return data.consultation;
  };

  const processAndNavigate = async (blob: Blob, durationSec: number) => {
    setIsTranscribing(true);
    try {
      if (blob.size === 0) { toast.error("No audio data. Please try again."); setIsTranscribing(false); return; }
      const { text, language, words } = await transcribeBlob(blob);
      if (!text.trim()) { toast.error("No speech detected in the audio."); setIsTranscribing(false); return; }

      let consultation: any = null;
      try {
        consultation = await saveConsultation({ patientProfileId, transcript: text, durationSeconds: durationSec, language, words });
        toast.success("Consultation saved — transcript ready.");
      } catch (err: any) {
        console.error("Save consultation error:", err);
        toast.error(err.message || "Transcript generated but not saved.");
      }

      onComplete({
        patientProfileId, patientName: safePatientName, duration: durationSec,
        transcript: text, language, words,
        saved: !!consultation,
        consultationId: consultation?.id,
        createdAt: consultation?.created_at || new Date().toISOString(),
      });
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
      const stopPromise = new Promise<void>(resolve => { recorder.onstop = () => resolve(); });
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["audio/mp3","audio/mpeg","audio/wav","audio/wave","audio/x-wav","audio/ogg","audio/webm","audio/mp4","audio/m4a","audio/x-m4a","audio/flac","audio/aac","video/webm","video/mp4"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|webm|m4a|mp4|flac|aac)$/i)) {
      toast.error("Unsupported format. Use MP3, WAV, OGG, WebM, M4A, or FLAC."); return;
    }
    if (file.size > 50 * 1024 * 1024) { toast.error("File too large. Maximum 50MB."); return; }
    setUploadedFile(file);
    toast.success(`"${file.name}" selected.`);
  };

  const handleUploadAndTranscribe = async () => {
    if (!uploadedFile) { toast.error("No file selected."); return; }
    let durationSec = 0;
    try {
      const audioUrl = URL.createObjectURL(uploadedFile);
      const audio = new Audio(audioUrl);
      await new Promise<void>(resolve => {
        audio.onloadedmetadata = () => { durationSec = Math.round(audio.duration); URL.revokeObjectURL(audioUrl); resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(audioUrl); resolve(); };
      });
    } catch {}
    await processAndNavigate(new Blob([uploadedFile], { type: uploadedFile.type }), durationSec);
  };

  const handleCancel = () => {
    try { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); } catch {}
    stopAllAudio();
    setIsRecording(false);
    setIsTranscribing(false);
    setUploadedFile(null);
    navigate("/doctor/dashboard");
  };

  const initials = safePatientName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // ── Transcribing overlay ──
  if (isTranscribing) {
    return (
      <div className="dl-page">
        <div className="page-header">
          <div className="page-header-top">
            <div className="page-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <Mic size={18} color="#fff" />
              </div>
              <div>
                <h1 className="page-header-title">Live Consultation</h1>
                <p className="page-header-sub">Processing audio for {safePatientName}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="page-content">
          <div className="lr-card">
            <div className="lr-transcribing-state">
              <div className="lr-transcribing-ring">
                <Loader2 size={36} className="lr-transcribing-spinner" />
              </div>
              <div className="lr-transcribing-body">
                <h2 className="lr-transcribing-title">Transcribing Audio…</h2>
                <p className="lr-transcribing-sub">
                  MedScribe AI is converting your recording to text. This usually takes 10–30 seconds.
                </p>
              </div>
              <div className="lr-transcribing-steps">
                {["Audio received", "Processing with AI", "Generating transcript", "Saving consultation"].map((step, i) => (
                  <div key={step} className="lr-transcribing-step">
                    <div className={`lr-step-dot ${i === 1 ? "lr-step-dot-active" : i === 0 ? "lr-step-dot-done" : "lr-step-dot-pending"}`} />
                    <span className={`lr-step-label ${i <= 1 ? "lr-step-label-active" : ""}`}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dl-page">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Mic size={18} color="#fff" />
            </div>
            <div>
              <h1 className="page-header-title">Live Consultation</h1>
              <p className="page-header-sub">
                {isRecording ? "Recording in progress…" : "Ready to record"}
              </p>
            </div>
          </div>
          {isRecording && (
            <div className="page-header-actions">
              <span className="lr-recording-badge">
                <span className="lr-dot lr-dot-red" />
                REC {formatDuration(duration)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="lr-card">

          {/* Patient strip */}
          <div className="lr-patient-strip">
            <div className="lr-patient-avatar">{initials}</div>
            <div className="lr-patient-info">
              <span className="lr-patient-label">Patient</span>
              <span className="lr-patient-name">{safePatientName}</span>
            </div>
            {isRecording && (
              <span className="badge badge-error" style={{ marginLeft: "auto" }}>
                <Radio size={11} /> Live
              </span>
            )}
          </div>

          {/* ── Tab switcher (only when idle) ── */}
          {!isRecording && (
            <div className="lr-tabs">
              <button
                type="button"
                className={`lr-tab ${activeTab === "record" ? "lr-tab-active" : ""}`}
                onClick={() => setActiveTab("record")}
              >
                <Mic size={14} /> Record
              </button>
              <button
                type="button"
                className={`lr-tab ${activeTab === "upload" ? "lr-tab-active" : ""}`}
                onClick={() => setActiveTab("upload")}
              >
                <Upload size={14} /> Upload Audio
              </button>
            </div>
          )}

          {/* ── RECORD TAB ── */}
          {(activeTab === "record" || isRecording) && (
            <div className="lr-recording-area">

              {/* Mic / Stop button */}
              <div className="lr-mic-wrap">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="lr-mic-btn"
                    aria-label="Start recording"
                  >
                    <Mic className="lr-mic-icon" />
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="lr-mic-btn lr-mic-btn-recording"
                    aria-label="Stop recording"
                  >
                    <Square className="lr-stop-icon" />
                  </button>
                )}
              </div>

              {/* Status / Timer */}
              {isRecording ? (
                <div className="lr-status">
                  <p className="lr-duration">{formatDuration(duration)}</p>
                  <div className="lr-status-row">
                    <span className="lr-dot lr-dot-red" />
                    <span className="lr-status-text">Recording in progress</span>
                  </div>
                  <p className="lr-status-sub">Speak clearly — click the button to stop and transcribe</p>
                </div>
              ) : (
                <div className="lr-status">
                  <p className="lr-status-idle">Tap the microphone to begin</p>
                  <p className="lr-status-sub">Ensure your microphone is connected and permission is granted</p>
                </div>
              )}

              {/* Live waveform */}
              <div className="lr-waveform">
                {waveformHeights.map((h, i) => (
                  <div
                    key={i}
                    className="lr-waveform-bar"
                    style={{
                      height: `${h}%`,
                      opacity: isRecording ? 0.85 : 0.2,
                    }}
                  />
                ))}
              </div>

              {/* Recording actions */}
              {isRecording && (
                <div className="lr-actions">
                  <button type="button" className="btn btn-primary btn-md" onClick={handleStopRecording}>
                    <Square size={14} /> Stop &amp; Transcribe
                  </button>
                  <button type="button" className="btn btn-secondary btn-md" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── UPLOAD TAB ── */}
          {activeTab === "upload" && !isRecording && (
            <div className="lr-upload-section">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.webm,.m4a,.mp4,.flac,.aac"
                onChange={handleFileSelect}
                className="lr-file-input-hidden"
              />

              {!uploadedFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="lr-upload-drop-zone"
                >
                  <div className="lr-upload-drop-icon">
                    <Upload className="lr-upload-icon-svg" />
                  </div>
                  <div className="lr-upload-drop-text">
                    <span className="lr-upload-drop-title">Click to select an audio file</span>
                    <span className="lr-upload-drop-sub">MP3, WAV, OGG, WebM, M4A, FLAC — Max 50 MB</span>
                  </div>
                </button>
              ) : (
                <div className="lr-upload-file-card">
                  <div className="lr-upload-file-info">
                    <div className="lr-upload-file-icon">
                      <FileAudio className="lr-upload-file-icon-svg" />
                    </div>
                    <div className="lr-upload-file-meta">
                      <span className="lr-upload-file-name">{uploadedFile.name}</span>
                      <span className="lr-upload-file-size">{formatFileSize(uploadedFile.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="lr-upload-remove-btn"
                      title="Remove file"
                    >
                      <X className="lr-upload-remove-icon" />
                    </button>
                  </div>
                </div>
              )}

              <div className="lr-actions">
                {uploadedFile && (
                  <button
                    type="button"
                    className="btn btn-primary btn-md"
                    onClick={handleUploadAndTranscribe}
                  >
                    <ArrowRight size={14} /> Transcribe Audio
                  </button>
                )}
                <button type="button" className="btn btn-secondary btn-md" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Idle cancel button */}
          {!isRecording && activeTab === "record" && (
            <div className="lr-actions">
              <button type="button" className="btn btn-secondary btn-md" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          )}

          {/* Security note */}
          <div className="lr-security-note">
            <ShieldCheck size={14} style={{ color: "var(--ms-teal)", flexShrink: 0 }} />
            <p className="lr-security-text">
              <span className="lr-security-bold">MedScribe AI</span> securely captures and transcribes your consultation. All data is encrypted in transit.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
