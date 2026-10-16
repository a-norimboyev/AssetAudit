import Link from "next/link";
import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { getOrgDashboardData } from "@/lib/data/dashboard";
import {
  Building2,
  Building,
  QrCode,
  Users,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  FileSpreadsheet,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "Tashkilot Boshqaruv Paneli — AssetAudit",
  description: "TATU va davlat tashkilotlari uchun markazlashgan QR inventarizatsiya va mulk nazorati boshqaruvi",
};

export const instant = false;

export default async function OrgDashboardPage() {
  // 1. Server-side Tenant Admin avtorizatsiyasi (Multi-tenant izolyatsiyasi)
  const { profile, user, organization } = await requireOrganizationAdmin();

  // 2. Real tenant-scoped statistikalar
  const { stats, buildingDistribution, recentActivity } = await getOrgDashboardData(organization.id);

  const settings = (organization.settings as {
    inventoryPrefix?: string;
    defaultQrVisibility?: string;
    allowPublicScanLogs?: boolean;
  }) || {};

  const inventoryPrefix = settings.inventoryPrefix || `${organization.code}-`;

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Tashkilot Sarlavhasi va Salomlashish */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {organization.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-[3px] text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {organization.code}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Faol SaaS Muhiti</span>
            </span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
            Xush kelibsiz, <strong>{profile.fullName}</strong> ({user.email}). Tashkilot ichki inventarizatsiya va mulk nazorati.
          </p>
        </div>

        {/* Tezkor harakatlar (Quick actions) */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/org/inventory/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yangi inventar</span>
          </Link>
          <Link
            href="/org/audits"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-xs"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Audit sikli</span>
          </Link>
          <Link
            href="/org/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hisobot</span>
          </Link>
        </div>
      </div>

      {/* 2. Asosiy KPI Kartalari (Real Tenant Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Jami inventarlar */}
        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Jami inventarlar</span>
            <QrCode className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.totalItems.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-400">dona</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span className="text-emerald-600 font-medium">{stats.activeItems} faol</span>
            <span>•</span>
            <span className="text-amber-600">{stats.repairItems} ta&apos;mirda</span>
          </div>
        </div>

        {/* Binolar va Lokatsiyalar */}
        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Binolar / Xonalar</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.buildingsCount}{" "}
            <span className="text-xs font-normal text-slate-400">bino</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span>{stats.floorsCount} qavat</span>
            <span>•</span>
            <span className="font-medium text-slate-700">{stats.roomsCount} xona</span>
          </div>
        </div>

        {/* Mas'ul xodimlar */}
        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Mas&apos;ul xodimlar</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.activeStaffCount}{" "}
            <span className="text-xs font-normal text-slate-400">nafar</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Inspektor va registratorlar
          </div>
        </div>

        {/* Faol Audit Sikllari */}
        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Aktiv Audit Sikllari</span>
            <ClipboardCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.activeCyclesCount}{" "}
            <span className="text-xs font-normal text-slate-400">jarayonda</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.activeCyclesCount > 0 ? "Tekshiruv olib borilmoqda" : "Rejalashtirilmagan"}
          </div>
        </div>
      </div>

      {/* 3. Inventarizatsiya Progress Paneli */}
      <div className="p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Inventarizatsiya Jarayoni va Rekonsilyatsiya</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Eng so&apos;nggi audit sikli bo&apos;yicha skanerlash va nomuvofiqlik ko&apos;rsatkichlari
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-blue-600">{stats.progressPercent}%</span>
            <span className="text-xs text-slate-400 ml-1">bajarildi</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${stats.progressPercent}%` }}
            title={`Tekshirildi: ${stats.progressPercent}%`}
          ></div>
        </div>

        {/* 3 ta Kichik Metrika: Tekshirilgan, Kutilayotgan, Konfliktlar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-2.5 rounded-[3px] bg-emerald-50 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-900 font-medium">Mos kelganlar:</span>
            </div>
            <strong className="text-emerald-700 font-bold">{stats.verifiedItemsCount} dona</strong>
          </div>

          <div className="p-2.5 rounded-[3px] bg-amber-50 border border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-amber-900 font-medium">Konfliktlar (Begona xona):</span>
            </div>
            <strong className="text-amber-700 font-bold">{stats.conflictsCount} ta</strong>
          </div>

          <div className="p-2.5 rounded-[3px] bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-slate-700 font-medium">Tekshirilmagan:</span>
            </div>
            <strong className="text-slate-800 font-bold">{stats.unverifiedItemsCount} dona</strong>
          </div>
        </div>
      </div>

      {/* 4. Binolar Bo'yicha Inventar Taqsimoti va So'nggi Faoliyatlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chap blok: Binolar bo'yicha taqsimot */}
        <div className="bg-white p-5 rounded-[4px] border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Binolar Bo&apos;yicha Inventar Taqsimoti
              </h3>
            </div>
            <Link
              href="/org/buildings"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>Barchasi</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {buildingDistribution.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Hozircha binolar kiritilmagan.
            </div>
          ) : (
            <div className="space-y-3">
              {buildingDistribution.map((b) => (
                <div key={b.id} className="p-3 rounded-[3px] bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">
                      {b.name}{" "}
                      <span className="font-mono text-[11px] text-slate-400">({b.code})</span>
                    </span>
                    <span className="font-bold text-blue-600">{b.itemsCount} dona</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{b.roomsCount} ta faol xona</span>
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{
                          width: `${stats.totalItems > 0 ? Math.min(100, Math.round((b.itemsCount / stats.totalItems) * 100)) : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* O'ng blok: So'nggi Faoliyatlar Jurnali */}
        <div className="bg-white p-5 rounded-[4px] border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">
                So&apos;nggi Faoliyatlar
              </h3>
            </div>
            <span className="text-xs text-slate-400">Audit & Ro&apos;yxat</span>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Hozircha yangi faoliyat qayd etilmagan.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((act) => (
                <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-medium text-slate-900">{act.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{act.subtitle}</div>
                  </div>
                  <div className="text-right shrink-0">
                    {act.statusBadge && (
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-[2px] text-[10px] font-semibold ${
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
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(act.timestamp).toLocaleTimeString("uz-UZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Tashkilot Asosiy Parametrlari va Xavfsizlik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-[4px] border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Tashkilot Konfiguratsiyasi
            </h3>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-slate-500">Tashkilot nomi</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">{organization.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Slug kodi</dt>
              <dd className="font-mono font-bold text-blue-600 mt-0.5">{organization.code}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Inventar prefiksi</dt>
              <dd className="font-mono font-semibold text-slate-900 mt-0.5">{inventoryPrefix}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Hisoblangan umumiy balans</dt>
              <dd className="font-semibold text-emerald-700 mt-0.5">
                {stats.totalValue > 0
                  ? `${stats.totalValue.toLocaleString("uz-UZ")} UZS`
                  : "0 UZS (Baholanmagan)"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white p-5 rounded-[4px] border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Multi-Tenant Himoyasi va RBAC
            </h3>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="p-2.5 rounded-[3px] bg-slate-50 border border-slate-100 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Avtonom Tenant Izolyatsiyasi:</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Har bir inventar va scan yozuvi PostgreSQL darajasida tashkilot ID si bilan muhrlanadi.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-[3px] bg-slate-50 border border-slate-100 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Audit va Rekonsilyatsiya Kafolati:</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Inspektor skani rasmiy xonani ruxsatsiz o&apos;zgartirmaydi, balki nomuvofiqlik (Conflict) sifatida xolis qayd etadi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
