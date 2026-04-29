import { Router } from "express";
import crypto from "crypto";
import { supabase } from "../config/supabaseClient";
import { authMiddleware, requireApprovedRole } from "../middleware/auth";

const router = Router();

// All routes here require an APPROVED hospital_admin
router.use(authMiddleware, requireApprovedRole("hospital_admin"));

/**
 * Helpers
 */
const genPassword = (len = 12) => {
  // readable + strong enough
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$_-";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

async function getAdminHospital(adminProfileId: string) {
  const { data: hospital, error } = await supabase
    .from("hospitals")
    .select(
      "id, name, address, hospital_type, status, registration_number, license_number, contact_email, contact_phone, admin_profile_id, created_at"
    )
    .eq("admin_profile_id", adminProfileId)
    .maybeSingle();

  if (error) throw error;
  return hospital; // may be null
}

async function getAuthEmail(userId: string) {
  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    return data?.user?.email || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/hospital-admin/dashboard
 * Summary + privacy-safe counts
 */
router.get("/dashboard", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);

    const adminEmail = await getAuthEmail(adminId);

    if (!hospital) {
      return res.json({
        admin: {
          id: adminId,
          full_name: adminProfile.full_name,
          phone: adminProfile.phone || null,
          email: adminEmail,
        },
        hospital: null,
        stats: {
          pendingDoctors: 0,
          pendingAssistants: 0,
          approvedDoctors: 0,
          approvedAssistants: 0,
          patientsCount: 0,
          totalPending: 0,
        },
      });
    }

    const hospitalId = hospital.id;

    const [{ count: approvedDoctors }, { count: approvedAssistants }, { count: patientsCount }] =
      await Promise.all([
        supabase
          .from("doctor_profiles")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospitalId)
          .eq("approval_status", "approved"),

        supabase
          .from("doctor_assistant_profiles")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospitalId)
          .eq("approval_status", "approved"),

        supabase
          .from("patient_profiles")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospitalId),
      ]);

    return res.json({
      admin: {
        id: adminId,
        full_name: adminProfile.full_name,
        phone: adminProfile.phone || null,
        email: adminEmail,
      },
      hospital,
      stats: {
        // no self creation, so pending is 0
        pendingDoctors: 0,
        pendingAssistants: 0,
        approvedDoctors: approvedDoctors || 0,
        approvedAssistants: approvedAssistants || 0,
        patientsCount: patientsCount || 0,
        totalPending: 0,
      },
    });
  } catch (err) {
    console.error("GET /hospital-admin/dashboard error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/hospital-admin/hospital
 * Hospital profile + counts
 */
router.get("/hospital", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) {
      return res.status(404).json({ error: "Hospital not found for this admin" });
    }

    const hospitalId = hospital.id;

    const [{ count: doctorsCount }, { count: assistantsCount }, { count: patientsCount }] =
      await Promise.all([
        supabase
          .from("doctor_profiles")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospitalId)
          .eq("approval_status", "approved"),

        supabase
          .from("doctor_assistant_profiles")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospitalId)
          .eq("approval_status", "approved"),

        supabase
          .from("patient_profiles")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospitalId),
      ]);

    const adminEmail = await getAuthEmail(adminId);

    return res.json({
      hospital,
      admin: {
        id: adminId,
        full_name: adminProfile.full_name,
        phone: adminProfile.phone || null,
        email: adminEmail,
      },
      stats: {
        doctorsCount: doctorsCount || 0,
        assistantsCount: assistantsCount || 0,
        patientsCount: patientsCount || 0,
      },
    });
  } catch (err) {
    console.error("GET /hospital-admin/hospital error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/hospital-admin/doctors
 * List APPROVED doctors for this admin hospital
 */
router.get("/doctors", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) return res.json({ doctors: [] });

    const hospitalId = hospital.id;

    const { data: doctorProfiles, error: docError } = await supabase
      .from("doctor_profiles")
      .select("profile_id, specialization, hospital_id, license_number, cnic, approval_status, created_at")
      .eq("hospital_id", hospitalId)
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });

    if (docError) {
      console.error("Fetch doctors error:", docError);
      return res.status(500).json({ error: "Failed to fetch doctors" });
    }

    const ids = (doctorProfiles || []).map((d) => d.profile_id);
    if (ids.length === 0) return res.json({ doctors: [] });

    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, gender, dob, role, approval_status, created_at")
      .in("id", ids)
      .eq("role", "doctor");

    if (profError) {
      console.error("Fetch doctor profiles error:", profError);
      return res.status(500).json({ error: "Failed to fetch profiles" });
    }

    // emails from auth (batch by listUsers then map)
    const { data: authData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const authMap = new Map<string, any>();
    (authData?.users || []).forEach((u) => authMap.set(u.id, u));

    const doctors = (doctorProfiles || []).map((dp) => {
      const p = profiles?.find((x) => x.id === dp.profile_id) || null;
      const au = authMap.get(dp.profile_id);
      return {
        profile_id: dp.profile_id,
        full_name: p?.full_name || "Unknown",
        email: au?.email || null,
        phone: p?.phone || null,
        gender: p?.gender || null,
        dob: p?.dob || null,
        specialization: dp.specialization,
        license_number: dp.license_number,
        cnic: dp.cnic,
        approval_status: dp.approval_status,
        created_at: dp.created_at || p?.created_at || null,
      };
    });

    return res.json({ doctors });
  } catch (err) {
    console.error("GET /hospital-admin/doctors error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/hospital-admin/doctors
 * Create doctor directly (auto-approved)
 * password: optional, if not provided -> generated
 */
router.post("/doctors", async (req, res) => {
  const {
    full_name,
    email,
    phone,
    gender,
    dob,
    specialization,
    license_number,
    cnic,
    password, // optional
    generate_password, // optional boolean
  } = req.body;

  if (!full_name || !email || !specialization || !license_number || !cnic) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["full_name", "email", "specialization", "license_number", "cnic"],
    });
  }

  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) {
      return res.status(400).json({ error: "No hospital assigned to this admin" });
    }

    const hospitalId = hospital.id;

    const shouldGenerate = generate_password === true || !password;
    const finalPassword = shouldGenerate ? genPassword(12) : password;

    // 1) create auth user
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
    });

    if (createError || !created?.user) {
      console.error("createUser error:", createError);
      return res.status(400).json({ error: createError?.message || "Failed to create auth user" });
    }

    const newId = created.user.id;

    // 2) insert profile
    const { error: profError } = await supabase.from("profiles").insert({
      id: newId,
      full_name,
      phone: phone || null,
      gender: gender || null,
      dob: dob || null,
      role: "doctor",
      approval_status: "approved",
    });

    if (profError) {
      console.error("Insert profile error:", profError);
      await supabase.auth.admin.deleteUser(newId);
      return res.status(500).json({ error: "Failed to create doctor profile" });
    }

    // 3) insert doctor_profiles
    const { error: dpError } = await supabase.from("doctor_profiles").insert({
      profile_id: newId,
      specialization,
      hospital_id: hospitalId,
      license_number,
      cnic,
      approval_status: "approved",
    });

    if (dpError) {
      console.error("Insert doctor_profiles error:", dpError);
      await supabase.from("profiles").delete().eq("id", newId);
      await supabase.auth.admin.deleteUser(newId);
      return res.status(500).json({ error: "Failed to create doctor record" });
    }

    return res.status(201).json({
      success: true,
      doctor: { profile_id: newId, full_name, email, hospital_id: hospitalId },
      credentials: {
        email,
        password: shouldGenerate ? finalPassword : null, // only return if generated
        generated: shouldGenerate,
      },
    });
  } catch (err) {
    console.error("POST /hospital-admin/doctors error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/hospital-admin/doctors/:profileId
 * Hard delete doctor user (SAFE: blocks deletion if consultations exist)
 */
router.delete("/doctors/:profileId", async (req, res) => {
  const { profileId } = req.params;

  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    // Ensure doctor belongs to this hospital
    const { data: dp, error: dpErr } = await supabase
      .from("doctor_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (dpErr) return res.status(500).json({ error: "Failed to validate doctor" });
    if (!dp) return res.status(404).json({ error: "Doctor not found in your hospital" });

    // Block deletion if consultations exist (FK safety)
    const { count: consultCount } = await supabase
      .from("consultations")
      .select("*", { count: "exact", head: true })
      .eq("doctor_profile_id", profileId)
      .eq("hospital_id", hospitalId);

    if ((consultCount || 0) > 0) {
      return res.status(409).json({
        error: "DOCTOR_HAS_CONSULTATIONS",
        message: "Cannot delete doctor because consultations exist. Consider deactivating instead.",
      });
    }

    // Unlink assistants assigned to this doctor in this hospital
    await supabase
      .from("doctor_assistant_profiles")
      .update({ doctor_profile_id: null })
      .eq("hospital_id", hospitalId)
      .eq("doctor_profile_id", profileId);

    // Delete doctor_profiles row
    await supabase.from("doctor_profiles").delete().eq("profile_id", profileId);

    // Delete profile row
    await supabase.from("profiles").delete().eq("id", profileId);

    // Delete auth user
    const { error: delAuthErr } = await supabase.auth.admin.deleteUser(profileId);
    if (delAuthErr) {
      console.error("Delete auth user error:", delAuthErr);
      return res.status(500).json({ error: "Deleted DB rows but failed to delete auth user" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE /hospital-admin/doctors/:profileId error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/hospital-admin/doctors/:profileId/deactivate
 * Deactivate doctor (soft disable using approval_status)
 */
router.patch("/doctors/:profileId/deactivate", async (req, res) => {
  const { profileId } = req.params;

  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    // Validate belongs to this hospital
    const { data: dp } = await supabase
      .from("doctor_profiles")
      .select("profile_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (!dp) return res.status(404).json({ error: "Doctor not found in your hospital" });

    await supabase.from("doctor_profiles").update({ approval_status: "rejected" }).eq("profile_id", profileId);
    await supabase.from("profiles").update({ approval_status: "rejected" }).eq("id", profileId);

    return res.json({ success: true });
  } catch (err) {
    console.error("PATCH /hospital-admin/doctors/:profileId/deactivate error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/hospital-admin/assistants
 * List APPROVED assistants for this admin hospital
 */
router.get("/assistants", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) return res.json({ assistants: [] });

    const hospitalId = hospital.id;

    const { data: links, error: linkErr } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id, doctor_profile_id, hospital_id, approval_status, created_at")
      .eq("hospital_id", hospitalId)
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });

    if (linkErr) {
      console.error("Fetch assistants error:", linkErr);
      return res.status(500).json({ error: "Failed to fetch assistants" });
    }

    const assistantIds = (links || []).map((l) => l.profile_id);
    const doctorIds = (links || [])
      .map((l) => l.doctor_profile_id)
      .filter((id): id is string => !!id);

    const { data: assistantProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone, gender, dob, role, approval_status, created_at")
      .in("id", assistantIds)
      .eq("role", "doctor_assistant");

    const { data: doctorProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", doctorIds)
      .eq("role", "doctor");

    // emails from auth (batch)
    const { data: authData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const authMap = new Map<string, any>();
    (authData?.users || []).forEach((u) => authMap.set(u.id, u));

    const assistants = (links || []).map((l) => {
      const ap = assistantProfiles?.find((p) => p.id === l.profile_id) || null;
      const au = authMap.get(l.profile_id);
      const doctor = doctorProfiles?.find((d) => d.id === l.doctor_profile_id) || null;

      return {
        profile_id: l.profile_id,
        full_name: ap?.full_name || "Unknown",
        email: au?.email || null,
        phone: ap?.phone || null,
        approval_status: l.approval_status,
        doctor: doctor ? { id: doctor.id, full_name: doctor.full_name } : null,
        created_at: l.created_at || ap?.created_at || null,
      };
    });

    return res.json({ assistants });
  } catch (err) {
    console.error("GET /hospital-admin/assistants error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/hospital-admin/assistants
 * Create assistant directly (auto-approved)
 * doctor_profile_id optional
 * password optional => generated if missing or generate_password=true
 */
router.post("/assistants", async (req, res) => {
  const {
    full_name,
    email,
    phone,
    gender,
    dob,
    doctor_profile_id, // optional
    password, // optional
    generate_password, // optional
  } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["full_name", "email"],
    });
  }

  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) {
      return res.status(400).json({ error: "No hospital assigned to this admin" });
    }

    const hospitalId = hospital.id;

    // Validate doctor_profile_id belongs to this hospital if provided
    if (doctor_profile_id) {
      const { data: dp, error: dpErr } = await supabase
        .from("doctor_profiles")
        .select("profile_id, hospital_id, approval_status")
        .eq("profile_id", doctor_profile_id)
        .eq("hospital_id", hospitalId)
        .maybeSingle();

      if (dpErr) {
        return res.status(500).json({ error: "Failed to validate doctor" });
      }
      if (!dp) {
        return res.status(400).json({ error: "Selected doctor is not in your hospital" });
      }
      if (dp.approval_status !== "approved") {
        return res.status(400).json({ error: "Selected doctor is not approved" });
      }
    }

    const shouldGenerate = generate_password === true || !password;
    const finalPassword = shouldGenerate ? genPassword(12) : password;

    // 1) create auth user
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
    });

    if (createError || !created?.user) {
      console.error("createUser error:", createError);
      return res.status(400).json({ error: createError?.message || "Failed to create auth user" });
    }

    const newId = created.user.id;

    // 2) insert profile
    const { error: profError } = await supabase.from("profiles").insert({
      id: newId,
      full_name,
      phone: phone || null,
      gender: gender || null,
      dob: dob || null,
      role: "doctor_assistant",
      approval_status: "approved",
    });

    if (profError) {
      console.error("Insert assistant profile error:", profError);
      await supabase.auth.admin.deleteUser(newId);
      return res.status(500).json({ error: "Failed to create assistant profile" });
    }

    // 3) insert doctor_assistant_profiles
    const { error: daError } = await supabase.from("doctor_assistant_profiles").insert({
      profile_id: newId,
      hospital_id: hospitalId,
      doctor_profile_id: doctor_profile_id || null,
      approval_status: "approved",
    });

    if (daError) {
      console.error("Insert doctor_assistant_profiles error:", daError);
      await supabase.from("profiles").delete().eq("id", newId);
      await supabase.auth.admin.deleteUser(newId);
      return res.status(500).json({ error: "Failed to create assistant record" });
    }

    return res.status(201).json({
      success: true,
      assistant: { profile_id: newId, full_name, email, hospital_id: hospitalId },
      credentials: {
        email,
        password: shouldGenerate ? finalPassword : null, // only return if generated
        generated: shouldGenerate,
      },
    });
  } catch (err) {
    console.error("POST /hospital-admin/assistants error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/hospital-admin/assistants/:profileId/link-doctor
 * Link or unlink assistant to doctor (doctor_profile_id can be null)
 */
router.patch("/assistants/:profileId/link-doctor", async (req, res) => {
  const { profileId } = req.params;
  const { doctor_profile_id } = req.body as { doctor_profile_id: string | null };

  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    // Validate assistant belongs to this hospital
    const { data: link, error: linkErr } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (linkErr) return res.status(500).json({ error: "Failed to validate assistant" });
    if (!link) return res.status(404).json({ error: "Assistant not found in your hospital" });

    // If doctor provided, validate doctor belongs to same hospital & approved
    if (doctor_profile_id) {
      const { data: dp, error: dpErr } = await supabase
        .from("doctor_profiles")
        .select("profile_id, hospital_id, approval_status")
        .eq("profile_id", doctor_profile_id)
        .eq("hospital_id", hospitalId)
        .maybeSingle();

      if (dpErr) return res.status(500).json({ error: "Failed to validate doctor" });
      if (!dp) return res.status(400).json({ error: "Doctor not found in your hospital" });
      if (dp.approval_status !== "approved") return res.status(400).json({ error: "Doctor is not approved" });
    }

    const { error: updErr } = await supabase
      .from("doctor_assistant_profiles")
      .update({ doctor_profile_id: doctor_profile_id || null })
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId);

    if (updErr) return res.status(500).json({ error: "Failed to update assistant link" });

    return res.json({ success: true });
  } catch (err) {
    console.error("PATCH /hospital-admin/assistants/:profileId/link-doctor error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/hospital-admin/assistants/:profileId
 * Hard delete assistant user
 */
router.delete("/assistants/:profileId", async (req, res) => {
  const { profileId } = req.params;

  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    // Validate assistant belongs to hospital
    const { data: link } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (!link) return res.status(404).json({ error: "Assistant not found in your hospital" });

    // Delete assistant link + profile + auth
    await supabase.from("doctor_assistant_profiles").delete().eq("profile_id", profileId);
    await supabase.from("profiles").delete().eq("id", profileId);

    const { error: delAuthErr } = await supabase.auth.admin.deleteUser(profileId);
    if (delAuthErr) {
      console.error("Delete auth user error:", delAuthErr);
      return res.status(500).json({ error: "Deleted DB rows but failed to delete auth user" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE /hospital-admin/assistants/:profileId error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/hospital-admin/assistants/:profileId/deactivate
 * Deactivate assistant (soft disable using approval_status)
 */
router.patch("/assistants/:profileId/deactivate", async (req, res) => {
  const { profileId } = req.params;

  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    // Validate assistant belongs to hospital
    const { data: link } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (!link) return res.status(404).json({ error: "Assistant not found in your hospital" });

    await supabase.from("doctor_assistant_profiles").update({ approval_status: "rejected" }).eq("profile_id", profileId);
    await supabase.from("profiles").update({ approval_status: "rejected" }).eq("id", profileId);

    return res.json({ success: true });
  } catch (err) {
    console.error("PATCH /hospital-admin/assistants/:profileId/deactivate error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;