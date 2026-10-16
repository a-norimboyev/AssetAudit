import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase muhit o'zgaruvchilari to'g'ri sozlanganligini tekshirish
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

/**
 * Brauzer (Client Components) uchun Supabase mijozi
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "AssetAudit: NEXT_PUBLIC_SUPABASE_URL yoki NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY topilmadi. Konfiguratsiyani .env.local faylida tekshiring."
    );
  }

  return createBrowserClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseKey || "placeholder-key"
  );
}
