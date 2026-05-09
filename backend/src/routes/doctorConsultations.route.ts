import { Router } from "express";
import { supabase } from "../config/supabaseClient";
import { authMiddleware, requireApprovedRole } from "../middleware/auth";

const router = Router();

router.use(authMiddleware, requireApprovedRole("doctor"));

/**
 * Helper: check if a doctor can access/consult a patient.
 *
 * Access is granted if ANY of these are true:
 *   1. patient_profiles.hospital_id matches doctor's hospital (registered there)
 *   2. Patient has ANY appointment at doctor's hospital (any status)
 *   3. Patient has no hospital_id yet (fresh mobile signup, not yet visited anywhere)
 *
 * We NEVER permanently reassign patient_profiles.hospital_id
 * because patients can visit multiple hospitals freely.
 */
async function canDoctorAccessPatient(
  patientProfileId: string,
  doctorHospitalId: string
): Promise<{ allowed: boolean; reason?: string }> {

  // 1) Check patient_profiles row exists
  const { data: patientRow, error: patientErr } = await supabase
    .from("patient_profiles")
    .select("profile_id, hospital_id")
    .eq("profile_id", patientProfileId)
    .single();

  if (patientErr || !patientRow) {
    return { allowed: false, reason: "Patient profile not found" };
  }

  // Case 1: Patient is registered at this hospital
  if (patientRow.hospital_id === doctorHospitalId) {
    return { allowed: true };
  }

  // Case 2: Patient has no hospital assigned yet (mobile signup)
  // Do NOT assign — just allow. They are a free patient.
  if (!patientRow.hospital_id) {
    return { allowed: true };
  }

  // Case 3: Patient has an appointment at this hospital
  // (any status — pending, approved, completed)
  const { data: appointment, error: apptErr } = await supabase
    .from("appointments")
    .select("id, status")
    .eq("patient_profile_id", patientProfileId)
    .eq("hospital_id", doctorHospitalId)
    .limit(1);

  if (!apptErr && appointment && appointment.length > 0) {
    return { allowed: true };
  }

  // None of the above — deny
  return {
    allowed: false,
    reason:
      "This patient has no appointment at your hospital. " +
      "Ask them to book an appointment first.",
  };
}

/**
 * POST /api/doctor/consultations
 */
router.post("/consultations", async (req, res) => {
  try {
    const profile = (req as any).profile as { id: string; role: string };
    const doctorProfileId = profile.id;

    const {
      patientProfileId,
      transcript,
      durationSeconds,
      language,
      words,
    } = req.body as {
      patientProfileId?: string;
      transcript?: string;
      durationSeconds?: number;
      language?: string;
      words?: any;
    };

    if (!patientProfileId || !transcript || !transcript.trim()) {
      return res
        .status(400)
        .json({ error: "patientProfileId and transcript are required" });
    }

    // 1) Get doctor's hospital_id
    const { data: doctorRow, error: doctorErr } = await supabase
      .from("doctor_profiles")
      .select("hospital_id, approval_status")
      .eq("profile_id", doctorProfileId)
      .single();

    if (doctorErr || !doctorRow) {
      console.error("doctor_profiles lookup error:", doctorErr);
      return res.status(400).json({ error: "Doctor profile not found" });
    }

    if (doctorRow.approval_status !== "approved") {
      return res.status(403).json({ error: "Doctor is not approved yet" });
    }

    const doctorHospitalId = doctorRow.hospital_id as string;

    // 2) Check patient access
    const access = await canDoctorAccessPatient(
      patientProfileId,
      doctorHospitalId
    );

    if (!access.allowed) {
      return res.status(403).json({
        error: access.reason || "Patient access denied",
      });
    }

    // 3) Insert consultation
    // Use doctor's hospital_id for the consultation record
    // This correctly records WHICH hospital this consultation happened at
    const { data: inserted, error: insErr } = await supabase
      .from("consultations")
      .insert({
        patient_profile_id: patientProfileId,
        doctor_profile_id:  doctorProfileId,
        hospital_id:        doctorHospitalId,
        duration_seconds:   Math.max(0, Number(durationSeconds || 0)),
        transcript:         transcript.trim(),
        language:           language || null,
        words:              words ?? null,
      })
      .select("*")
      .single();

    if (insErr || !inserted) {
      console.error("Insert consultation error:", insErr);
      return res.status(500).json({ error: "Failed to save consultation" });
    }

    return res.json({ success: true, consultation: inserted });
  } catch (err) {
    console.error("POST /api/doctor/consultations error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/doctor/patients/:patientProfileId/consultations
 */
router.get("/patients/:patientProfileId/consultations", async (req, res) => {
  try {
    const profile = (req as any).profile as { id: string; role: string };
    const doctorProfileId = profile.id;
    const { patientProfileId } = req.params;

    const { data: doctorRow, error: doctorErr } = await supabase
      .from("doctor_profiles")
      .select("hospital_id, approval_status")
      .eq("profile_id", doctorProfileId)
      .single();

    if (doctorErr || !doctorRow) {
      return res.status(400).json({ error: "Doctor profile not found" });
    }

    if (doctorRow.approval_status !== "approved") {
      return res.status(403).json({ error: "Doctor not approved" });
    }

    const access = await canDoctorAccessPatient(
      patientProfileId,
      doctorRow.hospital_id
    );

    if (!access.allowed) {
      return res.status(403).json({
        error: access.reason || "Patient access denied",
      });
    }

    const { data, error } = await supabase
      .from("consultations")
      .select(
        "id, transcript, duration_seconds, language, created_at, " +
        "medical_info, summary, doctor_notes, prescription"
      )
      .eq("patient_profile_id", patientProfileId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch consultations error:", error);
      return res.status(500).json({ error: "Failed to load consultations" });
    }

    return res.json({ consultations: data || [] });
  } catch (err) {
    console.error(
      "GET /api/doctor/patients/:patientProfileId/consultations error:",
      err
    );
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/doctor/consultations/:consultationId
 */
router.patch("/consultations/:consultationId", async (req, res) => {
  try {
    const profile = (req as any).profile as { id: string; role: string };
    const doctorProfileId = profile.id;
    const { consultationId } = req.params;

    const { extracted_data, soap_notes, prescription } = req.body as {
      extracted_data?: Record<string, unknown>;
      soap_notes?:     string;
      prescription?:   Record<string, unknown>;
    };

    // Verify ownership
    const { data: existing, error: lookupErr } = await supabase
      .from("consultations")
      .select("id, doctor_profile_id")
      .eq("id", consultationId)
      .single();

    if (lookupErr || !existing) {
      return res.status(404).json({ error: "Consultation not found" });
    }

    if (existing.doctor_profile_id !== doctorProfileId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Map to DB schema
    const updates: Record<string, unknown> = {};
    if (extracted_data !== undefined) updates.medical_info = extracted_data;
    if (soap_notes     !== undefined) updates.doctor_notes = soap_notes;
    if (prescription   !== undefined) updates.prescription = prescription;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { data: updated, error: updateErr } = await supabase
      .from("consultations")
      .update(updates)
      .eq("id", consultationId)
      .select("*")
      .single();

    if (updateErr) {
      console.error("Update error:", updateErr);
      return res.status(500).json({ error: "Failed to update" });
    }

    return res.json({ success: true, consultation: updated });
  } catch (err) {
    console.error("PATCH /api/doctor/consultations/:id error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/doctor/consultations/:consultationId/send-prescription
 * Marks the prescription as sent to the patient
 */
router.post("/consultations/:consultationId/send-prescription", async (req, res) => {
  try {
    const profile = (req as any).profile as { id: string; role: string };
    const doctorProfileId = profile.id;
    const { consultationId } = req.params;

    // Verify ownership
    const { data: existing, error: lookupErr } = await supabase
      .from("consultations")
      .select("id, doctor_profile_id, prescription, patient_profile_id")
      .eq("id", consultationId)
      .single();

    if (lookupErr || !existing) {
      return res.status(404).json({ error: "Consultation not found" });
    }

    if (existing.doctor_profile_id !== doctorProfileId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!existing.prescription || Object.keys(existing.prescription).length === 0) {
      return res.status(400).json({ error: "No prescription to send. Generate one first." });
    }

    // Check if prescription has medications
    const meds = existing.prescription?.medications || [];
    if (meds.length === 0) {
      return res.status(400).json({
        error: "Prescription has no medications. Cannot send an empty prescription.",
      });
    }

    // Update consultation to mark prescription as sent
    const { data: updated, error: updateErr } = await supabase
      .from("consultations")
      .update({
        prescription_sent: true,
        prescription_sent_at: new Date().toISOString(),
      })
      .eq("id", consultationId)
      .select("id, prescription_sent, prescription_sent_at")
      .single();

    if (updateErr) {
      console.error("Send prescription error:", updateErr);
      return res.status(500).json({ error: "Failed to send prescription" });
    }

    // Get patient name for response
    let patientName = "Patient";
    if (existing.patient_profile_id) {
      const { data: patientProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", existing.patient_profile_id)
        .single();

      if (patientProfile) patientName = patientProfile.full_name;
    }

    return res.json({
      success: true,
      message: `Prescription sent to ${patientName} successfully`,
      consultation: updated,
    });
  } catch (err) {
    console.error("POST /api/doctor/consultations/:id/send-prescription error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;