import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Download, Sparkles, Loader2, FileText } from "lucide-react";
import { Button } from "../ui/button";
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

  const safe = useMemo(() => {
    return {
      patientName: data?.patientName || "New Patient",
      duration: data?.duration ?? 0,
      transcript: data?.transcript || "",
      language: data?.language || "unknown",
      createdAt: data?.createdAt
        ? new Date(data.createdAt).toLocaleString()
        : "-",
      wordCount: data?.transcript
        ? data.transcript.trim().split(/\s+/).filter(Boolean).length
        : 0,
      consultationId: data?.consultationId,
    };
  }, [data]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleCopy = async () => {
    if (!safe.transcript) {
      toast.error("No transcript to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(safe.transcript);
      toast.success("Transcript copied to clipboard.");
    } catch {
      toast.error("Copy failed. Your browser may block clipboard access.");
    }
  };

  const handleDownload = () => {
    if (!safe.transcript) {
      toast.error("No transcript to download.");
      return;
    }
    const filename = `Transcript - ${safe.patientName}.txt`.replace(
      /[\/\\:*?"<>|]/g,
      "_"
    );
    const blob = new Blob([safe.transcript], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded.");
  };

  const handleGenerateAll = async () => {
    if (!safe.transcript) {
      toast.error("No transcript available to process.");
      return;
    }
    setIsProcessing(true);
    const toastId = toast.loading(
      "MedScribe AI is generating all documentation..."
    );
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${BASE_URL}/api/nlp/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: safe.transcript,
          consultation_id: safe.consultationId,
          generate_notes: true,
          generate_prescription: true,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || result.details || "Pipeline failed");
      }

      // Save to DB in background — fire and forget
      if (safe.consultationId) {
        const savedToken = localStorage.getItem("accessToken");
        fetch(`${BASE_URL}/api/doctor/consultations/${safe.consultationId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${savedToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            extracted_data: result.extracted_data,
            soap_notes: result.notes,
            prescription: result.prescription,
          }),
        }).catch((err) => console.warn("Background save failed:", err));
      }

      toast.success("All documentation generated!", { id: toastId });

      // Let parent handle navigation — it sets state then navigates
      // so prescription page always mounts with data ready
      if (onPipelineComplete) {
        onPipelineComplete(result);
      }
      // Do NOT call onNavigate here — App.tsx handles it

    } catch (err: any) {
      console.error("Pipeline error:", err);
      toast.error(err.message || "Failed to generate documentation", {
        id: toastId,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const initials = safe.patientName
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
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="page-header-title">Consultation Transcript</h1>
              <p className="page-header-sub">
                Review and generate clinical documentation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="page-content">
        <div className="tp-card">
          {/* Patient header */}
          <div className="tp-patient-header">
            <div className="tp-patient-avatar">{initials}</div>
            <div className="tp-patient-info">
              <span className="tp-patient-label">Patient</span>
              <span className="tp-patient-name">{safe.patientName}</span>
              <div className="tp-meta-chips">
                <span className="tp-chip">
                  Duration: {formatDuration(safe.duration)}
                </span>
                <span className="tp-chip">Words: {safe.wordCount}</span>
                <span className="tp-chip tp-chip-cap">
                  Language: {safe.language}
                </span>
                <span className="tp-chip">Recorded: {safe.createdAt}</span>
              </div>
            </div>
            <div className="tp-header-actions">
              <Button onClick={handleCopy} className="btn-print-premium btn-sm">
                <Copy className="w-4 h-4 mr-1.5" />
                Copy
              </Button>
              <Button onClick={handleDownload} className="btn-print-premium btn-sm">
                <Download className="w-4 h-4 mr-1.5" />
                Download
              </Button>
            </div>
          </div>

          {/* Transcript body */}
          <div className="tp-body">
            <div className="tp-transcript-box">
              <p className="tp-transcript-text">
                {safe.transcript || "No transcript available."}
              </p>
            </div>
          </div>

          {/* Footer actions */}
          <div className="tp-footer">
            <Button
              variant="outline"
              onClick={() => navigate("/doctor/recording")}
              className="btn-print-premium btn-md text-red-600 hover:text-red-700 hover:border-red-200"
            >
              Discard and Re-record
            </Button>
            <div className="tp-footer-right">
              <Button
                onClick={() => navigate("/doctor/extraction")}
                className="btn-download-premium btn-md"
              >
                Manual Review Flow
              </Button>
              <Button
                onClick={handleGenerateAll}
                disabled={isProcessing}
                className="btn-send-premium btn-md"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate All with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}