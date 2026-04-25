import { useMemo } from "react";
import { Activity, Copy, Download, FileText, User as UserIcon } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import ConsultationTopNav from "./ConsultationTopNav";

export interface TranscriptData {
  patientName: string;
  duration: number;
  transcript: string;
  language?: string;
  words?: unknown[];
  createdAt?: string;
}

interface TranscriptPageProps {
  data: TranscriptData | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function TranscriptPage({ data, onNavigate, onLogout }: TranscriptPageProps) {
  const safe = useMemo(() => {
    return {
      patientName: data?.patientName || "New Patient",
      duration: data?.duration ?? 0,
      transcript: data?.transcript || "",
      language: data?.language || "unknown",
      createdAt: data?.createdAt ? new Date(data.createdAt).toLocaleString() : "-",
      wordCount: data?.transcript ? data.transcript.trim().split(/\s+/).filter(Boolean).length : 0,
    };
  }, [data]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
    const filename = `Transcript - ${safe.patientName}.txt`.replace(/[\/\\:*?"<>|]/g, "_");
    const blob = new Blob([safe.transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded.");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <ConsultationTopNav
        onNavigate={onNavigate}
        onLogout={onLogout}
        doctorName="Dr. Ahmed Hassan"
        doctorSubtitle="Internal Medicine"
      />

      <div className="max-w-[1100px] mx-auto p-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl">Transcript</h2>
          <p className="text-muted-foreground">
            Review, copy, or download the consultation transcript.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
          {/* Patient header */}
          <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Patient</p>
              <p className="text-lg font-semibold">{safe.patientName}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="px-3 py-1 rounded-full bg-gray-50 border">
                  Duration: {formatDuration(safe.duration)}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-50 border">
                  Language: {safe.language}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-50 border">
                  Words: {safe.wordCount}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-50 border">
                  Created: {safe.createdAt}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex gap-2">
              <Button variant="outline" onClick={handleCopy} className="rounded-xl">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" onClick={handleDownload} className="rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Transcript body */}
          <div className="mt-6">
            {!safe.transcript ? (
              <div className="p-6 rounded-2xl border bg-gray-50 text-gray-600">
                No transcript available yet. Go back and record a consultation.
              </div>
            ) : (
              <div className="p-6 rounded-2xl border bg-gradient-to-r from-gray-50 to-blue-50/40 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                {safe.transcript}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => onNavigate("recording")}
              className="bg-gradient-to-r from-[#2563EB] to-[#14B8A6] hover:opacity-90"
            >
              <Activity className="w-4 h-4 mr-2" />
              Record Again
            </Button>

            <Button variant="outline" onClick={() => onNavigate("dashboard")} className="rounded-xl">
              Back to Dashboard
            </Button>

            {/* Optional: continue to extraction / notes */}
            <Button
              variant="outline"
              onClick={() => onNavigate("extraction")}
              className="rounded-xl"
              disabled={!safe.transcript}
              title={!safe.transcript ? "No transcript available" : "Go to extraction"}
            >
              <FileText className="w-4 h-4 mr-2" />
              Continue to AI Extraction
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}