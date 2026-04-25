import { Router } from "express";
import { supabase } from "../config/supabaseClient";
import { authMiddleware, requireApprovedRole } from "../middleware/auth";

const router = Router();

// All routes here require APPROVED doctor
router.use(authMiddleware, requireApprovedRole("doctor"));

/**
 * POST /api/doctor/consultations
 * Body:
 * {
 *   patientProfileId: string;
 *   transcript: string;
 *   durationSeconds?: number;
 *   language?: string;
 *   words?: any;
 * }
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

    // 1) Get doctor's hospital_id from doctor_profiles
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

    // 2) Ensure patient_profile exists and belongs to same hospital
    const { data: patientRow, error: patientErr } = await supabase
      .from("patient_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", patientProfileId)
      .single();

    if (patientErr || !patientRow) {
      console.error("patient_profiles lookup error:", patientErr);
      return res.status(404).json({ error: "Patient profile not found" });
    }

    if (patientRow.hospital_id !== doctorHospitalId) {
      return res
        .status(403)
        .json({ error: "This patient does not belong to your hospital" });
    }

    // 3) Insert consultation
    const { data: inserted, error: insErr } = await supabase
      .from("consultations")
      .insert({
        patient_profile_id: patientProfileId,
        doctor_profile_id: doctorProfileId,
        hospital_id: doctorHospitalId,
        duration_seconds: Math.max(0, Number(durationSeconds || 0)),
        transcript: transcript.trim(),
        language: language || null,
        words: words ?? null,
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
 * Returns consultations for a given patient (doctor's hospital only)
 */
router.get("/patients/:patientProfileId/consultations", async (req, res) => {
  try {
    const profile = (req as any).profile as { id: string; role: string };
    const doctorProfileId = profile.id;
    const { patientProfileId } = req.params;

    // verify doctor approved & get hospital
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
      return res.status(403).json({ error: "Doctor not approved" });
    }

    // ensure patient belongs to same hospital
    const { data: patientRow, error: patientErr } = await supabase
      .from("patient_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", patientProfileId)
      .single();

    if (patientErr || !patientRow) {
      return res.status(404).json({ error: "Patient profile not found" });
    }

    if (patientRow.hospital_id !== doctorRow.hospital_id) {
      return res
        .status(403)
        .json({ error: "Patient does not belong to your hospital" });
    }

    const { data, error } = await supabase
      .from("consultations")
      .select("id, transcript, duration_seconds, language, created_at")
      .eq("patient_profile_id", patientProfileId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch consultations error:", error);
      return res.status(500).json({ error: "Failed to load consultations" });
    }

    return res.json({ consultations: data || [] });
  } catch (err) {
    console.error("GET /api/doctor/patients/:patientProfileId/consultations error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;