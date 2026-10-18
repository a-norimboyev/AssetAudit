import Link from "next/link";
import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { getInventoryCyclesList } from "@/lib/data/audit";
import { AddCycleModal } from "./add-cycle-modal";
import { CycleStatusManager } from "./cycle-status-manager";
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  DoorClosed,
  FileSpreadsheet,
} from "lucide-react";

export const metadata = {
  title: "Audit Sikllari — AssetAudit",
  description: "Tashkilot inventarizatsiya va mulk sanog‘i jarayonlari",
};

export const instant = false;

const CYCLE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  planned: { label: "Rejalashtirilgan", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  in_progress: { label: "Jarayonda", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  completed: { label: "Yakunlangan", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  cancelled: { label: "Bekor qilingan", color: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertCircle },
};

export default async function OrgAuditsPage() {
  const { organization } = await requireOrganizationAdmin();
  const cycles = await getInventoryCyclesList(organization.id);

  return (
    <div className="space-y-6">
      {/* Sarlavha va Harakat tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Inventarizatsiya Auditlari
          </h1>
        </div>

        <AddCycleModal />
      </div>

      {/* Sikllar Ro'yxati */}
      {cycles.length === 0 ? (
        <div className="bg-white p-10 sm:p-16 rounded-2xl border border-slate-200/80 shadow-2xs text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Hozircha audit sikllari mavjud emas
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Mulk sanog‘ini boshlash uchun birinchi audit siklini rejalashtiring. Tizim barcha xonalar uchun tekshiruv jadvallarini avtomatik tuzadi.
          </p>
          <div className="mt-6">
            <AddCycleModal />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {cycles.map((c) => {
            const statusMeta = CYCLE_STATUS_CONFIG[c.status] || CYCLE_STATUS_CONFIG.planned;
            const StatusIcon = statusMeta.icon;
            const progressPercent = c.totalRooms > 0 ? Math.round((c.completedRooms / c.totalRooms) * 100) : 0;

            return (
              <div
                key={c.id}
                className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5 hover:border-slate-300 hover:shadow-xs transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">{c.title}</h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.color}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusMeta.label}</span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>Boshlangan sana: {new Date(c.startDate).toLocaleDateString("uz-UZ")}</span>
                      {c.creatorName && (
                        <>
                          <span>•</span>
                          <span>Tashabbuskor: {c.creatorName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <CycleStatusManager
                      cycleId={c.id}
                      currentStatus={c.status}
                      cycleTitle={c.title}
                    />
                    <Link
                      href={`/org/reports?cycleId=${c.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Rekonsilyatsiya hisoboti</span>
                    </Link>
                  </div>
                </div>

                {/* Progress bari */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                    <span className="font-semibold flex items-center gap-1.5">
                      <DoorClosed className="w-4 h-4 text-blue-600" />
                      Xonalar tekshiruvi: {c.completedRooms} / {c.totalRooms} ta yakunlangan
                    </span>
                    <span className="font-mono font-bold text-blue-600">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Ko'rsatkichlar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Skanerlangan inventarlar</span>
                    <div className="font-bold text-slate-900 mt-0.5 text-sm sm:text-base">{c.scannedItemsCount} ta</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Konfliktli joylashuvlar</span>
                    <div className="font-bold text-amber-600 mt-0.5 text-sm sm:text-base">{c.conflictsCount} ta</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Holati</span>
                    <div className="font-semibold text-slate-700 mt-0.5">{statusMeta.label}</div>
                  </div>
                  <div className="text-right">
                    <Link
                      href={`/audit/scan?cycleId=${c.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-2"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Skan qilish</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
