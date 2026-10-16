import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Components va Server Actions uchun foydalanuvchi sessiyasiga bog'langan Supabase mijozi
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "AssetAudit: Serverda NEXT_PUBLIC_SUPABASE_URL yoki NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY topilmadi."
    );
  }

  return createServerClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseKey || "placeholder-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component ichidan chaqirilganda setAll e'tiborsiz qoldirilishi mumkin
          }
        },
      },
    }
  );
}

