import { Router, Request, Response } from "express";
import { supabase } from "../config/supabaseClient";
import multer from "multer";

const router = Router();

// Multer for memory file upload (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
});

/**
 * Middleware: authenticate patient
 */
async function patientAuth(req: Request, res: Response, next: Function) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Missing token" });
    }

    const token = authHeader.split(" ")[1];
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const userId = userData.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (profileError || !profile || profile.role !== "patient") {
      return res
        .status(403)
        .json({ success: false, message: "Patients only" });
    }

    (req as any).patientId = userId;
    (req as any).userEmail = userData.user.email;
    next();
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

/**
 * GET /api/patient/profile
 * Returns full patient profile + stats
 */
router.get("/profile", patientAuth, async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).patientId;
    const email     = (req as any).userEmail;

    // Profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, gender, dob, avatar_url, created_at")
      .eq("id", patientId)
      .single();

    if (profileError || !profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    // Patient profile (CNIC, etc.)
    const { data: patientProfile } = await supabase
      .from("patient_profiles")
      .select("cnic, medical_history")
      .eq("profile_id", patientId)
      .single();

    // Stats — total appointments
    const { count: totalAppointments } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("patient_profile_id", patientId);

    // Stats — completed appointments
    const { count: completedAppointments } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("patient_profile_id", patientId)
      .eq("status", "completed");

    // Stats — total prescriptions
    const { count: totalPrescriptions } = await supabase
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .eq("patient_profile_id", patientId)
      .eq("prescription_sent", true);

    return res.json({
      success: true,
      data: {
        id:              profile.id,
        full_name:       profile.full_name,
        email,
        phone:           profile.phone,
        gender:          profile.gender,
        dob:             profile.dob,
        avatar_url:      profile.avatar_url,
        cnic:            patientProfile?.cnic || null,
        medical_history: patientProfile?.medical_history || null,
        created_at:      profile.created_at,
        stats: {
          total_appointments:     totalAppointments || 0,
          completed_appointments: completedAppointments || 0,
          total_prescriptions:    totalPrescriptions || 0,
        },
      },
    });
  } catch (err) {
    console.error("GET /api/patient/profile error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

/**
 * PATCH /api/patient/profile
 * Updates: full_name, phone, gender, dob, medical_history
 */
router.patch("/profile", patientAuth, async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).patientId;
    const { full_name, phone, gender, dob, medical_history } = req.body;

    const profileUpdates: Record<string, any> = {};
    if (full_name !== undefined) profileUpdates.full_name = full_name;
    if (phone     !== undefined) profileUpdates.phone     = phone;
    if (gender    !== undefined) profileUpdates.gender    = gender;
    if (dob       !== undefined) profileUpdates.dob       = dob;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", patientId);

      if (profileError) {
        console.error("Profile update error:", profileError);
        return res
          .status(500)
          .json({ success: false, message: "Failed to update profile" });
      }
    }

    if (medical_history !== undefined) {
      const { error: ppError } = await supabase
        .from("patient_profiles")
        .update({ medical_history })
        .eq("profile_id", patientId);

      if (ppError) {
        console.error("Patient profile update error:", ppError);
        return res.status(500).json({
          success: false,
          message: "Failed to update medical history",
        });
      }
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("PATCH /api/patient/profile error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

/**
 * POST /api/patient/profile/avatar
 * Multipart upload — uploads to Supabase Storage 'avatars' bucket
 */
router.post(
  "/profile/avatar",
  patientAuth,
  upload.single("avatar"),
  async (req: Request, res: Response) => {
    try {
      const patientId = (req as any).patientId;
      const file      = (req as any).file as Express.Multer.File | undefined;

      if (!file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      // Validate mime type
      if (!file.mimetype.startsWith("image/")) {
        return res
          .status(400)
          .json({ success: false, message: "Only image files allowed" });
      }

      // Generate unique file path
      const ext      = file.originalname.split(".").pop() || "jpg";
      const filePath = `${patientId}/avatar-${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert:      true,
        });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return res
          .status(500)
          .json({ success: false, message: "Failed to upload avatar" });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", patientId);

      if (updateError) {
        console.error("Profile avatar update error:", updateError);
        return res.status(500).json({
          success: false,
          message: "Avatar uploaded but profile update failed",
        });
      }

      return res.json({
        success:    true,
        message:    "Avatar uploaded successfully",
        avatar_url: avatarUrl,
      });
    } catch (err) {
      console.error("POST /api/patient/profile/avatar error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

/**
 * POST /api/patient/profile/change-password
 * Body: { current_password, new_password }
 */
router.post(
  "/profile/change-password",
  patientAuth,
  async (req: Request, res: Response) => {
    try {
      const patientId = (req as any).patientId;
      const email     = (req as any).userEmail;
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: "current_password and new_password required",
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters",
        });
      }

      // Verify current password by attempting sign-in
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password: current_password,
        });

      if (signInError) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update password via admin API
      const { error: updateError } =
        await supabase.auth.admin.updateUserById(patientId, {
          password: new_password,
        });

      if (updateError) {
        console.error("Password update error:", updateError);
        return res
          .status(500)
          .json({ success: false, message: "Failed to update password" });
      }

      return res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (err) {
      console.error("POST change-password error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

export default router;