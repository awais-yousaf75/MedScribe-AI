import { Router } from "express";
import { supabase } from "../config/supabaseClient";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

// All routes here require super_admin
router.use(authMiddleware, requireRole("super_admin"));

/**
 * GET /api/superadmin/pending-hospital-admins
 * Returns pending hospital admins + their hospitals + validation info
 */
router.get("/pending-hospital-admins", async (_req, res) => {
  try {
    // 1) Get pending hospital_admin profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, gender, dob, approval_status")
      .eq("role", "hospital_admin")
      .eq("approval_status", "pending");

    if (profilesError) {
      console.error("Fetch pending hospital admins error:", profilesError);
      return res.status(500).json({ error: "Failed to fetch pending admins" });
    }

    if (!profiles || profiles.length === 0) {
      return res.json({ admins: [] });
    }

    const profileIds = profiles.map((p) => p.id);

    // 2) Get hospitals created by these admins
    const { data: hospitals, error: hospitalsError } = await supabase
      .from("hospitals")
      .select("id, name, address, hospital_type, status, admin_profile_id")
      .in("admin_profile_id", profileIds);

    if (hospitalsError) {
      console.error("Fetch hospitals for admins error:", hospitalsError);
      return res.status(500).json({ error: "Failed to fetch hospitals" });
    }

    // 3) Check for duplicate hospital names
    const hospitalNames = hospitals?.map((h) => h.name.toLowerCase()) || [];
    
    const { data: allHospitals } = await supabase
      .from("hospitals")
      .select("id, name, status")
      .eq("status", "approved");

    const approvedHospitalNames = new Set(
      allHospitals?.map((h) => h.name.toLowerCase()) || []
    );

    // 4) Merge profiles + hospitals + validation flags
    const admins = profiles.map((p) => {
      const hospital = hospitals?.find((h) => h.admin_profile_id === p.id) || null;
      
      let isDuplicateHospital = false;
      let duplicateInfo = null;

      if (hospital) {
        const normalizedName = hospital.name.toLowerCase();
        // Check if another approved hospital has the same name
        const duplicateApproved = allHospitals?.find(
          (h) => h.name.toLowerCase() === normalizedName && h.id !== hospital.id
        );
        
        if (duplicateApproved) {
          isDuplicateHospital = true;
          duplicateInfo = {
            existingHospitalId: duplicateApproved.id,
            existingHospitalName: duplicateApproved.name,
            existingStatus: duplicateApproved.status,
          };
        }
      }

      return {
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        gender: p.gender,
        dob: p.dob,
        approval_status: p.approval_status,
        hospital,
        isDuplicateHospital,
        duplicateInfo,
      };
    });

    return res.json({ admins });
  } catch (err) {
    console.error("pending-hospital-admins handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/superadmin/pending-hospitals
 * Returns hospitals with status='pending' + admin info + duplicate detection
 */
router.get("/pending-hospitals", async (_req, res) => {
  try {
    const { data: hospitals, error: hospitalsError } = await supabase
      .from("hospitals")
      .select("id, name, address, hospital_type, status, admin_profile_id")
      .eq("status", "pending");

    if (hospitalsError) {
      console.error("Fetch pending hospitals error:", hospitalsError);
      return res.status(500).json({ error: "Failed to fetch hospitals" });
    }

    if (!hospitals || hospitals.length === 0) {
      return res.json({ hospitals: [] });
    }

    // Get approved hospitals to check for duplicates
    const { data: approvedHospitals } = await supabase
      .from("hospitals")
      .select("id, name")
      .eq("status", "approved");

    const approvedNamesMap = new Map(
      approvedHospitals?.map((h) => [h.name.toLowerCase(), h]) || []
    );

    const adminIds = hospitals
      .map((h) => h.admin_profile_id)
      .filter((id): id is string => !!id);

    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, approval_status, role")
      .in("id", adminIds)
      .eq("role", "hospital_admin");

    if (adminsError) {
      console.error("Fetch admins for hospitals error:", adminsError);
      return res.status(500).json({ error: "Failed to fetch admins" });
    }

    // Check for duplicate names among pending hospitals
    const pendingNamesCount = new Map<string, number>();
    hospitals.forEach((h) => {
      const key = h.name.toLowerCase();
      pendingNamesCount.set(key, (pendingNamesCount.get(key) || 0) + 1);
    });

    const enriched = hospitals.map((h) => {
      const admin = admins?.find((a) => a.id === h.admin_profile_id) || null;
      const normalizedName = h.name.toLowerCase();
      
      // Check if duplicate of approved hospital
      const approvedDuplicate = approvedNamesMap.get(normalizedName);
      
      // Check if duplicate among pending (more than one with same name)
      const pendingDuplicateCount = pendingNamesCount.get(normalizedName) || 0;
      const hasPendingDuplicate = pendingDuplicateCount > 1;

      return {
        ...h,
        admin,
        isDuplicate: !!approvedDuplicate || hasPendingDuplicate,
        duplicateType: approvedDuplicate 
          ? "approved" 
          : hasPendingDuplicate 
            ? "pending" 
            : null,
        duplicateInfo: approvedDuplicate
          ? {
              message: `A hospital named "${approvedDuplicate.name}" is already approved in the system.`,
              existingHospitalId: approvedDuplicate.id,
            }
          : hasPendingDuplicate
            ? {
                message: `Multiple registration requests for "${h.name}" are pending. Only one should be approved.`,
              }
            : null,
      };
    });

    return res.json({ hospitals: enriched });
  } catch (err) {
    console.error("pending-hospitals handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/superadmin/hospital-admins/:profileId/approve
 * Approve hospital admin only (hospital approved separately)
 */
router.post("/hospital-admins/:profileId/approve", async (req, res) => {
  const { profileId } = req.params;

  try {
    // Check if this admin already manages an approved hospital
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
      console.error("Reject hospital error:", hospitalError);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Reject hospital-admin handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/superadmin/hospitals/:hospitalId/approve
 * Approve a hospital with duplicate check
 */
router.post("/hospitals/:hospitalId/approve", async (req, res) => {
  const { hospitalId } = req.params;

  try {
    // Get hospital details
    const { data: hospital, error: getError } = await supabase
      .from("hospitals")
      .select("id, name, admin_profile_id")
      .eq("id", hospitalId)
      .single();

    if (getError || !hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    // Check for duplicate name among approved hospitals
    const { data: duplicate, error: dupError } = await supabase
      .from("hospitals")
      .select("id, name")
      .ilike("name", hospital.name)
      .eq("status", "approved")
      .neq("id", hospitalId)
      .maybeSingle();

    if (dupError) {
      console.error("Duplicate check error:", dupError);
      return res.status(500).json({ error: "Failed to validate hospital" });
    }

    if (duplicate) {
      return res.status(409).json({
        error: "DUPLICATE_HOSPITAL_NAME",
        message: `Cannot approve: A hospital named "${duplicate.name}" is already approved in the system.`,
        existingHospitalId: duplicate.id,
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
router.get("/users", async (_req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      console.error("List users error:", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }

    const authUsers = data.users;
    const ids = authUsers.map((u) => u.id);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, approval_status")
      .in("id", ids);

    if (profilesError) {
      console.error("Fetch profiles for users error:", profilesError);
      return res.status(500).json({ error: "Failed to fetch profiles" });
    }

    const users = authUsers
      .map((u) => {
        const profile = profiles?.find((p) => p.id === u.id) || null;
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          full_name: profile?.full_name || u.user_metadata?.full_name || null,
          phone: profile?.phone || u.user_metadata?.phone || null,
          role: profile?.role || u.user_metadata?.role || null,
          approval_status: profile?.approval_status || null,
        };
      })
      .filter((u) => u.role !== "super_admin" && u.approval_status === "approved");

    return res.json({ users });
  } catch (err) {
    console.error("GET /superadmin/users error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/superadmin/users/:userId
 */
router.patch("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const { approval_status } = req.body;

  if (!approval_status) {
    return res.status(400).json({ error: "approval_status is required" });
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ approval_status })
      .eq("id", userId);

    if (error) {
      console.error("Update user profile error:", error);
      return res.status(500).json({ error: "Failed to update user profile" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("PATCH /superadmin/users/:userId error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/superadmin/users/:userId
 */
router.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
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
router.get("/hospitals", async (_req, res) => {
  try {
    const { data: hospitals, error: hospitalsError } = await supabase
      .from("hospitals")
      .select("id, name, address, hospital_type, status, admin_profile_id");

    if (hospitalsError) {
      console.error("Fetch all hospitals error:", hospitalsError);
      return res.status(500).json({ error: "Failed to fetch hospitals" });
    }

    if (!hospitals || hospitals.length === 0) {
      return res.json({ hospitals: [] });
    }

    const adminIds = hospitals
      .map((h) => h.admin_profile_id)
      .filter((id): id is string => !!id);

    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, approval_status, role")
      .in("id", adminIds);

    if (adminsError) {
      console.error("Fetch admins for hospitals error:", adminsError);
      return res.status(500).json({ error: "Failed to fetch admins" });
    }

    const enriched = hospitals.map((h) => {
      const admin = admins?.find((a) => a.id === h.admin_profile_id) || null;
      return { ...h, admin };
    });

    return res.json({ hospitals: enriched });
  } catch (err) {
    console.error("GET /superadmin/hospitals error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;