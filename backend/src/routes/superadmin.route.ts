import { Router } from "express";
import { supabase } from "../config/supabaseClient";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

router.use(authMiddleware, requireRole("super_admin"));

const chunkArray = <T>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const genPassword = (len = 12) => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$_-";
  let out = "";
  for (let i = 0; i < len; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

/**
 * POST /api/superadmin/register-hospital-admin
 */
router.post("/register-hospital-admin", async (req, res) => {
  const {
    admin_email,
    admin_password,
    admin_full_name,
    admin_phone,
    admin_gender,
    admin_dob,
    hospital_name,
    hospital_type,
    hospital_address,
    hospital_registration_number,
    hospital_license_number,
    hospital_contact_email,
    hospital_contact_phone,
  } = req.body;

  const requiredFields = {
    admin_email,
    admin_password,
    admin_full_name,
    hospital_name,
    hospital_type,
    hospital_registration_number,
    hospital_contact_email,
    hospital_contact_phone,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: "Missing required fields",
      missingFields,
    });
  }

  try {
    // Validate registration number format
    const registrationNumberRegex = /^[A-Z0-9\-]{5,}$/;
    if (!registrationNumberRegex.test(hospital_registration_number)) {
      return res.status(400).json({
        error: "INVALID_REGISTRATION_NUMBER",
        message:
          'Registration number must be at least 5 characters and contain only uppercase letters, numbers, and hyphens (e.g., "REG-12345")',
      });
    }

    // Check if registration number already exists
    const { data: existingReg, error: regCheckError } = await supabase
      .from("hospitals")
      .select("id, registration_number")
      .eq("registration_number", hospital_registration_number)
      .maybeSingle();

    if (regCheckError) {
      console.error("Check registration number error:", regCheckError);
      return res
        .status(500)
        .json({ error: "Failed to validate registration number" });
    }

    if (existingReg) {
      return res.status(409).json({
        error: "DUPLICATE_REGISTRATION_NUMBER",
        message: `A hospital with registration number "${hospital_registration_number}" already exists in the system.`,
      });
    }

    // Check if hospital name already exists
    const { data: existingHospital } = await supabase
      .from("hospitals")
      .select("id, name, status")
      .ilike("name", hospital_name)
      .eq("status", "approved")
      .maybeSingle();

    if (existingHospital) {
      return res.status(409).json({
        error: "DUPLICATE_HOSPITAL_NAME",
        message: `A hospital named "${existingHospital.name}" already exists in the system.`,
      });
    }

    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: admin_email,
        password: admin_password,
        email_confirm: true,
      });

    if (authError) {
      console.error("Create auth user error:", authError);
      return res
        .status(400)
        .json({ error: authError.message || "Failed to create user account" });
    }

    const adminProfileId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: adminProfileId,
      full_name: admin_full_name,
      phone: admin_phone,
      gender: admin_gender,
      dob: admin_dob,
      role: "hospital_admin",
      approval_status: "approved",
    });

    if (profileError) {
      console.error("Create profile error:", profileError);
      await supabase.auth.admin.deleteUser(adminProfileId);
      return res.status(500).json({ error: "Failed to create admin profile" });
    }

    // Create hospital
    const { data: hospitalData, error: hospitalError } = await supabase
      .from("hospitals")
      .insert({
        name: hospital_name,
        hospital_type: hospital_type,
        address: hospital_address || null,
        registration_number: hospital_registration_number,
        license_number: hospital_license_number || null,
        contact_email: hospital_contact_email,
        contact_phone: hospital_contact_phone,
        status: "approved",
        admin_profile_id: adminProfileId,
      })
      .select()
      .single();

    if (hospitalError) {
      console.error("Create hospital error:", hospitalError);
      await supabase.auth.admin.deleteUser(adminProfileId);
      await supabase.from("profiles").delete().eq("id", adminProfileId);
      return res.status(500).json({ error: "Failed to create hospital" });
    }

    // Create hospital_admin_profiles entry
    const { error: adminProfileError } = await supabase
      .from("hospital_admin_profiles")
      .insert({
        profile_id: adminProfileId,
        hospital_id: hospitalData.id,
      });

    if (adminProfileError) {
      console.error("Create hospital_admin_profiles error:", adminProfileError);
      await supabase.auth.admin.deleteUser(adminProfileId);
      await supabase.from("profiles").delete().eq("id", adminProfileId);
      await supabase.from("hospitals").delete().eq("id", hospitalData.id);
      return res
        .status(500)
        .json({ error: "Failed to create admin hospital profile" });
    }

    return res.status(201).json({
      success: true,
      message: "Hospital admin and hospital registered successfully",
      data: {
        admin_id: adminProfileId,
        admin_email: admin_email,
        hospital_id: hospitalData.id,
        hospital_name: hospitalData.name,
        hospital_registration_number: hospitalData.registration_number,
      },
    });
  } catch (err) {
    console.error("Register hospital admin handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/superadmin/registration-form-data
 */
router.get("/registration-form-data", async (_req, res) => {
  try {
    const hospitalTypes = [
      "General Hospital",
      "Specialty Hospital",
      "Multi-specialty Hospital",
      "Teaching Hospital",
      "Private Hospital",
      "Government Hospital",
      "Diagnostic Center",
    ];

    return res.json({
      hospitalTypes,
    });
  } catch (err) {
    console.error("GET registration-form-data error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/superadmin/pending-hospital-admins
 */
router.get("/pending-hospital-admins", async (_req, res) => {
  try {
    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, gender, dob, approval_status, created_at")
      .eq("role", "hospital_admin")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });

    if (profError) {
      console.error("Fetch pending admins error:", profError);
      return res.status(500).json({ error: "Failed to fetch pending admins" });
    }

    if (!profiles || profiles.length === 0) {
      return res.json({ admins: [] });
    }

    const adminIds = profiles.map((p) => p.id);

    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUsersMap = new Map<string, any>();
    (authData?.users || []).forEach((u) => {
      authUsersMap.set(u.id, u);
    });

    const { data: hospitals, error: hospError } = await supabase
      .from("hospitals")
      .select(
        "id, name, address, hospital_type, status, admin_profile_id, registration_number",
      )
      .in("admin_profile_id", adminIds);

    if (hospError) {
      console.error("Fetch hospitals for admins error:", hospError);
    }

    const admins = profiles.map((p) => {
      const authUser = authUsersMap.get(p.id);
      const hospital =
        (hospitals || []).find((h) => h.admin_profile_id === p.id) || null;

      return {
        id: p.id,
        full_name: p.full_name,
        email: authUser?.email || null,
        phone: p.phone,
        gender: p.gender,
        dob: p.dob,
        approval_status: p.approval_status,
        created_at: p.created_at,
        hospital: hospital
          ? {
              id: hospital.id,
              name: hospital.name,
              address: hospital.address,
              hospital_type: hospital.hospital_type,
              status: hospital.status,
              admin_profile_id: hospital.admin_profile_id,
              registration_number: hospital.registration_number,
            }
          : null,
      };
    });

    return res.json({ admins });
  } catch (err) {
    console.error("GET /superadmin/pending-hospital-admins error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/superadmin/hospital-admins/:profileId/approve
 */
router.post("/hospital-admins/:profileId/approve", async (req, res) => {
  const { profileId } = req.params;

  try {
    const { data: existingHospital, error: checkError } = await supabase
      .from("hospitals")
      .select("id, name, status")
      .eq("admin_profile_id", profileId)
      .eq("status", "approved")
      .maybeSingle();

    if (checkError) {
      console.error("Check existing hospital error:", checkError);
      return res.status(500).json({ error: "Failed to validate admin" });
    }

    if (existingHospital) {
      return res.status(409).json({
        error: "ADMIN_ALREADY_HAS_HOSPITAL",
        message: `This admin already manages an approved hospital: "${existingHospital.name}"`,
      });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ approval_status: "approved" })
      .eq("id", profileId);

    if (profileError) {
      console.error("Approve profile error:", profileError);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Approve hospital-admin handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/superadmin/hospital-admins/:profileId/reject
 */
router.post("/hospital-admins/:profileId/reject", async (req, res) => {
  const { profileId } = req.params;

  try {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ approval_status: "rejected" })
      .eq("id", profileId);

    if (profileError) {
      console.error("Reject profile error:", profileError);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    const { error: hospitalError } = await supabase
      .from("hospitals")
      .update({ status: "rejected" })
      .eq("admin_profile_id", profileId);

    if (hospitalError) {
      console.error("Reject hospitals error:", hospitalError);
    }

    const { error: adminProfileError } = await supabase
      .from("hospital_admin_profiles")
      .delete()
      .eq("profile_id", profileId);

    if (adminProfileError) {
      console.error("Delete hospital_admin_profiles error:", adminProfileError);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Reject hospital-admin handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/superadmin/pending-hospitals
 */
router.get("/pending-hospitals", async (_req, res) => {
  try {
    const { data: hospitals, error: hospError } = await supabase
      .from("hospitals")
      .select(
        "id, name, address, hospital_type, status, admin_profile_id, created_at, registration_number, license_number, contact_email, contact_phone",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (hospError) {
      console.error("Fetch pending hospitals error:", hospError);
      return res
        .status(500)
        .json({ error: "Failed to fetch pending hospitals" });
    }

    if (!hospitals || hospitals.length === 0) {
      return res.json({ hospitals: [] });
    }

    const adminIds = hospitals
      .map((h) => h.admin_profile_id)
      .filter((id): id is string => !!id);

    let adminProfiles: any[] = [];
    if (adminIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, approval_status, role")
        .in("id", adminIds);

      adminProfiles = profiles || [];
    }

    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUsersMap = new Map<string, any>();
    (authData?.users || []).forEach((u) => {
      authUsersMap.set(u.id, u);
    });

    const { data: approvedHospitals } = await supabase
      .from("hospitals")
      .select("id, name, registration_number")
      .eq("status", "approved");

    const approvedNamesMap = new Map(
      approvedHospitals?.map((h) => [
        h.name.toLowerCase().trim().replace(/\s+/g, " "),
        h,
      ]) || [],
    );

    const approvedRegMap = new Map(
      approvedHospitals?.map((h) => [h.registration_number, h]) || [],
    );

    const pendingNamesCount = new Map<string, number>();
    hospitals.forEach((h) => {
      const key = h.name.toLowerCase().trim().replace(/\s+/g, " ");
      pendingNamesCount.set(key, (pendingNamesCount.get(key) || 0) + 1);
    });

    const result = hospitals.map((h) => {
      const admin =
        adminProfiles.find((p) => p.id === h.admin_profile_id) || null;
      const authUser = admin ? authUsersMap.get(admin.id) : null;
      const normalizedName = h.name.toLowerCase().trim().replace(/\s+/g, " ");

      const approvedDuplicate = approvedNamesMap.get(normalizedName);
      const registrationDuplicate = approvedRegMap.get(h.registration_number);
      const pendingCount = pendingNamesCount.get(normalizedName) || 0;
      const hasPendingDuplicate = pendingCount > 1;

      let isDuplicate = false;
      let duplicateType: string | null = null;
      let duplicateInfo = null;

      if (registrationDuplicate) {
        isDuplicate = true;
        duplicateType = "registration";
        duplicateInfo = {
          message: `A hospital with registration number "${registrationDuplicate.registration_number}" is already approved in the system.`,
          existingHospitalId: registrationDuplicate.id,
        };
      } else if (approvedDuplicate) {
        isDuplicate = true;
        duplicateType = "name";
        duplicateInfo = {
          message: `A hospital named "${approvedDuplicate.name}" is already approved in the system.`,
          existingHospitalId: approvedDuplicate.id,
        };
      } else if (hasPendingDuplicate) {
        isDuplicate = true;
        duplicateType = "pending";
        duplicateInfo = {
          message: `Multiple registration requests for "${h.name}" are pending. Only one should be approved.`,
        };
      }

      return {
        id: h.id,
        name: h.name,
        address: h.address,
        hospital_type: h.hospital_type,
        status: h.status,
        admin_profile_id: h.admin_profile_id,
        created_at: h.created_at,
        registration_number: h.registration_number,
        license_number: h.license_number,
        contact_email: h.contact_email,
        contact_phone: h.contact_phone,
        admin: admin
          ? {
              id: admin.id,
              full_name: admin.full_name,
              email: authUser?.email || null,
              phone: admin.phone,
              approval_status: admin.approval_status,
              role: admin.role,
            }
          : null,
        isDuplicate,
        duplicateType,
        duplicateInfo,
      };
    });

    return res.json({ hospitals: result });
  } catch (err) {
    console.error("GET /api/superadmin/pending-hospitals error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/superadmin/hospitals/:hospitalId/approve
 */
router.post("/hospitals/:hospitalId/approve", async (req, res) => {
  const { hospitalId } = req.params;

  try {
    const { data: hospital, error: getError } = await supabase
      .from("hospitals")
      .select("id, name, admin_profile_id, registration_number, status")
      .eq("id", hospitalId)
      .single();

    if (getError || !hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    // Check for duplicate registration number
    const { data: registrationDuplicate, error: regDupError } = await supabase
      .from("hospitals")
      .select("id, name, registration_number")
      .eq("registration_number", hospital.registration_number)
      .eq("status", "approved")
      .neq("id", hospitalId)
      .maybeSingle();

    if (regDupError) {
      console.error("Registration duplicate check error:", regDupError);
      return res.status(500).json({ error: "Failed to validate hospital" });
    }

    if (registrationDuplicate) {
      return res.status(409).json({
        error: "DUPLICATE_REGISTRATION_NUMBER",
        message: `Cannot approve: A hospital with registration number "${registrationDuplicate.registration_number}" is already approved in the system.`,
        existingHospitalId: registrationDuplicate.id,
      });
    }

    // Check for duplicate name
    const { data: nameDuplicate, error: nameDupError } = await supabase
      .from("hospitals")
      .select("id, name")
      .ilike("name", hospital.name)
      .eq("status", "approved")
      .neq("id", hospitalId)
      .maybeSingle();

    if (nameDupError) {
      console.error("Name duplicate check error:", nameDupError);
      return res.status(500).json({ error: "Failed to validate hospital" });
    }

    if (nameDuplicate) {
      return res.status(409).json({
        error: "DUPLICATE_HOSPITAL_NAME",
        message: `Cannot approve: A hospital named "${nameDuplicate.name}" is already approved in the system.`,
        existingHospitalId: nameDuplicate.id,
      });
    }

    // Check if admin already has an approved hospital
    const { data: adminHospital, error: adminCheckError } = await supabase
      .from("hospitals")
      .select("id, name")
      .eq("admin_profile_id", hospital.admin_profile_id)
      .eq("status", "approved")
      .neq("id", hospitalId)
      .maybeSingle();

    if (adminCheckError) {
      console.error("Admin hospital check error:", adminCheckError);
      return res.status(500).json({ error: "Failed to validate admin" });
    }

    if (adminHospital) {
      return res.status(409).json({
        error: "ADMIN_ALREADY_HAS_HOSPITAL",
        message: `Cannot approve: This admin already manages "${adminHospital.name}". One admin can only manage one hospital.`,
        existingHospitalId: adminHospital.id,
      });
    }

    // Approve the hospital
    const { error } = await supabase
      .from("hospitals")
      .update({ status: "approved" })
      .eq("id", hospitalId);

    if (error) {
      console.error("Approve hospital error:", error);
      return res.status(500).json({ error: "Failed to approve hospital" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Approve hospital handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/superadmin/hospitals/:hospitalId/reject
 */
router.post("/hospitals/:hospitalId/reject", async (req, res) => {
  const { hospitalId } = req.params;

  try {
    const { error } = await supabase
      .from("hospitals")
      .update({ status: "rejected" })
      .eq("id", hospitalId);

    if (error) {
      console.error("Reject hospital error:", error);
      return res.status(500).json({ error: "Failed to reject hospital" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Reject hospital handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/superadmin/users
 */
router.get("/users", async (req, res) => {
  try {
    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, approval_status, created_at")
      .neq("role", "super_admin")
      .order("created_at", { ascending: false });

    if (profError) {
      console.error("Fetch profiles error:", profError);
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    if (!profiles || profiles.length === 0) {
      return res.json({ users: [] });
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Fetch auth users error:", authError);
    }

    const authUsersMap = new Map<string, any>();
    (authData?.users || []).forEach((u) => {
      authUsersMap.set(u.id, u);
    });

    const { data: doctorProfiles } = await supabase
      .from("doctor_profiles")
      .select("profile_id, hospital_id");

    const { data: assistantProfiles } = await supabase
      .from("doctor_assistant_profiles")
      .select("profile_id, hospital_id");

    const { data: hospitals } = await supabase
      .from("hospitals")
      .select("id, name, admin_profile_id");

    const { data: patientProfiles } = await supabase
      .from("patient_profiles")
      .select("profile_id, hospital_id");

    const userHospitalMap = new Map<string, string>();

    (hospitals || []).forEach((h) => {
      if (h.admin_profile_id) {
        userHospitalMap.set(h.admin_profile_id, h.name);
      }
    });

    const hospitalIdToName = new Map<string, string>();
    (hospitals || []).forEach((h) => {
      hospitalIdToName.set(h.id, h.name);
    });

    (doctorProfiles || []).forEach((d) => {
      const hospitalName = hospitalIdToName.get(d.hospital_id);
      if (hospitalName) {
        userHospitalMap.set(d.profile_id, hospitalName);
      }
    });

    (assistantProfiles || []).forEach((a) => {
      const hospitalName = hospitalIdToName.get(a.hospital_id);
      if (hospitalName) {
        userHospitalMap.set(a.profile_id, hospitalName);
      }
    });

    (patientProfiles || []).forEach((p) => {
      const hospitalName = hospitalIdToName.get(p.hospital_id);
      if (hospitalName) {
        userHospitalMap.set(p.profile_id, hospitalName);
      }
    });

    const users = profiles.map((p) => {
      const authUser = authUsersMap.get(p.id);

      return {
        id: p.id,
        email: authUser?.email || null,
        full_name: p.full_name,
        phone: p.phone,
        role: p.role,
        approval_status: p.approval_status,
        created_at: p.created_at,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        hospital_name: userHospitalMap.get(p.id) || null,
      };
    });

    return res.json({ users });
  } catch (err) {
    console.error("GET /api/superadmin/users error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/superadmin/users/:userId
 * Hard delete user (safe: unlinks FK references first)
 */
router.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // 0) Safety: never delete super_admin via this route
    const { data: prof, error: profFetchErr } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    if (profFetchErr) {
      console.error("Fetch profile error:", profFetchErr);
      return res.status(500).json({ error: "Failed to validate user" });
    }

    if (!prof) return res.status(404).json({ error: "User not found" });

    if (prof.role === "super_admin") {
      return res.status(403).json({ error: "Cannot delete super_admin" });
    }

    // 1) Unlink hospitals where this user is admin (FK: hospitals.admin_profile_id -> profiles.id)
    const { error: unlinkHospErr } = await supabase
      .from("hospitals")
      .update({ admin_profile_id: null })
      .eq("admin_profile_id", userId);

    if (unlinkHospErr) {
      console.error("Unlink hospital admin_profile_id error:", unlinkHospErr);
      return res.status(500).json({ error: "Failed to unlink hospital admin" });
    }

    // 2) Unlink assistants linked to this doctor (FK: doctor_assistant_profiles.doctor_profile_id -> profiles.id)
    const { error: unlinkAssistErr } = await supabase
      .from("doctor_assistant_profiles")
      .update({ doctor_profile_id: null })
      .eq("doctor_profile_id", userId);

    if (unlinkAssistErr) {
      console.error("Unlink assistants from doctor error:", unlinkAssistErr);
      return res.status(500).json({ error: "Failed to unlink assistants" });
    }

    // 3) Unlink patient_profiles.created_by (FK: patient_profiles.created_by -> profiles.id)
    const { error: unlinkCreatedByErr } = await supabase
      .from("patient_profiles")
      .update({ created_by: null })
      .eq("created_by", userId);

    if (unlinkCreatedByErr) {
      console.error(
        "Unlink patient_profiles.created_by error:",
        unlinkCreatedByErr,
      );
      return res.status(500).json({ error: "Failed to unlink created_by" });
    }

    // 4) Delete consultations first (FKs depend on doctor_profiles/patient_profiles)
    const { error: delDocConsultErr } = await supabase
      .from("consultations")
      .delete()
      .eq("doctor_profile_id", userId);

    if (delDocConsultErr) {
      console.error(
        "Delete consultations (doctor_profile_id) error:",
        delDocConsultErr,
      );
      return res
        .status(500)
        .json({ error: "Failed to delete doctor consultations" });
    }

    const { error: delPatConsultErr } = await supabase
      .from("consultations")
      .delete()
      .eq("patient_profile_id", userId);

    if (delPatConsultErr) {
      console.error(
        "Delete consultations (patient_profile_id) error:",
        delPatConsultErr,
      );
      return res
        .status(500)
        .json({ error: "Failed to delete patient consultations" });
    }

    // 5) Delete role tables
    const { error: delHospAdminErr } = await supabase
      .from("hospital_admin_profiles")
      .delete()
      .eq("profile_id", userId);
    if (delHospAdminErr) {
      console.error("Delete hospital_admin_profiles error:", delHospAdminErr);
      return res
        .status(500)
        .json({ error: "Failed to delete hospital admin profile" });
    }

    const { error: delAssistErr } = await supabase
      .from("doctor_assistant_profiles")
      .delete()
      .eq("profile_id", userId);
    if (delAssistErr) {
      console.error("Delete doctor_assistant_profiles error:", delAssistErr);
      return res
        .status(500)
        .json({ error: "Failed to delete assistant profile" });
    }

    const { error: delDoctorErr } = await supabase
      .from("doctor_profiles")
      .delete()
      .eq("profile_id", userId);
    if (delDoctorErr) {
      console.error("Delete doctor_profiles error:", delDoctorErr);
      return res.status(500).json({ error: "Failed to delete doctor profile" });
    }

    const { error: delPatientErr } = await supabase
      .from("patient_profiles")
      .delete()
      .eq("profile_id", userId);
    if (delPatientErr) {
      console.error("Delete patient_profiles error:", delPatientErr);
      return res
        .status(500)
        .json({ error: "Failed to delete patient profile" });
    }

    // 6) Delete main profile row (FK: profiles.id -> auth.users.id)
    const { error: delProfileErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (delProfileErr) {
      console.error("Delete profiles error:", delProfileErr);
      return res.status(500).json({
        error: "Failed to delete profile (likely FK reference still exists)",
        details: delProfileErr.message,
      });
    }

    // 7) Finally delete auth user
    const { error: delAuthErr } = await supabase.auth.admin.deleteUser(userId);

    if (delAuthErr) {
      console.error("Delete auth user error:", delAuthErr);
      return res.status(500).json({
        error: "Failed to delete auth user",
        details: delAuthErr.message,
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE /superadmin/users/:userId error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/superadmin/hospitals
 */
router.get("/hospitals", async (req, res) => {
  try {
    const { data: hospitals, error: hospError } = await supabase
      .from("hospitals")
      .select(
        "id, name, address, hospital_type, status, admin_profile_id, created_at, registration_number, license_number, contact_email, contact_phone",
      )
      .order("created_at", { ascending: false });

    if (hospError) {
      console.error("Fetch hospitals error:", hospError);
      return res.status(500).json({ error: "Failed to fetch hospitals" });
    }

    if (!hospitals || hospitals.length === 0) {
      return res.json({ hospitals: [] });
    }

    const adminIds = hospitals
      .map((h) => h.admin_profile_id)
      .filter((id): id is string => !!id);

    let adminProfiles: any[] = [];
    if (adminIds.length > 0) {
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, full_name, phone, approval_status, role")
        .in("id", adminIds);

      if (profError) {
        console.error("Fetch admin profiles error:", profError);
      } else {
        adminProfiles = profiles || [];
      }
    }

    const hospitalIds = hospitals.map((h) => h.id);

    const { data: doctorCounts, error: docCountError } = await supabase
      .from("doctor_profiles")
      .select("hospital_id")
      .in("hospital_id", hospitalIds)
      .eq("approval_status", "approved");

    if (docCountError) {
      console.error("Fetch doctor counts error:", docCountError);
    }

    const { data: assistantCounts, error: assistCountError } = await supabase
      .from("doctor_assistant_profiles")
      .select("hospital_id")
      .in("hospital_id", hospitalIds)
      .eq("approval_status", "approved");

    if (assistCountError) {
      console.error("Fetch assistant counts error:", assistCountError);
    }

    const doctorCountMap = new Map<string, number>();
    const assistantCountMap = new Map<string, number>();

    (doctorCounts || []).forEach((d) => {
      const current = doctorCountMap.get(d.hospital_id) || 0;
      doctorCountMap.set(d.hospital_id, current + 1);
    });

    (assistantCounts || []).forEach((a) => {
      const current = assistantCountMap.get(a.hospital_id) || 0;
      assistantCountMap.set(a.hospital_id, current + 1);
    });

    const result = hospitals.map((h) => {
      const admin =
        adminProfiles.find((p) => p.id === h.admin_profile_id) || null;

      return {
        id: h.id,
        name: h.name,
        address: h.address,
        hospital_type: h.hospital_type,
        status: h.status,
        admin_profile_id: h.admin_profile_id,
        created_at: h.created_at,
        registration_number: h.registration_number,
        license_number: h.license_number,
        contact_email: h.contact_email,
        contact_phone: h.contact_phone,
        admin: admin
          ? {
              id: admin.id,
              full_name: admin.full_name,
              phone: admin.phone,
              approval_status: admin.approval_status,
              role: admin.role,
            }
          : null,
        doctors_count: doctorCountMap.get(h.id) || 0,
        assistants_count: assistantCountMap.get(h.id) || 0,
      };
    });

    return res.json({ hospitals: result });
  } catch (err) {
    console.error("GET /api/superadmin/hospitals error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/superadmin/hospitals/:hospitalId
 * Returns full details for a specific hospital including admin info and stats
 */
router.get("/hospitals/:hospitalId", async (req, res) => {
  const { hospitalId } = req.params;

  try {
    // 1. Fetch Hospital details and join the Admin Profile info
    const { data: hospital, error: hospError } = await supabase
      .from("hospitals")
      .select(
        `
        *,
        admin:profiles!hospitals_admin_profile_id_fkey (
          id,
          full_name,
          phone,
          approval_status,
          role
        )
      `,
      )
      .eq("id", hospitalId)
      .single();

    if (hospError || !hospital) {
      console.error("Fetch hospital detail error:", hospError);
      return res.status(404).json({ error: "Hospital not found" });
    }

    // 2. Fetch the Admin's Email from Supabase Auth (since it's not in the profiles table)
    let adminEmail = null;
    if (hospital.admin_profile_id) {
      const { data: authUser, error: authError } =
        await supabase.auth.admin.getUserById(hospital.admin_profile_id);
      if (!authError && authUser) {
        adminEmail = authUser.user.email;
      }
    }

    // 3. Get Aggregated Stats for this specific hospital

    // Count Approved Doctors
    const { count: doctorsCount } = await supabase
      .from("doctor_profiles")
      .select("*", { count: "exact", head: true })
      .eq("hospital_id", hospitalId)
      .eq("approval_status", "approved");

    // Count Approved Assistants
    const { count: assistantsCount } = await supabase
      .from("doctor_assistant_profiles")
      .select("*", { count: "exact", head: true })
      .eq("hospital_id", hospitalId)
      .eq("approval_status", "approved");

    // Count Total Patients
    const { count: patientsCount } = await supabase
      .from("patient_profiles")
      .select("*", { count: "exact", head: true })
      .eq("hospital_id", hospitalId);

    // 4. Construct the final response matching your frontend interface
    const response = {
      hospital: {
        ...hospital,
        admin: hospital.admin
          ? {
              ...hospital.admin,
              email: adminEmail,
            }
          : null,
        doctors_count: doctorsCount || 0,
        assistants_count: assistantsCount || 0,
      },
      patients_count: patientsCount || 0,
    };

    return res.json(response);
  } catch (err) {
    console.error("Hospital detail route error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/superadmin/stats
 */
router.get("/stats", async (req, res) => {
  try {
    const { count: adminCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "hospital_admin")
      .eq("approval_status", "approved");

    const { count: hospitalCount } = await supabase
      .from("hospitals")
      .select("*", { count: "exact", head: true });

    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("role", "super_admin");

    const { count: pendingAdminCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "hospital_admin")
      .eq("approval_status", "pending");

    const { count: pendingHospitalCount } = await supabase
      .from("hospitals")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    return res.json({
      totalAdmins: adminCount || 0,
      totalHospitals: hospitalCount || 0,
      totalUsers: userCount || 0,
      pendingApprovals: (pendingAdminCount || 0) + (pendingHospitalCount || 0),
    });
  } catch (err) {
    console.error("GET /api/superadmin/stats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/superadmin/hospital-admins/:profileId/email
 * Body: { email: string }
 */
router.patch("/hospital-admins/:profileId/email", async (req, res) => {
  const { profileId } = req.params;
  const { email } = req.body as { email?: string };

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "INVALID_EMAIL" });
  }

  try {
    // ensure user exists + is hospital_admin
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", profileId)
      .maybeSingle();

    if (profErr) {
      console.error("Fetch profile error:", profErr);
      return res.status(500).json({ error: "Failed to validate user" });
    }

    if (!profile) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    if (profile.role !== "hospital_admin") {
      return res.status(400).json({
        error: "NOT_A_HOSPITAL_ADMIN",
        message: "Only hospital_admin email can be edited from this endpoint.",
      });
    }

    // update auth email
    const { data, error: updErr } = await supabase.auth.admin.updateUserById(
      profileId,
      {
        email,
        email_confirm: true, // keeps it usable immediately
      },
    );

    if (updErr) {
      console.error("Update auth email error:", updErr);
      return res.status(400).json({
        error: "FAILED_TO_UPDATE_EMAIL",
        message: updErr.message,
      });
    }

    return res.json({
      success: true,
      user: { id: profileId, email: data.user.email },
    });
  } catch (err) {
    console.error("PATCH /hospital-admins/:profileId/email error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/superadmin/users?confirm=DELETE_ALL_USERS
 * Deletes ALL non-super_admin users + related rows safely.
 * Leaves hospitals in place, but unlinks admin_profile_id where needed.
 */
router.delete("/users", async (req, res) => {
  const confirm =
    (req.query.confirm as string) || (req.body?.confirm as string);

  if (confirm !== "DELETE_ALL_USERS") {
    return res.status(400).json({
      error: "CONFIRMATION_REQUIRED",
      message: "Pass ?confirm=DELETE_ALL_USERS to confirm bulk deletion.",
    });
  }

  try {
    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, role")
      .neq("role", "super_admin");

    if (profError) {
      console.error("Fetch profiles error:", profError);
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    const ids = (profiles || []).map((p) => p.id);
    if (ids.length === 0) {
      return res.json({ success: true, deleted: 0 });
    }

    // 1) Unlink hospitals that point to these admins (FK safety)
    const { error: unlinkHospErr } = await supabase
      .from("hospitals")
      .update({ admin_profile_id: null })
      .in("admin_profile_id", ids);

    if (unlinkHospErr) {
      console.error("Unlink hospitals error:", unlinkHospErr);
      return res.status(500).json({ error: "Failed to unlink hospitals" });
    }

    // 2) Delete consultations first (FK safety)
    // chunk to avoid huge IN lists
    for (const chunk of chunkArray(ids, 500)) {
      await supabase
        .from("consultations")
        .delete()
        .in("doctor_profile_id", chunk);
      await supabase
        .from("consultations")
        .delete()
        .in("patient_profile_id", chunk);
    }

    // 3) Delete role tables
    for (const chunk of chunkArray(ids, 500)) {
      await supabase
        .from("hospital_admin_profiles")
        .delete()
        .in("profile_id", chunk);
      await supabase
        .from("doctor_assistant_profiles")
        .delete()
        .in("profile_id", chunk);
      await supabase.from("doctor_profiles").delete().in("profile_id", chunk);
      await supabase.from("patient_profiles").delete().in("profile_id", chunk);
    }

    // 4) Delete profiles
    for (const chunk of chunkArray(ids, 500)) {
      await supabase.from("profiles").delete().in("id", chunk);
    }

    // 5) Delete auth users (must be done per-user)
    let authDeleted = 0;
    const authErrors: Array<{ id: string; message: string }> = [];

    for (const chunk of chunkArray(ids, 50)) {
      const results = await Promise.all(
        chunk.map(async (id) => {
          const { error } = await supabase.auth.admin.deleteUser(id);
          if (error) return { id, error };
          return { id, error: null };
        }),
      );

      results.forEach((r) => {
        if (r.error) {
          authErrors.push({ id: r.id, message: r.error.message });
        } else {
          authDeleted += 1;
        }
      });
    }

    return res.json({
      success: true,
      deleted_profiles: ids.length,
      deleted_auth_users: authDeleted,
      auth_errors: authErrors, // if any
    });
  } catch (err) {
    console.error("DELETE /api/superadmin/users error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/superadmin/hospitals/:hospitalId/admin
 * Create + assign a NEW hospital admin for an existing hospital.
 *
 * Query: ?replace=true  (optional) -> allows replacing existing admin
 * Body:
 * {
 *   full_name: string,
 *   email: string,
 *   password?: string,
 *   generate_password?: boolean,
 *   phone?: string,
 *   gender?: string,
 *   dob?: string
 * }
 */
router.post("/hospitals/:hospitalId/admin", async (req, res) => {
  const { hospitalId } = req.params;
  const replace =
    req.query.replace === "true" || (req.body?.replace as boolean) === true;

  const {
    full_name,
    email,
    password,
    generate_password,
    phone,
    gender,
    dob,
  } = req.body || {};

  if (!full_name || !email) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["full_name", "email"],
    });
  }

  try {
    // 1) hospital check
    const { data: hospital, error: hospErr } = await supabase
      .from("hospitals")
      .select("id, name, admin_profile_id")
      .eq("id", hospitalId)
      .maybeSingle();

    if (hospErr) {
      console.error("Fetch hospital error:", hospErr);
      return res.status(500).json({ error: "Failed to fetch hospital" });
    }

    if (!hospital) return res.status(404).json({ error: "Hospital not found" });

    if (hospital.admin_profile_id && !replace) {
      return res.status(409).json({
        error: "HOSPITAL_ALREADY_HAS_ADMIN",
        message:
          "This hospital already has an admin. Use ?replace=true to replace.",
      });
    }

    // 2) if replacing: unlink old admin mapping for consistency
    if (hospital.admin_profile_id && replace) {
      const oldAdminId = hospital.admin_profile_id;

      await supabase
        .from("hospital_admin_profiles")
        .update({ hospital_id: null })
        .eq("profile_id", oldAdminId);

      await supabase
        .from("hospitals")
        .update({ admin_profile_id: null })
        .eq("id", hospitalId);
    }

    // 3) create auth user
    const shouldGenerate = generate_password === true || !password;
    const finalPassword = shouldGenerate ? genPassword(12) : password;

    const { data: authData, error: authErr } =
      await supabase.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
      });

    if (authErr || !authData?.user) {
      console.error("Create auth user error:", authErr);
      return res
        .status(400)
        .json({ error: authErr?.message || "Failed to create auth user" });
    }

    const adminId = authData.user.id;

    // 4) create profile
    const { error: profErr } = await supabase.from("profiles").insert({
      id: adminId,
      full_name,
      phone: phone || null,
      gender: gender || null,
      dob: dob || null,
      role: "hospital_admin",
      approval_status: "approved",
    });

    if (profErr) {
      console.error("Insert profile error:", profErr);
      await supabase.auth.admin.deleteUser(adminId);
      return res.status(500).json({ error: "Failed to create profile" });
    }

    // 5) create hospital_admin_profiles
    const { error: hapErr } = await supabase
      .from("hospital_admin_profiles")
      .insert({
        profile_id: adminId,
        hospital_id: hospitalId,
      });

    if (hapErr) {
      console.error("Insert hospital_admin_profiles error:", hapErr);
      await supabase.from("profiles").delete().eq("id", adminId);
      await supabase.auth.admin.deleteUser(adminId);
      return res
        .status(500)
        .json({ error: "Failed to create hospital admin link" });
    }

    // 6) assign as hospital admin_profile_id
    const { error: assignErr } = await supabase
      .from("hospitals")
      .update({ admin_profile_id: adminId })
      .eq("id", hospitalId);

    if (assignErr) {
      console.error("Assign hospital admin error:", assignErr);
      await supabase.from("hospital_admin_profiles").delete().eq("profile_id", adminId);
      await supabase.from("profiles").delete().eq("id", adminId);
      await supabase.auth.admin.deleteUser(adminId);
      return res.status(500).json({ error: "Failed to assign admin to hospital" });
    }

    return res.status(201).json({
      success: true,
      message: "Hospital admin created and assigned successfully",
      admin: { id: adminId, full_name, email },
      hospital: { id: hospital.id, name: hospital.name },
      credentials: {
        email,
        password: shouldGenerate ? finalPassword : null,
        generated: shouldGenerate,
      },
    });
  } catch (err) {
    console.error("POST /superadmin/hospitals/:hospitalId/admin error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
