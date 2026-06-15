import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Send,
  Printer,
  User,
  FileText,
  Loader2,
  AlertCircle,
  Sparkles,
  Stethoscope,
  Activity,
  Pill,
  ClipboardCheck,
  ShieldAlert,
  CalendarClock,
  Building2,
  Award,
  Hash,
  CheckCircle,
  Phone,
} from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface DoctorInfo {
  full_name?: string;
  specialization?: string;
  license_number?: string;
  cnic?: string;
  phone?: string;
}

interface HospitalInfo {
  name?: string;
  address?: string;
  hospital_type?: string;
  contact_phone?: string;
  contact_email?: string;
  registration_number?: string;
}

interface PatientInfo {
  full_name?: string;
  age?: string | number;
  gender?: string;
  phone?: string;
  cnic?: string;
}

interface PrescriptionPreviewProps {
  patientName: string;
  recordingData: any;
  extractedData: any;
  pregeneratedData?: any;
  soapNotes?: string;
  extractionEditedText?: string;
  onLogout: () => void;
  doctorInfo?: DoctorInfo;
  hospitalInfo?: HospitalInfo;
  patientInfo?: PatientInfo;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = API_URL.replace(/\/$/, "");

export default function PrescriptionPreview({
  patientName,
  recordingData,
  extractedData,
  pregeneratedData,
  soapNotes,
  extractionEditedText,
  onLogout: _onLogout,
  doctorInfo,
  hospitalInfo,
  patientInfo,
}: PrescriptionPreviewProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [model, setModel] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const rxDocumentRef = useRef<HTMLDivElement>(null);

  // Local state for fetching doctor + hospital info if not passed in
  const [fetchedDoctor, setFetchedDoctor] = useState<DoctorInfo | null>(null);
  const [fetchedHospital, setFetchedHospital] = useState<HospitalInfo | null>(null);

  useEffect(() => {
    if (doctorInfo && hospitalInfo) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch(`${BASE_URL}/api/doctor/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.profile && data?.doctor_profile) {
          setFetchedDoctor({
            full_name:      data.profile.full_name,
            phone:          data.profile.phone,
            specialization: data.doctor_profile.specialization,
            license_number: data.doctor_profile.license_number,
            cnic:           data.doctor_profile.cnic,
          });
        }
        if (data?.hospital) {
          setFetchedHospital({
            name:                data.hospital.name,
            address:             data.hospital.address,
            hospital_type:       data.hospital.hospital_type,
            contact_phone:       data.hospital.contact_phone,
            contact_email:       data.hospital.contact_email,
            registration_number: data.hospital.registration_number,
          });
        }
      })
      .catch((err) => console.warn("Could not fetch doctor info:", err));
  }, [doctorInfo, hospitalInfo]);

  const doctor   = doctorInfo   || fetchedDoctor   || {};
  const hospital = hospitalInfo || fetchedHospital || {};
  const patient  = patientInfo  || {};

  useEffect(() => {
    if (pregeneratedData && Object.keys(pregeneratedData).length > 0) {
      setPrescriptionData(pregeneratedData);
      setIsLoading(false);
      return;
    }
    const transcript = recordingData?.transcript;
    if (!transcript) {
      setError("No transcript available. Go back and record a consultation first.");
      setIsLoading(false);
      return;
    }
    generatePrescription(transcript);
  }, [pregeneratedData]);

  const generatePrescription = async (transcript: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Not authenticated");

      // Priority for source text:
      // 1. SOAP notes (most downstream — doctor reviewed everything)
      // 2. Edited AI extraction text (doctor changed medications/diagnosis in extraction step)
      // 3. Original transcript (no edits made)
      // When any manual edit exists, force a fresh extraction from that edited text
      // so structured data (medications, diagnoses) reflects the doctor's changes.
      const sourceText =
        (soapNotes && soapNotes.trim())
          ? soapNotes
          : (extractionEditedText && extractionEditedText.trim())
          ? extractionEditedText
          : transcript;
      const sourceIsEdited = !!(soapNotes?.trim() || extractionEditedText?.trim());

      let currentExtracted = sourceIsEdited ? null : extractedData;

      if (!currentExtracted || Object.keys(currentExtracted).length === 0) {
        const extractRes = await fetch(`${BASE_URL}/api/nlp/extract`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transcript: sourceText }),
        });
        const extractData = await extractRes.json();
        if (extractRes.ok && extractData.success) {
          currentExtracted = extractData.extracted_data;
        }
      }

      const res = await fetch(`${BASE_URL}/api/nlp/prescription`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: sourceText,
          extracted_data: currentExtracted || {},
          consultation_id: recordingData?.consultationId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || "Prescription generation failed");
      }

      setPrescriptionData(data.prescription);
      setProcessingTime(data.processing_time_seconds);
      setModel(data.model || "");

      const consultationId = recordingData?.consultationId;
      if (consultationId && token) {
        fetch(`${BASE_URL}/api/doctor/consultations/${consultationId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prescription: data.prescription }),
        }).catch((e) => console.warn("Save error:", e));
      }

      toast.success(`Prescription generated in ${data.processing_time_seconds}s`);
    } catch (err: any) {
      console.error("Prescription error:", err);
      setError(err.message || "Failed to generate prescription");
      toast.error(err.message || "Prescription generation failed");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Send prescription to patient ── */
  const handleSendToPatient = async () => {
    const consultationId = recordingData?.consultationId;
    if (!consultationId) {
      toast.error("No consultation ID found. Save the consultation first.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/doctor/consultations/${consultationId}/send-prescription`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send prescription");
      }

      setIsSent(true);
      toast.success(data.message || "Prescription sent to patient!");
    } catch (err: any) {
      console.error("Send prescription error:", err);
      toast.error(err.message || "Failed to send prescription");
    } finally {
      setIsSending(false);
    }
  };

  /* ── Download as PDF (using print-to-PDF) ── */
  const handleDownloadPDF = () => {
    setIsDownloading(true);

    // Create a new window with just the prescription content for clean PDF
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to download PDF");
      setIsDownloading(false);
      return;
    }

    const rxElement = rxDocumentRef.current;
    if (!rxElement) {
      printWindow.close();
      toast.error("Prescription document not found");
      setIsDownloading(false);
      return;
    }

    // Collect all stylesheets from current page
    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch {
          // Cross-origin stylesheets
          if (sheet.href) {
            return `@import url("${sheet.href}");`;
          }
          return "";
        }
      })
      .join("\n");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Prescription - ${patientName || "Patient"}</title>
          <style>
            ${styles}

            @media print {
              @page {
                margin: 10mm;
                size: A4;
              }
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .rx-document {
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                max-width: 100% !important;
              }
            }

            body {
              margin: 0;
              padding: 20px;
              background: white;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .rx-document {
              max-width: 800px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          ${rxElement.outerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to render then trigger print (save as PDF)
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
        setIsDownloading(false);
        toast.success("PDF download dialog opened");
      }, 500);
    };

    // Fallback timeout
    setTimeout(() => {
      setIsDownloading(false);
    }, 5000);
  };

  /* ── Print ── */
  const handlePrint = () => {
    window.print();
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="dl-page">
        <div className="page-header">
          <div className="page-header-top">
            <div className="page-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="page-header-title">E-Prescription</h1>
                <p className="page-header-sub">Generating prescription...</p>
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
              <h2 className="aix-state-title">Generating Prescription...</h2>
              <p className="aix-state-sub">
                Creating a structured prescription with dosing, warnings, and instructions.
              </p>
            </div>
            <div className="aix-state-spinner-row">
              <Loader2 className="aix-spinner" />
              <span className="aix-state-spinner-text">This may take 10–20 seconds...</span>
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
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h1 className="page-header-title">E-Prescription</h1>
                <p className="page-header-sub">Generation failed</p>
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
              <h2 className="aix-state-title">Prescription Generation Failed</h2>
              <p className="aix-state-sub">{error}</p>
            </div>
            <div className="aix-state-actions">
              <Button variant="outline" onClick={() => navigate("/doctor/notes")}>
                Back to Notes
              </Button>
              <Button onClick={() => generatePrescription(recordingData?.transcript)}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const medications     = prescriptionData?.medications  || [];
  const diagnoses       = extractedData?.diagnoses       || [];
  const symptoms        = extractedData?.symptoms        || [];
  const vitals          = extractedData?.vital_signs     || {};
  const allergies       = extractedData?.allergies       || [];
  const investigations  = prescriptionData?.investigations_ordered || [];
  const followUp        = prescriptionData?.follow_up;
  const noMeds          = medications.length === 0;
  const hasWarnings     = medications.some((m: any) => m.warnings?.length > 0);

  const today = new Date();
  const prescriptionNumber = `RX-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const doctorInitials = (doctor.full_name || "Dr")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* ── Main Document ── */
  return (
    <div className="dl-page">
      {/* Page header */}
      <div className="page-header no-print">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="page-header-title">E-Prescription</h1>
              <p className="page-header-sub">
                Prescription for {patientName || "Patient"}
              </p>
            </div>
          </div>
          <div className="page-header-actions">
            <Button
              onClick={handlePrint}
              className="btn-print-premium btn-md"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={handleDownloadPDF}
              className="btn-download-premium btn-md"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
            <Button
              onClick={handleSendToPatient}
              className="btn-send-premium btn-md"
              disabled={isSending || isSent || noMeds}
            >
              {isSent ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Sent ✓
                </>
              ) : isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to Patient
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sent confirmation banner */}
      {isSent && (
        <div className="rx-sent-banner no-print">
          <CheckCircle size={16} />
          <span>
            Prescription has been sent to the patient's mobile app. They can view and download it anytime.
          </span>
        </div>
      )}

      {/* Page content */}
      <div className="page-content">

        {/* ════════ PRESCRIPTION DOCUMENT ════════ */}
        <div className="rx-document" ref={rxDocumentRef}>
          {/* Subtle Watermark */}
          <div className="rx-watermark-container">
            <div className="rx-watermark-text">MEDSCRIBE AI</div>
            <div className="rx-watermark-text">CERTIFIED PRESCRIPTION</div>
          </div>

          {/* ─── Letterhead ─── */}
          <div className="rx-letterhead">
            <div className="rx-letterhead-accent" />
            <div className="rx-letterhead-top">
              <div className="rx-hospital">
                <div className="rx-hospital-icon">
                  <Building2 size={32} />
                </div>
                <div className="rx-hospital-text">
                  <h1 className="rx-hospital-name">
                    {hospital.name || "Hospital Name"}
                  </h1>
                  {hospital.address && (
                    <p className="rx-hospital-address">{hospital.address}</p>
                  )}
                  <div className="rx-hospital-meta">
                    {hospital.hospital_type && (
                      <span className="rx-hospital-meta-item">
                        {hospital.hospital_type}
                      </span>
                    )}
                    {hospital.contact_phone && (
                      <span className="rx-hospital-meta-item">
                        <Phone size={10} className="mr-1" /> {hospital.contact_phone}
                      </span>
                    )}
                    {hospital.registration_number && (
                      <span className="rx-hospital-meta-item">
                        Reg# {hospital.registration_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rx-doctor">
                <div className="rx-doctor-name-row">
                  <Stethoscope size={16} />
                  <span className="rx-doctor-name">
                    {doctor.full_name
                      ? `Dr. ${(doctor.full_name as string).replace(/^Dr\.?\s*/i, "")}`
                      : "Doctor Name"}
                  </span>
                </div>
                {doctor.specialization && (
                  <div className="rx-doctor-spec">{doctor.specialization}</div>
                )}
                <div className="rx-doctor-creds">
                  {doctor.license_number && (
                    <div className="rx-doctor-cred-item">
                      <Award size={12} />
                      <span>PMC# {doctor.license_number}</span>
                    </div>
                  )}
                  {doctor.cnic && (
                    <div className="rx-doctor-cred-item">
                      <Hash size={12} />
                      <span>CNIC: {doctor.cnic}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rx-letterhead-divider">
              <div className="rx-divider-ornament left" />
              <span className="rx-divider-symbol">℞</span>
              <div className="rx-divider-ornament right" />
            </div>

            <div className="rx-meta-row">
              <div className="rx-meta-item">
                <span className="rx-meta-label">Prescription #</span>
                <span className="rx-meta-value rx-mono">{prescriptionNumber}</span>
              </div>
              <div className="rx-meta-item">
                <span className="rx-meta-label">Date</span>
                <span className="rx-meta-value">
                  {today.toLocaleDateString("en-US", {
                    year:  "numeric",
                    month: "long",
                    day:   "numeric",
                  })}
                </span>
              </div>
              <div className="rx-meta-item">
                <span className="rx-meta-label">Time</span>
                <span className="rx-meta-value">
                  {today.toLocaleTimeString("en-US", {
                    hour:   "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Patient information ─── */}
          <section className="rx-section rx-patient-section">
            <div className="rx-section-header">
              <User size={16} className="rx-section-icon" />
              <h3 className="rx-section-title">Patient Information</h3>
            </div>

            <div className="rx-patient-grid">
              <div className="rx-patient-field">
                <span className="rx-field-label">Name</span>
                <span className="rx-field-value">
                  {patientName || patient.full_name || "—"}
                </span>
              </div>
              {patient.age && (
                <div className="rx-patient-field">
                  <span className="rx-field-label">Age</span>
                  <span className="rx-field-value">{patient.age}</span>
                </div>
              )}
              {patient.gender && (
                <div className="rx-patient-field">
                  <span className="rx-field-label">Gender</span>
                  <span className="rx-field-value rx-cap">{patient.gender}</span>
                </div>
              )}
              {patient.cnic && (
                <div className="rx-patient-field">
                  <span className="rx-field-label">CNIC</span>
                  <span className="rx-field-value rx-mono">{patient.cnic}</span>
                </div>
              )}
              {patient.phone && (
                <div className="rx-patient-field">
                  <span className="rx-field-label">Phone</span>
                  <span className="rx-field-value">{patient.phone}</span>
                </div>
              )}
            </div>

            {allergies.length > 0 ? (
              <div className="rx-allergy-banner rx-allergy-warn">
                <ShieldAlert size={16} />
                <div>
                  <span className="rx-allergy-label">ALLERGIES:</span>
                  <span className="rx-allergy-text">{allergies.join(", ")}</span>
                </div>
              </div>
            ) : (
              <div className="rx-allergy-banner rx-allergy-ok">
                <ShieldAlert size={14} />
                <span>No known drug allergies (NKDA)</span>
              </div>
            )}
          </section>

          {/* ─── Vital signs ─── */}
          {Object.values(vitals).some((v) => v) && (
            <section className="rx-section">
              <div className="rx-section-header">
                <Activity size={16} className="rx-section-icon" />
                <h3 className="rx-section-title">Vital Signs</h3>
              </div>
              <div className="rx-vitals-grid">
                {vitals.blood_pressure && (
                  <div className="rx-vital-item">
                    <span className="rx-vital-label">BP</span>
                    <span className="rx-vital-value">{vitals.blood_pressure}</span>
                    <span className="rx-vital-unit">mmHg</span>
                  </div>
                )}
                {vitals.heart_rate && (
                  <div className="rx-vital-item">
                    <span className="rx-vital-label">HR</span>
                    <span className="rx-vital-value">{vitals.heart_rate}</span>
                    <span className="rx-vital-unit">bpm</span>
                  </div>
                )}
                {vitals.temperature && (
                  <div className="rx-vital-item">
                    <span className="rx-vital-label">Temp</span>
                    <span className="rx-vital-value">{vitals.temperature}</span>
                  </div>
                )}
                {vitals.spo2 && (
                  <div className="rx-vital-item">
                    <span className="rx-vital-label">SpO₂</span>
                    <span className="rx-vital-value">{vitals.spo2}</span>
                    <span className="rx-vital-unit">%</span>
                  </div>
                )}
                {vitals.weight && (
                  <div className="rx-vital-item">
                    <span className="rx-vital-label">Weight</span>
                    <span className="rx-vital-value">{vitals.weight}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ─── Diagnosis ─── */}
          {diagnoses.length > 0 && (
            <section className="rx-section rx-diagnosis-section">
              <div className="rx-section-header">
                <ClipboardCheck size={16} className="rx-section-icon" />
                <h3 className="rx-section-title">Diagnosis</h3>
              </div>
              <div className="rx-diagnosis-list">
                {diagnoses.map((dx: any, idx: number) => (
                  <div key={idx} className="rx-diagnosis-item">
                    <div className="rx-dx-main">
                      <span className="rx-dx-bullet">•</span>
                      <span className="rx-dx-name">{dx.name}</span>
                      {dx.icd10_code && (
                        <span className="rx-dx-icd">{dx.icd10_code}</span>
                      )}
                    </div>
                    <div className="rx-dx-tags">
                      {dx.type && (
                        <span className={`rx-dx-tag rx-dx-tag-${dx.type === "primary" ? "primary" : "diff"}`}>
                          {dx.type}
                        </span>
                      )}
                      {dx.confidence && (
                        <span className="rx-dx-confidence">{dx.confidence}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {symptoms.length > 0 && (
                <div className="rx-symptoms-row">
                  <span className="rx-symptoms-label">Presenting symptoms:</span>
                  <span className="rx-symptoms-text">
                    {symptoms.map((s: any) => s.name).filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </section>
          )}

          {/* ─── Prescribed medications ─── */}
          <section className="rx-section rx-meds-section-new">
            <div className="rx-section-header">
              <Pill size={16} className="rx-section-icon" />
              <h3 className="rx-section-title">℞ Prescribed Medications</h3>
              {noMeds && (
                <span className="rx-section-note">
                  {prescriptionData?.note || "No medications prescribed"}
                </span>
              )}
            </div>

            {!noMeds && (
              <div className="rx-meds-list">
                {medications.map((med: any, idx: number) => (
                  <div key={idx} className="rx-med-card">
                    <div className="rx-med-number">{idx + 1}</div>
                    <div className="rx-med-body">
                      <div className="rx-med-header-row">
                        <div className="rx-med-name-block">
                          <span className="rx-med-name-new">{med.name}</span>
                          {med.generic_name && med.generic_name !== med.name && (
                            <span className="rx-med-generic-new">
                              ({med.generic_name})
                            </span>
                          )}
                          {med.strength && (
                            <span className="rx-med-strength">{med.strength}</span>
                          )}
                        </div>
                        {med.route && (
                          <span className={`rx-med-route rx-route-${med.route?.toLowerCase()}`}>
                            {med.route}
                          </span>
                        )}
                      </div>

                      <div className="rx-med-details">
                        {med.dose && (
                          <div className="rx-med-detail">
                            <span className="rx-detail-label">Dose</span>
                            <span className="rx-detail-value">{med.dose}</span>
                          </div>
                        )}
                        {med.frequency && (
                          <div className="rx-med-detail">
                            <span className="rx-detail-label">Frequency</span>
                            <span className="rx-detail-value">{med.frequency}</span>
                          </div>
                        )}
                        {med.duration && (
                          <div className="rx-med-detail">
                            <span className="rx-detail-label">Duration</span>
                            <span className="rx-detail-value">{med.duration}</span>
                          </div>
                        )}
                        {med.dosage_form && (
                          <div className="rx-med-detail">
                            <span className="rx-detail-label">Form</span>
                            <span className="rx-detail-value rx-cap">{med.dosage_form}</span>
                          </div>
                        )}
                        {med.quantity_to_dispense && (
                          <div className="rx-med-detail">
                            <span className="rx-detail-label">Dispense</span>
                            <span className="rx-detail-value">{med.quantity_to_dispense}</span>
                          </div>
                        )}
                      </div>

                      {med.instructions && (
                        <div className="rx-med-instructions">
                          <span className="rx-instructions-label">Instructions:</span>
                          <span className="rx-instructions-text">{med.instructions}</span>
                        </div>
                      )}

                      {med.warnings?.length > 0 && (
                        <div className="rx-med-warning">
                          <AlertCircle size={12} />
                          <span>{med.warnings.join(" · ")}</span>
                        </div>
                      )}

                      {med.allergy_flag && (
                        <div className="rx-med-allergy-flag">
                          <ShieldAlert size={12} />
                          <span>Allergy alert: {med.allergy_flag}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ─── Investigations ─── */}
          {investigations.length > 0 && (
            <section className="rx-section rx-inv-section">
              <div className="rx-section-header">
                <FileText size={16} className="rx-section-icon" />
                <h3 className="rx-section-title">Investigations Ordered</h3>
              </div>
              <div className="rx-inv-grid">
                {investigations.map((inv: string, idx: number) => (
                  <div key={idx} className="rx-inv-chip">
                    <span className="rx-inv-num">{idx + 1}</span>
                    <span>{inv}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Warnings ─── */}
          {hasWarnings && (
            <section className="rx-section rx-warnings-section">
              <div className="rx-section-header">
                <AlertCircle size={16} className="rx-section-icon rx-warn-color" />
                <h3 className="rx-section-title rx-warn-color">General Warnings</h3>
              </div>
              <ul className="rx-warnings-list-new">
                {medications.flatMap((m: any, i: number) =>
                  (m.warnings || []).map((w: string, j: number) => (
                    <li key={`${i}-${j}`} className="rx-warning-item-new">
                      <span className="rx-warn-pill">{m.name}</span>
                      <span>{w}</span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          )}

          {/* ─── Follow-up ─── */}
          {(followUp || prescriptionData?.prescriber_notes) && (
            <section className="rx-section rx-followup-section">
              {followUp && (
                <div className="rx-followup-box">
                  <div className="rx-followup-icon-wrap">
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <h4 className="rx-followup-title">Follow-up</h4>
                    <p className="rx-followup-text-new">{followUp}</p>
                  </div>
                </div>
              )}

              {prescriptionData?.prescriber_notes && (
                <div className="rx-notes-box">
                  <h4 className="rx-notes-title">Additional Notes</h4>
                  <p className="rx-notes-text-new">
                    {prescriptionData.prescriber_notes}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ─── Digital signature ─── */}
          <section className="rx-signature-section">
            <div className="rx-sig-grid">
              <div className="rx-sig-block-empty">
                <div className="rx-sig-line" />
                <span className="rx-sig-caption">Patient / Attendant Signature</span>
              </div>

              <div className="rx-sig-block">
                <div className="rx-sig-stamp">
                  <div className="rx-sig-mark">
                    <span className="rx-sig-initials">{doctorInitials}</span>
                    <span className="rx-sig-script">
                      Dr. {(doctor.full_name as string)?.split(" ")[0] || ""}
                    </span>
                  </div>
                  <div className="rx-sig-verified">
                    <span className="rx-verified-dot" />
                    Digitally Signed
                  </div>
                </div>
                <div className="rx-sig-line" />
                <div className="rx-sig-doctor-info">
                  <span className="rx-sig-doc-name">
                    Dr. {doctor.full_name || "Doctor"}
                  </span>
                  {doctor.specialization && (
                    <span className="rx-sig-doc-spec">{doctor.specialization}</span>
                  )}
                  {doctor.license_number && (
                    <span className="rx-sig-doc-license">
                      License: {doctor.license_number}
                    </span>
                  )}
                  <span className="rx-sig-doc-date">
                    Signed on {today.toLocaleDateString("en-US", {
                      year:  "numeric",
                      month: "short",
                      day:   "numeric",
                    })} at {today.toLocaleTimeString("en-US", {
                      hour:   "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Footer ─── */}
          <footer className="rx-footer">
            <div className="rx-footer-left">
              <Sparkles size={12} />
              <span>
                Powered by <strong>MedScribe AI</strong>
                {model && ` · ${model}`}
                {processingTime && ` · ${processingTime}s`}
              </span>
            </div>
            <div className="rx-footer-right">
              <span>This is an AI-assisted prescription · Requires physician countersignature</span>
            </div>
          </footer>
        </div>

        {/* ════════ Page footer actions ════════ */}
        <div className="pp-footer no-print">
          <Button
            variant="outline"
            onClick={() => navigate("/doctor/notes")}
            className="pp-footer-back"
          >
            Back to Notes
          </Button>
          <div className="pp-footer-right">
            <Button
              variant="outline"
              onClick={() => navigate("/doctor/dashboard")}
              className="pp-footer-secondary"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => {
                if (!isSent) {
                  handleSendToPatient().then(() => {
                    navigate("/doctor/dashboard");
                  });
                } else {
                  navigate("/doctor/dashboard");
                }
              }}
              className="pp-footer-primary"
              disabled={isSending || noMeds}
            >
              {isSent ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Done
                </>
              ) : isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send & Complete
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}