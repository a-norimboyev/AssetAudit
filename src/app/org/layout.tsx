import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuthenticatedUser, AuthError } from "@/lib/auth/authorization";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { OrgLayoutClient } from "./org-layout-client";
import { MaintenanceScreen } from "@/components/ui/maintenance-screen";
import { getPlatformSettings } from "@/lib/data/platform-settings";

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
  let authError: AuthError | null = null;

  try {
    context = await requireAuthenticatedUser({ allowMustChangePassword: true });

    if (context.profile.role === "super_admin") {
      redirect("/admin");
    }

    if (context.profile.role !== "organization_admin" && context.profile.role !== "registrar") {
      throw new AuthError(
        "FORBIDDEN",
        "Ushbu bo‘lim faqat tashkilot mas’ullari uchun ruxsat etilgan."
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
      authError = error;
    } else {
      redirect("/login");
    }
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4">
        <main className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-950">
            Kirish cheklangan ({authError.code})
          </h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            {authError.message || "Ushbu bo‘lim faqat faol Tashkilot Administratori uchun ruxsat etilgan."}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
            >
              <span>Login sahifasiga qaytish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!context || !context.organization) {
    redirect("/login");
  }

  const platformSettings = getPlatformSettings();
  if (platformSettings.maintenance.enabled) {
    return (
      <MaintenanceScreen
        message={platformSettings.maintenance.message}
        supportEmail={platformSettings.system.supportEmail}
        supportPhone={platformSettings.system.supportPhone}
      />
    );
  }

  const { profile, user, organization } = context;

  return (
    <OrgLayoutClient
      organization={organization}
      profile={profile}
      user={user}
    >
      {children}
    </OrgLayoutClient>
  );
}
