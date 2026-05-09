import { Router, Request, Response } from "express";
import { supabase } from "../config/supabaseClient";

const router = Router();

/**
 * Middleware: authenticate patient via Bearer token
 */
async function patientAuth(req: Request, res: Response, next: Function) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Missing token" });
    }

    const token = authHeader.split(" ")[1];
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const userId = userData.user.id;

    // Verify patient role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", userId)
      .single();

    if (profileError || !profile || profile.role !== "patient") {
      return res.status(403).json({ success: false, message: "Access denied. Patients only." });
    }

    (req as any).patientProfileId = userId;
    (req as any).patientName = profile.full_name;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/patient/prescriptions
 * Returns all prescriptions that have been sent to this patient
 */
router.get("/prescriptions", patientAuth, async (req: Request, res: Response) => {
  try {
    const patientProfileId = (req as any).patientProfileId;

    const { data: consultations, error } = await supabase
      .from("consultations")
      .select(
        `id, prescription, medical_info, created_at, prescription_sent_at,
         doctor_profile_id, hospital_id, duration_seconds, language`
      )
      .eq("patient_profile_id", patientProfileId)
      .eq("prescription_sent", true)
      .not("prescription", "is", null)
      .order("prescription_sent_at", { ascending: false });

    if (error) {
      console.error("Fetch patient prescriptions error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch prescriptions" });
    }

    // Enrich with doctor and hospital info
    const enriched = await Promise.all(
      (consultations || []).map(async (c: any) => {
        let doctorName = "Doctor";
        let doctorSpecialization = "";
        let doctorLicense = "";
        let hospitalName = "Hospital";
        let hospitalAddress = "";

        // Fetch doctor info
        if (c.doctor_profile_id) {
          const { data: docProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", c.doctor_profile_id)
            .single();

          if (docProfile) doctorName = docProfile.full_name;

          const { data: docDetail } = await supabase
            .from("doctor_profiles")
            .select("specialization, license_number")
            .eq("profile_id", c.doctor_profile_id)
            .single();

          if (docDetail) {
            doctorSpecialization = docDetail.specialization || "";
            doctorLicense = docDetail.license_number || "";
          }
        }

        // Fetch hospital info
        if (c.hospital_id) {
          const { data: hosp } = await supabase
            .from("hospitals")
            .select("name, address, hospital_type, contact_phone")
            .eq("id", c.hospital_id)
            .single();

          if (hosp) {
            hospitalName = hosp.name;
            hospitalAddress = hosp.address || "";
          }
        }

        return {
          id: c.id,
          prescription: c.prescription,
          medical_info: c.medical_info,
          consultation_date: c.created_at,
          sent_at: c.prescription_sent_at,
          doctor: {
            name: doctorName,
            specialization: doctorSpecialization,
            license_number: doctorLicense,
          },
          hospital: {
            name: hospitalName,
            address: hospitalAddress,
          },
        };
      })
    );

    return res.json({ success: true, prescriptions: enriched });
  } catch (err) {
    console.error("GET /api/patient/prescriptions error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * GET /api/patient/prescriptions/:id
 * Returns a single prescription detail
 */
router.get("/prescriptions/:id", patientAuth, async (req: Request, res: Response) => {
  try {
    const patientProfileId = (req as any).patientProfileId;
    const { id } = req.params;

    const { data: consultation, error } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", id)
      .eq("patient_profile_id", patientProfileId)
      .eq("prescription_sent", true)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    // Fetch doctor info
    let doctor: any = {};
    if (consultation.doctor_profile_id) {
      const { data: docProfile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", consultation.doctor_profile_id)
        .single();

      const { data: docDetail } = await supabase
        .from("doctor_profiles")
        .select("specialization, license_number, cnic")
        .eq("profile_id", consultation.doctor_profile_id)
        .single();

      doctor = {
        name: docProfile?.full_name || "Doctor",
        phone: docProfile?.phone,
        specialization: docDetail?.specialization,
        license_number: docDetail?.license_number,
      };
    }

    // Fetch hospital info
    let hospital: any = {};
    if (consultation.hospital_id) {
      const { data: hosp } = await supabase
        .from("hospitals")
        .select("name, address, hospital_type, contact_phone, registration_number")
        .eq("id", consultation.hospital_id)
        .single();

      hospital = hosp || {};
    }

    return res.json({
      success: true,
      prescription: {
        id: consultation.id,
        prescription: consultation.prescription,
        medical_info: consultation.medical_info,
        doctor_notes: consultation.doctor_notes,
        consultation_date: consultation.created_at,
        sent_at: consultation.prescription_sent_at,
        duration_seconds: consultation.duration_seconds,
        doctor,
        hospital,
      },
    });
  } catch (err) {
    console.error("GET /api/patient/prescriptions/:id error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;