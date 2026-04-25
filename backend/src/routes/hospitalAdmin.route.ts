import { Router } from "express";
import { supabase } from "../config/supabaseClient";
import { authMiddleware, requireApprovedRole } from "../middleware/auth";

const router = Router();

// All routes here require an APPROVED hospital_admin
router.use(authMiddleware, requireApprovedRole("hospital_admin"));

/**
 * GET /api/hospital-admin/pending-doctors
 * Returns doctors with approval_status='pending' for this admin's hospital(s)
 */
router.get("/pending-doctors", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminProfileId = adminProfile.id as string;

    // 1) Hospitals this admin manages
    const { data: hospitals, error: hospError } = await supabase
      .from("hospitals")
      .select("id, name, address, hospital_type")
      .eq("admin_profile_id", adminProfileId);

    if (hospError) {
      console.error("Fetch admin hospitals error:", hospError);
      return res.status(500).json({ error: "Failed to fetch hospitals" });
    }

    if (!hospitals || hospitals.length === 0) {
      return res.json({ doctors: [] });
    }

    const hospitalIds = hospitals.map((h) => h.id);

    // 2) Pending doctor_profiles for these hospitals
    const { data: doctorProfiles, error: docError } = await supabase
      .from("doctor_profiles")
      .select(
        "profile_id, specialization, hospital_id, license_number, cnic, approval_status"
      )
      .in("hospital_id", hospitalIds)
      .eq("approval_status", "pending");

    if (docError) {
      console.error("Fetch pending doctors error:", docError);
      return res.status(500).json({ error: "Failed to fetch doctors" });
    }

    if (!doctorProfiles || doctorProfiles.length === 0) {
      return res.json({ doctors: [] });
    }

    const doctorIds = doctorProfiles.map((d) => d.profile_id);

    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, approval_status, role")
      .in("id", doctorIds)
      .eq("role", "doctor");

    if (profError) {
      console.error("Fetch doctor profiles error:", profError);
      return res.status(500).json({ error: "Failed to fetch profiles" });
    }

    const doctors = doctorProfiles.map((dp) => {
      const profile = profiles?.find((p) => p.id === dp.profile_id) || null;
      const hospital =
        hospitals.find((h) => h.id === dp.hospital_id) || null;

      return {
        profile_id: dp.profile_id,
        full_name: profile?.full_name || "Unknown doctor",
        phone: profile?.phone || null,
        specialization: dp.specialization,
        license_number: dp.license_number,
        cnic: dp.cnic,
        approval_status: dp.approval_status,
        hospital,
      };
    });

    return res.json({ doctors });
  } catch (err) {
    console.error("GET /hospital-admin/pending-doctors error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/hospital-admin/doctors/:profileId/approve
 * Approves a doctor (doctor_profiles + profiles)
 */
router.post("/doctors/:profileId/approve", async (req, res) => {
  const { profileId } = req.params;

  try {
    const { error: docError } = await supabase
      .from("doctor_profiles")
      .update({ approval_status: "approved" })
      .eq("profile_id", profileId);

    if (docError) {
      console.error("Approve doctor_profiles error:", docError);
      return res.status(500).json({ error: "Failed to update doctor profile" });
    }

    const { error: profError } = await supabase
      .from("profiles")
      .update({ approval_status: "approved" })
      .eq("id", profileId);

    if (profError) {
      console.error("Approve profiles error:", profError);
      return res
        .status(500)
        .json({ error: "Doctor approved but profile update failed" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Approve doctor handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/hospital-admin/doctors/:profileId/reject
 * Rejects a doctor (doctor_profiles + profiles)
 */
router.post("/doctors/:profileId/reject", async (req, res) => {
  const { profileId } = req.params;

  try {
    const { error: docError } = await supabase
      .from("doctor_profiles")
      .update({ approval_status: "rejected" })
      .eq("profile_id", profileId);

    if (docError) {
      console.error("Reject doctor_profiles error:", docError);
      return res.status(500).json({ error: "Failed to update doctor profile" });
    }

    const { error: profError } = await supabase
      .from("profiles")
      .update({ approval_status: "rejected" })
      .eq("id", profileId);

    if (profError) {
      console.error("Reject profiles error:", profError);
      return res
        .status(500)
        .json({ error: "Doctor rejected but profile update failed" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Reject doctor handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/hospital-admin/pending-assistants
 * Returns doctor assistants with approval_status='pending'
 * for this admin's hospital(s)
 */
router.get("/pending-assistants", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminProfileId = adminProfile.id as string;

    // 1) Hospitals this admin manages
    const { data: hospitals, error: hospError } = await supabase
      .from("hospitals")
      .select("id, name")
      .eq("admin_profile_id", adminProfileId);

    if (hospError) {
      console.error("Fetch admin hospitals error:", hospError);
      return res.status(500).json({ error: "Failed to fetch hospitals" });
    }

    if (!hospitals || hospitals.length === 0) {
      return res.json({ assistants: [] });
    }

    const hospitalIds = hospitals.map((h) => h.id);

    // 2) Pending assistant links
    const { data: assistantLinks, error: daError } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id, doctor_profile_id, hospital_id, approval_status")
      .in("hospital_id", hospitalIds)
      .eq("approval_status", "pending");

    if (daError) {
      console.error("Fetch pending assistants error:", daError);
      return res
        .status(500)
        .json({ error: "Failed to fetch doctor assistants" });
    }

    if (!assistantLinks || assistantLinks.length === 0) {
      return res.json({ assistants: [] });
    }

    const assistantIds = assistantLinks.map((a) => a.profile_id);
    const doctorIds = assistantLinks.map((a) => a.doctor_profile_id);

    // 3) Assistant profiles
    const { data: assistantProfiles, error: apError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, approval_status, role")
      .in("id", assistantIds)
      .eq("role", "doctor_assistant");

    if (apError) {
      console.error("Fetch assistant profiles error:", apError);
      return res.status(500).json({ error: "Failed to fetch profiles" });
    }

    // 4) Doctor profiles
    const { data: doctorProfiles, error: dpError } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", doctorIds)
      .eq("role", "doctor");

    if (dpError) {
      console.error("Fetch doctor profiles error:", dpError);
      return res.status(500).json({ error: "Failed to fetch doctors" });
    }

    const assistants = assistantLinks.map((link) => {
      const assistant =
        assistantProfiles?.find((p) => p.id === link.profile_id) || null;
      const doctor =
        doctorProfiles?.find((d) => d.id === link.doctor_profile_id) || null;
      const hospital =
        hospitals.find((h) => h.id === link.hospital_id) || null;

      return {
        profile_id: link.profile_id,
        full_name: assistant?.full_name || "Unknown assistant",
        phone: assistant?.phone || null,
        approval_status: link.approval_status as
          | "pending"
          | "approved"
          | "rejected",
        doctor: doctor
          ? { id: doctor.id, full_name: doctor.full_name }
          : null,
        hospital: hospital ? { id: hospital.id, name: hospital.name } : null,
      };
    });

    return res.json({ assistants });
  } catch (err) {
    console.error("GET /hospital-admin/pending-assistants error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/hospital-admin/assistants/:profileId/approve
 * Approves a doctor assistant (doctor_assistant_profiles + profiles)
 */
router.post("/assistants/:profileId/approve", async (req, res) => {
  const { profileId } = req.params;

  try {
    const { error: daError } = await supabase
      .from("doctor_assistant_profiles")
      .update({ approval_status: "approved" })
      .eq("profile_id", profileId);

    if (daError) {
      console.error("Approve doctor_assistant_profiles error:", daError);
      return res
        .status(500)
        .json({ error: "Failed to update assistant link" });
    }

    const { error: profError } = await supabase
      .from("profiles")
      .update({ approval_status: "approved" })
      .eq("id", profileId);

    if (profError) {
      console.error("Approve assistant profile error:", profError);
      return res
        .status(500)
        .json({ error: "Assistant approved but profile update failed" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Approve assistant handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/hospital-admin/assistants/:profileId/reject
 * Rejects a doctor assistant (doctor_assistant_profiles + profiles)
 */
router.post("/assistants/:profileId/reject", async (req, res) => {
  const { profileId } = req.params;

  try {
    const { error: daError } = await supabase
      .from("doctor_assistant_profiles")
      .update({ approval_status: "rejected" })
      .eq("profile_id", profileId);

    if (daError) {
      console.error("Reject doctor_assistant_profiles error:", daError);
      return res
        .status(500)
        .json({ error: "Failed to update assistant link" });
    }

    const { error: profError } = await supabase
      .from("profiles")
      .update({ approval_status: "rejected" })
      .eq("id", profileId);

    if (profError) {
      console.error("Reject assistant profile error:", profError);
      return res
        .status(500)
        .json({ error: "Assistant rejected but profile update failed" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Reject assistant handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;