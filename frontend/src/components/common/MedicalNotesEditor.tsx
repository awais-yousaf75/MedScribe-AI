import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import {
  FileText, Sparkles, Loader2, Brain, AlertCircle,
  ClipboardList, RefreshCw, ArrowRight, ArrowLeft, Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface MedicalNotesEditorProps {
  patientName: string;
  recordingData: any;
  extractedData: any;
  onLogout: () => void;
  onNotesFinalized?: (notes: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = API_URL.replace(/\/$/, "");

const SOAP_PLACEHOLDER = `Subjective:
Patient reports...

Objective:
Vitals: BP 120/80, HR 78, Temp 98.6°F
Physical examination findings...

Assessment:
1. Primary diagnosis...
2. Secondary findings...

Plan:
• Medications prescribed...
• Follow-up in X weeks
• Patient education provided...`;

export default function MedicalNotesEditor({
  patientName,
  recordingData,
  extractedData,
  onLogout: _onLogout,
  onNotesFinalized,
}: MedicalNotesEditorProps) {
  const navigate = useNavigate();
  const [notes, setNotes]               = useState('');
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [model, setModel]               = useState<string>('');
  const [isSaving, setIsSaving]         = useState(false);

  useEffect(() => {
    const transcript = recordingData?.transcript;
    if (!transcript) { setIsLoading(false); return; }
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
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          extracted_data:  extractedData || null,
          consultation_id: recordingData?.consultationId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.details || "Notes generation failed");
      setNotes(data.notes || "");
      setProcessingTime(data.processing_time_seconds);
      setModel(data.model || "");

      const consultationId = recordingData?.consultationId;
      if (consultationId && token) {
        fetch(`${BASE_URL}/api/doctor/consultations/${consultationId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ soap_notes: data.notes }),
        }).catch(e => console.warn("⚠️ Save notes error:", e));
      }
      toast.success(`SOAP notes generated in ${data.processing_time_seconds}s`);
    } catch (err: any) {
      setError(err.message || "Failed to generate notes");
      toast.error(err.message || "Notes generation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    setIsSaving(true);
    try {
      const consultationId = recordingData?.consultationId;
      const token = localStorage.getItem("accessToken");
      if (consultationId && token) {
        await fetch(`${BASE_URL}/api/doctor/consultations/${consultationId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ soap_notes: notes }),
        });
      }
    } catch { /* fire and forget — navigate regardless */ }
    onNotesFinalized?.(notes);
    navigate('/doctor/prescription');
    setIsSaving(false);
  };

  const wordCount = notes.trim().split(/\s+/).filter(Boolean).length;

  // ── LOADING STATE ──
  if (isLoading) {
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
                <div className="page-header-sub">Generating clinical documentation…</div>
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
              <div className="aix-state-title">Generating SOAP Notes…</div>
              <div className="aix-state-sub">
                MedScribe AI is creating structured clinical documentation from the consultation.
              </div>
            </div>
            <div className="aix-state-spinner-row">
              <Loader2 className="aix-spinner" />
              <span className="aix-state-spinner-text">This may take 10–20 seconds…</span>
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
                Start a consultation from the Patients page first. After recording and AI extraction, notes will be generated here.
              </div>
            </div>
            <div className="aix-state-actions">
              <button type="button" className="btn btn-secondary btn-md" onClick={() => navigate('/doctor/dashboard')}>
                <ArrowLeft size={14} /> Back to Dashboard
              </button>
              <button type="button" className="btn btn-primary btn-md" onClick={() => navigate('/doctor/patients')}>
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
                <div className="page-header-title">Notes Generation Failed</div>
                <div className="page-header-sub">MedScribe AI encountered an error</div>
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
              <div className="aix-state-title">Generation Failed</div>
              <div className="aix-state-sub">{error}</div>
            </div>
            <div className="aix-state-actions">
              <button type="button" className="btn btn-secondary btn-md" onClick={() => navigate('/doctor/extraction')}>
                <ArrowLeft size={14} /> Back to Extraction
              </button>
              <button type="button" className="btn btn-primary btn-md" onClick={() => generateNotes(recordingData?.transcript)}>
                <RefreshCw size={14} /> Retry
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
              <div className="page-header-title">SOAP Notes Editor</div>
              <div className="page-header-sub">
                Review and finalize clinical documentation for {patientName || "Patient"}
              </div>
            </div>
          </div>
          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleFinalize}
              disabled={isSaving}
            >
              {isSaving
                ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
                : <><ArrowRight size={13} /> Finalize &amp; Prescribe</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="page-content">
        <div className="sp-section">

          {/* SOAP section quick-reference */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {[
              { key: "S", label: "Subjective",  color: "#0D9488" },
              { key: "O", label: "Objective",   color: "#3B82F6" },
              { key: "A", label: "Assessment",  color: "#8B5CF6" },
              { key: "P", label: "Plan",        color: "#F59E0B" },
            ].map(s => (
              <span
                key={s.key}
                className="badge"
                style={{
                  background: s.color + "18",
                  color: s.color,
                  border: `1px solid ${s.color}40`,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: 4,
                  background: s.color, color: "#fff",
                  display: "inline-flex", alignItems: "center",
                  justifyContent: "center", fontSize: 10,
                  fontWeight: 800, marginRight: 4,
                }}>
                  {s.key}
                </span>
                {s.label}
              </span>
            ))}
            <span className="badge badge-info" style={{ marginLeft: "auto" }}>
              <Brain size={11} /> AI-generated — physician reviewed
            </span>
          </div>

          {/* Editor card */}
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
                    Edit the AI-generated notes below — your changes will be used when generating the prescription
                  </div>
                </div>
              </div>
              {model && (
                <span className="mn-editor-eyebrow">
                  <Brain size={11} /> {model}
                </span>
              )}
            </div>

            <div className="mn-editor-body">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="mn-textarea"
                placeholder={SOAP_PLACEHOLDER}
                spellCheck={false}
                style={{ minHeight: 420 }}
              />
            </div>

            <div className="mn-editor-footer">
              <div className="mn-meta-left">
                {processingTime !== null && (
                  <span className="mn-meta-chip">
                    <Loader2 size={13} /> Generated in {processingTime}s
                  </span>
                )}
              </div>
              <div className="mn-meta-right">
                <span>{wordCount} words</span>
                <span className="mn-meta-dot" />
                <span>{notes.length} chars</span>
              </div>
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="mn-bottom-actions">
            <div className="mn-bottom-actions-right">
              <button type="button" className="btn btn-secondary btn-md" onClick={() => navigate('/doctor/extraction')}>
                <ArrowLeft size={14} /> Back to Extraction
              </button>
            </div>
            <div className="mn-bottom-actions-right">
              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={handleFinalize}
                disabled={isSaving}
              >
                {isSaving
                  ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  : <><Save size={14} /> Save &amp; Continue to Prescription</>
                }
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
