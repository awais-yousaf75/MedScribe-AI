import { Router } from "express";
import { supabase } from "../config/supabaseClient";

const router = Router();

const normalizeHospitalName = (name: string) => name.trim().replace(/\s+/g, " ");

// GET /api/hospitals/approved
router.get("/approved", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("hospitals")
      .select("id, name, address, hospital_type")
      .eq("status", "approved")
      .order("name", { ascending: true });

    if (error) {
      console.error("Fetch hospitals error:", error);
      return res.status(500).json({ error: "Failed to fetch hospitals" });
    }

    return res.json({ hospitals: data });
  } catch (err: any) {
    console.error("Hospitals handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/hospitals/check-name?name=...
router.get("/check-name", async (req, res) => {
  try {
    const name = typeof req.query.name === "string" ? req.query.name : "";
    const cleaned = normalizeHospitalName(name);

    if (!cleaned || cleaned.length < 3) {
      return res.json({ exists: false, message: "Enter at least 3 characters." });
    }

    const { data, error } = await supabase
      .from("hospitals")
      .select("id, name, status")
      .ilike("name", cleaned)
      .maybeSingle();

    if (error) {
      console.error("Check hospital name error:", error);
      return res.status(500).json({ error: "Failed to check hospital name" });
    }

    if (!data) {
      return res.json({ exists: false, message: "Hospital name is available." });
    }

    return res.json({
      exists: true,
      status: data.status,
      existingHospital: { id: data.id, name: data.name, status: data.status },
      message: `Hospital "${data.name}" is already registered (${data.status}).`,
    });
  } catch (err: any) {
    console.error("Check hospital name handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;