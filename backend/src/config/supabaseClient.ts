import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const supabaseUrl        = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("SUPABASE_URL:", supabaseUrl);
  console.error("SUPABASE_SERVICE_KEY defined:", !!supabaseServiceKey);
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
}

// :white_check_mark: Single client using service role key — bypasses RLS
// Used everywhere in backend (backend is trusted, no need for anon key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession:   false,
  },
});

// :white_check_mark: Keep this alias so existing imports like `import { supabase }` still work
export const supabase = supabaseAdmin;