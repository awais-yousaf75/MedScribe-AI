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
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$_-";
  let out = "";
  for (let i = 0; i < len; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

async function getAdminHospital(adminProfileId: string) {
  const { data: hospital, error } = await supabase
    .from("hospitals")
    .select(
      "id, name, address, hospital_type, status, registration_number, license_number, contact_email, contact_phone, admin_profile_id, created_at",
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
 * Returns summary + alerts counts
 */
router.get("/dashboard", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminProfileId = adminProfile.id as string;

    // hospital managed by this admin
    const { data: hospital, error: hospError } = await supabase
      .from("hospitals")
      .select(
        "id, name, address, hospital_type, status, registration_number, license_number, contact_email, contact_phone, admin_profile_id, created_at",
      )
      .eq("admin_profile_id", adminProfileId)
      .maybeSingle();

    if (hospError) {
      console.error("Fetch hospital error:", hospError);
      return res.status(500).json({ error: "Failed to fetch hospital" });
    }

    // admin email from auth
    let adminEmail: string | null = null;
    try {
      const { data: authUser } =
        await supabase.auth.admin.getUserById(adminProfileId);
      adminEmail = authUser?.user?.email || null;
    } catch {
      adminEmail = null;
    }

    if (!hospital) {
      return res.json({
        admin: {
          id: adminProfileId,
          full_name: adminProfile.full_name,
          phone: adminProfile.phone || null,
          email: adminEmail,
        },
        hospital: null,
        stats: {
          doctorsActive: 0,
          doctorsInactive: 0,
          assistantsActive: 0,
          assistantsInactive: 0,
          patientsCount: 0,
          assistantsUnlinked: 0, // ✅ ALERT METRIC
        },
      });
    }

    const hospitalId = hospital.id;

    // Doctors counts (active/inactive)
    const [{ count: doctorsActive }, { count: doctorsInactive }] =
      await Promise.all([
        supabase
          .from("doctor_profiles")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospitalId)
          .eq("approval_status", "approved"),
        supabase
          .from("doctor_profiles")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospitalId)
          .eq("approval_status", "rejected"),
      ]);

    // Assistants counts (active/inactive)
    const [{ count: assistantsActive }, { count: assistantsInactive }] =
      await Promise.all([
        supabase
          .from("doctor_assistant_profiles")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospitalId)
          .eq("approval_status", "approved"),
        supabase
          .from("doctor_assistant_profiles")
          .select("*", { count: "exact", head: true })
          .eq("hospital_id", hospitalId)
          .eq("approval_status", "rejected"),
      ]);

    // Patients count (privacy-safe)
    const { count: patientsCount } = await supabase
      .from("patient_profiles")
      .select("*", { count: "exact", head: true })
      .eq("hospital_id", hospitalId);

    // ✅ ALERT METRIC: assistants not linked to any doctor
    const { count: assistantsUnlinked } = await supabase
      .from("doctor_assistant_profiles")
      .select("*", { count: "exact", head: true })
      .eq("hospital_id", hospitalId)
      .eq("approval_status", "approved")
      .is("doctor_profile_id", null);

    return res.json({
      admin: {
        id: adminProfileId,
        full_name: adminProfile.full_name,
        phone: adminProfile.phone || null,
        email: adminEmail,
      },
      hospital,
      stats: {
        doctorsActive: doctorsActive || 0,
        doctorsInactive: doctorsInactive || 0,
        assistantsActive: assistantsActive || 0,
        assistantsInactive: assistantsInactive || 0,
        patientsCount: patientsCount || 0,
        assistantsUnlinked: assistantsUnlinked || 0, // ✅ used by Overview Alerts panel
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
      return res
        .status(404)
        .json({ error: "Hospital not found for this admin" });
    }

    const hospitalId = hospital.id;

    const [
      { count: doctorsCount },
      { count: assistantsCount },
      { count: patientsCount },
    ] = await Promise.all([
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
 * List ALL doctors (approved + rejected) for this admin hospital
 */
router.get("/doctors", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminProfileId = adminProfile.id as string;

    const { data: hospital } = await supabase
      .from("hospitals")
      .select("id")
      .eq("admin_profile_id", adminProfileId)
      .maybeSingle();

    if (!hospital) return res.json({ doctors: [] });

    const hospitalId = hospital.id;

    const { data: doctorProfiles, error: docError } = await supabase
      .from("doctor_profiles")
      .select(
        "profile_id, specialization, hospital_id, license_number, cnic, approval_status, created_at",
      )
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false });

    if (docError)
      return res.status(500).json({ error: "Failed to fetch doctors" });

    const ids = (doctorProfiles || []).map((d) => d.profile_id);
    if (ids.length === 0) return res.json({ doctors: [] });

    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, phone, gender, dob, role, approval_status, created_at, avatar_url", // ✅ AVATAR
      )
      .in("id", ids)
      .eq("role", "doctor");

    if (profError)
      return res.status(500).json({ error: "Failed to fetch doctor profiles" });

    const { data: authData } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
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
        avatar_url: p?.avatar_url || null, // ✅ AVATAR
        specialization: dp.specialization,
        license_number: dp.license_number,
        cnic: dp.cnic,
        approval_status: dp.approval_status, // ✅ active/inactive based on this
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
      required: [
        "full_name",
        "email",
        "specialization",
        "license_number",
        "cnic",
      ],
    });
  }

  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) {
      return res
        .status(400)
        .json({ error: "No hospital assigned to this admin" });
    }

    const hospitalId = hospital.id;

    const shouldGenerate = generate_password === true || !password;
    const finalPassword = shouldGenerate ? genPassword(12) : password;

    // 1) create auth user
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
      });

    if (createError || !created?.user) {
      console.error("createUser error:", createError);
      return res
        .status(400)
        .json({ error: createError?.message || "Failed to create auth user" });
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
    if (!hospital)
      return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    // Ensure doctor belongs to this hospital
    const { data: dp, error: dpErr } = await supabase
      .from("doctor_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (dpErr)
      return res.status(500).json({ error: "Failed to validate doctor" });
    if (!dp)
      return res
        .status(404)
        .json({ error: "Doctor not found in your hospital" });

    // Block deletion if consultations exist (FK safety)
    const { count: consultCount } = await supabase
      .from("consultations")
      .select("*", { count: "exact", head: true })
      .eq("doctor_profile_id", profileId)
      .eq("hospital_id", hospitalId);

    if ((consultCount || 0) > 0) {
      return res.status(409).json({
        error: "DOCTOR_HAS_CONSULTATIONS",
        message:
          "Cannot delete doctor because consultations exist. Consider deactivating instead.",
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
    const { error: delAuthErr } =
      await supabase.auth.admin.deleteUser(profileId);
    if (delAuthErr) {
      console.error("Delete auth user error:", delAuthErr);
      return res
        .status(500)
        .json({ error: "Deleted DB rows but failed to delete auth user" });
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
    if (!hospital)
      return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    // Validate belongs to this hospital
    const { data: dp } = await supabase
      .from("doctor_profiles")
      .select("profile_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (!dp)
      return res
        .status(404)
        .json({ error: "Doctor not found in your hospital" });

    await supabase
      .from("doctor_profiles")
      .update({ approval_status: "rejected" })
      .eq("profile_id", profileId);
    await supabase
      .from("profiles")
      .update({ approval_status: "rejected" })
      .eq("id", profileId);

    return res.json({ success: true });
  } catch (err) {
    console.error(
      "PATCH /hospital-admin/doctors/:profileId/deactivate error:",
      err,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/hospital-admin/assistants
 * List ALL assistants (approved + rejected) for this admin hospital
 */
router.get("/assistants", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminProfileId = adminProfile.id as string;

    const { data: hospital } = await supabase
      .from("hospitals")
      .select("id")
      .eq("admin_profile_id", adminProfileId)
      .maybeSingle();

    if (!hospital) return res.json({ assistants: [] });

    const hospitalId = hospital.id;

    const { data: links, error: linkErr } = await supabase
      .from("doctor_assistant_profiles")
      .select(
        "profile_id, doctor_profile_id, hospital_id, approval_status, created_at",
      )
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false });

    if (linkErr)
      return res.status(500).json({ error: "Failed to fetch assistants" });

    const assistantIds = (links || []).map((l) => l.profile_id);
    const doctorIds = (links || [])
      .map((l) => l.doctor_profile_id)
      .filter((id): id is string => !!id);

    const { data: assistantProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone, gender, dob, role, created_at, avatar_url") // ✅ AVATAR
      .in("id", assistantIds)
      .eq("role", "doctor_assistant");

    const { data: doctorProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, role, avatar_url") // ✅ AVATAR
      .in("id", doctorIds)
      .eq("role", "doctor");

    const { data: authData } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const authMap = new Map<string, any>();
    (authData?.users || []).forEach((u) => authMap.set(u.id, u));

    const assistants = (links || []).map((l) => {
      const ap = assistantProfiles?.find((p) => p.id === l.profile_id) || null;
      const au = authMap.get(l.profile_id);
      const doctor =
        doctorProfiles?.find((d) => d.id === l.doctor_profile_id) || null;

      return {
        profile_id: l.profile_id,
        full_name: ap?.full_name || "Unknown",
        email: au?.email || null,
        phone: ap?.phone || null,
        gender: ap?.gender || null,
        dob: ap?.dob || null,
        avatar_url: ap?.avatar_url || null, // ✅ AVATAR
        approval_status: l.approval_status, // ✅ active/inactive
        doctor: doctor
          ? {
              id: doctor.id,
              full_name: doctor.full_name,
              avatar_url: doctor.avatar_url || null, // ✅ AVATAR
            }
          : null,
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
      return res
        .status(400)
        .json({ error: "No hospital assigned to this admin" });
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
        return res
          .status(400)
          .json({ error: "Selected doctor is not in your hospital" });
      }
      if (dp.approval_status !== "approved") {
        return res
          .status(400)
          .json({ error: "Selected doctor is not approved" });
      }
    }

    const shouldGenerate = generate_password === true || !password;
    const finalPassword = shouldGenerate ? genPassword(12) : password;

    // 1) create auth user
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
      });

    if (createError || !created?.user) {
      console.error("createUser error:", createError);
      return res
        .status(400)
        .json({ error: createError?.message || "Failed to create auth user" });
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
      return res
        .status(500)
        .json({ error: "Failed to create assistant profile" });
    }

    // 3) insert doctor_assistant_profiles
    const { error: daError } = await supabase
      .from("doctor_assistant_profiles")
      .insert({
        profile_id: newId,
        hospital_id: hospitalId,
        doctor_profile_id: doctor_profile_id || null,
        approval_status: "approved",
      });

    if (daError) {
      console.error("Insert doctor_assistant_profiles error:", daError);
      await supabase.from("profiles").delete().eq("id", newId);
      await supabase.auth.admin.deleteUser(newId);
      return res
        .status(500)
        .json({ error: "Failed to create assistant record" });
    }

    return res.status(201).json({
      success: true,
      assistant: {
        profile_id: newId,
        full_name,
        email,
        hospital_id: hospitalId,
      },
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
  const { doctor_profile_id } = req.body as {
    doctor_profile_id: string | null;
  };

  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital)
      return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    // Validate assistant belongs to this hospital
    const { data: link, error: linkErr } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (linkErr)
      return res.status(500).json({ error: "Failed to validate assistant" });
    if (!link)
      return res
        .status(404)
        .json({ error: "Assistant not found in your hospital" });

    // If doctor provided, validate doctor belongs to same hospital & approved
    if (doctor_profile_id) {
      const { data: dp, error: dpErr } = await supabase
        .from("doctor_profiles")
        .select("profile_id, hospital_id, approval_status")
        .eq("profile_id", doctor_profile_id)
        .eq("hospital_id", hospitalId)
        .maybeSingle();

      if (dpErr)
        return res.status(500).json({ error: "Failed to validate doctor" });
      if (!dp)
        return res
          .status(400)
          .json({ error: "Doctor not found in your hospital" });
      if (dp.approval_status !== "approved")
        return res.status(400).json({ error: "Doctor is not approved" });
    }

    const { error: updErr } = await supabase
      .from("doctor_assistant_profiles")
      .update({ doctor_profile_id: doctor_profile_id || null })
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId);

    if (updErr)
      return res.status(500).json({ error: "Failed to update assistant link" });

    return res.json({ success: true });
  } catch (err) {
    console.error(
      "PATCH /hospital-admin/assistants/:profileId/link-doctor error:",
      err,
    );
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
    if (!hospital)
      return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    // Validate assistant belongs to hospital
    const { data: link } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (!link)
      return res
        .status(404)
        .json({ error: "Assistant not found in your hospital" });

    // Delete assistant link + profile + auth
    await supabase
      .from("doctor_assistant_profiles")
      .delete()
      .eq("profile_id", profileId);
    await supabase.from("profiles").delete().eq("id", profileId);

    const { error: delAuthErr } =
      await supabase.auth.admin.deleteUser(profileId);
    if (delAuthErr) {
      console.error("Delete auth user error:", delAuthErr);
      return res
        .status(500)
        .json({ error: "Deleted DB rows but failed to delete auth user" });
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
    if (!hospital)
      return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    // Validate assistant belongs to hospital
    const { data: link } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (!link)
      return res
        .status(404)
        .json({ error: "Assistant not found in your hospital" });

    await supabase
      .from("doctor_assistant_profiles")
      .update({ approval_status: "rejected" })
      .eq("profile_id", profileId);
    await supabase
      .from("profiles")
      .update({ approval_status: "rejected" })
      .eq("id", profileId);

    return res.json({ success: true });
  } catch (err) {
    console.error(
      "PATCH /hospital-admin/assistants/:profileId/deactivate error:",
      err,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/hospital-admin/doctors/:profileId
 * Edit doctor (profiles + doctor_profiles) - must belong to admin hospital
 */
router.patch("/doctors/:profileId", async (req, res) => {
  const { profileId } = req.params;
  const {
    full_name,
    phone,
    gender,
    dob,
    specialization,
    license_number,
    cnic,
  } = req.body;

  try {
    const adminProfile = (req as any).profile;
    const adminProfileId = adminProfile.id as string;

    const { data: hospital } = await supabase
      .from("hospitals")
      .select("id")
      .eq("admin_profile_id", adminProfileId)
      .maybeSingle();

    if (!hospital)
      return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    const { data: dp } = await supabase
      .from("doctor_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (!dp)
      return res
        .status(404)
        .json({ error: "Doctor not found in your hospital" });

    if (full_name || phone || gender || dob) {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          ...(full_name ? { full_name } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(gender !== undefined ? { gender } : {}),
          ...(dob !== undefined ? { dob } : {}),
        })
        .eq("id", profileId);

      if (pErr)
        return res
          .status(500)
          .json({ error: "Failed to update doctor profile" });
    }

    if (specialization || license_number || cnic) {
      const { error: dpErr } = await supabase
        .from("doctor_profiles")
        .update({
          ...(specialization ? { specialization } : {}),
          ...(license_number ? { license_number } : {}),
          ...(cnic ? { cnic } : {}),
        })
        .eq("profile_id", profileId);

      if (dpErr)
        return res
          .status(500)
          .json({ error: "Failed to update doctor record" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("PATCH /hospital-admin/doctors/:profileId error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/hospital-admin/assistants/:profileId
 * Edit assistant (profiles only) - must belong to admin hospital
 */
router.patch("/assistants/:profileId", async (req, res) => {
  const { profileId } = req.params;
  const { full_name, phone, gender, dob } = req.body;

  try {
    const adminProfile = (req as any).profile;
    const adminProfileId = adminProfile.id as string;

    const { data: hospital } = await supabase
      .from("hospitals")
      .select("id")
      .eq("admin_profile_id", adminProfileId)
      .maybeSingle();

    if (!hospital)
      return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    const { data: link } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (!link)
      return res
        .status(404)
        .json({ error: "Assistant not found in your hospital" });

    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        ...(full_name ? { full_name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(dob !== undefined ? { dob } : {}),
      })
      .eq("id", profileId);

    if (pErr)
      return res
        .status(500)
        .json({ error: "Failed to update assistant profile" });

    return res.json({ success: true });
  } catch (err) {
    console.error("PATCH /hospital-admin/assistants/:profileId error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/hospital-admin/doctors/:profileId
 * Edit doctor (profiles + doctor_profiles) - must belong to admin hospital
 */
router.patch("/doctors/:profileId", async (req, res) => {
  const { profileId } = req.params;
  const {
    full_name,
    phone,
    gender,
    dob,
    specialization,
    license_number,
    cnic,
  } = req.body;

  try {
    const adminProfile = (req as any).profile;
    const adminProfileId = adminProfile.id as string;

    const { data: hospital } = await supabase
      .from("hospitals")
      .select("id")
      .eq("admin_profile_id", adminProfileId)
      .maybeSingle();

    if (!hospital)
      return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    const { data: dp } = await supabase
      .from("doctor_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (!dp)
      return res
        .status(404)
        .json({ error: "Doctor not found in your hospital" });

    if (full_name || phone || gender || dob) {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          ...(full_name ? { full_name } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(gender !== undefined ? { gender } : {}),
          ...(dob !== undefined ? { dob } : {}),
        })
        .eq("id", profileId);

      if (pErr)
        return res
          .status(500)
          .json({ error: "Failed to update doctor profile" });
    }

    if (specialization || license_number || cnic) {
      const { error: dpErr } = await supabase
        .from("doctor_profiles")
        .update({
          ...(specialization ? { specialization } : {}),
          ...(license_number ? { license_number } : {}),
          ...(cnic ? { cnic } : {}),
        })
        .eq("profile_id", profileId);

      if (dpErr)
        return res
          .status(500)
          .json({ error: "Failed to update doctor record" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("PATCH /hospital-admin/doctors/:profileId error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/hospital-admin/assistants/:profileId
 * Edit assistant (profiles only) - must belong to admin hospital
 */
router.patch("/assistants/:profileId", async (req, res) => {
  const { profileId } = req.params;
  const { full_name, phone, gender, dob } = req.body;

  try {
    const adminProfile = (req as any).profile;
    const adminProfileId = adminProfile.id as string;

    const { data: hospital } = await supabase
      .from("hospitals")
      .select("id")
      .eq("admin_profile_id", adminProfileId)
      .maybeSingle();

    if (!hospital)
      return res.status(400).json({ error: "No hospital assigned" });

    const hospitalId = hospital.id;

    const { data: link } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (!link)
      return res
        .status(404)
        .json({ error: "Assistant not found in your hospital" });

    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        ...(full_name ? { full_name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(dob !== undefined ? { dob } : {}),
      })
      .eq("id", profileId);

    if (pErr)
      return res
        .status(500)
        .json({ error: "Failed to update assistant profile" });

    return res.json({ success: true });
  } catch (err) {
    console.error("PATCH /hospital-admin/assistants/:profileId error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/hospital-admin/doctors/:profileId/reset-password
 * Body: { generate_password?: boolean, password?: string }
 */
router.post("/doctors/:profileId/reset-password", async (req, res) => {
  const { profileId } = req.params;
  const { generate_password, password } = req.body || {};

  try {
    const adminProfile = (req as any).profile;
    const adminProfileId = adminProfile.id as string;

    const { data: hospital } = await supabase
      .from("hospitals")
      .select("id")
      .eq("admin_profile_id", adminProfileId)
      .maybeSingle();

    if (!hospital)
      return res.status(400).json({ error: "No hospital assigned" });

    // validate doctor belongs to hospital
    const { data: dp } = await supabase
      .from("doctor_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospital.id)
      .maybeSingle();

    if (!dp)
      return res
        .status(404)
        .json({ error: "Doctor not found in your hospital" });

    const shouldGen = generate_password === true || !password;
    const newPass = shouldGen ? genPassword(12) : password;

    if (!newPass || newPass.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const { error: updErr } = await supabase.auth.admin.updateUserById(
      profileId,
      {
        password: newPass,
      },
    );

    if (updErr)
      return res.status(500).json({ error: "Failed to reset password" });

    // email
    const email = await getAuthEmail(profileId);

    return res.json({
      success: true,
      credentials: {
        email,
        password: shouldGen ? newPass : null,
        generated: shouldGen,
      },
    });
  } catch (err) {
    console.error(
      "POST /hospital-admin/doctors/:profileId/reset-password error:",
      err,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/hospital-admin/assistants/:profileId/reset-password
 * Body: { generate_password?: boolean, password?: string }
 */
router.post("/assistants/:profileId/reset-password", async (req, res) => {
  const { profileId } = req.params;
  const { generate_password, password } = req.body || {};

  try {
    const adminProfile = (req as any).profile;
    const adminProfileId = adminProfile.id as string;

    const { data: hospital } = await supabase
      .from("hospitals")
      .select("id")
      .eq("admin_profile_id", adminProfileId)
      .maybeSingle();

    if (!hospital)
      return res.status(400).json({ error: "No hospital assigned" });

    // validate assistant belongs to hospital
    const { data: link } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospital.id)
      .maybeSingle();

    if (!link)
      return res
        .status(404)
        .json({ error: "Assistant not found in your hospital" });

    const shouldGen = generate_password === true || !password;
    const newPass = shouldGen ? genPassword(12) : password;

    if (!newPass || newPass.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const { error: updErr } = await supabase.auth.admin.updateUserById(
      profileId,
      {
        password: newPass,
      },
    );

    if (updErr)
      return res.status(500).json({ error: "Failed to reset password" });

    const email = await getAuthEmail(profileId);

    return res.json({
      success: true,
      credentials: {
        email,
        password: shouldGen ? newPass : null,
        generated: shouldGen,
      },
    });
  } catch (err) {
    console.error(
      "POST /hospital-admin/assistants/:profileId/reset-password error:",
      err,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/hospital-admin/assistants/:profileId/activate
 * Activate assistant (doctor_assistant_profiles + profiles)
 */
router.patch("/assistants/:profileId/activate", async (req, res) => {
  const { profileId } = req.params;

  try {
    const adminProfile = (req as any).profile;
    const adminProfileId = adminProfile.id as string;

    // find hospital for this admin
    const { data: hospital, error: hospErr } = await supabase
      .from("hospitals")
      .select("id")
      .eq("admin_profile_id", adminProfileId)
      .maybeSingle();

    if (hospErr) {
      console.error("Fetch hospital error:", hospErr);
      return res.status(500).json({ error: "Failed to fetch hospital" });
    }

    if (!hospital)
      return res.status(400).json({ error: "No hospital assigned" });

    // ensure assistant belongs to this hospital
    const { data: link, error: linkErr } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospital.id)
      .maybeSingle();

    if (linkErr) {
      console.error("Validate assistant error:", linkErr);
      return res.status(500).json({ error: "Failed to validate assistant" });
    }

    if (!link) {
      return res
        .status(404)
        .json({ error: "Assistant not found in your hospital" });
    }

    // activate both records
    const { error: daErr } = await supabase
      .from("doctor_assistant_profiles")
      .update({ approval_status: "approved" })
      .eq("profile_id", profileId);

    if (daErr) {
      console.error("Activate assistant link error:", daErr);
      return res
        .status(500)
        .json({ error: "Failed to activate assistant link" });
    }

    const { error: pErr } = await supabase
      .from("profiles")
      .update({ approval_status: "approved" })
      .eq("id", profileId);

    if (pErr) {
      console.error("Activate assistant profile error:", pErr);
      return res
        .status(500)
        .json({ error: "Failed to activate assistant profile" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error(
      "PATCH /hospital-admin/assistants/:profileId/activate error:",
      err,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/hospital-admin/doctors/:profileId/activate
 * Activate doctor (doctor_profiles + profiles)
 */
router.patch("/doctors/:profileId/activate", async (req, res) => {
  const { profileId } = req.params;

  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) {
      return res.status(400).json({ error: "No hospital assigned" });
    }

    const hospitalId = hospital.id;

    // ensure doctor belongs to this hospital
    const { data: dp, error: dpErr } = await supabase
      .from("doctor_profiles")
      .select("profile_id, hospital_id")
      .eq("profile_id", profileId)
      .eq("hospital_id", hospitalId)
      .maybeSingle();

    if (dpErr) {
      console.error("Validate doctor error:", dpErr);
      return res.status(500).json({ error: "Failed to validate doctor" });
    }

    if (!dp) {
      return res
        .status(404)
        .json({ error: "Doctor not found in your hospital" });
    }

    // activate both records
    const { error: doctorErr } = await supabase
      .from("doctor_profiles")
      .update({ approval_status: "approved" })
      .eq("profile_id", profileId);

    if (doctorErr) {
      console.error("Activate doctor record error:", doctorErr);
      return res
        .status(500)
        .json({ error: "Failed to activate doctor record" });
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ approval_status: "approved" })
      .eq("id", profileId);

    if (profileErr) {
      console.error("Activate doctor profile error:", profileErr);
      return res
        .status(500)
        .json({ error: "Failed to activate doctor profile" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error(
      "PATCH /hospital-admin/doctors/:profileId/activate error:",
      err,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/hospital-admin/my-profile
 * Returns admin profile + auth email
 */
router.get("/my-profile", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const email = await getAuthEmail(adminId);

    return res.json({
      profile: {
        id: adminId,
        full_name: adminProfile.full_name,
        phone: adminProfile.phone || null,
        gender: adminProfile.gender || null,
        dob: adminProfile.dob || null,
        email,
      },
    });
  } catch (err) {
    console.error("GET /hospital-admin/my-profile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/hospital-admin/my-profile
 * Edit own profile (full_name, phone, gender, dob only)
 */
router.patch("/my-profile", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;
    const { full_name, phone, gender, dob } = req.body;

    const updates: Record<string, any> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone || null;
    if (gender !== undefined) updates.gender = gender || null;
    if (dob !== undefined) updates.dob = dob || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", adminId);

    if (error) throw error;

    return res.json({ success: true });
  } catch (err) {
    console.error("PATCH /hospital-admin/my-profile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/hospital-admin/hospital-details
 * Edit hospital contact/address fields only
 * (registration_number and license_number are NEVER editable)
 */
router.patch("/hospital-details", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;

    const hospital = await getAdminHospital(adminId);
    if (!hospital) {
      return res.status(404).json({ error: "No hospital assigned to this admin" });
    }

    const { address, contact_email, contact_phone, hospital_type } = req.body;

    const updates: Record<string, any> = {};
    if (address !== undefined) updates.address = address || null;
    if (contact_email !== undefined) updates.contact_email = contact_email || null;
    if (contact_phone !== undefined) updates.contact_phone = contact_phone || null;
    if (hospital_type !== undefined) updates.hospital_type = hospital_type || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { error } = await supabase
      .from("hospitals")
      .update(updates)
      .eq("id", hospital.id);

    if (error) throw error;

    return res.json({ success: true });
  } catch (err) {
    console.error("PATCH /hospital-admin/hospital-details error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/hospital-admin/change-password
 * Changes admin's own password via Supabase Admin API
 * (We trust the admin is authenticated; current password verification
 *  is handled by re-signing in via Supabase client on the frontend)
 */
router.post("/change-password", async (req, res) => {
  try {
    const adminProfile = (req as any).profile;
    const adminId = adminProfile.id as string;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const { error } = await supabase.auth.admin.updateUserById(adminId, {
      password: newPassword,
    });

    if (error) throw error;

    return res.json({ success: true });
  } catch (err: any) {
    console.error("POST /hospital-admin/change-password error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
