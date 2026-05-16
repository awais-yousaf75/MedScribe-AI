// backend/src/routes/userProfile.route.ts
import { Router, Request, Response } from "express";
import multer from "multer";
import { supabase } from "../config/supabaseClient";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// All routes require ANY authenticated user (works for all roles)
router.use(authMiddleware);

// 5MB max, memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * POST /api/profile/avatar
 * Multipart upload — works for any logged-in role
 * Uploads to Supabase Storage 'avatars' bucket
 */
router.post(
  "/avatar",
  upload.single("avatar"),
  async (req: Request, res: Response) => {
    try {
      const profile = (req as any).profile;
      if (!profile) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = profile.id as string;
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "Only image files allowed" });
      }

      // Use stable file name (overwrites old avatar)
      const ext = file.originalname.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload avatar" });
      }

      // Public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Save URL on profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (updateError) {
        console.error("Profile avatar update error:", updateError);
        return res.status(500).json({
          error: "Avatar uploaded but profile update failed",
        });
      }

      return res.json({
        success: true,
        message: "Avatar uploaded successfully",
        avatar_url: avatarUrl,
      });
    } catch (err) {
      console.error("POST /api/profile/avatar error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/profile/avatar
 * Removes avatar URL from profile (file stays in bucket for safety)
 */
router.delete("/avatar", async (req: Request, res: Response) => {
  try {
    const profile = (req as any).profile;
    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    const userId = profile.id as string;

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);

    if (error) {
      console.error("Remove avatar error:", error);
      return res.status(500).json({ error: "Failed to remove avatar" });
    }

    return res.json({ success: true, message: "Avatar removed" });
  } catch (err) {
    console.error("DELETE /api/profile/avatar error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/profile/update
 * Updates basic profile fields for ANY authenticated user
 * Body: { full_name?, phone?, gender?, dob? }
 */
router.patch("/update", async (req: Request, res: Response) => {
  try {
    const profile = (req as any).profile;
    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    const userId = profile.id as string;
    const { full_name, phone, gender, dob } = req.body;

    const updates: Record<string, any> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone     !== undefined) updates.phone     = phone || null;
    if (gender    !== undefined) updates.gender    = gender || null;
    if (dob       !== undefined) updates.dob       = dob || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    return res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error("PATCH /api/profile/update error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/profile/change-password
 * Changes own password — works for any authenticated user
 */
router.post("/change-password", async (req: Request, res: Response) => {
  try {
    const profile = (req as any).profile;
    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    const userId = profile.id as string;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error("Change password error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, message: "Password changed" });
  } catch (err) {
    console.error("POST /api/profile/change-password error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;