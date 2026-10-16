import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuthenticatedUser, AuthError } from "@/lib/auth/authorization";
import { OrgLogoutButton } from "./org-logout-button";
import { OrgNav } from "./org-nav";
import { ShieldAlert, Building2, ArrowRight } from "lucide-react";
import { ForceChangePasswordCard } from "@/components/auth/force-change-password-card";

/**
 * Next.js 16: Barcha /org segmentlari uchun statik shell validatsiyasini o'chirish
 * va har bir so'rovda server-side to'liq autentifikatsiya va tenant izolyatsiyasini talab qilish.
 */
export const instant = false;

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let context;

  try {
    context = await requireAuthenticatedUser();

    if (context.profile.role === "super_admin") {
      redirect("/admin");
    }

    if (context.profile.role !== "organization_admin" && context.profile.role !== "registrar") {
      throw new AuthError(
        "FORBIDDEN",
        "Ushbu bo‘lim faqat tashkilot mas’ullari (Administrator va Moddiy javobgar) uchun ruxsat etilgan."
      );
    }

    if (!context.organization || !context.organization.isActive) {
      throw new AuthError(
        "ORGANIZATION_INACTIVE",
        "Tashkilot faoliyati vaqtincha to‘xtatilgan yoki topilmadi."
      );
    }
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.code === "AUTHENTICATION_REQUIRED") {
        redirect("/login");
      }

      if (error.code === "PASSWORD_CHANGE_REQUIRED") {
        return <ForceChangePasswordCard />;
      }

      // Agar boshqa rol bo'lsa yoki tashkilot faol bo'lmasa:
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4">
          <main className="max-w-md w-full bg-white border border-slate-200 rounded-[4px] p-6 sm:p-8 text-center shadow-xs">
            <div className="w-14 h-14 rounded-[4px] bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">
              Kirish cheklangan ({error.code})
            </h1>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {error.message || "Ushbu bo‘lim faqat faol Tashkilot Administratori uchun ruxsat etilgan."}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[3px] bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Login sahifasiga qaytish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </main>
        </div>
      );
    }

    redirect("/login");
  }

  const { profile, user, organization } = context;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col justify-between">
      {/* Yuqori Header */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/org"
              className="w-9 h-9 rounded-[4px] bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-xs hover:bg-blue-700 transition-colors"
            >
              A
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-lg tracking-tight text-slate-900">
                Asset<span className="text-blue-600">Audit</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[3px] text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hidden sm:inline-flex">
                <Building2 className="w-3 h-3 text-blue-600" />
                <span>{organization.code}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">{profile.fullName}</div>
              <div className="text-[11px] text-slate-500">{user.email}</div>
            </div>
            <OrgLogoutButton />
          </div>
        </div>
      </header>

      {/* Asosiy Ishchi Hudud (Sidebar + Kontent) */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row">
        <OrgNav organizationCode={organization.code} />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Pastki Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          &copy; 2026 AssetAudit. Barcha huquqlar himoyalangan.
        </div>
      </footer>
    </div>
  );
}
