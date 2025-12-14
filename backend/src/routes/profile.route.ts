// backend/src/routes/profile.route.ts
import { Router } from "express";
import { supabase } from "../config/supabaseClient";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * GET /api/profile/me
 * - Requires a valid Bearer token (handled by authMiddleware)
 * - Returns { user, profile }
 * - If profile row does not exist, auto-creates a basic one.
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    let profile = (req as any).profile;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // If middleware already loaded a profile, just return it
    if (profile) {
      return res.json({ user, profile });
    }

    // ---- Auto-create profile if missing ----
    console.warn("Profile not found, auto-creating for user:", user.id);

    // Allowed roles in your enum
    const allowedRoles = [
      "super_admin",
      "hospital_admin",
      "doctor",
      "doctor_assistant",
      "patient",
    ] as const;

    type AllowedRole = (typeof allowedRoles)[number];

    const metaRole = (user.user_metadata?.role as string) || "";
    const inferredRole: AllowedRole = (allowedRoles as readonly string[]).includes(
      metaRole
    )
      ? (metaRole as AllowedRole)
      : "patient"; // safe default

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name:
          (user.user_metadata?.full_name as string) ||
          (user.email as string),
        phone: user.user_metadata?.phone || null,
        gender: user.user_metadata?.gender || null,
        dob: user.user_metadata?.dob || null,
        role: inferredRole,
        approval_status: "pending", // keep as in your previous version
      })
      .select("*")
      .single();

    if (createError || !newProfile) {
      console.error("Auto-create profile error:", createError);
      return res.status(500).json({ error: "Failed to create profile" });
    }

    profile = newProfile;
    return res.json({ user, profile });
  } catch (err) {
    console.error("GET /api/profile/me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;