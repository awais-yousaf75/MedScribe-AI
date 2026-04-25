// backend/src/routes/assistant.route.ts
import { Router } from "express";
import { supabase } from "../config/supabaseClient";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = Router();

// All assistant routes require doctor_assistant role
router.use(authMiddleware, requireRole("doctor_assistant"));

/**
 * GET /api/assistant/me
 * Returns assistant info + linked doctor + hospital
 */
router.get("/me", async (req, res) => {
  try {
    const user = (req as any).user;
    const profile = (req as any).profile;

    if (!user || !profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const assistantProfileId = profile.id as string;

    const { data: assistantLink, error: alError } = await supabase
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
      const { data: docProfile, error: docError } = await supabase
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
      const { data: hosp, error: hospError } = await supabase
        .from("hospitals")
        .select("id, name, address, hospital_type, status")
        .eq("id", assistantLink.hospital_id)
        .single();

      if (hospError && hospError.code !== "PGRST116") {
        console.error("Fetch hospital for assistant error:", hospError);
        return res.status(500).json({ error: "Failed to fetch hospital info" });
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
 * Returns all patients registered in this assistant's hospital
 */
router.get("/patients", async (req, res) => {
  try {
    const profile = (req as any).profile;
    if (!profile) return res.status(401).json({ error: "Unauthorized" });
    const assistantProfileId = profile.id as string;

    const { data: assistantLink, error: alError } = await supabase
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

    const { data: patientProfiles, error: ppError } = await supabase
      .from("patient_profiles")
      .select("profile_id, cnic, created_at")
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false });

    if (ppError) {
      console.error("Fetch patients error:", ppError);
      return res.status(500).json({ error: "Failed to fetch patients" });
    }

    if (!patientProfiles || patientProfiles.length === 0) {
      return res.json({ patients: [] });
    }

    const patientIds = patientProfiles.map((p) => p.profile_id);

    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, gender, dob")
      .in("id", patientIds);

    if (profError) {
      console.error("Fetch patient base profiles error:", profError);
      return res
        .status(500)
        .json({ error: "Failed to fetch patient profile data" });
    }

    const patients = patientProfiles.map((pp) => {
      const p = profiles?.find((pr) => pr.id === pp.profile_id);
      return {
        id: pp.profile_id,
        full_name: p?.full_name || "Unknown",
        phone: p?.phone || null,
        gender: p?.gender || null,
        dob: p?.dob || null,
        cnic: pp.cnic,
        created_at: pp.created_at,
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
 * Lookup a patient by CNIC anywhere in the system.
 */
router.get("/patients/search", async (req, res) => {
  const cnic = (req.query.cnic as string | undefined)?.trim();
  if (!cnic) {
    return res.status(400).json({ error: "cnic query parameter is required" });
  }

  try {
    const { data: patientProfiles, error: ppError } = await supabase
      .from("patient_profiles")
      .select("profile_id, hospital_id, cnic, created_at")
      .eq("cnic", cnic);

    if (ppError) {
      console.error("Search patient_profiles by CNIC error:", ppError);
      return res.status(500).json({ error: "Failed to search patient" });
    }

    if (!patientProfiles || patientProfiles.length === 0) {
      return res.json({ found: false });
    }

    const profileId = patientProfiles[0].profile_id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, gender, dob")
      .eq("id", profileId)
      .single();

    if (profileError) {
      console.error("Fetch patient profile for search error:", profileError);
      return res
        .status(500)
        .json({ error: "Failed to load patient information" });
    }

    const hospitalIds = Array.from(
      new Set(
        patientProfiles
          .map((p) => p.hospital_id)
          .filter((id): id is string => !!id)
      )
    );

    let hospitals: { id: string; name: string }[] = [];
    if (hospitalIds.length) {
      const { data: hospitalRows, error: hospError } = await supabase
        .from("hospitals")
        .select("id, name")
        .in("id", hospitalIds);

      if (hospError) {
        console.error("Fetch hospitals for search error:", hospError);
      } else {
        hospitals = (hospitalRows || []) as { id: string; name: string }[];
      }
    }

    return res.json({
      found: true,
      patient: {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        gender: profile.gender,
        dob: profile.dob,
        cnic,
      },
      hospitals,
    });
  } catch (err) {
    console.error("GET /api/assistant/patients/search error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/assistant/patients
 * Body: { fullName, cnic, phone?, gender?, dob? }
 *
 * Behaviour:
 * - If CNIC already exists:
 *    - If patient is already linked to THIS hospital -> "already_exists".
 *    - Else -> move/link the existing patient record to THIS hospital.
 * - If CNIC does NOT exist anywhere:
 *    - Create a new patient profile and link to this hospital.
 */
router.post("/patients", async (req, res) => {
  const { fullName, cnic, phone, gender, dob } = req.body as {
    fullName?: string;
    cnic?: string;
    phone?: string;
    gender?: string;
    dob?: string;
  };

  if (!fullName || !cnic) {
    return res
      .status(400)
      .json({ error: "fullName and cnic are required fields" });
  }

  try {
    const profile = (req as any).profile;
    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const assistantProfileId = profile.id as string;

    // 1) Determine assistant's hospital
    const { data: assistantLink, error: assistantLinkError } = await supabase
      .from("doctor_assistant_profiles")
      .select("hospital_id")
      .eq("profile_id", assistantProfileId)
      .single();

    if (assistantLinkError || !assistantLink?.hospital_id) {
      console.error("Fetch assistant hospital error:", assistantLinkError);
      return res.status(400).json({
        error:
          "Assistant is not properly linked to a hospital. Please contact admin.",
      });
    }

    const hospitalId = assistantLink.hospital_id;

    const normalize = (s: string) =>
      s.toString().trim().replace(/\s+/g, " ").toLowerCase();

    // 2) Check if a patient with this CNIC already exists anywhere
    const { data: existingPatientProfiles, error: existingPpError } =
      await supabase
        .from("patient_profiles")
        .select("profile_id, hospital_id, cnic, created_at")
        .eq("cnic", cnic);

    if (existingPpError) {
      console.error("Check existing patient_profiles error:", existingPpError);
      return res
        .status(500)
        .json({ error: "Failed to check existing patients" });
    }

    // === CASE A: patient with this CNIC already exists ===
    if (existingPatientProfiles && existingPatientProfiles.length > 0) {
      const existingProfileId = existingPatientProfiles[0].profile_id;

      const { data: existingProfile, error: existingProfileError } =
        await supabase
          .from("profiles")
          .select("id, full_name, phone, gender, dob")
          .eq("id", existingProfileId)
          .single();

      if (existingProfileError) {
        console.error(
          "Fetch existing patient profile error:",
          existingProfileError
        );
        return res
          .status(500)
          .json({ error: "Failed to load existing patient information" });
      }

      // Safety: CNIC exists but name must match
      if (
        existingProfile?.full_name &&
        normalize(existingProfile.full_name) !== normalize(fullName)
      ) {
        return res.status(400).json({
          error:
            "A patient with this CNIC already exists, but the name does not match. Please verify the CNIC with the patient or contact admin.",
        });
      }

      const alreadyInThisHospital = existingPatientProfiles.find(
        (p) => p.hospital_id === hospitalId
      );

      // Optional: update demographic info
      const updatePayload: Record<string, any> = {};
      if (
        !existingProfile?.full_name ||
        normalize(existingProfile.full_name) !== normalize(fullName)
      ) {
        updatePayload.full_name = fullName;
      }
      if (phone && phone !== existingProfile?.phone)
        updatePayload.phone = phone;
      if (gender && gender !== existingProfile?.gender)
        updatePayload.gender = gender;
      if (dob && dob !== existingProfile?.dob) updatePayload.dob = dob;

      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", existingProfileId);
        if (updateError) {
          console.error("Update existing patient profile error:", updateError);
        }
      }

      // A1: already in this hospital -> do not duplicate
      if (alreadyInThisHospital) {
        return res.status(200).json({
          status: "already_exists",
          patient: {
            id: existingProfileId,
            full_name: fullName,
            phone: phone ?? existingProfile?.phone ?? null,
            gender: gender ?? existingProfile?.gender ?? null,
            dob: dob ?? existingProfile?.dob ?? null,
            cnic,
            created_at: alreadyInThisHospital.created_at,
          },
        });
      }

      // A2: exists, but in ANOTHER hospital -> move/link to this hospital
      const targetRow = existingPatientProfiles[0];

      const { error: updateLinkError } = await supabase
        .from("patient_profiles")
        .update({
          hospital_id: hospitalId,
          created_by: assistantProfileId,
        })
        .eq("profile_id", targetRow.profile_id)
        .eq("cnic", cnic);

      if (updateLinkError) {
        console.error("Update patient_profiles link error:", updateLinkError);
        return res.status(500).json({
          error:
            "Existing patient found, but failed to link to this hospital. Please try again.",
        });
      }

      return res.status(200).json({
        status: "linked",
        patient: {
          id: existingProfileId,
          full_name: fullName,
          phone: phone ?? existingProfile?.phone ?? null,
          gender: gender ?? existingProfile?.gender ?? null,
          dob: dob ?? existingProfile?.dob ?? null,
          cnic,
          // keep original creation time from the row we moved
          created_at: targetRow.created_at,
        },
      });
    }

    // === CASE B: CNIC does NOT exist anywhere -> create new patient ===
    const { data: newProfile, error: newProfileError } = await supabase
      .from("profiles")
      .insert({
        full_name: fullName,
        phone,
        gender,
        dob,
        role: "patient",
        approval_status: "approved",
      })
      .select("id, full_name, phone, gender, dob")
      .single();

    if (newProfileError || !newProfile) {
      console.error("Create new patient profile error:", newProfileError);
      return res
        .status(500)
        .json({ error: "Failed to create new patient profile" });
    }

    const { data: newPatientProfile, error: newPpError } = await supabase
      .from("patient_profiles")
      .insert({
        profile_id: newProfile.id,
        cnic,
        hospital_id: hospitalId,
        created_by: assistantProfileId,
      })
      .select("profile_id, cnic, hospital_id, created_at")
      .single();

    if (newPpError || !newPatientProfile) {
      console.error("Create new patient_profiles error:", newPpError);
      return res.status(500).json({
        error:
          "Patient profile created, but failed to link it to this hospital.",
      });
    }

    return res.status(201).json({
      status: "created",
      patient: {
        id: newProfile.id,
        full_name: newProfile.full_name,
        phone: newProfile.phone,
        gender: newProfile.gender,
        dob: newProfile.dob,
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
