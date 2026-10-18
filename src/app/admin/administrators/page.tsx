import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import {
  getOrganizationAdminsStats,
  getOrganizationAdminsList,
} from "@/lib/data/administrators";
import { getOrganizationsList } from "@/lib/data/organizations";
import { AdminFilters } from "./admin-filters";
import { AddAdminModal } from "./add-admin-modal";
import { ToggleAdminStatusButton } from "./toggle-admin-status-button";
import {
  Users,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

export const metadata = {
  title: "Administratorlar — AssetAudit Platformasi",
  description: "Platformaga ulangan tashkilotlar rahbarlari va administratorlari",
};

export const instant = false;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

export default async function AdminAdministratorsPage({ searchParams }: PageProps) {
  // 1. Super Admin avtorizatsiyasi (Server-side himoya)
  await requirePlatformAdmin();

  // 2. URL qidiruv parametrlarini o'qish
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const search = params.q?.trim() || "";

  // 3. PostgreSQL bazasidan haqiqiy ma'lumotlarni parallel yuklash
  const [stats, data, orgs] = await Promise.all([
    getOrganizationAdminsStats(),
    getOrganizationAdminsList({ page, pageSize: 20, search }),
    getOrganizationsList({ pageSize: 100 }),
  ]);

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
            <span className="text-xs font-semibold text-slate-500">Qamrab olingan tashkilotlar</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
            {stats.organizationsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Admin biriktirilgan tashkilotlar</div>
        </div>
      </div>

      {/* Filtrlash va Qidiruv */}
      <AdminFilters currentSearch={search} organizations={orgs.items} />

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
                  Hozircha tashkilot administratorlari mavjud emas
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Tashkilot boshqaruvchisi akkauntlari xavfsizlik va parollarni himoya qilish maqsadida xavfsiz tizim orqali bootstrap qilinadi. Parollar maskalangan tarzda saqlanadi va scrypt orqali xeshlanadi.
                </p>

                <div className="mt-6 flex justify-center">
                  <AddAdminModal organizations={orgs.items} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Administrator</th>
                  <th scope="col" className="px-5 py-3.5">Tashkilot</th>
                  <th scope="col" className="px-5 py-3.5">Roli</th>
                  <th scope="col" className="px-5 py-3.5">Holati</th>
                  <th scope="col" className="px-5 py-3.5">Qo&apos;shilgan sana</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {data.items.map((admin) => (
                  <tr key={admin.userId} className="hover:bg-slate-50/70 transition-colors">
                    {/* Administrator Ismi */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/administrators/${admin.userId}`}
                          className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs transition-colors"
                          title="Admin profilini ochish"
                        >
                          {admin.fullName.charAt(0).toUpperCase()}
                        </Link>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/administrators/${admin.userId}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm truncate block"
                            title="Admin profilini ko'rish va faoliyatini kuzatish"
                          >
                            {admin.fullName}
                          </Link>
                        </div>
                      </div>
                    </td>

                    {/* Tashkilot */}
                    <td className="px-5 py-3.5">
                      {admin.organizationName ? (
                        <div>
                          <div className="font-medium text-slate-900">
                            {admin.organizationName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {admin.organizationCode}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Bog&apos;lanmagan</span>
                      )}
                    </td>

                    {/* Roli */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Tashkilot Rahbari</span>
                      </span>
                    </td>

                    {/* Holati */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        {admin.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Faol</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Nofaol</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sana */}
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(admin.createdAt).toLocaleDateString("uz-UZ", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Amallar: Profilni ko'rish va Faollashtirish/Bloklash */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/administrators/${admin.userId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                          title="Admin profilini ko'rish va faoliyatini kuzatish"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Profil</span>
                        </Link>
                        <ToggleAdminStatusButton
                          userId={admin.userId}
                          fullName={admin.fullName}
                          isActive={admin.isActive}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
