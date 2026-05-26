import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PERFUME_IMAGE_BUCKET = "perfume-images";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseProjectHost(): string {
  if (!supabaseUrl) return "";

  try {
    return new URL(supabaseUrl).host;
  } catch {
    return supabaseUrl;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  browserClient ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

  return browserClient;
}

export function requireSupabaseClient(): SupabaseClient {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase nao configurado. Defina as variaveis de ambiente.");
  }
  return supabase;
}
