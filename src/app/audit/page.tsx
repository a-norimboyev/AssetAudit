import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser, AuthError } from "@/lib/auth/authorization";
import { ForceChangePasswordCard } from "@/components/auth/force-change-password-card";
import { OrgLogoutButton } from "@/app/org/org-logout-button";
import { canPerformAudit } from "@/lib/auth/authorization-rules";
import { getActiveCycle, getRoomAuditsForCycle } from "@/lib/data/audit";
import {
  QrCode,
  Building,
  DoorClosed,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Tekshiruvchi Paneli — AssetAudit",
  description: "Inventarizatsiya tekshiruvchisi ishchi portali",
};

export const instant = false;

export default async function InspectorDashboardPage() {
  let context;
  try {
    context = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.code === "AUTHENTICATION_REQUIRED") {
        redirect("/login");
      }
      if (error.code === "PASSWORD_CHANGE_REQUIRED") {
        return <ForceChangePasswordCard />;
      }
    }
    redirect("/login");
  }

  const { profile, organization } = context;

  if (!organization || !canPerformAudit(profile.role)) {
    redirect("/login");
  }

  const activeCycle = await getActiveCycle(organization.id);
  const roomAuditsList = activeCycle
    ? await getRoomAuditsForCycle({ organizationId: organization.id, cycleId: activeCycle.id })
    : [];

  const completedRooms = roomAuditsList.filter((r) => r.status === "completed").length;
  const inProgressRooms = roomAuditsList.filter((r) => r.status === "in_progress").length;
  const pendingRooms = roomAuditsList.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Yuqori Header */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[3px] bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
              A
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-slate-900">
                Asset<span className="text-blue-600">Audit</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {organization.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Inspektor</span>
            </span>
            <OrgLogoutButton />
          </div>
        </div>
      </header>

      {/* Asosiy Kontent */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Salomlashish va Faol Sikl Boshqaruv Kartasi */}
        <div className="p-5 sm:p-6 rounded-[4px] bg-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 rounded-[3px] text-[11px] font-semibold bg-blue-500/20 text-blue-200 border border-blue-500/30">
              Xush kelibsiz, {profile.fullName}
            </span>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-2">
              {activeCycle ? activeCycle.title : "Faol audit sikli mavjud emas"}
            </h1>
            <p className="mt-1 text-xs text-slate-300 max-w-xl">
              {activeCycle
                ? "QR skaner yordamida har bir xonadagi inventarlarni tekshiring. Kutilmagan xonadagi buyumlar avtomatik konflikt sifatida qayd etiladi."
                : "Hozirda tashkilotda faol inventarizatsiya sikli yo‘q. Yangi sikl boshlangach xonalar ro‘yxati bu yerda chiqadi."}
            </p>
          </div>

          {activeCycle && (
            <Link
              href="/audit/scan"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[3px] bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all shrink-0"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Skanerni ochish</span>
            </Link>
          )}
        </div>

        {/* Audit Progress Ko'rsatkichlari */}
        {activeCycle && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 rounded-[4px] bg-white border border-slate-200/80 shadow-xs text-center sm:text-left">
              <div className="text-xs text-slate-500 font-medium">Tekshirilgan</div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
                {completedRooms} <span className="text-xs font-normal text-slate-500">xona</span>
              </div>
            </div>

            <div className="p-4 rounded-[4px] bg-white border border-slate-200/80 shadow-xs text-center sm:text-left">
              <div className="text-xs text-slate-500 font-medium">Jarayonda</div>
              <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
                {inProgressRooms} <span className="text-xs font-normal text-slate-500">xona</span>
              </div>
            </div>

            <div className="p-4 rounded-[4px] bg-white border border-slate-200/80 shadow-xs text-center sm:text-left">
              <div className="text-xs text-slate-500 font-medium">Kutilmoqda</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {pendingRooms} <span className="text-xs font-normal text-slate-500">xona</span>
              </div>
            </div>
          </div>
        )}

        {/* Xonalar Tekshiruvi Ro'yxati */}
        <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DoorClosed className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Xonalar bo‘yicha tekshiruv holati
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Jami {roomAuditsList.length} ta xona
            </span>
          </div>

          {roomAuditsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Audit uchun xonalar biriktirilmagan yoki binolar hali yaratilmagan.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {roomAuditsList.map((r) => (
                <div
                  key={r.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[3px] bg-slate-100 font-mono font-bold text-xs flex items-center justify-center text-slate-800 shrink-0">
                      {r.roomNumber}
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-slate-900">
                        {r.roomName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{r.buildingName}</span>
                        <span>•</span>
                        <span>{r.floorName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {r.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Yakunlangan</span>
                      </span>
                    ) : r.status === "in_progress" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        <span>Skanlanmoqda</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[11px] font-semibold bg-slate-100 text-slate-600">
                        <span>Kutilmoqda</span>
                      </span>
                    )}

                    <Link
                      href={`/audit/scan?roomId=${r.roomId}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                    >
                      <span>Skanerlash</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        &copy; 2026 AssetAudit. Inspektor Portali.
      </footer>
    </div>
  );
}
