import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Edit2,
  Save,
  FileText,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";

interface AIExtractionProps {
  patientName: string;
  recordingData: any;
  onLogout: () => void;
  onExtractionComplete?: (data: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = API_URL.replace(/\/$/, "");

export default function AIExtraction({
  patientName,
  recordingData,
  onLogout: _onLogout,
  onExtractionComplete,
}: AIExtractionProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [model, setModel] = useState<string>("");

  const [insights, setInsights] = useState({
    symptoms: "",
    diagnosis: "",
    advice: "",
    avoidances: "",
  });

  const [isEditing, setIsEditing] = useState({
    symptoms: false,
    diagnosis: false,
    advice: false,
    avoidances: false,
  });

  useEffect(() => {
    const transcript = recordingData?.transcript;
    if (!transcript) {
      setIsLoading(false);
      return;
    }
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
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          consultation_id: recordingData?.consultationId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || "Extraction failed");
      }
      const ed = data.extracted_data;
      setExtractedData(ed);
      setProcessingTime(data.processing_time_seconds);
      setModel(data.model || "");
      const symptomsText =
        (ed.symptoms || [])
          .map((s: any) => {
            let line = s.name || "Unknown symptom";
            if (s.severity) line += ` (severity: ${s.severity})`;
            if (s.duration) line += ` — ${s.duration}`;
            if (s.location) line += ` — ${s.location}`;
            return line;
          })
          .join("\n") || "No symptoms extracted";
      const diagnosisText =
        (ed.diagnoses || [])
          .map((d: any) => {
            let line = d.name || "Unknown";
            if (d.icd10_code) line += ` (${d.icd10_code})`;
            if (d.type) line += ` — ${d.type}`;
            if (d.confidence) line += ` [${d.confidence}]`;
            return line;
          })
          .join("\n") || "No diagnoses extracted";
      const medicationsText = (ed.medications || [])
        .map((m: any) => {
          let line = m.name || "Unknown";
          if (m.dose) line += ` ${m.dose}`;
          if (m.frequency) line += ` ${m.frequency}`;
          if (m.duration) line += ` for ${m.duration}`;
          if (m.instructions) line += ` — ${m.instructions}`;
          return line;
        })
        .join("\n");
      const followUp = ed.follow_up;
      const adviceText =
        [
          medicationsText ? `Medications:\n${medicationsText}` : null,
          followUp?.timing ? `Follow-up: ${followUp.timing}` : null,
          followUp?.instructions
            ? `Instructions: ${followUp.instructions}`
            : null,
          followUp?.red_flags?.length
            ? `Red Flags: ${followUp.red_flags.join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join("\n\n") || "No treatment plan extracted";
      const allergies = (ed.allergies || []).join(", ") || "None documented";
      const avoidancesText = `Allergies: ${allergies}`;
      setInsights({
        symptoms: symptomsText,
        diagnosis: diagnosisText,
        advice: adviceText,
        avoidances: avoidancesText,
      });
      if (onExtractionComplete) {
        onExtractionComplete(ed);
      }
      const consultationId = recordingData?.consultationId;
      if (consultationId && token) {
        fetch(`${BASE_URL}/api/doctor/consultations/${consultationId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ extracted_data: ed }),
        })
          .then((r) => r.json())
          .then((r) => {
            if (r.success) console.log("✅ Extracted data saved");
            else console.warn("⚠️ Could not save extracted data:", r.error);
          })
          .catch((e) => console.warn("⚠️ Save error:", e));
      }
      toast.success(`AI extraction complete in ${data.processing_time_seconds}s`);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setError(err.message || "Failed to extract medical data");
      toast.error(err.message || "Extraction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (field: keyof typeof insights, value: string) => {
    setInsights({ ...insights, [field]: value });
  };

  const toggleEdit = (field: keyof typeof isEditing) => {
    setIsEditing({ ...isEditing, [field]: !isEditing[field] });
  };

  const handleSave = () => navigate("/doctor/notes");
  const handleGeneratePrescription = () => navigate("/doctor/prescription");

  /* ── No active consultation ── */
  if (!recordingData) {
    return (
      <div className="dl-page">
        <div className="page-header">
          <div className="page-header-top">
            <div className="page-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="page-header-title">AI Extraction</h1>
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
                To use AI extraction, start a consultation from the Patients page first. Record a session, then AI will extract clinical insights automatically.
              </p>
            </div>
            <div className="aix-state-actions">
              <button
                type="button"
                className="btn btn-secondary btn-md"
                onClick={() => navigate("/doctor/dashboard")}
              >
                Back to Dashboard
              </button>
              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={() => navigate("/doctor/patients")}
              >
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
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="page-header-title">AI Extraction</h1>
                <p className="page-header-sub">
                  Analyzing consultation transcript
                </p>
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
              <h2 className="aix-state-title">
                MedScribe AI is Analyzing...
              </h2>
              <p className="aix-state-sub">
                Extracting symptoms, diagnoses, medications, and clinical
                data from the transcript using Groq AI.
              </p>
            </div>
            <div className="aix-state-spinner-row">
              <Loader2 className="aix-spinner" />
              <span className="aix-state-spinner-text">
                This may take 5–15 seconds...
              </span>
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
              <div className="icon-wrap icon-wrap-md icon-wrap-muted">
                <Brain className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h1 className="page-header-title">AI Extraction</h1>
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
              <Button
                className="btn-print-premium btn-md"
                onClick={() => navigate("/doctor/transcript")}
              >
                Back to Transcript
              </Button>
              <Button
                className="btn-send-premium btn-md"
                onClick={() =>
                  extractMedicalData(recordingData?.transcript)
                }
              >
                Retry Extraction
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="dl-page">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="page-header-title">AI Clinical Insights</h1>
              <p className="page-header-sub">
                Extracted data for {patientName}
              </p>
            </div>
          </div>
          <div className="page-header-actions">
            <div className="aix-complete-pill">
              <Sparkles className="aix-complete-icon" />
              <span className="aix-complete-text">AI Analysis Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="page-content">
        {/* Cards grid */}
        <div className="aix-grid">
          {/* Symptoms */}
          <div className="aix-card">
            <div className="aix-card-header">
              <div className="aix-card-header-left">
                <div className="aix-card-icon aix-card-icon-blue">
                  <AlertCircle className="aix-card-icon-svg" />
                </div>
                <div>
                  <h3 className="aix-card-title">Symptoms Extracted</h3>
                  <p className="aix-card-sub">
                    AI-identified patient complaints
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleEdit("symptoms")}
                className="aix-edit-btn"
                title={isEditing.symptoms ? "Done" : "Edit"}
              >
                <Edit2 className="aix-edit-icon" />
              </button>
            </div>
            {isEditing.symptoms ? (
              <Textarea
                value={insights.symptoms}
                onChange={(e) => handleEdit("symptoms", e.target.value)}
                className="aix-textarea"
              />
            ) : (
              <p className="aix-card-text">{insights.symptoms}</p>
            )}
          </div>

          {/* Diagnosis */}
          <div className="aix-card">
            <div className="aix-card-header">
              <div className="aix-card-header-left">
                <div className="aix-card-icon aix-card-icon-teal">
                  <Brain className="aix-card-icon-svg" />
                </div>
                <div>
                  <h3 className="aix-card-title">AI-Suggested Diagnosis</h3>
                  <p className="aix-card-sub">
                    Preliminary clinical assessment
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleEdit("diagnosis")}
                className="aix-edit-btn"
                title={isEditing.diagnosis ? "Done" : "Edit"}
              >
                <Edit2 className="aix-edit-icon" />
              </button>
            </div>
            {isEditing.diagnosis ? (
              <Textarea
                value={insights.diagnosis}
                onChange={(e) => handleEdit("diagnosis", e.target.value)}
                className="aix-textarea"
              />
            ) : (
              <p className="aix-card-text">{insights.diagnosis}</p>
            )}
          </div>

          {/* Treatment Plan */}
          <div className="aix-card">
            <div className="aix-card-header">
              <div className="aix-card-header-left">
                <div className="aix-card-icon aix-card-icon-navy">
                  <FileText className="aix-card-icon-svg" />
                </div>
                <div>
                  <h3 className="aix-card-title">
                    Treatment Plan & Medications
                  </h3>
                  <p className="aix-card-sub">Extracted care plan</p>
                </div>
              </div>
              <button
                onClick={() => toggleEdit("advice")}
                className="aix-edit-btn"
                title={isEditing.advice ? "Done" : "Edit"}
              >
                <Edit2 className="aix-edit-icon" />
              </button>
            </div>
            {isEditing.advice ? (
              <Textarea
                value={insights.advice}
                onChange={(e) => handleEdit("advice", e.target.value)}
                className="aix-textarea aix-textarea-lg"
              />
            ) : (
              <p className="aix-card-text">{insights.advice}</p>
            )}
          </div>

          {/* Allergies */}
          <div className="aix-card">
            <div className="aix-card-header">
              <div className="aix-card-header-left">
                <div className="aix-card-icon aix-card-icon-error">
                  <AlertCircle className="aix-card-icon-svg" />
                </div>
                <div>
                  <h3 className="aix-card-title">Allergies & Avoidances</h3>
                  <p className="aix-card-sub">
                    Documented patient allergies
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleEdit("avoidances")}
                className="aix-edit-btn"
                title={isEditing.avoidances ? "Done" : "Edit"}
              >
                <Edit2 className="aix-edit-icon" />
              </button>
            </div>
            {isEditing.avoidances ? (
              <Textarea
                value={insights.avoidances}
                onChange={(e) => handleEdit("avoidances", e.target.value)}
                className="aix-textarea aix-textarea-lg"
              />
            ) : (
              <p className="aix-card-text">{insights.avoidances}</p>
            )}
          </div>
        </div>

        {/* AI notice */}
        <div className="aix-notice">
          <Sparkles className="aix-notice-icon" />
          <div className="aix-notice-body">
            <h4 className="aix-notice-title">
              AI Extraction Complete
              {processingTime ? ` — ${processingTime}s` : ""}
            </h4>
            <p className="aix-notice-text">
              MedScribe AI ({model}) has analyzed the consultation transcript.
              All suggestions are based on clinical evidence and should be
              reviewed by the physician before finalization.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="aix-footer">
          <Button
            onClick={() => navigate("/doctor/transcript")}
            className="btn-print-premium btn-md"
          >
            Back to Transcript
          </Button>
          <div className="aix-footer-right">
            <Button
              onClick={handleSave}
              className="btn-download-premium btn-md"
            >
              <Save className="w-4 h-4 mr-2" />
              Continue to SOAP Notes
            </Button>
            <Button
              onClick={handleGeneratePrescription}
              className="btn-send-premium btn-md"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Prescription
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}