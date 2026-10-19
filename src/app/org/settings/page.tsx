import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { Shield } from "lucide-react";
import { ChangePasswordCard } from "./change-password-card";

export const metadata = {
  title: "Sozlamalar — AssetAudit",
  description: "Administrator profili va xavfsizlik sozlamalari",
};

export const instant = false;

export default async function OrgSettingsPage() {
  const { profile, user } = await requireOrganizationAdmin();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Sarlavha */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Sozlamalar
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mas'ul Administrator */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-xs transition-shadow space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Joriy Mas&apos;ul Administrator</h2>
              <p className="text-[11px] text-slate-500">Boshqaruv hisobi</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-500 font-medium block mb-1">F.I.SH</label>
              <div className="font-semibold text-slate-900 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                {profile.fullName || "Kiritilmagan"}
              </div>
            </div>

            <div>
              <label className="text-slate-500 font-medium block mb-1">Kirish emaili</label>
              <div className="font-mono font-semibold text-slate-800 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                {(user as { email?: string; username?: string; displayUsername?: string }).email ||
                  (user as { email?: string; username?: string; displayUsername?: string }).username ||
                  (user as { email?: string; username?: string; displayUsername?: string }).displayUsername ||
                  "superadmin"}
              </div>
            </div>

            <div>
              <label className="text-slate-500 font-medium block mb-1">Tizimdagi Roli</label>
              <div className="font-semibold text-blue-700 bg-blue-50/60 p-3 rounded-xl border border-blue-200/80">
                Universitet Bosh Administratori (organization_admin)
              </div>
            </div>
          </div>
        </div>

        {/* Administrator Parolini O'zgartirish */}
        <ChangePasswordCard />
      </div>
    </div>
  );
}
