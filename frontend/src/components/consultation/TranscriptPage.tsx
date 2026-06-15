import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Copy, Download, Sparkles, Loader2, FileText,
  Clock, Globe, Hash, BookOpen, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export interface TranscriptData {
  patientName: string;
  duration: number;
  transcript: string;
  language?: string;
  words?: unknown[];
  createdAt?: string;
  consultationId?: string;
}

interface TranscriptPageProps {
  data: TranscriptData | null;
  onLogout: () => void;
  onPipelineComplete?: (data: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = API_URL.replace(/\/$/, "");

export default function TranscriptPage({
  data,
  onLogout: _onLogout,
  onPipelineComplete,
}: TranscriptPageProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const safe = useMemo(() => ({
    patientName: data?.patientName || "New Patient",
    duration:    data?.duration ?? 0,
    transcript:  data?.transcript || "",
    language:    data?.language || "unknown",
    createdAt:   data?.createdAt
      ? new Date(data.createdAt).toLocaleString()
      : "—",
    wordCount: data?.transcript
      ? data.transcript.trim().split(/\s+/).filter(Boolean).length
      : 0,
    readingTime: data?.transcript
      ? Math.max(1, Math.ceil(data.transcript.trim().split(/\s+/).filter(Boolean).length / 200))
      : 0,
    consultationId: data?.consultationId,
  }), [data]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  const initials = safe.patientName
    .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleCopy = async () => {
    if (!safe.transcript) { toast.error("No transcript to copy."); return; }
    try {
      await navigator.clipboard.writeText(safe.transcript);
      setCopied(true);
      toast.success("Transcript copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed. Your browser may block clipboard access.");
    }
  };

  const handleDownload = () => {
    if (!safe.transcript) { toast.error("No transcript to download."); return; }
    const filename = `Transcript - ${safe.patientName}.txt`.replace(/[\/\\:*?"<>|]/g, "_");
    const blob = new Blob([safe.transcript], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded.");
  };

  const handleGenerateAll = async () => {
    if (!safe.transcript) { toast.error("No transcript available."); return; }
    setIsProcessing(true);
    const toastId = toast.loading("Generating all documentation…");
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${BASE_URL}/api/nlp/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript:             safe.transcript,
          consultation_id:        safe.consultationId,
          generate_notes:         true,
          generate_prescription:  true,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || result.details || "Pipeline failed");

      if (safe.consultationId) {
        fetch(`${BASE_URL}/api/doctor/consultations/${safe.consultationId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            extracted_data: result.extracted_data,
            soap_notes:     result.notes,
            prescription:   result.prescription,
          }),
        }).catch(err => console.warn("Background save failed:", err));
      }

      toast.success("All documentation generated!", { id: toastId });
      if (onPipelineComplete) onPipelineComplete(result);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate documentation", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const paragraphs = safe.transcript
    ? safe.transcript.split(/\n+/).filter(l => l.trim())
    : [];

  return (
    <div className="dl-page">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <FileText size={18} color="#fff" />
            </div>
            <div>
              <h1 className="page-header-title">Consultation Transcript</h1>
              <p className="page-header-sub">Review the recording and generate documentation</p>
            </div>
          </div>
          <div className="page-header-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
              <Copy size={13} /> {copied ? "Copied!" : "Copy"}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownload}>
              <Download size={13} /> Download
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="tp-card">

          {/* Patient + meta header */}
          <div className="tp-patient-header">
            <div className="tp-patient-avatar">{initials}</div>
            <div className="tp-patient-info">
              <span className="tp-patient-label">Patient</span>
              <span className="tp-patient-name">{safe.patientName}</span>
              <div className="tp-meta-chips">
                <span className="tp-chip">
                  <Clock size={11} style={{ display: "inline", marginRight: 3 }} />
                  {formatDuration(safe.duration)}
                </span>
                <span className="tp-chip tp-chip-cap">
                  <Globe size={11} style={{ display: "inline", marginRight: 3 }} />
                  {safe.language}
                </span>
                <span className="tp-chip">
                  <Hash size={11} style={{ display: "inline", marginRight: 3 }} />
                  {safe.wordCount.toLocaleString()} words
                </span>
                <span className="tp-chip">
                  <BookOpen size={11} style={{ display: "inline", marginRight: 3 }} />
                  ~{safe.readingTime} min read
                </span>
                {safe.createdAt !== "—" && (
                  <span className="tp-chip">{safe.createdAt}</span>
                )}
              </div>
            </div>
          </div>

          {/* Transcript body */}
          <div className="tp-body">
            <div className="tp-transcript-box">
              {paragraphs.length > 0
                ? paragraphs.map((line, i) => (
                    <p key={i} className="tp-transcript-text" style={{ marginBottom: 10 }}>
                      {line}
                    </p>
                  ))
                : <p className="tp-transcript-text" style={{ color: "var(--ms-text-muted)", fontStyle: "italic" }}>
                    No transcript available.
                  </p>
              }
            </div>
          </div>

          {/* Footer actions */}
          <div className="tp-footer">
            <button
              type="button"
              className="btn btn-secondary btn-md"
              style={{ color: "var(--ms-error)" }}
              onClick={() => navigate("/doctor/recording")}
            >
              <RotateCcw size={14} /> Re-record
            </button>
            <div className="tp-footer-right">
              <button
                type="button"
                className="btn btn-secondary btn-md"
                onClick={() => navigate("/doctor/extraction")}
              >
                Step-by-step Review
              </button>
              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={handleGenerateAll}
                disabled={isProcessing}
              >
                {isProcessing
                  ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                  : <><Sparkles size={14} /> Generate All with AI</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
