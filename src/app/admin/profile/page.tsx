import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { cookies } from "next/headers";
import { ProfileSettingsManager } from "./profile-settings-manager";
import { Settings } from "lucide-react";

export const metadata = {
  title: "Sozlamalar — AssetAudit Super Admin",
  description: "Foydalanuvchi kirish emaili, maxfiy paroli va interfeys tilini boshqarish",
};

export const instant = false;

export default async function AdminProfileSettingsPage() {
  const { user, profile } = await requirePlatformAdmin();
  const cookieStore = await cookies();
  const currentLanguage = cookieStore.get("NEXT_LOCALE")?.value || "uz-latn";

  const emailOrUsername =
    profile.role === "super_admin"
      ? "super@admin"
      : (user.email && !user.email.endsWith("@auth.assetaudit.uz")
          ? user.email
          : ((user as { username?: string | null }).username || user.email || "super@admin"));

  return (
    <div className="space-y-6 w-full">
      {/* Sarlavha va Breadcrumbs */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <span>Platforma Boshqaruvi</span>
          <span>/</span>
          <span className="text-slate-700 font-semibold">Sozlamalar</span>
        </nav>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Foydalanuvchi Sozlamalari
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Shaxsiy hisobingiz kirish emaili, maxfiy paroli va tizim interfeysi tilini o&apos;zgartirish
            </p>
          </div>
        </div>
      </div>

      {/* Interaktiv Sozlamalar Boshqaruvchisi */}
      <ProfileSettingsManager
        currentUsername={emailOrUsername}
        fullName={profile.fullName || "Bosh Super Admin"}
        currentLanguage={currentLanguage}
      />
    </div>
  );
}
