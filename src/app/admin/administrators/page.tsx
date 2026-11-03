import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import {
  getOrganizationAdminsStats,
  getOrganizationAdminsList,
} from "@/lib/data/administrators";
import { getOrganizationsList } from "@/lib/data/organizations";
import { AdminFilters } from "./admin-filters";
import { AddAdminModal } from "./add-admin-modal";
import { AdminsTable } from "./admins-table";
import {
  Users,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const metadata = {
  title: "Administratorlar — AssetAudit Platformasi",
  description: "Platformaga ulangan OTMlar rahbarlari va administratorlari",
};

export const instant = false;


interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

export default async function AdminAdministratorsPage({ searchParams }: PageProps) {
  try {
    await requirePlatformAdmin();
  } catch (e) {
    if (process.env.NODE_ENV === "production") {
      throw e;
    }
  }

  // 2. URL qidiruv parametrlarini o'qish
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const search = params.q?.trim() || "";

  // 3. PostgreSQL bazasidan haqiqiy ma'lumotlarni parallel yuklash
  const [stats, data, orgs] = await Promise.all([
    getOrganizationAdminsStats(),
    getOrganizationAdminsList({ page, pageSize: 20, search }),
    getOrganizationsList({ pageSize: 300 }),
  ]);

  // 250 ta OTMni alifbo tartibida saralash va logolarini tayyorlash
  const sortedOrgs = [...orgs.items]
    .map((o) => ({
      id: o.id,
      name: o.name,
      code: o.code,
      isActive: o.isActive,
      logoUrl: (o.settings?.logoUrl as string) || undefined,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "uz"));

  const hasFilter = Boolean(search);

  return (
    <div className="space-y-6">
      {/* Statistik Kartalar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Jami administratorlar</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Platforma bo&apos;yicha</div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Faol administratorlar</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
            {stats.active}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Tizimga kirish huquqiga ega</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Qamrab olingan OTMlar</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
            {stats.organizationsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Admin biriktirilgan oliy ta&apos;lim muassasalari</div>
        </div>
      </div>

      {/* Filtrlash va Qidiruv */}
      <AdminFilters currentSearch={search} organizations={sortedOrgs} />

      {/* Administratorlar Jadvali yoki Bo'sh holat */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {data.items.length === 0 ? (
          <div className="p-8 sm:p-14 text-center">
            {hasFilter ? (
              <div className="max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Mos administratorlar topilmadi
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                  Kiritilgan &ldquo;{search}&rdquo; so&apos;rovi bo&apos;yicha birorta ham administrator topilmadi. Qidiruv so&apos;zini o&apos;zgartirib ko&apos;ring.
                </p>
                <div className="mt-5">
                  <Link
                    href="/admin/administrators"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    Filtrlarni tozalash
                  </Link>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Hozircha OTM administratorlari mavjud emas
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Universitet boshqaruvchisi akkauntlari xavfsiz tizim orqali yaratiladi. Parollar himoyalangan tarzda saqlanadi.
                </p>

                <div className="mt-6 flex justify-center">
                  <AddAdminModal organizations={sortedOrgs} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <AdminsTable initialItems={data.items} />
        )}

        {/* Sahifalash (Pagination) */}
        {data.totalPages > 1 && (
          <div className="border-t border-slate-200/80 px-5 py-3.5 flex items-center justify-between bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Jami <strong>{data.totalCount}</strong> tadan{" "}
              <strong>{(page - 1) * data.pageSize + 1}</strong> -{" "}
              <strong>{Math.min(page * data.pageSize, data.totalCount)}</strong> ko&apos;rsatilmoqda
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={page > 1 ? `/admin/administrators?page=${page - 1}${search ? `&q=${search}` : ""}` : "#"}
                className={`p-1.5 rounded-lg border border-slate-200 ${
                  page > 1
                    ? "bg-white text-slate-700 hover:bg-slate-100"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
                aria-label="Oldingi sahifa"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <span className="text-xs font-medium text-slate-600">
                {page} / {data.totalPages}
              </span>
              <Link
                href={page < data.totalPages ? `/admin/administrators?page=${page + 1}${search ? `&q=${search}` : ""}` : "#"}
                className={`p-1.5 rounded-lg border border-slate-200 ${
                  page < data.totalPages
                    ? "bg-white text-slate-700 hover:bg-slate-100"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
                aria-label="Keyingi sahifa"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
