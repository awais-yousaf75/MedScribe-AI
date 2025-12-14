import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabaseClient";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      profile?: any;
    }
  }
}

// Attach req.user (auth.users) and req.profile (profiles)
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];

    const { data: userData, error: userError } = await supabase.auth.getUser(
      token
    );

    if (userError || !userData?.user) {
      return res.status(401).json({ error: userError?.message || "Invalid token" });
    }

    const userId = userData.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: "Profile not found" });
    }

    req.user = userData.user;
    req.profile = profile;

    next();
  } catch (err) {
    console.error("authMiddleware error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const requireRole =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

  export const requireApprovedRole =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (req.profile.approval_status !== "approved") {
      return res
        .status(403)
        .json({ error: "Account is pending approval. Please wait." });
    }

    next();
  };