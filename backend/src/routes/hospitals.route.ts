import { Router } from "express";
import { supabase } from "../config/supabaseClient";

const router = Router();

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

export default router;