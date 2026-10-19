import Link from "next/link";
import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { getOrgDashboardData } from "@/lib/data/dashboard";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PlayCircle,
  Building2,
  ArrowRight,
  Plus,
  ClipboardCheck,
  FileSpreadsheet,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata = {
  title: "Boshqaruv Paneli — AssetAudit",
  description: "Universitet va tashkilotlar uchun markazlashgan QR inventarizatsiya va mulk nazorati boshqaruvi",
};

export const instant = false;

export default async function OrgDashboardPage() {
  // 1. Server-side Tenant Admin avtorizatsiyasi (Multi-tenant izolyatsiyasi)
  const { organization } = await requireOrganizationAdmin();

  // 2. Real tenant-scoped statistikalar
  const { stats, buildingDistribution, recentActivity } = await getOrgDashboardData(organization.id);

  const total = stats.totalItems;
  const verified = stats.verifiedItemsCount;
  const conflicts = stats.conflictsCount;
  const pending = stats.unverifiedItemsCount;

  const verifiedPercent = total > 0 ? ((verified / total) * 100).toFixed(1) : "0.0";
  const conflictPercent = total > 0 ? ((conflicts / total) * 100).toFixed(1) : "0.0";
  const pendingPercent = total > 0 ? ((pending / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8 w-full pb-10">
      {/* 1. Yuqori salomlashish va Kampaniya Sarlavhasi */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            Universitet Boshqaruv Paneli
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/org/inventory/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs hover:shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yangi inventar</span>
          </Link>
          <Link
            href="/org/audits"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Audit sikli</span>
          </Link>
          <Link
            href="/org/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hisobot</span>
          </Link>
        </div>
      </div>

      {/* 2. Asosiy 5 ta Statistik Kartalar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="JAMI INVENTARLAR"
          value={total.toLocaleString()}
          subtitle="Bazada ro‘yxatga olingan jami buyumlar"
          icon={Package}
          colorVariant="blue"
          badgeText="100%"
          badgeVariant="neutral"
        />

        <StatCard
          title="O‘Z JOYIDA TOPILGAN"
          value={verified.toLocaleString()}
          subtitle="O‘z biriktirilgan xonasida skanerlandi"
          icon={CheckCircle2}
          colorVariant="green"
          badgeText={`${verifiedPercent}%`}
          badgeVariant="success"
        />

        <StatCard
          title="BOSHQA XONADA TOPILGAN"
          value={conflicts.toLocaleString()}
          subtitle="Nomuvofiq — asl xonasi boshqa"
          icon={AlertTriangle}
          colorVariant="amber"
          badgeText={`${conflictPercent}%`}
          badgeVariant="warning"
        />

        <StatCard
          title="HALI ANIQLANMAGAN"
          value={pending.toLocaleString()}
          subtitle="Skanerlanmagan"
          icon={Clock}
          colorVariant="slate"
          badgeText={`${pendingPercent}%`}
          badgeVariant="neutral"
        />

        <StatCard
          title="JARAYONDAGI XONALAR"
          value={stats.activeCyclesCount > 0 ? String(stats.activeCyclesCount) : "0"}
          subtitle="Ayni paytda tekshirilmoqda"
          icon={PlayCircle}
          colorVariant="blue"
          badgeText="Faol"
          badgeVariant="success"
        />
      </div>

      {/* 3. Asosiy blok: Binolar statistikasi & So'nggi tekshiruvlar */}
      <div className="space-y-8">
        {/* A. Binolar bo‘yicha tekshiruv holati */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-2xs">
          <SectionHeader
            title="Binolar bo‘yicha tekshiruv holati"
            description={`${organization.name} bo‘yicha binolar kesimida o‘tkazilgan inventarizatsiya natijalari`}
            badge={`${buildingDistribution.length} ta bino`}
          />

          <div className="mt-6 space-y-4">
            {buildingDistribution.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Hozircha binolar kiritilmagan.{" "}
                <Link href="/org/buildings" className="text-blue-600 font-semibold underline">
                  Bino qo‘shish
                </Link>
              </div>
            ) : (
              buildingDistribution.map((bldg) => {
                const bldgPercent = total > 0 ? Math.min(100, Math.round((bldg.itemsCount / total) * 100)) : 0;

                return (
                  <div
                    key={bldg.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900">
                            {bldg.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {bldg.itemsCount} ta inventar &bull; {bldg.roomsCount} xona
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          {bldgPercent}%
                        </span>
                        <span className="text-xs text-slate-500 ml-1">yakunlandi</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${bldgPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* B. So'nggi faoliyat va tekshiruvlar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                So‘nggi tekshiruvlar va harakatlar
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Tekshiruvchilar tomonidan amalga oshirilayotgan xona va inventar sessiyalari
              </p>
            </div>

            <Link
              href="/org/audits"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span>Barcha auditlar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {recentActivity.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Hali faoliyatlar qayd etilmagan.
              </div>
            ) : (
              recentActivity.map((act) => (
                <div key={act.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      {act.type === "scan" ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Package className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {act.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {act.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {act.statusBadge && (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          act.statusBadge.variant === "success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : act.statusBadge.variant === "danger"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {act.statusBadge.label}
                      </span>
                    )}
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
