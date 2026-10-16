import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import {
  getOrganizationsStats,
  getOrganizationTypesList,
  getOrganizationsList,
} from "@/lib/data/organizations";
import { OrganizationFilters } from "./organization-filters";
import { EditOrganizationModal } from "./edit-organization-modal";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Layers,
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileQuestion,
} from "lucide-react";

export const metadata = {
  title: "Tashkilotlar — AssetAudit Platformasi",
  description: "Platformaga ulangan tashkilotlarni boshqarish",
};

export const instant = false;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    type?: string;
  }>;
}

export default async function AdminOrganizationsPage({ searchParams }: PageProps) {
  // 1. Super Admin avtorizatsiyasi (Server-side himoya)
  await requirePlatformAdmin();

  // 2. URL qidiruv va filtrlash parametrlarini o'qish
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const search = params.q?.trim() || "";
  const typeId = params.type?.trim() || "all";

  // 3. PostgreSQL bazasidan haqiqiy ma'lumotlarni parallel yuklash
  const [stats, types, data] = await Promise.all([
    getOrganizationsStats(),
    getOrganizationTypesList(),
    getOrganizationsList({ page, pageSize: 20, search, typeId }),
  ]);

  const hasFilter = Boolean(search || (typeId && typeId !== "all"));

  return (
    <div className="space-y-6">
      {/* Sahifa Sarlavhasi va Harakat bloki */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Tashkilotlar
            </h1>
            <span className="px-2 py-0.5 rounded-[3px] text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {stats.total} ta
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Platformaga ulangan tashkilotlarni boshqarish
          </p>
        </div>

        {/* Yangi tashkilot qo'shish tugmasi */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/organizations/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi tashkilot qo‘shish</span>
          </Link>
        </div>
      </div>

      {/* Haqiqiy Statistik Kartalar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Jami tashkilotlar</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Platforma bo‘yicha</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Faol tashkilotlar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.active}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Faol holatda</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Nofaol tashkilotlar</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.inactive}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Bloklangan</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tashkilot turlari</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.typesCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">OTM, maktab, korxona...</div>
        </div>
      </div>

      {/* Qidiruv va Filter bloki */}
      <OrganizationFilters
        types={types}
        currentSearch={search}
        currentType={typeId}
      />

      {/* Asosiy Tashkilotlar Jadvali yoki Bo'sh Holat */}
      <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-xs overflow-hidden">
        {data.items.length === 0 ? (
          <div className="p-10 sm:p-16 text-center flex flex-col items-center justify-center">
            {hasFilter ? (
              <>
                <div className="w-12 h-12 rounded-[4px] bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-100">
                  <FileQuestion className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Hech qanday tashkilot topilmadi
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
                  Kiritilgan qidiruv yoki tanlangan tur bo‘yicha natija chiqmadi. Filtrlarni tozalab ko‘ring.
                </p>
                <div className="mt-4">
                  <Link
                    href="/admin/organizations"
                    className="inline-flex items-center px-4 py-2 rounded-[3px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Barcha tashkilotlarni ko‘rish
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-[4px] bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100 shadow-xs">
                  <Building2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Hozircha tashkilotlar qo‘shilmagan
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 max-w-md leading-relaxed">
                  Yangi tashkilot qo‘shish orqali unga administrator tayinlashingiz mumkin.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href="/admin/organizations/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Birinchi tashkilotni qo‘shish</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop va Planshet Jadvali */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Tashkilot nomi</th>
                    <th className="px-5 py-3.5">Tashkilot kodi</th>
                    <th className="px-5 py-3.5">Tashkilot turi</th>
                    <th className="px-5 py-3.5">Holati</th>
                    <th className="px-5 py-3.5 text-right">Ro‘yxatga olingan</th>
                    <th className="px-5 py-3.5 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.items.map((org) => {
                    const formattedDate = new Intl.DateTimeFormat("uz-UZ", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }).format(new Date(org.createdAt));

                    return (
                      <tr
                        key={org.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                          {org.name}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-blue-700">
                          <span className="px-2 py-0.5 rounded-[2px] bg-blue-50 border border-blue-200">
                            {org.code}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {org.typeName || org.typeId}
                        </td>
                        <td className="px-5 py-3.5">
                          {org.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Faol</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>Nofaol</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formattedDate}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end">
                            <EditOrganizationModal organization={org} types={types} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Boshqaruvi */}
            {data.totalPages > 1 && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  Jami <strong>{data.totalCount}</strong> ta tashkilotdan{" "}
                  <strong>{(page - 1) * 20 + 1}</strong>-
                  <strong>{Math.min(page * 20, data.totalCount)}</strong> ko‘rsatilmoqda
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/organizations?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}${typeId && typeId !== "all" ? `&type=${encodeURIComponent(typeId)}` : ""}`}
                    aria-disabled={page <= 1}
                    tabIndex={page <= 1 ? -1 : undefined}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-200 bg-white text-xs font-medium ${
                      page <= 1
                        ? "opacity-50 pointer-events-none cursor-not-allowed"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Oldingi</span>
                  </Link>

                  <span className="px-2 font-medium text-slate-700">
                    {page} / {data.totalPages}
                  </span>

                  <Link
                    href={`/admin/organizations?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}${typeId && typeId !== "all" ? `&type=${encodeURIComponent(typeId)}` : ""}`}
                    aria-disabled={page >= data.totalPages}
                    tabIndex={page >= data.totalPages ? -1 : undefined}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] border border-slate-200 bg-white text-xs font-medium ${
                      page >= data.totalPages
                        ? "opacity-50 pointer-events-none cursor-not-allowed"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span>Keyingi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
