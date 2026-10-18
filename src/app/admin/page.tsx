import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { getDashboardOverview } from "@/lib/data/organizations";
import {
  Building2,
  Lock,
  Database,
  CheckCircle2,
  Layers,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Hourglass,
  Eye,
  RefreshCw,
  Mail,
} from "lucide-react";
import { EditOrganizationModal } from "./organizations/edit-organization-modal";
import { OrganizationDetailsModal } from "./organizations/organization-details-modal";

export const metadata = {
  title: "Platforma Boshqaruvi — AssetAudit",
  description: "AssetAudit SaaS platformasining boshqaruv paneli (Faqat Super Admin)",
};

export const instant = false;

export default async function AdminPage() {
  await requirePlatformAdmin();

  // Haqiqiy PostgreSQL ma'lumotlar bazasidan monitoring ma'lumotlari
  const { stats, recentOrganizations, expiringOrganizations, types } =
    await getDashboardOverview();

  return (
    <div className="space-y-6">
      {/* 1. Yuqori sarlavha va tezkor amallar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Platforma Boshqaruv Markazi
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/organizations"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Tashkilotlar ro‘yxati</span>
          </Link>

          <Link
            href="/admin/organizations/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi tashkilot qo‘shish</span>
          </Link>
        </div>
      </div>

      {/* 2. Haqiqiy Statistik Kartalar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jami tashkilotlar */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Jami tashkilotlar</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Platforma bo‘yicha</div>
        </div>

        {/* Faol tashkilotlar */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Faol tashkilotlar</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
            {stats.active}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Faol holatda</span>
          </div>
        </div>

        {/* Dostup Ogohlantirishlari */}
        <div
          className={`p-5 rounded-xl border shadow-2xs transition-shadow ${
            stats.expiringCount > 0
              ? "bg-amber-50/50 border-amber-200"
              : "bg-white border-slate-200/80 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dostup ogohlantirishlari</span>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                stats.expiringCount > 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {stats.expiringCount > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Hourglass className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-bold mt-3 tracking-tight ${
              stats.expiringCount > 0 ? "text-amber-900" : "text-slate-900"
            }`}
          >
            {stats.expiringCount} ta
          </div>
          <div
            className={`text-[11px] font-medium mt-1 flex items-center gap-1.5 ${
              stats.expiringCount > 0 ? "text-amber-700" : "text-emerald-600"
            }`}
          >
            {stats.expiringCount > 0 ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Muddati tugayotgan / tugagan</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Barchasi faol (0 ta xavf)</span>
              </>
            )}
          </div>
        </div>

        {/* Tashkilot turlari */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tashkilot turlari</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
            {stats.typesCount} ta
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">OTM, maktab, korxona va h.k.</div>
        </div>
      </div>

      {/* 3. DOSTUP MUDDATI TUGAYOTGAN TASHKILOTLAR OGOHLANTIRISH BLOKI */}
      {expiringOrganizations.length > 0 ? (
        <div className="p-5 rounded-xl border border-amber-300/80 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-amber-950 flex items-center gap-2">
                  <span>Dostup muddati tugayotgan yoki tugagan tashkilotlar</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900">
                    {expiringOrganizations.length} ta
                  </span>
                </h2>
                <p className="text-xs text-amber-800/90 mt-0.5">
                  Quyidagi tashkilotlarning tizimdan foydalanish muddati tugagan yoki 30 kundan kam vaqt qolgan. Tashkilot bilan bog‘lanib, to‘g‘ridan-to‘g‘ri muddatni uzaytirishingiz mumkin.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {expiringOrganizations.map((org) => {
              const isExpired = org.subscription.status === "expired";
              return (
                <div
                  key={org.id}
                  className={`p-4 rounded-xl border bg-white flex flex-col justify-between gap-3 shadow-2xs ${
                    isExpired ? "border-rose-300" : "border-amber-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm truncate">
                          {org.name}
                        </h3>
                        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {org.code}
                        </span>
                      </div>
                      {org.admin && (
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{org.admin.email || org.admin.username}</span>
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 border ${
                        isExpired
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {org.subscription.statusLabel}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <div className="text-slate-500">
                      <span>Joriy: <strong>{org.subscription.planLabel}</strong></span>
                      <span className="mx-1.5 text-slate-300">&bull;</span>
                      <span>
                        Tugash: <strong>{new Intl.DateTimeFormat("uz-UZ").format(new Date(org.subscription.expiresAt))}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <OrganizationDetailsModal
                        organization={org}
                        types={types}
                        trigger={
                          <button
                            type="button"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                            title="Batafsil ma'lumot"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        }
                      />

                      <EditOrganizationModal
                        organization={org}
                        types={types}
                        trigger={
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Muddatni uzaytirish</span>
                          </button>
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-emerald-950">
                Barcha tashkilotlarning dostup muddati to‘liq faol
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-800/80 mt-0.5">
                Yaqin 30 kun ichida muddati tugaydigan birorta tashkilot yo‘q. Platforma litsenziyalari barqaror holatda.
              </p>
            </div>
          </div>
          <Link
            href="/admin/organizations"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Tashkilotlar monitoringi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4. Tashkilotlar va Dostup Monitoringi Jadvali */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Hourglass className="w-4 h-4 text-blue-600" />
              <span>Tashkilotlar va Dostup Monitoringi</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Platformadagi tashkilotlarning litsenziya muddatlari va administratorlari
            </p>
          </div>

          <Link
            href="/admin/organizations"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
          >
            <span>Barchasini ko‘rish ({stats.total})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrganizations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Hozircha hech qanday tashkilot ro‘yxatga olinmagan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Tashkilot</th>
                  <th className="px-5 py-3.5">Admin (Gmail)</th>
                  <th className="px-5 py-3.5">O‘rnatilgan sana</th>
                  <th className="px-5 py-3.5">Dostup muddati</th>
                  <th className="px-5 py-3.5">Holati & Qolgan kunlar</th>
                  <th className="px-5 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentOrganizations.map((org) => {
                  const formattedStartDate = new Intl.DateTimeFormat("uz-UZ", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).format(new Date(org.subscription.startsAt));

                  return (
                    <tr key={org.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Tashkilot nomi */}
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        <OrganizationDetailsModal
                          organization={org}
                          types={types}
                          trigger={
                            <div className="flex items-center gap-3 cursor-pointer group text-left">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold border border-blue-100 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {org.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                  <span>{org.name}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  <span>{org.code}</span>
                                  <span className="mx-1 text-slate-300">&bull;</span>
                                  <span>{org.typeName || org.typeId}</span>
                                </div>
                              </div>
                            </div>
                          }
                        />
                      </td>

                      {/* Admin Gmail */}
                      <td className="px-5 py-3.5">
                        {org.admin ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium truncate">{org.admin.email || org.admin.username}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Mavjud emas</span>
                        )}
                      </td>

                      {/* O'rnatilgan sana */}
                      <td className="px-5 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedStartDate}</span>
                        </div>
                      </td>

                      {/* Dostup muddati */}
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800 text-xs">
                          {org.subscription.planLabel}
                        </span>
                      </td>

                      {/* Holati va qolgan kunlar */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            org.subscription.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : org.subscription.status === "expiring_soon"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              org.subscription.status === "active"
                                ? "bg-emerald-500"
                                : org.subscription.status === "expiring_soon"
                                ? "bg-amber-500 animate-pulse"
                                : "bg-rose-500"
                            }`}
                          />
                          <span>{org.subscription.statusLabel}</span>
                        </span>
                      </td>

                      {/* Amallar */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EditOrganizationModal
                            organization={org}
                            types={types}
                            trigger={
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                                title="Muddatni uzaytirish"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Uzaytirish</span>
                              </button>
                            }
                          />

                          <OrganizationDetailsModal
                            organization={org}
                            types={types}
                            trigger={
                              <button
                                type="button"
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                                title="Batafsil ma'lumot"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Xavfsizlik ko'rsatkichlari kartalari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Multi-Tenant Izolyatsiyasi
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Qat’iy qoida: Super Admin platformani boshqaradi, ammo tashkilotlarning ichki inventar va auditlariga ruxsatsiz kira olmaydi.
          </p>
          <div className="mt-3 text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Qat’iy himoyalangan</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            PostgreSQL Klasteri
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            PostgreSQL mustaqil klasteri, Drizzle ORM migratsiyalari va least-privilege rollari to‘liq soz holatda.
          </p>
          <div className="mt-3 text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Jadvallar online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
