import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { getOrganizationStaffList, getOrganizationStaffStats } from "@/lib/data/staff";
import { AddStaffModal } from "./add-staff-modal";
import { ResetStaffPasswordModal } from "./reset-password-modal";
import { ToggleStaffStatusButton } from "./toggle-staff-status-button";
import {
  Users,
  Calendar,
  User,
  UserCheck,
  Tag,
  QrCode,
  AlertTriangle,
} from "lucide-react";

export const metadata = {
  title: "Mas'ul Xodimlar — AssetAudit",
  description: "Tashkilot inspektorlari va moddiy javobgar shaxslari boshqaruvi",
};

export const instant = false;

export default async function OrgStaffPage() {
  const { organization } = await requireOrganizationAdmin();

  const [stats, staffList] = await Promise.all([
    getOrganizationStaffStats(organization.id),
    getOrganizationStaffList(organization.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Sarlavha va Harakat tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Mas&apos;ul Xodimlar
            </h1>
            <span className="px-2.5 py-0.5 rounded-[3px] text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {stats.totalStaff} nafar xodim
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {organization.name} — inventarizatsiya tekshiruvchilari va moddiy javobgarlar
          </p>
        </div>

        <AddStaffModal />
      </div>

      {/* KPI Kartalari */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Jami xodimlar</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.totalStaff}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tashkilot bo‘yicha</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Inspektorlar</span>
            <QrCode className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.inspectorsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Faqat QR skanerlaydi</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Moddiy javobgarlar</span>
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.registrarsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Yangi mulk kiritadi</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Faol akkauntlar</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.activeStaffCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tizimga kirish huquqiga ega</div>
        </div>
      </div>

      {/* Xodimlar Jadvali */}
      <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-xs overflow-hidden">
        {staffList.length === 0 ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-[4px] bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Hozircha xodimlar mavjud emas
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Universitet auditoriyalari yoki xonalarini tekshirish uchun inspektorlar va yangi mulklarni kiritish uchun moddiy javobgar shaxslarni qo‘shing.
            </p>
            <div className="mt-5">
              <AddStaffModal />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Xodim F.I.SH</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Login (Foydalanuvchi)</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Roli & Vakolati</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Holati & Parol</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Qo‘shilgan sana</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-normal">
                {staffList.map((s) => (
                  <tr key={s.userId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[3px] bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {s.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-semibold text-slate-900">{s.fullName}</div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 sm:px-6 text-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 font-mono">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold text-slate-900">{s.username || s.email}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 sm:px-6">
                      {s.role === "inspector" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <QrCode className="w-3 h-3 text-purple-600" />
                          <span>Inspektor (Tekshiruvchi)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Tag className="w-3 h-3 text-emerald-600" />
                          <span>Moddiy Javobgar (Registrar)</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 sm:px-6">
                      <div className="flex flex-col gap-1.5 items-start">
                        <ToggleStaffStatusButton
                          userId={s.userId}
                          fullName={s.fullName}
                          isActive={s.isActive}
                        />

                        {s.mustChangePassword && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200" title="Birinchi kirishda parolni almashtirishi shart">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Vaqtinchalik parol</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 sm:px-6 text-slate-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(s.createdAt).toLocaleDateString("uz-UZ")}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 sm:px-6 text-right">
                      <ResetStaffPasswordModal
                        userId={s.userId}
                        fullName={s.fullName}
                        username={s.username}
                        role={s.role}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
