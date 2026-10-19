import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // .env.local me ye dono keys honi chahiye (README dekho), phir dev server dobara chalao
  console.error("Supabase keys missing: .env.local me NEXT_PUBLIC_SUPABASE_URL aur NEXT_PUBLIC_SUPABASE_ANON_KEY daalo.");
}

// Browser se seedha Supabase (koi beech ka server nahi = fast). Safety RLS se aati hai.
export const supabase = createClient(url ?? "http://localhost", anonKey ?? "missing-key", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});