import { Router } from "express";
import { supabase } from "../config/supabaseClient";

const router = Router();

const normalizeHospitalName = (name: string) =>
  name.trim().replace(/\s+/g, " "); // keep case; DB check uses ilike

/**
 * POST /api/auth/register
 * Handles registration for:
 * - doctor
 * - hospital_admin (role="admin" in your frontend, mapped to 'hospital_admin')
 */
router.post("/register", async (req, res) => {
  const {
    email,
    password,
    fullName,
    phone,
    gender,
    dob,
    role: rawRole, // 'doctor' | 'admin' from frontend
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

  // Doctor validations
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

  // Hospital admin validations
  const cleanedHospitalName =
    role === "hospital_admin" && hospitalName
      ? normalizeHospitalName(hospitalName)
      : "";

  if (role === "hospital_admin") {
    if (!hospitalName || !hospitalAddress || !hospitalType) {
      return res.status(400).json({
        error:
          "Missing hospital admin fields: hospitalName, hospitalAddress, hospitalType",
      });
    }

    // HARD RULE: "if a hospital is previously registered then it cant be registered again"
    // → block if hospital exists with same name (any status)
    const { data: existingHospital, error: existsErr } = await supabase
      .from("hospitals")
      .select("id, name, status, admin_profile_id")
      .ilike("name", cleanedHospitalName) // case-insensitive exact match
      .maybeSingle();

    if (existsErr) {
      console.error("Hospital existence check error:", existsErr);
      return res
        .status(500)
        .json({ error: "Failed to validate hospital name" });
    }

    if (existingHospital) {
      return res.status(409).json({
        error: `Hospital "${existingHospital.name}" is already registered (${existingHospital.status}).`,
        code: "HOSPITAL_NAME_TAKEN",
        status: existingHospital.status,
        existingHospital: {
          id: existingHospital.id,
          name: existingHospital.name,
          status: existingHospital.status,
        },
      });
    }
  }

  let createdUserId: string | null = null;
  let createdHospitalId: string | null = null;

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
      // keep same response style but add code for UI
      return res.status(400).json({
        error: userError?.message || "Failed to create user",
        code: userError?.message?.toLowerCase().includes("already registered")
          ? "EMAIL_ALREADY_EXISTS"
          : "AUTH_CREATE_FAILED",
      });
    }

    createdUserId = userData.user.id;

    // 2) Insert into profiles (common table)
    const { error: profileError } = await supabase.from("profiles").insert({
      id: createdUserId,
      full_name: fullName,
      phone,
      gender,
      dob,
      role,
      approval_status: "pending",
    });

    if (profileError) {
      console.error("Insert profiles error:", profileError);

      // rollback auth user
      await supabase.auth.admin.deleteUser(createdUserId);

      return res.status(500).json({
        error: "User created but failed to create profile",
        code: "PROFILE_CREATE_FAILED",
      });
    }

    // 3) Role-specific inserts
    if (role === "doctor") {
      const { error: doctorError } = await supabase
        .from("doctor_profiles")
        .insert({
          profile_id: createdUserId,
          specialization,
          hospital_id: hospitalId,
          license_number: licenseNumber,
          cnic,
          approval_status: "pending",
        });

      if (doctorError) {
        console.error("Insert doctor_profiles error:", doctorError);

        // rollback: delete profile + auth user
        await supabase.from("profiles").delete().eq("id", createdUserId);
        await supabase.auth.admin.deleteUser(createdUserId);

        return res.status(500).json({
          error:
            "User created but failed to create doctor profile. Contact support.",
          code: "DOCTOR_PROFILE_CREATE_FAILED",
        });
      }
    }

    if (role === "hospital_admin") {
      // Re-check right before insert to avoid race conditions
      const { data: existingHospital2, error: existsErr2 } = await supabase
        .from("hospitals")
        .select("id, name, status")
        .ilike("name", cleanedHospitalName)
        .maybeSingle();

      if (existsErr2) {
        console.error("Hospital existence re-check error:", existsErr2);
        await supabase.from("profiles").delete().eq("id", createdUserId);
        await supabase.auth.admin.deleteUser(createdUserId);
        return res.status(500).json({
          error: "Failed to validate hospital name",
          code: "HOSPITAL_VALIDATION_FAILED",
        });
      }

      if (existingHospital2) {
        // rollback
        await supabase.from("profiles").delete().eq("id", createdUserId);
        await supabase.auth.admin.deleteUser(createdUserId);

        return res.status(409).json({
          error: `Hospital "${existingHospital2.name}" is already registered (${existingHospital2.status}).`,
          code: "HOSPITAL_NAME_TAKEN",
          status: existingHospital2.status,
          existingHospital: {
            id: existingHospital2.id,
            name: existingHospital2.name,
            status: existingHospital2.status,
          },
        });
      }

      // 3a) Create hospital in pending state
      const { data: hospitalData, error: hospitalError } = await supabase
        .from("hospitals")
        .insert({
          name: cleanedHospitalName,
          address: hospitalAddress,
          hospital_type: hospitalType,
          admin_profile_id: createdUserId,
          status: "pending",
        })
        .select("id")
        .single();

      if (hospitalError || !hospitalData) {
        console.error("Insert hospitals error:", hospitalError);

        // rollback
        await supabase.from("profiles").delete().eq("id", createdUserId);
        await supabase.auth.admin.deleteUser(createdUserId);

        // If you later add DB unique constraint, Supabase will return code 23505
        const code =
          (hospitalError as any)?.code === "23505"
            ? "HOSPITAL_UNIQUE_VIOLATION"
            : "HOSPITAL_CREATE_FAILED";

        return res.status(500).json({
          error: "User created but failed to create hospital. Contact support.",
          code,
        });
      }

      createdHospitalId = hospitalData.id;

      // 3b) Link in hospital_admin_profiles
      const { error: adminProfileError } = await supabase
        .from("hospital_admin_profiles")
        .insert({
          profile_id: createdUserId,
          hospital_id: createdHospitalId,
        });

      if (adminProfileError) {
        console.error(
          "Insert hospital_admin_profiles error:",
          adminProfileError,
        );

        // rollback: delete hospital + profile + auth user
        await supabase.from("hospitals").delete().eq("id", createdHospitalId);
        await supabase.from("profiles").delete().eq("id", createdUserId);
        await supabase.auth.admin.deleteUser(createdUserId);

        return res.status(500).json({
          error:
            "User created but failed to create hospital admin profile. Contact support.",
          code: "HOSPITAL_ADMIN_PROFILE_CREATE_FAILED",
        });
      }
    }

    return res.status(201).json({
      user: userData.user,
      message:
        "Account created successfully. Your account is pending approval.",
    });
  } catch (err: any) {
    console.error("Register handler error:", err);

    // best-effort rollback if something unexpected happened
    if (createdHospitalId) {
      await supabase.from("hospitals").delete().eq("id", createdHospitalId);
    }
    if (createdUserId) {
      await supabase.from("profiles").delete().eq("id", createdUserId);
      await supabase.auth.admin.deleteUser(createdUserId);
    }

    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/login
 * (unchanged)
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
