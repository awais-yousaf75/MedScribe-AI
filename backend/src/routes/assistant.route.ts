// backend/src/routes/assistant.route.ts
import { Router } from "express";
import { supabase, supabaseAdmin } from "../config/supabaseClient";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

router.use(authMiddleware, requireRole("doctor_assistant"));

/**A
 * GET /api/assistant/me
 */
router.get("/me", async (req, res) => {
  try {
    const user    = (req as any).user;
    const profile = (req as any).profile;

    if (!user || !profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const assistantProfileId = profile.id as string;

    const { data: assistantLink, error: alError } = await supabaseAdmin
      .from("doctor_assistant_profiles")
      .select("doctor_profile_id, hospital_id, approval_status")
      .eq("profile_id", assistantProfileId)
      .single();

    if (alError && alError.code !== "PGRST116") {
      console.error("Fetch assistant link error:", alError);
      return res
        .status(500)
        .json({ error: "Failed to fetch assistant linkage info" });
    }

    let doctor = null;
    if (assistantLink?.doctor_profile_id) {
      const { data: docProfile, error: docError } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, phone, role")
        .eq("id", assistantLink.doctor_profile_id)
        .single();

      if (docError && docError.code !== "PGRST116") {
        console.error("Fetch doctor for assistant error:", docError);
        return res
          .status(500)
          .json({ error: "Failed to fetch assigned doctor info" });
      }
      doctor = docProfile || null;
    }

    let hospital = null;
    if (assistantLink?.hospital_id) {
      const { data: hosp, error: hospError } = await supabaseAdmin
        .from("hospitals")
        .select("id, name, address, hospital_type, status")
        .eq("id", assistantLink.hospital_id)
        .single();

      if (hospError && hospError.code !== "PGRST116") {
        console.error("Fetch hospital for assistant error:", hospError);
        return res
          .status(500)
          .json({ error: "Failed to fetch hospital info" });
      }
      hospital = hosp || null;
    }

    return res.json({
      user,
      profile,
      assistant_link: assistantLink || null,
      doctor,
      hospital,
    });
  } catch (err) {
    console.error("GET /api/assistant/me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/assistant/patients
 */
router.get("/patients", async (req, res) => {
  try {
    const profile = (req as any).profile;
    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    const assistantProfileId = profile.id as string;

    // 1) Get assistant's hospital
    const { data: assistantLink, error: alError } = await supabaseAdmin
      .from("doctor_assistant_profiles")
      .select("hospital_id")
      .eq("profile_id", assistantProfileId)
      .single();

    if (alError || !assistantLink?.hospital_id) {
      console.error("Fetch assistant hospital error:", alError);
      return res
        .status(400)
        .json({ error: "Assistant not linked to a hospital" });
    }

    const hospitalId = assistantLink.hospital_id;

    // 2) Get all patients directly registered to this hospital
    const { data: patientProfiles, error: ppError } = await supabaseAdmin
      .from("patient_profiles")
      .select("profile_id, cnic, created_at")
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false });

    if (ppError) {
      console.error("Fetch patients error:", ppError);
      return res.status(500).json({ error: "Failed to fetch patients" });
    }

    // 3) Also include patients who have appointments at this hospital
    const { data: apptPatients } = await supabaseAdmin
      .from("appointments")
      .select("patient_profile_id")
      .eq("hospital_id", hospitalId);

    const apptPatientIds   = apptPatients?.map((a: { patient_profile_id: any; }) => a.patient_profile_id) || [];
    const directPatientIds = (patientProfiles || []).map((p: { profile_id: any; }) => p.profile_id);
    const allPatientIds    = Array.from(
      new Set([...directPatientIds, ...apptPatientIds])
    );

    if (allPatientIds.length === 0) {
      return res.json({ patients: [] });
    }

    // 4) Fetch profile details
    const { data: profileRows, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, gender, dob")
      .in("id", allPatientIds);

    if (profilesError) {
      console.error("Fetch profile rows error:", profilesError);
      return res.status(500).json({ error: "Failed to fetch patient details" });
    }

    // 5) Fetch patient_profiles for cnic + created_at
    const { data: allPatientProfileRows, error: allPpError } =
      await supabaseAdmin
        .from("patient_profiles")
        .select("profile_id, cnic, created_at")
        .in("profile_id", allPatientIds);

    if (allPpError) {
      console.error("Fetch all patient_profiles error:", allPpError);
      return res
        .status(500)
        .json({ error: "Failed to fetch patient profile rows" });
    }

    // 6) Merge
    const patients = allPatientIds.map((id) => {
      const p  = profileRows?.find((pr: { id: any; }) => pr.id === id);
      const pp = allPatientProfileRows?.find((pr: { profile_id: any; }) => pr.profile_id === id);
      return {
        id,
        full_name:  p?.full_name  || "Unknown",
        phone:      p?.phone      || null,
        gender:     p?.gender     || null,
        dob:        p?.dob        || null,
        cnic:       pp?.cnic      || "—",
        created_at: pp?.created_at || new Date().toISOString(),
      };
    });

    return res.json({ patients });
  } catch (err) {
    console.error("GET /api/assistant/patients error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/assistant/patients/search?cnic=...
 */
router.get("/patients/search", async (req, res) => {
  const cnic = (req.query.cnic as string | undefined)?.trim();
  if (!cnic) {
    return res
      .status(400)
      .json({ error: "cnic query parameter is required" });
  }

  try {
    const { data: patientProfile, error: ppError } = await supabaseAdmin
      .from("patient_profiles")
      .select("profile_id, hospital_id, cnic, created_at")
      .eq("cnic", cnic)
      .maybeSingle(); // one row per patient (profile_id is PK)

    if (ppError) {
      console.error("Search patient_profiles by CNIC error:", ppError);
      return res.status(500).json({ error: "Failed to search patient" });
    }

    if (!patientProfile) {
      return res.json({ found: false });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, gender, dob")
      .eq("id", patientProfile.profile_id)
      .single();

    if (profileError) {
      console.error("Fetch patient profile for search error:", profileError);
      return res
        .status(500)
        .json({ error: "Failed to load patient information" });
    }

    // Fetch hospital name if linked
    let hospital: { id: string; name: string } | null = null;
    if (patientProfile.hospital_id) {
      const { data: hospRow } = await supabaseAdmin
        .from("hospitals")
        .select("id, name")
        .eq("id", patientProfile.hospital_id)
        .single();

      hospital = hospRow || null;
    }

    return res.json({
      found: true,
      patient: {
        id:        profile.id,
        full_name: profile.full_name,
        phone:     profile.phone,
        gender:    profile.gender,
        dob:       profile.dob,
        cnic,
      },
      hospital, // single hospital (not array) — one row per patient
    });
  } catch (err) {
    console.error("GET /api/assistant/patients/search error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/assistant/patients
 *
 * Schema facts:
 *  - profiles        : id, full_name, phone, gender, dob, role, approval_status, avatar_url
 *  - patient_profiles: profile_id (PK), cnic, hospital_id, created_by, medical_history, created_at
 *  - ONE row per patient in patient_profiles (profile_id is PK)
 *  - email lives ONLY in auth.users — NOT in profiles table
 */
router.post("/patients", async (req, res) => {
  const { fullName, cnic, phone, gender, dob, email, password } =
    req.body as {
      fullName?: string;
      cnic?:     string;
      phone?:    string;
      gender?:   string;
      dob?:      string;
      email?:    string;
      password?: string;
    };

  if (!fullName || !cnic) {
    return res
      .status(400)
      .json({ error: "fullName and cnic are required fields" });
  }

  try {
    const profile = (req as any).profile;
    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    const assistantProfileId = profile.id as string;

    // 1) Get assistant's hospital
    const { data: assistantLink, error: assistantLinkError } =
      await supabaseAdmin
        .from("doctor_assistant_profiles")
        .select("hospital_id")
        .eq("profile_id", assistantProfileId)
        .single();

    if (assistantLinkError || !assistantLink?.hospital_id) {
      console.error("Fetch assistant hospital error:", assistantLinkError);
      return res.status(400).json({
        error: "Assistant is not properly linked to a hospital.",
      });
    }

    const hospitalId = assistantLink.hospital_id;
    const normalize  = (s: string) =>
      s.toString().trim().replace(/\s+/g, " ").toLowerCase();

    // 2) Check if CNIC already exists
    //    patient_profiles.profile_id is PK → at most ONE row per patient
    const { data: existingPP, error: existingPpError } = await supabaseAdmin
      .from("patient_profiles")
      .select("profile_id, hospital_id, cnic, created_at")
      .eq("cnic", cnic)
      .maybeSingle();

    if (existingPpError) {
      console.error("Check existing patient error:", existingPpError);
      return res
        .status(500)
        .json({ error: "Failed to check existing patients" });
    }

    // === CASE A: CNIC already exists ===
    if (existingPP) {
      const existingProfileId = existingPP.profile_id;

      // Load the profile row
      const { data: existingProfile, error: existingProfileError } =
        await supabaseAdmin
          .from("profiles")
          .select("id, full_name, phone, gender, dob")
          .eq("id", existingProfileId)
          .single();

      if (existingProfileError || !existingProfile) {
        console.error("Fetch existing profile error:", existingProfileError);
        return res
          .status(500)
          .json({ error: "Failed to load existing patient" });
      }

      // Name must match for safety
      if (normalize(existingProfile.full_name) !== normalize(fullName)) {
        return res.status(400).json({
          error:
            "A patient with this CNIC already exists but the name does not match. Please verify the CNIC or contact admin.",
        });
      }

      // Update demographics on profiles if anything changed
      const profileUpdate: Record<string, any> = {};
      if (phone  && phone  !== existingProfile.phone)  profileUpdate.phone  = phone;
      if (gender && gender !== existingProfile.gender) profileUpdate.gender = gender;
      if (dob    && dob    !== existingProfile.dob)    profileUpdate.dob    = dob;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profUpdateErr } = await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("id", existingProfileId);

        if (profUpdateErr) {
          console.error("Update profile demographics error:", profUpdateErr);
        }
      }

      // A1: already linked to THIS hospital
      if (existingPP.hospital_id === hospitalId) {
        return res.status(200).json({
          status: "already_exists",
          patient: {
            id:         existingProfileId,
            full_name:  fullName,
            phone:      phone   ?? existingProfile.phone   ?? null,
            gender:     gender  ?? existingProfile.gender  ?? null,
            dob:        dob     ?? existingProfile.dob     ?? null,
            cnic,
            created_at: existingPP.created_at,
          },
        });
      }

      // A2: linked to a DIFFERENT hospital — move to this hospital
      //     (profile_id is PK so we UPDATE the existing row)
      const { data: updatedPP, error: updatePpError } = await supabaseAdmin
        .from("patient_profiles")
        .update({
          hospital_id: hospitalId,
          created_by:  assistantProfileId,
        })
        .eq("profile_id", existingProfileId)
        .select("created_at")
        .single();

      if (updatePpError || !updatedPP) {
        console.error("Move patient to new hospital error:", updatePpError);
        return res.status(500).json({
          error: "Failed to link patient to this hospital.",
        });
      }

      return res.status(200).json({
        status: "linked",
        patient: {
          id:         existingProfileId,
          full_name:  fullName,
          phone:      phone   ?? existingProfile.phone   ?? null,
          gender:     gender  ?? existingProfile.gender  ?? null,
          dob:        dob     ?? existingProfile.dob     ?? null,
          cnic,
          created_at: updatedPP.created_at,
        },
      });
    }

    // === CASE B: Brand new patient ===

    // email → auth.users only, never stored in profiles table
    const authEmail    = email?.trim()
      ? email.trim()
      : `${cnic.replace(/-/g, "")}@patient.local`;

    const authPassword = password?.trim()
      ? password.trim()
      : crypto.randomUUID();

    // Step 1: Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email:         authEmail,
        password:      authPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role:      "patient",
        },
      });

    if (authError || !authData?.user) {
      console.error("Create auth user error:", authError);
      if (authError?.message?.toLowerCase().includes("already")) {
        return res.status(400).json({
          error:
            "This email is already registered. Please use a different email.",
        });
      }
      return res.status(500).json({
        error: `Failed to create patient account: ${authError?.message}`,
      });
    }

    const newAuthUserId = authData.user.id;
    console.log("✅ Auth user created:", newAuthUserId);

    // Step 2: Wait for any DB trigger that auto-creates a profiles row
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Step 3: Check if trigger already created the profile row
    const { data: triggerProfile, error: triggerCheckError } =
      await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", newAuthUserId)
        .maybeSingle();

    if (triggerCheckError) {
      console.error("Trigger profile check error:", triggerCheckError);
      await supabaseAdmin.auth.admin.deleteUser(newAuthUserId);
      return res
        .status(500)
        .json({ error: "Failed to verify profile creation" });
    }

    let finalProfile: {
      id:        string;
      full_name: string;
      phone:     string | null;
      gender:    string | null;
      dob:       string | null;
    } | null = null;

    if (triggerProfile) {
      // Step 4a: Trigger created it — update with full submitted details
      console.log("✅ Trigger created profile row, updating...");

      const updatePayload: Record<string, any> = {
        full_name:       fullName,
        role:            "patient",
        approval_status: "approved",
      };
      if (phone?.trim())  updatePayload.phone  = phone.trim();
      if (gender?.trim()) updatePayload.gender = gender.trim();
      if (dob?.trim())    updatePayload.dob    = dob.trim();

      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from("profiles")
        .update(updatePayload)
        .eq("id", newAuthUserId)
        .select("id, full_name, phone, gender, dob")
        .single();

      if (updateError || !updatedProfile) {
        console.error("Update trigger-created profile error:", updateError);
        await supabaseAdmin.auth.admin.deleteUser(newAuthUserId);
        return res.status(500).json({
          error: `Failed to update patient profile: ${updateError?.message}`,
        });
      }

      finalProfile = updatedProfile;

    } else {
      // Step 4b: No trigger — insert manually
      //          Only columns that exist in profiles table:
      //          id, full_name, phone, gender, dob, role, approval_status
      console.log("No trigger found, inserting profile manually...");

      const { data: insertedProfile, error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id:              newAuthUserId,
          full_name:       fullName,
          phone:           phone?.trim()  || null,
          gender:          gender?.trim() || null,
          dob:             dob?.trim()    || null,
          role:            "patient",
          approval_status: "approved",
        })
        .select("id, full_name, phone, gender, dob")
        .single();

      if (insertError || !insertedProfile) {
        console.error("Insert profile error:", {
          message: insertError?.message,
          details: insertError?.details,
          hint:    insertError?.hint,
          code:    insertError?.code,
        });
        await supabaseAdmin.auth.admin.deleteUser(newAuthUserId);
        return res.status(500).json({
          error:   `Failed to create patient profile: ${insertError?.message}`,
          details: insertError?.details ?? null,
          hint:    insertError?.hint    ?? null,
          code:    insertError?.code    ?? null,
        });
      }

      finalProfile = insertedProfile;
    }

    console.log("✅ Profile ready:", finalProfile);

    // Step 5: Insert into patient_profiles
    //         Only columns that exist:
    //         profile_id, cnic, hospital_id, created_by, medical_history, created_at
    const { data: newPatientProfile, error: newPpError } = await supabaseAdmin
      .from("patient_profiles")
      .insert({
        profile_id:  finalProfile!.id,
        cnic,
        hospital_id: hospitalId,
        created_by:  assistantProfileId,
        // medical_history: null by default
      })
      .select("profile_id, cnic, hospital_id, created_at")
      .single();

    if (newPpError || !newPatientProfile) {
      console.error("Create patient_profiles error:", {
        message: newPpError?.message,
        details: newPpError?.details,
        hint:    newPpError?.hint,
        code:    newPpError?.code,
      });
      await supabaseAdmin.auth.admin.deleteUser(newAuthUserId);
      return res.status(500).json({
        error: `Failed to link patient to hospital: ${newPpError?.message}`,
      });
    }

    console.log("✅ Patient fully registered:", newPatientProfile);

    return res.status(201).json({
      status: "created",
      patient: {
        id:         finalProfile!.id,
        full_name:  finalProfile!.full_name,
        phone:      finalProfile!.phone,
        gender:     finalProfile!.gender,
        dob:        finalProfile!.dob,
        cnic,
        created_at: newPatientProfile.created_at,
      },
    });

  } catch (err) {
    console.error("POST /api/assistant/patients error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;