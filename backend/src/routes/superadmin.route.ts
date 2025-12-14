import { Router } from "express";
import { supabase } from "../config/supabaseClient";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

// All routes here require super_admin
router.use(authMiddleware, requireRole("super_admin"));

/**
 * GET /api/superadmin/pending-hospital-admins
 * Returns pending hospital admins + their hospitals (by admin_profile_id)
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

    // 2) Get hospitals created by these admins (any status)
    const { data: hospitals, error: hospitalsError } = await supabase
      .from("hospitals")
      .select("id, name, address, hospital_type, status, admin_profile_id")
      .in("admin_profile_id", profileIds);

    if (hospitalsError) {
      console.error("Fetch hospitals for admins error:", hospitalsError);
      return res.status(500).json({ error: "Failed to fetch hospitals" });
    }

    // 3) Merge profiles + hospitals
    const admins = profiles.map((p) => {
      const hospital =
        hospitals?.find((h) => h.admin_profile_id === p.id) || null;
      return {
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        gender: p.gender,
        dob: p.dob,
        approval_status: p.approval_status, // admin status
        hospital, // single hospital object or null
      };
    });

    return res.json({ admins });
  } catch (err) {
    console.error("pending-hospital-admins handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/superadmin/hospital-admins/:profileId/approve
 * STEP 1: Approve the HOSPITAL ADMIN ONLY.
 * Hospital(s) will be approved later in a separate flow.
 */
router.post("/hospital-admins/:profileId/approve", async (req, res) => {
  const { profileId } = req.params;

  try {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ approval_status: "approved" })
      .eq("id", profileId);

    if (profileError) {
      console.error("Approve profile error:", profileError);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    // NOTE: we do NOT change hospitals.status here
    // Hospitals remain 'pending' and will be handled in a separate "pending hospitals" list.
    return res.json({ success: true });
  } catch (err) {
    console.error("Approve hospital-admin handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/superadmin/hospital-admins/:profileId/reject
 * Rejects hospital admin AND their hospital submissions.
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
      return res.status(500).json({
        error: "Profile rejected but hospital update failed",
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Reject hospital-admin handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/superadmin/pending-hospitals
 * Returns hospitals with status='pending' + basic admin info
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

    const enriched = hospitals.map((h) => {
      const admin =
        admins?.find((a) => a.id === h.admin_profile_id) || null;
      return {
        ...h,
        admin,
      };
    });

    return res.json({ hospitals: enriched });
  } catch (err) {
    console.error("pending-hospitals handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/superadmin/hospitals/:hospitalId/approve
 * Approve a hospital (status field only)
 */
router.post("/hospitals/:hospitalId/approve", async (req, res) => {
  const { hospitalId } = req.params;

  try {
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
 * Reject a hospital (status field only)
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
 * Returns all users (auth + profiles merged)
 */
router.get("/users", async (_req, res) => {
  try {
    // 1) List users from auth
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

    // 2) Get profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, approval_status")
      .in("id", ids);

    if (profilesError) {
      console.error("Fetch profiles for users error:", profilesError);
      return res.status(500).json({ error: "Failed to fetch profiles" });
    }

    // 3) Merge auth + profile
    const users = authUsers.map((u) => {
      const profile = profiles?.find((p) => p.id === u.id) || null;
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        full_name:
          profile?.full_name ||
          (u.user_metadata?.full_name as string | undefined) ||
          null,
        phone:
          profile?.phone ||
          (u.user_metadata?.phone as string | undefined) ||
          null,
        role:
          (profile?.role as string | undefined) ||
          (u.user_metadata?.role as string | undefined) ||
          null,
        approval_status:
          (profile?.approval_status as string | undefined) || null,
      };
    });

    return res.json({ users });
  } catch (err) {
    console.error("GET /superadmin/users error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/superadmin/users/:userId
 * Update user's profile role and/or approval_status
 */
router.patch("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const { role, approval_status } = req.body as {
    role?: string;
    approval_status?: string;
  };

  if (!role && !approval_status) {
    return res
      .status(400)
      .json({ error: "Nothing to update (role or approval_status required)" });
  }

  try {
    const update: Record<string, any> = {};
    if (role) update.role = role;
    if (approval_status) update.approval_status = approval_status;

    const { error } = await supabase
      .from("profiles")
      .update(update)
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
 * Delete user completely (auth + cascaded profile/hospitals via FK)
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
 * GET /api/superadmin/users
 * Returns all users (auth + profiles merged),
 * filtered to only show approved non-super_admin accounts.
 */
router.get("/users", async (_req, res) => {
  try {
    // 1) List users from auth
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

    // 2) Get profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, approval_status")
      .in("id", ids);

    if (profilesError) {
      console.error("Fetch profiles for users error:", profilesError);
      return res.status(500).json({ error: "Failed to fetch profiles" });
    }

    // 3) Merge auth + profile and filter:
    //    - only approved users
    //    - exclude super_admin
    const users = authUsers
      .map((u) => {
        const profile = profiles?.find((p) => p.id === u.id) || null;
        const role =
          (profile?.role as string | undefined) ||
          (u.user_metadata?.role as string | undefined) ||
          null;
        const approvalStatus =
          (profile?.approval_status as string | undefined) || null;

        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          full_name:
            profile?.full_name ||
            (u.user_metadata?.full_name as string | undefined) ||
            null,
          phone:
            profile?.phone ||
            (u.user_metadata?.phone as string | undefined) ||
            null,
          role,
          approval_status: approvalStatus,
        };
      })
      .filter(
        (u) => u.role !== "super_admin" && u.approval_status === "approved"
      );

    return res.json({ users });
  } catch (err) {
    console.error("GET /superadmin/users error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/superadmin/users/:userId
 * Update user's approval_status (for marking rejected, etc.)
 */
router.patch("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const { approval_status } = req.body as {
    approval_status?: string;
  };

  if (!approval_status) {
    return res
      .status(400)
      .json({ error: "approval_status is required for update" });
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
 * Delete user completely (auth + cascaded rows via FK).
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
 * Returns ALL hospitals (any status) + basic admin info.
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
      const admin =
        admins?.find((a) => a.id === h.admin_profile_id) || null;
      return {
        ...h,
        admin,
      };
    });

    return res.json({ hospitals: enriched });
  } catch (err) {
    console.error("GET /superadmin/hospitals error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;