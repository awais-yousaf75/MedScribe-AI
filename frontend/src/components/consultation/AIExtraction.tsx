import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain, Edit2, FileText, Sparkles, AlertCircle,
  Loader2, Check, X, Activity, Pill, ShieldAlert, Stethoscope,
} from "lucide-react";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";

interface AIExtractionProps {
  patientName: string;
  recordingData: any;
  onLogout: () => void;
  onExtractionComplete?: (data: any) => void;
  onExtractionEdited?: (text: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = API_URL.replace(/\/$/, "");

export default function AIExtraction({
  patientName,
  recordingData,
  onLogout: _onLogout,
  onExtractionComplete,
  onExtractionEdited,
}: AIExtractionProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [model, setModel]               = useState<string>("");

  const [insights, setInsights] = useState({
    symptoms:   "",
    diagnosis:  "",
    advice:     "",
    avoidances: "",
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editDraft,    setEditDraft]    = useState<string>("");

  useEffect(() => {
    const transcript = recordingData?.transcript;
    if (!transcript) { setIsLoading(false); return; }
    extractMedicalData(transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extractMedicalData = async (transcript: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${BASE_URL}/api/nlp/extract`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, consultation_id: recordingData?.consultationId || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.details || "Extraction failed");

      const ed = data.extracted_data;
      setExtractedData(ed);
      setProcessingTime(data.processing_time_seconds);
      setModel(data.model || "");

      const symptomsText = (ed.symptoms || []).map((s: any) => {
        let l = s.name || "Unknown symptom";
        if (s.severity) l += ` (severity: ${s.severity})`;
        if (s.duration) l += ` — ${s.duration}`;
        if (s.location) l += ` at ${s.location}`;
        return l;
      }).join("\n") || "No symptoms extracted";

      const diagnosisText = (ed.diagnoses || []).map((d: any) => {
        let l = d.name || "Unknown";
        if (d.icd10_code) l += ` [${d.icd10_code}]`;
        if (d.type)       l += ` — ${d.type}`;
        if (d.confidence) l += ` (${d.confidence} confidence)`;
        return l;
      }).join("\n") || "No diagnoses extracted";

      const medicationsText = (ed.medications || []).map((m: any) => {
        let l = m.name || "Unknown";
        if (m.dose)         l += ` ${m.dose}`;
        if (m.frequency)    l += ` ${m.frequency}`;
        if (m.duration)     l += ` for ${m.duration}`;
        if (m.instructions) l += ` — ${m.instructions}`;
        return l;
      }).join("\n");

      const followUp    = ed.follow_up;
      const adviceText  = [
        medicationsText ? `Medications:\n${medicationsText}` : null,
        followUp?.timing ? `Follow-up: ${followUp.timing}` : null,
        followUp?.instructions ? `Instructions: ${followUp.instructions}` : null,
        followUp?.red_flags?.length ? `Red Flags: ${followUp.red_flags.join(", ")}` : null,
      ].filter(Boolean).join("\n\n") || "No treatment plan extracted";

      const allergies = (ed.allergies || []).join(", ") || "None documented";

      setInsights({
        symptoms:   symptomsText,
        diagnosis:  diagnosisText,
        advice:     adviceText,
        avoidances: `Allergies: ${allergies}`,
      });

      if (onExtractionComplete) onExtractionComplete(ed);

      const consultationId = recordingData?.consultationId;
      if (consultationId && token) {
        fetch(`${BASE_URL}/api/doctor/consultations/${consultationId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ extracted_data: ed }),
        }).catch(e => console.warn("⚠️ Save error:", e));
      }

      toast.success(`AI extraction complete in ${data.processing_time_seconds}s`);
    } catch (err: any) {
      setError(err.message || "Failed to extract medical data");
      toast.error(err.message || "Extraction failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Build combined text from current edited insights, used as source for prescription
  const buildEditedText = (ins = insights) =>
    `Symptoms:\n${ins.symptoms}\n\nDiagnosis:\n${ins.diagnosis}\n\nTreatment Plan & Medications:\n${ins.advice}\n\nAllergies & Avoidances:\n${ins.avoidances}`;

  const handleGoToNotes = () => {
    onExtractionEdited?.(buildEditedText());
    navigate("/doctor/notes");
  };

  const handleGoToPrescription = () => {
    onExtractionEdited?.(buildEditedText());
    navigate("/doctor/prescription");
  };

  const startEdit = (field: string) => {
    setEditingField(field);
    setEditDraft(insights[field as keyof typeof insights]);
  };

  const saveEdit = (field: string) => {
    const updated = { ...insights, [field]: editDraft };
    setInsights(updated);
    setEditingField(null);
  };

  const cancelEdit = () => setEditingField(null);

  /* ── No active consultation ── */
  if (!recordingData) {
    return (
      <div className="dl-page">
        <div className="page-header">
          <div className="page-header-top">
            <div className="page-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <Brain size={18} color="#fff" />
              </div>
              <div>
                <h1 className="page-header-title">AI Clinical Insights</h1>
                <p className="page-header-sub">No active consultation</p>
              </div>
            </div>
          </div>
        </div>
        <div className="page-content">
          <div className="aix-state-card">
            <div className="aix-state-icon aix-state-icon-loading">
              <Brain className="aix-state-icon-svg" />
            </div>
            <div className="aix-state-body">
              <h2 className="aix-state-title">No Active Consultation</h2>
              <p className="aix-state-sub">
                Start a consultation from the Patients page first. Record a session, then AI will extract clinical insights here.
              </p>
            </div>
            <div className="aix-state-actions">
              <button type="button" className="btn btn-secondary btn-md" onClick={() => navigate("/doctor/dashboard")}>
                Back to Dashboard
              </button>
              <button type="button" className="btn btn-primary btn-md" onClick={() => navigate("/doctor/patients")}>
                Go to Patients
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="dl-page">
        <div className="page-header">
          <div className="page-header-top">
            <div className="page-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <Brain size={18} color="#fff" />
              </div>
              <div>
                <h1 className="page-header-title">AI Clinical Insights</h1>
                <p className="page-header-sub">Analyzing consultation transcript…</p>
              </div>
            </div>
          </div>
        </div>
        <div className="page-content">
          <div className="aix-state-card">
            <div className="aix-state-icon aix-state-icon-loading">
              <Brain className="aix-state-icon-svg" />
            </div>
            <div className="aix-state-body">
              <h2 className="aix-state-title">MedScribe AI is Analyzing…</h2>
              <p className="aix-state-sub">
                Extracting symptoms, diagnoses, medications, and clinical data from the transcript.
              </p>
            </div>
            <div className="aix-state-spinner-row">
              <Loader2 className="aix-spinner" />
              <span className="aix-state-spinner-text">This may take 5–15 seconds…</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="dl-page">
        <div className="page-header">
          <div className="page-header-top">
            <div className="page-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <Brain size={18} color="#fff" />
              </div>
              <div>
                <h1 className="page-header-title">AI Clinical Insights</h1>
                <p className="page-header-sub">Extraction failed</p>
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
              <h2 className="aix-state-title">Extraction Failed</h2>
              <p className="aix-state-sub">{error}</p>
            </div>
            <div className="aix-state-actions">
              <button type="button" className="btn btn-secondary btn-md" onClick={() => navigate("/doctor/transcript")}>
                Back to Transcript
              </button>
              <button type="button" className="btn btn-primary btn-md" onClick={() => extractMedicalData(recordingData?.transcript)}>
                Retry Extraction
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main ── */
  const cards = [
    { field: "symptoms",   title: "Symptoms",                  sub: "Patient-reported complaints",    icon: Activity,    iconClass: "aix-card-icon-blue"  },
    { field: "diagnosis",  title: "AI-Suggested Diagnosis",    sub: "Preliminary clinical assessment", icon: Stethoscope, iconClass: "aix-card-icon-teal"  },
    { field: "advice",     title: "Treatment Plan & Medications", sub: "Extracted care plan",          icon: Pill,        iconClass: "aix-card-icon-navy"  },
    { field: "avoidances", title: "Allergies & Avoidances",    sub: "Documented contraindications",   icon: ShieldAlert, iconClass: "aix-card-icon-error" },
  ];

  const summaryCount = [
    { label: "Symptoms",    value: extractedData?.symptoms?.length   ?? 0 },
    { label: "Diagnoses",   value: extractedData?.diagnoses?.length  ?? 0 },
    { label: "Medications", value: extractedData?.medications?.length ?? 0 },
    { label: "Allergies",   value: extractedData?.allergies?.length  ?? 0 },
  ];

  return (
    <div className="dl-page">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Brain size={18} color="#fff" />
            </div>
            <div>
              <h1 className="page-header-title">AI Clinical Insights</h1>
              <p className="page-header-sub">Extracted data for {patientName}</p>
            </div>
          </div>
          <div className="page-header-actions">
            <div className="aix-complete-pill">
              <Sparkles className="aix-complete-icon" />
              <span className="aix-complete-text">
                AI Complete{processingTime ? ` · ${processingTime}s` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">

        {/* Summary counts + model info */}
        <div className="card card-sm" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {summaryCount.map(({ label, value }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "var(--ms-teal)" }}>{value}</span>
                  <span style={{ fontSize: 12, color: "var(--ms-text-soft)" }}>{label}</span>
                </div>
              ))}
            </div>
            {model && (
              <span className="badge badge-info" style={{ fontSize: 11 }}>
                <Brain size={10} /> {model}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--ms-text-muted)", marginTop: 10, marginBottom: 0 }}>
            Review and edit any field below before proceeding. Your edits will be used to generate the prescription.
          </p>
        </div>

        {/* Extraction cards */}
        <div className="aix-grid">
          {cards.map(({ field, title, sub, icon: Icon, iconClass }) => {
            const isEditing = editingField === field;
            const value     = insights[field as keyof typeof insights];

            return (
              <div key={field} className="aix-card">
                <div className="aix-card-header">
                  <div className="aix-card-header-left">
                    <div className={`aix-card-icon ${iconClass}`}>
                      <Icon className="aix-card-icon-svg" />
                    </div>
                    <div>
                      <h3 className="aix-card-title">{title}</h3>
                      <p className="aix-card-sub">{sub}</p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "4px 8px", color: "var(--ms-teal)" }}
                        onClick={() => saveEdit(field)}
                        title="Save"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "4px 8px", color: "var(--ms-error)" }}
                        onClick={cancelEdit}
                        title="Cancel"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="aix-edit-btn"
                      onClick={() => startEdit(field)}
                      title="Edit"
                    >
                      <Edit2 className="aix-edit-icon" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <Textarea
                    value={editDraft}
                    onChange={e => setEditDraft(e.target.value)}
                    className="aix-textarea aix-textarea-lg"
                    autoFocus
                  />
                ) : (
                  <p className="aix-card-text">{value || "No data extracted"}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* AI notice */}
        <div className="aix-notice">
          <Sparkles className="aix-notice-icon" />
          <div className="aix-notice-body">
            <h4 className="aix-notice-title">
              AI Extraction Complete{processingTime ? ` — ${processingTime}s` : ""}
            </h4>
            <p className="aix-notice-text">
              MedScribe AI ({model}) has analyzed the consultation transcript. All suggestions are
              preliminary and should be reviewed by the physician. Edits you make here will be
              reflected in the prescription.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="aix-footer">
          <button type="button" className="btn btn-secondary btn-md" onClick={() => navigate("/doctor/transcript")}>
            Back to Transcript
          </button>
          <div className="aix-footer-right">
            <button type="button" className="btn btn-secondary btn-md" onClick={handleGoToPrescription}>
              <FileText size={14} /> Skip to Prescription
            </button>
            <button type="button" className="btn btn-primary btn-md" onClick={handleGoToNotes}>
              Continue to SOAP Notes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
