import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { ChangePasswordCard } from "./change-password-card";
import { AdminProfileCard } from "./admin-profile-card";

export const metadata = {
  title: "Sozlamalar — AssetAudit",
  description: "Administrator profili va xavfsizlik sozlamalari",
};

export const instant = false;

export default async function OrgSettingsPage() {
  const { profile, user, organization } = await requireOrganizationAdmin();

  const settings = (organization.settings as Record<string, unknown>) || {};
  const currentPhone = (settings.adminPhone as string) || "";

  const currentLogin =
    (user as { username?: string | null; displayUsername?: string | null; email?: string | null }).username ||
    (user as { username?: string | null; displayUsername?: string | null; email?: string | null }).displayUsername ||
    (user.email?.endsWith("@auth.assetaudit.uz") ? user.email.split("@")[0] : user.email) ||
    "";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Sarlavha */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Sozlamalar
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mas'ul Administrator Profil Ma'lumotlari & Telefon */}
        <AdminProfileCard
          initialFullName={profile.fullName || ""}
          initialUsername={currentLogin}
          initialPhone={currentPhone}
          role="Universitet Bosh Administratori (organization_admin)"
        />

        {/* Administrator Parolini O'zgartirish */}
        <ChangePasswordCard />
      </div>
    </div>
  );
}
