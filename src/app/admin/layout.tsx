import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePlatformAdmin, AuthError } from "@/lib/auth/authorization";
import { AdminLayoutClient } from "./admin-layout-client";
import { ShieldAlert, ArrowRight } from "lucide-react";

/**
 * Next.js 16: Barcha /admin segmentlari uchun statik shell validatsiyasini o'chirish
 * va har bir so'rovda server-side to'liq autentifikatsiyani talab qilish.
 */
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let context;

  try {
    context = await requirePlatformAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.code === "AUTHENTICATION_REQUIRED") {
        redirect("/login");
      }

      // Agar boshqa rol (masalan, organization_admin, inspector, registrar) bo'lsa:
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4">
          <main className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">
              Kirish cheklangan
            </h1>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Ushbu bo‘lim faqat <strong>Platforma Bosh Administratori</strong> uchun ruxsat etilgan. Sizning rolingiz ushbu panelga kirish huquqiga ega emas.
            </p>
            <div className="mt-6">
              <Link
                href="/org"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Tashkilot dashboardiga o‘tish</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </main>
        </div>
      );
    }

    redirect("/login");
  }

  const { profile, user } = context;

  return (
    <AdminLayoutClient
      profile={{
        fullName: profile.fullName,
        role: profile.role,
      }}
      user={{
        username: profile.role === "super_admin" ? "super@admin" : ((user as { username?: string }).username || null),
        email: user.email,
      }}
    >
      {children}
    </AdminLayoutClient>
  );
}
