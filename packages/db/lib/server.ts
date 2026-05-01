import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Service-role client. Bypasses RLS — use only on the server (API routes, server components).
// Never import this in a "use client" file.
let cached: SupabaseClient<Database> | null = null;

export function createServerClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. Set them in .env.local for dev or via scripts/sync-env.sh for Railway."
    );
  }
  cached = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

// True if Supabase env is configured. Use to gate fallback paths in dev.
export function hasSupabase(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
