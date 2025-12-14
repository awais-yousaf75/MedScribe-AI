import { Router } from "express";
import { supabase } from "../config/supabaseClient";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

// All routes here require doctor_assistant role
router.use(authMiddleware, requireRole("doctor_assistant"));

/**
 * GET /api/assistant/me
 * Returns combined assistant info: auth user, profile, assistant link, doctor, hospital
 */
router.get("/me", async (req, res) => {
  try {
    const user = (req as any).user;
    const profile = (req as any).profile;

    if (!user || !profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const assistantProfileId = profile.id as string;

    // 1) Find doctor_assistant_profiles row for this assistant
    const { data: link, error: linkError } = await supabase
      .from("doctor_assistant_profiles")
      .select("doctor_profile_id, hospital_id, approval_status")
      .eq("profile_id", assistantProfileId)
      .single();

    if (linkError && linkError.code !== "PGRST116") {
      console.error("Fetch assistant link error:", linkError);
      return res
        .status(500)
        .json({ error: "Failed to fetch assistant link info" });
    }

    let doctor = null;
    let hospital = null;

    if (link?.doctor_profile_id) {
      // doctor profile
      const { data: doctorProfile, error: docProfileError } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role")
        .eq("id", link.doctor_profile_id)
        .eq("role", "doctor")
        .single();

      if (docProfileError && docProfileError.code !== "PGRST116") {
        console.error("Fetch doctor profile error:", docProfileError);
        return res
          .status(500)
          .json({ error: "Failed to fetch doctor profile" });
      }

      doctor = doctorProfile || null;
    }

    if (link?.hospital_id) {
      const { data: hosp, error: hospError } = await supabase
        .from("hospitals")
        .select("id, name, address, hospital_type, status")
        .eq("id", link.hospital_id)
        .single();

      if (hospError && hospError.code !== "PGRST116") {
        console.error("Fetch hospital for assistant error:", hospError);
        return res
          .status(500)
          .json({ error: "Failed to fetch hospital info" });
      }

      hospital = hosp || null;
    }

    return res.json({
      user,
      profile,
      assistant_link: link || null,
      doctor,
      hospital,
    });
  } catch (err) {
    console.error("GET /api/assistant/me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;