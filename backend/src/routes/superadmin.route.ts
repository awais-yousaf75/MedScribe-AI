import { Router } from "express";
import { supabase } from "../config/supabaseClient";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

router.use(authMiddleware, requireRole("super_admin"));

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
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
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
        "id, name, address, hospital_type, status, admin_profile_id, registration_number"
      )
      .in("admin_profile_id", adminIds);

    if (hospError) {
      console.error("Fetch hospitals for admins error:", hospError);
    }

    const admins = profiles.map((p) => {
      const authUser = authUsersMap.get(p.id);
      const hospital = (hospitals || []).find(
        (h) => h.admin_profile_id === p.id
      ) || null;

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
        "id, name, address, hospital_type, status, admin_profile_id, created_at, registration_number, license_number, contact_email, contact_phone"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (hospError) {
      console.error("Fetch pending hospitals error:", hospError);
      return res.status(500).json({ error: "Failed to fetch pending hospitals" });
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
      ]) || []
    );

    const approvedRegMap = new Map(
      approvedHospitals?.map((h) => [h.registration_number, h]) || []
    );

    const pendingNamesCount = new Map<string, number>();
    hospitals.forEach((h) => {
      const key = h.name.toLowerCase().trim().replace(/\s+/g, " ");
      pendingNamesCount.set(key, (pendingNamesCount.get(key) || 0) + 1);
    });

    const result = hospitals.map((h) => {
      const admin = adminProfiles.find((p) => p.id === h.admin_profile_id) || null;
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
      .select(
        "id, name, admin_profile_id, registration_number, status"
      )
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

    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

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
 */
router.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await supabase
      .from("hospital_admin_profiles")
      .delete()
      .eq("profile_id", userId);

    await supabase
      .from("doctor_assistant_profiles")
      .delete()
      .eq("profile_id", userId);

    await supabase
      .from("doctor_profiles")
      .delete()
      .eq("profile_id", userId);

    await supabase
      .from("patient_profiles")
      .delete()
      .eq("profile_id", userId);

    await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ error: "Failed to delete user" });
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
        "id, name, address, hospital_type, status, admin_profile_id, created_at, registration_number, license_number, contact_email, contact_phone"
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
      const admin = adminProfiles.find((p) => p.id === h.admin_profile_id) || null;

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
      .select(`
        *,
        admin:profiles!hospitals_admin_profile_id_fkey (
          id,
          full_name,
          phone,
          approval_status,
          role
        )
      `)
      .eq("id", hospitalId)
      .single();

    if (hospError || !hospital) {
      console.error("Fetch hospital detail error:", hospError);
      return res.status(404).json({ error: "Hospital not found" });
    }

    // 2. Fetch the Admin's Email from Supabase Auth (since it's not in the profiles table)
    let adminEmail = null;
    if (hospital.admin_profile_id) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
        hospital.admin_profile_id
      );
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
        admin: hospital.admin ? {
          ...hospital.admin,
          email: adminEmail
        } : null,
        doctors_count: doctorsCount || 0,
        assistants_count: assistantsCount || 0
      },
      patients_count: patientsCount || 0
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

export default router;