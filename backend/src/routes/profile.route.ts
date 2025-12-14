import { Router } from "express";
import { supabase } from "../config/supabaseClient";

const router = Router();

// GET /api/profile/me
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 1) Get auth user from token
    const { data: userData, error: userError } = await supabase.auth.getUser(
      token
    );

    if (userError || !userData?.user) {
      return res
        .status(401)
        .json({ error: userError?.message || "Invalid token" });
    }

    const user = userData.user;
    const userId = user.id;

    // 2) Try to get existing profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profileError && profile) {
      // Found existing profile
      return res.json({ user, profile });
    }

    // 3) If profile not found, auto-create a basic one
    console.warn("Profile not found, auto-creating for user:", userId);

    // Infer role from user_metadata or default to 'doctor'
    const inferredRole =
      (user.user_metadata?.role as string) || "doctor";

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name:
          (user.user_metadata?.full_name as string) || (user.email as string),
        phone: user.user_metadata?.phone || null,
        gender: user.user_metadata?.gender || null,
        dob: user.user_metadata?.dob || null,
        role: inferredRole,          // must be valid in your user_role enum
        approval_status: "pending",  // adjust if you want auto-approved
      })
      .select("*")
      .single();

    if (createError || !newProfile) {
      console.error("Auto-create profile error:", createError);
      return res.status(500).json({ error: "Failed to create profile" });
    }

    return res.json({ user, profile: newProfile });
  } catch (err) {
    console.error("GET /profile/me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;