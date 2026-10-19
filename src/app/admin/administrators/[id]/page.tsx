import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { getOrganizationAdminDetails } from "@/lib/data/administrators";
import { AdminPasswordCell } from "../admin-password-cell";
import { ToggleAdminStatusButton } from "../toggle-admin-status-button";
import { CopyButton } from "./copy-button";
import {
  User,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  ExternalLink,
  Package,
  Users,
  Clock,
  Layers,
  Activity,
  DoorClosed,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Administrator Profili va Faoliyati — AssetAudit",
  description: "Tashkilot mas'ul administratori profili, hisob ma'lumotlari va faoliyat monitoringi",
};

export const instant = false;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminDetailsProfilePage({ params }: PageProps) {
  // 1. Super Admin avtorizatsiyasi (Server-side himoya)
  await requirePlatformAdmin();

  // 2. Administrator ID parametrini o'qish
  const { id } = await params;
  const admin = await getOrganizationAdminDetails(id);

  if (!admin) {
    notFound();
  }

  const stats = admin.dashboard?.stats;
  const rawEmail = admin.email && !admin.email.endsWith("@auth.assetaudit.uz")
    ? admin.email
    : (admin.username || admin.email);
  const rawPhone = admin.phone || "+998 (93) 364-20-30";
  const cleanPhone = rawPhone.replace(/[^+\d]/g, "");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Sarlavha va Orqaga qaytish */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-sm shrink-0">
            {admin.fullName.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {admin.fullName}
          </h1>
        </div>

        {/* Amallar tugmalari */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/administrators"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Ro&apos;yxatga qaytish</span>
          </Link>

          <ToggleAdminStatusButton
            userId={admin.userId}
            fullName={admin.fullName}
            isActive={admin.isActive}
          />
        </div>
      </div>

      {/* 2. Asosiy Grid: Chapda Kirish Profili | O'ngda Ishlar va Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHAP USTUN: Shaxsiy va Kirish Profili */}
        <div className="space-y-6 lg:col-span-1">
          {/* Kirish ma'lumotlari kartasi */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <User className="w-4 h-4 text-blue-600" />
                <span>Kirish va Profil Ma&apos;lumotlari</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 font-mono">
                ID: {admin.userId.slice(0, 8)}...
              </span>
            </div>

            <div className="space-y-3.5">
              {/* To'liq ism */}
              <div>
                <label className="text-[11px] font-medium text-slate-400">To&apos;liq ism</label>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {admin.fullName}
                </div>
              </div>

              {/* Gmail / Kirish emaili */}
              <div>
                <label className="text-[11px] font-medium text-slate-400">
                  Gmail manzili
                </label>
                <div className="flex items-center justify-between mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-mono text-xs font-bold text-slate-900 truncate">
                      {rawEmail}
                    </span>
                  </div>
                  <CopyButton text={rawEmail} title="Gmail manzilidan nusxa olish" />
                </div>
              </div>

              {/* Kirish Paroli */}
              <div>
                <label className="text-[11px] font-medium text-slate-400">Kirish Paroli</label>
                <div className="mt-1">
                  <AdminPasswordCell password={admin.password} />
                </div>
              </div>

              {/* Telefon raqami */}
              <div>
                <label className="text-[11px] font-medium text-slate-400">Telefon raqami</label>
                <div className="flex items-center justify-between mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{rawPhone}</span>
                  </a>
                  <CopyButton text={rawPhone} title="Telefon raqamidan nusxa olish" />
                </div>
              </div>

              {/* Biriktirilgan Tashkilot */}
              <div>
                <label className="text-[11px] font-medium text-slate-400">Tashkilot</label>
                <div className="mt-1 flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {admin.organizationName || "Bog'lanmagan"}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Kodi: {admin.organizationCode || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ro'yxatdan o'tgan sana */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Qo&apos;shilgan:</span>
                </span>
                <span className="font-semibold text-slate-700">
                  {new Date(admin.createdAt).toLocaleDateString("uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Super Admin uchun Kabinetga kirish va Kuzatuv yo'riqnomasi */}
          <div className="bg-linear-to-br from-blue-50/70 to-indigo-50/50 rounded-2xl border border-blue-200/80 p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Ishlarni Kuzatish va Boshqaruv</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Siz ushbu administratorning <strong>{rawEmail}</strong> emaili va maxfiy paroli orqali istalgan paytda tizimga kirib, tashkilotning barcha amallari, auditlari va buyumlarini to&apos;g&apos;ridan-to&apos;g&apos;ri kuzatishingiz mumkin.
            </p>
            <div className="pt-2">
              <a
                href="/login"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span>Kirish sahifasini ochish</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* O'NG USTUN: Tashkilot Ishlari, Statistikasi va Monitoring */}
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Monitoring Kartalari */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Jami mulklar */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Mulklar</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                {stats?.totalItems ?? 0} ta
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Faol: {stats?.activeItems ?? 0} ta
              </div>
            </div>

            {/* Audit qilingan */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Audit Sanoqi</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-2">
                {stats?.verifiedItemsCount ?? 0} ta
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                Progress: {stats?.progressPercent ?? 0}%
              </div>
            </div>

            {/* Binolar & Xonalar */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Infratuzilma</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                {stats?.buildingsCount ?? 0} bino
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {stats?.roomsCount ?? 0} ta xona
              </div>
            </div>

            {/* Xodimlar & Auditorlar */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Xodimlar</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                {stats?.activeStaffCount ?? 0} ta
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {stats?.activeCyclesCount ?? 0} faol sikl
              </div>
            </div>
          </div>

          {/* 2. Oxirgi Faoliyatlar va Skanerlashlar (Live Activity Stream) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Oxirgi Faoliyatlar va Amallar Tarixi
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Real vaqt monitoringi
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {admin.dashboard?.recentActivity && admin.dashboard.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {admin.dashboard.recentActivity.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {act.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {act.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {act.statusBadge && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(act.timestamp).toLocaleTimeString("uz-UZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Hozircha faoliyat qaydlari yo&apos;q
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    Ushbu tashkilot administratori yoki mas&apos;ul xodimlari tizimda yangi mulk kiritganda yoki QR audit o&apos;tkazganda amallar bu yerda darhol aks etadi.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Tashkilot Mulklari / Inventarlar Jadvali */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Tashkilot Mulklari (Inventarlar)
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                So&apos;nggi kiritilganlar
              </span>
            </div>

            {admin.recentItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    <tr>
                      <th scope="col" className="px-4 py-3">Inventar Raqam</th>
                      <th scope="col" className="px-4 py-3">Mulk Nomi</th>
                      <th scope="col" className="px-4 py-3">Joylashuvi (Xona / Bino)</th>
                      <th scope="col" className="px-4 py-3">Narxi</th>
                      <th scope="col" className="px-4 py-3">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {admin.recentItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-blue-700">
                          {item.inventoryNumber}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.roomNumber || item.roomName ? (
                            <span className="flex items-center gap-1">
                              <DoorClosed className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.roomNumber || item.roomName} ({item.buildingName || "Asosiy bino"})</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Belgilanmagan</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {item.price ? `${Number(item.price).toLocaleString("uz-UZ")} so'm` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : item.status === "repair"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.status === "active" ? "Faol" : item.status === "repair" ? "Ta'mirda" : item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/50">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                  <Package className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">
                  Hozircha inventar ro&apos;yxatga olinmagan
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Administrator yoki uning inspektorlari tomonidan inventarlar kiritilishi bilan bu jadval to&apos;ldirib boriladi.
                </p>
              </div>
            )}
          </div>

          {/* 4. Audit Sikllari va Jamoa Xodimlari */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Audit Sikllari */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Audit Sikllari
                </h4>
              </div>

              {admin.cyclesList.length > 0 ? (
                <div className="space-y-2.5">
                  {admin.cyclesList.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{c.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Boshlangan: {new Date(c.startDate).toLocaleDateString("uz-UZ")}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  Hozircha audit sikllari mavjud emas.
                </div>
              )}
            </div>

            {/* Mas'ul Xodimlar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                <Users className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Mas&apos;ul Xodimlar
                </h4>
              </div>

              {admin.staffMembers.length > 0 ? (
                <div className="space-y-2.5">
                  {admin.staffMembers.map((s) => (
                    <div key={s.userId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{s.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.email}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {s.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  Hozircha qo&apos;shimcha xodimlar qo&apos;shilmagan.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
