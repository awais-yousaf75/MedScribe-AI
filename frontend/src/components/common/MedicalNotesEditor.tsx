import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import {
  FileText, Sparkles, Loader2, Brain, AlertCircle,
  ClipboardList, RefreshCw, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface MedicalNotesEditorProps {
  patientName: string;
  recordingData: any;
  extractedData: any;
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = API_URL.replace(/\/$/, "");

export default function MedicalNotesEditor({
  patientName,
  recordingData,
  extractedData,
  onLogout,
}: MedicalNotesEditorProps) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [model, setModel] = useState<string>('');

  // Call NLP engine on mount
  useEffect(() => {
    const transcript = recordingData?.transcript;
    if (!transcript) {
      setIsLoading(false);
      return;
    }
    generateNotes(transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateNotes = async (transcript: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${BASE_URL}/api/nlp/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          extracted_data: extractedData || null,
          consultation_id: recordingData?.consultationId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || "Notes generation failed");
      }

      setNotes(data.notes || "No notes generated");
      setProcessingTime(data.processing_time_seconds);
      setModel(data.model || "");

      // Save SOAP notes to Supabase (fire-and-forget)
      const consultationId = recordingData?.consultationId;
      if (consultationId && token) {
        fetch(`${BASE_URL}/api/doctor/consultations/${consultationId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ soap_notes: data.notes }),
        })
          .then((r) => r.json())
          .then((r) => {
            if (r.success) console.log("✅ SOAP notes saved to Supabase");
            else console.warn("⚠️ Could not save notes:", r.error);
          })
          .catch((e) => console.warn("⚠️ Save notes error:", e));
      }

      toast.success(`SOAP notes generated in ${data.processing_time_seconds}s`);
    } catch (err: any) {
      console.error("Notes generation error:", err);
      setError(err.message || "Failed to generate notes");
      toast.error(err.message || "Notes generation failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── LOADING STATE ──
  if (isLoading) {
    return (
      <div className="dl-page">
        <div className="page-content">
          <div className="aix-state-card">
            <div className="aix-state-icon aix-state-icon-loading">
              <FileText className="aix-state-icon-svg" />
            </div>
            <div className="aix-state-body">
              <div className="aix-state-title">Generating SOAP Notes…</div>
              <div className="aix-state-sub">
                MedScribe AI is creating structured clinical documentation from
                the consultation.
              </div>
            </div>
            <div className="aix-state-spinner-row">
              <Loader2 className="aix-spinner" />
              <span className="aix-state-spinner-text">
                This may take 10–20 seconds…
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── NO ACTIVE CONSULTATION ──
  if (!recordingData) {
    return (
      <div className="dl-page">
        <div className="page-header">
          <div className="page-header-top">
            <div className="page-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <ClipboardList size={18} color="#fff" />
              </div>
              <div>
                <div className="page-header-title">SOAP Notes</div>
                <div className="page-header-sub">No active consultation</div>
              </div>
            </div>
          </div>
        </div>
        <div className="page-content">
          <div className="aix-state-card">
            <div className="aix-state-icon aix-state-icon-loading">
              <FileText className="aix-state-icon-svg" />
            </div>
            <div className="aix-state-body">
              <div className="aix-state-title">No Active Consultation</div>
              <div className="aix-state-sub">
                To generate SOAP notes, start a consultation from the Patients page first. After recording and AI extraction, notes will be generated automatically here.
              </div>
            </div>
            <div className="aix-state-actions">
              <button
                type="button"
                className="btn btn-secondary btn-md"
                onClick={() => navigate('/doctor/dashboard')}
              >
                <ArrowLeft size={14} /> Back to Dashboard
              </button>
              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={() => navigate('/doctor/patients')}
              >
                Go to Patients
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ERROR STATE ──
  if (error) {
    return (
      <div className="dl-page">
        <div className="page-header">
          <div className="page-header-top">
            <div className="page-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <AlertCircle size={18} color="#fff" />
              </div>
              <div>
                <div className="page-header-title">Generation Failed</div>
                <div className="page-header-sub">
                  MedScribe AI encountered an error
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-content">
          <div className="aix-state-card">
            <div className="aix-state-icon aix-state-icon-error">
              <AlertCircle className="aix-state-icon-svg" />
            </div>
            <div className="aix-state-body">
              <div className="aix-state-title">Notes Generation Failed</div>
              <div className="aix-state-sub">{error}</div>
            </div>
            <div className="aix-state-actions">
              <button
                type="button"
                className="btn btn-secondary btn-md"
                onClick={() => navigate('/doctor/extraction')}
              >
                <ArrowLeft size={14} /> Back to Extraction
              </button>
              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={() => generateNotes(recordingData?.transcript)}
              >
                <RefreshCw size={14} /> Retry Generation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN STATE ──
  return (
    <div className="dl-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <ClipboardList size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Clinical SOAP Documentation</div>
              <div className="page-header-sub">
                Refining consultation records for {patientName || "Patient"}
              </div>
            </div>
          </div>
          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/doctor/prescription')}
            >
              Finalize Notes <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="page-content">
        <div className="sp-section">

          {/* ── Editor Card ── */}
          <div className="mn-editor-card">
            <div className="mn-editor-accent" />

            <div className="mn-editor-header">
              <div className="mn-editor-header-left">
                <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                  <Sparkles size={16} color="#fff" />
                </div>
                <div>
                  <div className="card-title">SOAP Notes Editor</div>
                  <div className="card-subtitle">
                    Review, refine and finalize the generated documentation
                  </div>
                </div>
              </div>
              <span className="mn-editor-eyebrow">
                <Brain size={11} /> AI Generated
              </span>
            </div>

            <div className="mn-editor-body">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mn-textarea"
                placeholder={`Subjective:
Patient reports...

Objective:
Vitals: BP 120/80...

Assessment:
Preliminary diagnosis...

Plan:
Treatment initiated...`}
              />
            </div>

            <div className="mn-editor-footer">
              <div className="mn-meta-left">
                {model && (
                  <span className="mn-meta-chip">
                    <Brain size={13} />
                    {model}
                  </span>
                )}
                {processingTime !== null && (
                  <span className="mn-meta-chip">
                    <Loader2 size={13} />
                    Processed in {processingTime}s
                  </span>
                )}
              </div>
              <div className="mn-meta-right">
                <span>{notes.split(' ').filter(Boolean).length} Words</span>
                <span className="mn-meta-dot" />
                <span>{notes.length} Chars</span>
              </div>
            </div>
          </div>

          {/* ── Bottom Navigation ── */}
          <div className="mn-bottom-actions">
            <div className="mn-bottom-actions-right">
              <button
                type="button"
                className="btn btn-secondary btn-md"
                onClick={() => navigate('/doctor/extraction')}
              >
                <ArrowLeft size={14} /> Back to Extraction
              </button>
            </div>
            <div className="mn-bottom-actions-right">
              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={() => navigate('/doctor/prescription')}
              >
                Finalize Notes <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}