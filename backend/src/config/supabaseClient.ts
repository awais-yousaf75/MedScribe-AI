import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
console.log('Loaded SUPABASE_URL:', process.env.SUPABASE_URL);
// Explicitly load .env from backend root
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_KEY defined:', !!supabaseServiceKey);
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);