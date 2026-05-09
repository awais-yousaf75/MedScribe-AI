import { Router } from "express";
import { supabase } from "../config/supabaseClient";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

// All routes here require doctor role
router.use(authMiddleware, requireRole("doctor"));

/**
 * GET /api/doctor/me
 * Returns combined doctor info: auth user, profile, doctor_profile, hospital
 */
router.get("/me", async (req, res) => {
  try {
    const user = (req as any).user;
    const profile = (req as any).profile;

    if (!user || !profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = profile.id as string;

    const { data: doctorProfile, error: doctorError } = await supabase
      .from("doctor_profiles")
      .select(
        "profile_id, specialization, hospital_id, license_number, cnic, approval_status"
      )
      .eq("profile_id", userId)
      .single();

    if (doctorError && doctorError.code !== "PGRST116") {
      console.error("Fetch doctor_profile error:", doctorError);
      return res.status(500).json({ error: "Failed to fetch doctor profile" });
    }

    let hospital = null;
    if (doctorProfile?.hospital_id) {
      const { data: hosp, error: hospError } = await supabase
        .from("hospitals")
        .select("id, name, address, hospital_type, status")
        .eq("id", doctorProfile.hospital_id)
        .single();

      if (hospError && hospError.code !== "PGRST116") {
        console.error("Fetch hospital for doctor error:", hospError);
        return res.status(500).json({ error: "Failed to fetch hospital info" });
      }

      hospital = hosp || null;
    }

    return res.json({
      user,
      profile,
      doctor_profile: doctorProfile || null,
      hospital,
    });
  } catch (err) {
    console.error("GET /api/doctor/me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/doctor/assistants
 * Returns all assistants for this doctor (with profile info)
 */
router.get("/assistants", async (req, res) => {
  try {
    const profile = (req as any).profile;
    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const doctorProfileId = profile.id as string;

    // doctor_assistant_profiles rows for this doctor
    const { data: assistantLinks, error: daError } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id, approval_status")
      .eq("doctor_profile_id", doctorProfileId);

    if (daError) {
      console.error("Fetch doctor_assistant_profiles error:", daError);
      return res
        .status(500)
        .json({ error: "Failed to fetch doctor assistants" });
    }

    if (!assistantLinks || assistantLinks.length === 0) {
      return res.json({ assistants: [] });
    }

    const assistantIds = assistantLinks.map((a) => a.profile_id);

    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, approval_status, role")
      .in("id", assistantIds)
      .eq("role", "doctor_assistant");

    if (profError) {
      console.error("Fetch assistant profiles error:", profError);
      return res.status(500).json({ error: "Failed to fetch profiles" });
    }

    const assistants = assistantLinks.map((link) => {
      const p = profiles?.find((pr) => pr.id === link.profile_id) || null;
      return {
        profile_id: link.profile_id,
        full_name: p?.full_name || "Unknown assistant",
        phone: p?.phone || null,
        approval_status: link.approval_status as
          | "pending"
          | "approved"
          | "rejected",
      };
    });

    return res.json({ assistants });
  } catch (err) {
    console.error("GET /api/doctor/assistants error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/doctor/assistants
 * Body: { fullName, email, phone, password }
 * Creates a new doctor assistant:
 * - auth user (role=doctor_assistant)
 * - profiles row
 * - doctor_assistant_profiles row (approval_status='pending')
 * Hospital admin will later approve/reject.
 */
router.post("/assistants", async (req, res) => {
  const { fullName, email, phone, password } = req.body as {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
  };

  if (!fullName || !email || !password) {
    return res.status(400).json({
      error: "fullName, email and password are required",
    });
  }

  try {
    const profile = (req as any).profile;
    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const doctorProfileId = profile.id as string;

    // Get doctor_profile to know hospital_id
    const { data: doctorProfile, error: docError } = await supabase
      .from("doctor_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", doctorProfileId)
      .single();

    if (docError || !doctorProfile) {
      console.error("Fetch doctor_profile error:", docError);
      return res
        .status(400)
        .json({ error: "Doctor profile not found. Please complete setup." });
    }

    // 1) Create auth user for assistant
    const { data: userData, error: userError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
          role: "doctor_assistant",
        },
      });

    if (userError || !userData?.user) {
      console.error("Create assistant user error:", userError);
      return res
        .status(400)
        .json({
          error: userError?.message || "Failed to create assistant user",
        });
    }

    const assistantId = userData.user.id;

    // 2) Insert into profiles
    const { error: profError } = await supabase.from("profiles").insert({
      id: assistantId,
      full_name: fullName,
      phone,
      role: "doctor_assistant",
      approval_status: "pending",
    });

    if (profError) {
      console.error("Insert assistant profile error:", profError);
      return res.status(500).json({
        error: "Assistant user created but failed to create profile",
      });
    }

    // 3) Insert into doctor_assistant_profiles
    const { error: daError } = await supabase
      .from("doctor_assistant_profiles")
      .insert({
        profile_id: assistantId,
        doctor_profile_id: doctorProfileId,
        hospital_id: doctorProfile.hospital_id,
        approval_status: "pending",
      });

    if (daError) {
      console.error("Insert doctor_assistant_profiles error:", daError);
      return res.status(500).json({
        error:
          "Assistant user created but failed to link to doctor. Contact support.",
      });
    }

    return res.status(201).json({
      assistant: {
        id: assistantId,
        full_name: fullName,
        email,
        phone,
        approval_status: "pending",
      },
    });
  } catch (err) {
    console.error("POST /api/doctor/assistants error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/doctor/patients
 * Returns all patients registered in the doctor's hospital
 */
router.get("/patients", async (req, res) => {
  try {
    const profile = (req as any).profile;
    const userId = profile.id;

    // 1. Get doctor's hospital_id
    const { data: doctorProfile } = await supabase
      .from("doctor_profiles")
      .select("hospital_id")
      .eq("profile_id", userId)
      .single();

    if (!doctorProfile?.hospital_id) {
      return res.status(400).json({ error: "Doctor not linked to a hospital" });
    }

    // 2. Fetch patients for this hospital (direct link or via appointment)
    const { data: patientProfiles, error: ppError } = await supabase
      .from("patient_profiles")
      .select("profile_id, cnic, created_at")
      .eq("hospital_id", doctorProfile.hospital_id)
      .order("created_at", { ascending: false });

    if (ppError) {
      console.error("Fetch patients error:", ppError);
      return res.status(500).json({ error: "Failed to fetch patients" });
    }

    // Also fetch patients who have an approved appointment at this hospital
    const { data: apptPatients, error: apptError } = await supabase
      .from("appointments")
      .select("patient_profile_id")
      .eq("hospital_id", doctorProfile.hospital_id)
      .eq("status", "approved");

    const apptPatientIds = apptPatients?.map(a => a.patient_profile_id) || [];
    const directPatientIds = patientProfiles.map(p => p.profile_id);
    const allPatientIds = Array.from(new Set([...directPatientIds, ...apptPatientIds]));

    if (allPatientIds.length === 0) return res.json({ patients: [] });

    // 3. Fetch profile details (name, phone, etc.)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone, dob, gender")
      .in("id", allPatientIds);

    // Fetch patient_profiles for those who might not be in directPatientIds
    const { data: extraPatientProfiles } = await supabase
      .from("patient_profiles")
      .select("profile_id, cnic, created_at")
      .in("profile_id", allPatientIds);

    // 4. Merge data
    const patients = allPatientIds.map((id) => {
      const p = profiles?.find((prof) => prof.id === id);
      const pp = extraPatientProfiles?.find((prof) => prof.profile_id === id);
      return {
        id,
        full_name: p?.full_name || "Unknown",
        phone: p?.phone,
        gender: p?.gender,
        dob: p?.dob,
        cnic: pp?.cnic || "—",
        created_at: pp?.created_at || new Date().toISOString(),
      };
    });

    return res.json({ patients });
  } catch (err) {
    console.error("GET /doctor/patients error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/doctor/availability
 * Doctor gets their own availability schedule
 */
router.get("/availability", async (req, res) => {
  try {
    const profile = (req as any).profile;
    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabase
      .from("doctor_availability")
      .select("*")
      .eq("doctor_profile_id", profile.id)
      .order("day_of_week", { ascending: true });

    if (error) {
      console.error("Fetch availability error:", error);
      return res.status(500).json({ error: "Failed to fetch availability" });
    }

    return res.json({ availability: data || [] });
  } catch (err) {
    console.error("GET /api/doctor/availability error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/doctor/availability
 * Doctor sets availability for specific days
 * Body: { availability: [{ day_of_week, start_time, end_time, slot_duration_minutes }] }
 * Uses upsert — replaces existing schedule
 */
router.post("/availability", async (req, res) => {
  try {
    const profile = (req as any).profile;
    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    const { availability } = req.body as {
      availability: {
        day_of_week: number;
        start_time: string;
        end_time: string;
        slot_duration_minutes: number;
      }[];
    };

    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({ error: "availability array is required" });
    }

    // Validate each entry
    for (const slot of availability) {
      if (
        slot.day_of_week === undefined ||
        slot.day_of_week < 0 ||
        slot.day_of_week > 6
      ) {
        return res.status(400).json({
          error: "day_of_week must be between 0 (Mon) and 6 (Sun)",
        });
      }
      if (!slot.start_time || !slot.end_time) {
        return res.status(400).json({
          error: "start_time and end_time are required",
        });
      }
      if (slot.start_time >= slot.end_time) {
        return res.status(400).json({
          error: "start_time must be before end_time",
        });
      }
      if (!slot.slot_duration_minutes || slot.slot_duration_minutes < 5) {
        return res.status(400).json({
          error: "slot_duration_minutes must be at least 5",
        });
      }
    }

    // First delete existing availability for this doctor
    const { error: deleteError } = await supabase
      .from("doctor_availability")
      .delete()
      .eq("doctor_profile_id", profile.id);

    if (deleteError) {
      console.error("Delete old availability error:", deleteError);
      return res.status(500).json({ error: "Failed to update availability" });
    }

    // If no days selected, just clearing is fine
    if (availability.length === 0) {
      return res.json({
        success: true,
        message: "Availability cleared successfully",
        availability: [],
      });
    }

    // Insert new availability
    const rows = availability.map((a) => ({
      doctor_profile_id: profile.id,
      day_of_week:           a.day_of_week,
      start_time:            a.start_time,
      end_time:              a.end_time,
      slot_duration_minutes: a.slot_duration_minutes,
    }));

    const { data, error: insertError } = await supabase
      .from("doctor_availability")
      .insert(rows)
      .select();

    if (insertError) {
      console.error("Insert availability error:", insertError);
      return res.status(500).json({ error: "Failed to save availability" });
    }

    return res.json({
      success:      true,
      message:      "Availability saved successfully",
      availability: data,
    });
  } catch (err) {
    console.error("POST /api/doctor/availability error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
