import { Router } from "express";
import { supabase } from "../config/supabaseClient";

const router = Router();

/**
 * POST /api/auth/register
 * Handles registration for:
 * - doctor
 * - hospital_admin (role="admin" in your frontend, we map it to 'hospital_admin')
 *
 * Expects body (from your RegisterPage, minus confirmPassword):
 * {
 *   fullName, email, password, phone, gender, dob, role,
 *   specialization, hospitalId, licenseNumber, cnic,
 *   hospitalName, hospitalAddress, hospitalType
 * }
 */
router.post("/register", async (req, res) => {
  const {
    email,
    password,
    fullName,
    phone,
    gender,
    dob,
    role: rawRole, 
    specialization,
    hospitalId,
    licenseNumber,
    cnic,
    hospitalName,
    hospitalAddress,
    hospitalType,
  } = req.body as {
    email?: string;
    password?: string;
    fullName?: string;
    phone?: string;
    gender?: string;
    dob?: string;
    role?: "doctor" | "admin";
    specialization?: string;
    hospitalId?: string;
    licenseNumber?: string;
    cnic?: string;
    hospitalName?: string;
    hospitalAddress?: string;
    hospitalType?: string;
  };

  // Map frontend 'admin' to DB role 'hospital_admin'
  const role = rawRole === "admin" ? "hospital_admin" : rawRole;

  // Basic validation
  if (!email || !password || !fullName || !phone || !gender || !dob || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (role !== "doctor" && role !== "hospital_admin") {
    return res
      .status(400)
      .json({ error: "Invalid role for self-registration" });
  }

  if (role === "doctor") {
    if (!specialization || !hospitalId || !licenseNumber || !cnic) {
      return res.status(400).json({
        error:
          "Missing doctor fields: specialization, hospitalId, licenseNumber, cnic",
      });
    }

    // Ensure hospital exists and is approved
    const { data: hosp, error: hospError } = await supabase
      .from("hospitals")
      .select("id, status")
      .eq("id", hospitalId)
      .single();

    if (hospError || !hosp) {
      return res.status(400).json({ error: "Selected hospital not found" });
    }
    if (hosp.status !== "approved") {
      return res
        .status(400)
        .json({ error: "Selected hospital is not approved yet" });
    }
  }

  if (role === "hospital_admin") {
    if (!hospitalName || !hospitalAddress || !hospitalType) {
      return res.status(400).json({
        error:
          "Missing hospital admin fields: hospitalName, hospitalAddress, hospitalType",
      });
    }
  }

  try {
    // 1) Create auth user
    const { data: userData, error: userError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
          gender,
          dob,
          role,
        },
      });

    if (userError || !userData?.user) {
      console.error("Supabase createUser error:", userError);
      return res
        .status(400)
        .json({ error: userError?.message || "Failed to create user" });
    }

    const userId = userData.user.id;

    // 2) Insert into profiles (common table)
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      full_name: fullName,
      phone,
      gender,
      dob,
      role,
      approval_status: "pending", // doctors & admins must be approved
    });

    if (profileError) {
      console.error("Insert profiles error:", profileError);
      return res
        .status(500)
        .json({ error: "User created but failed to create profile" });
    }

    // 3) Role-specific inserts
    if (role === "doctor") {
      const { error: doctorError } = await supabase
        .from("doctor_profiles")
        .insert({
          profile_id: userId,
          specialization,
          hospital_id: hospitalId,
          license_number: licenseNumber,
          cnic,
          approval_status: "pending", // hospital admin must approve
        });

      if (doctorError) {
        console.error("Insert doctor_profiles error:", doctorError);
        return res.status(500).json({
          error:
            "User created but failed to create doctor profile. Contact support.",
        });
      }
    }

    if (role === "hospital_admin") {
      // 3a) Create hospital in pending state
      const { data: hospitalData, error: hospitalError } = await supabase
        .from("hospitals")
        .insert({
          name: hospitalName,
          address: hospitalAddress,
          hospital_type: hospitalType,
          admin_profile_id: userId,
          status: "pending", // super admin must approve hospital admin + hospital
        })
        .select("id")
        .single();

      if (hospitalError || !hospitalData) {
        console.error("Insert hospitals error:", hospitalError);
        return res.status(500).json({
          error: "User created but failed to create hospital. Contact support.",
        });
      }

      const hospitalIdNew = hospitalData.id;

      // 3b) Link in hospital_admin_profiles
      const { error: adminProfileError } = await supabase
        .from("hospital_admin_profiles")
        .insert({
          profile_id: userId,
          hospital_id: hospitalIdNew,
        });

      if (adminProfileError) {
        console.error(
          "Insert hospital_admin_profiles error:",
          adminProfileError
        );
        return res.status(500).json({
          error:
            "User created but failed to create hospital admin profile. Contact support.",
        });
      }
    }

    return res.status(201).json({ user: userData.user });
  } catch (err: any) {
    console.error("Register handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/login
 * (unchanged, just adds basic validation)
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login error:", error);
      return res.status(401).json({ error: error.message });
    }

    return res.json({ user: data.user, session: data.session });
  } catch (err: any) {
    console.error("Login handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: error?.message || "Invalid token" });
    }

    return res.json({ user: data.user });
  } catch (err) {
    console.error("GET /me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
