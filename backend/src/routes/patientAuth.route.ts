import { Router, Request, Response } from "express";
import { supabase } from "../config/supabaseClient";

const router = Router();

// ─────────────────────────────────────────────
// POST /patient-auth/signup
// ─────────────────────────────────────────────
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, phone, gender, dob, cnic } = req.body;

    // ── Validate required fields ──
    if (!email || !password || !full_name || !cnic) {
      return res.status(400).json({
        success: false,
        message: "email, password, full_name and cnic are required",
      });
    }

    // ── Create auth user in Supabase ──
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(400).json({
        success: false,
        message: authError?.message || "Failed to create user",
      });
    }

    const userId = authData.user.id;

    // ── Insert into profiles table ──
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      full_name,
      phone: phone || null,
      gender: gender || null,
      dob: dob || null,
      role: "patient",
      approval_status: "approved", // patients are auto approved
    });

    if (profileError) {
      // Cleanup: delete auth user if profile insert fails
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({
        success: false,
        message: "Failed to create profile: " + profileError.message,
      });
    }

    // ── Insert into patient_profiles table ──
    const { error: patientProfileError } = await supabase
      .from("patient_profiles")
      .insert({
        profile_id: userId,
        cnic,
        hospital_id: null,
        created_by: userId,
        medical_history: null,
      });

    if (patientProfileError) {
      // Cleanup: delete profile and auth user if patient profile insert fails
      await supabase.from("profiles").delete().eq("id", userId);
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({
        success: false,
        message:
          "Failed to create patient profile: " + patientProfileError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Patient registered successfully. Please check your email to verify your account.",
      data: {
        id: userId,
        email,
        full_name,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

// ─────────────────────────────────────────────
// POST /patient-auth/login
// ─────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // ── Validate required fields ──
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    // ── Sign in with Supabase Auth ──
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      return res.status(401).json({
        success: false,
        message: authError?.message || "Invalid credentials",
      });
    }

    const userId = authData.user.id;

    // ── Fetch profile and verify role is patient ──
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // ── Block non-patient roles ──
    if (profile.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. This app is for patients only.",
      });
    }

    // ── Fetch patient profile ──
    const { data: patientProfile, error: patientProfileError } = await supabase
      .from("patient_profiles")
      .select("*")
      .eq("profile_id", userId)
      .single();

    if (patientProfileError || !patientProfile) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        user: {
          id: userId,
          email: authData.user.email,
          full_name: profile.full_name,
          phone: profile.phone,
          gender: profile.gender,
          dob: profile.dob,
          role: profile.role,
          cnic: patientProfile.cnic,
          medical_history: patientProfile.medical_history,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

export default router;