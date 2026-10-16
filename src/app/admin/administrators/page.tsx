import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import {
  getOrganizationAdminsStats,
  getOrganizationAdminsList,
} from "@/lib/data/administrators";
import { AdminFilters } from "./admin-filters";
import {
  Users,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Calendar,
  Terminal,
  Mail,
  ChevronLeft,
  ChevronRight,
  Info,
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
  const [stats, data] = await Promise.all([
    getOrganizationAdminsStats(),
    getOrganizationAdminsList({ page, pageSize: 20, search }),
  ]);

  const hasFilter = Boolean(search);

  return (
    <div className="space-y-6">
      {/* Sahifa Sarlavhasi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Tashkilot Administratorlari
            </h1>
            <span className="px-2 py-0.5 rounded-[3px] text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {stats.total} ta
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Tashkilotlarning asosiy ma&apos;murlari va rahbarlik akkauntlari ro&apos;yxati
          </p>
        </div>
      </div>

      {/* Statistik Kartalar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Jami administratorlar</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Platforma bo&apos;yicha</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Faol administratorlar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.active}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Tizimga kirish huquqiga ega</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Qamrab olingan tashkilotlar</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.organizationsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Admin biriktirilgan tashkilotlar</div>
        </div>
      </div>

      {/* Filtrlash va Qidiruv */}
      <AdminFilters currentSearch={search} />

      {/* Administratorlar Jadvali yoki Bo'sh holat */}
      <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-xs overflow-hidden">
        {data.items.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            {hasFilter ? (
              <div className="max-w-md mx-auto">
                <div className="w-12 h-12 rounded-[4px] bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Mos administratorlar topilmadi
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Kiritilgan &ldquo;{search}&rdquo; so&apos;rovi bo&apos;yicha birorta ham administrator topilmadi. Qidiruv so&apos;zini o&apos;zgartirib ko&apos;ring.
                </p>
                <div className="mt-4">
                  <Link
                    href="/admin/administrators"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    Filtrlarni tozalash
                  </Link>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-[4px] bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Hozircha tashkilot administratorlari mavjud emas
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Tashkilot boshqaruvchisi akkauntlari xavfsizlik va parollarni himoya qilish maqsadida maxsus CLI orqali xavfsiz bootstrap qilinadi. Parollar terminalda yashirin (maskalangan) tarzda kiritiladi va scrypt orqali xeshlanadi.
                </p>

                <div className="mt-6 p-4 rounded-[4px] bg-slate-900 text-left text-xs font-mono text-slate-100 border border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between text-slate-400 pb-2 mb-2 border-b border-slate-800 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-blue-400" />
                      Yangi administrator yaratish buyrug&apos;i:
                    </span>
                    <span className="text-[10px] text-emerald-400">Scrypt Secured</span>
                  </div>
                  <code className="text-blue-300">
                    npx tsx scripts/create-organization-admin.ts --execute
                  </code>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    TATU uchun tashkilot kodi: <strong>TATU</strong>. Yaratilgandan so&apos;ng bu yerda avtomatik ko&apos;rinadi.
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Administrator</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Tashkilot</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Roli</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Holati</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Qo&apos;shilgan sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-normal">
                {data.items.map((admin) => (
                  <tr key={admin.userId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Administrator Ismi va Emaili */}
                    <td className="px-4 py-3.5 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[4px] bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {admin.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {admin.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            {admin.username && (
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-[2px]">
                                {admin.username}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-slate-400">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{admin.email}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Tashkilot */}
                    <td className="px-4 py-3.5 sm:px-6">
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
                    <td className="px-4 py-3.5 sm:px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        <span>Tashkilot Rahbari</span>
                      </span>
                    </td>

                    {/* Holati */}
                    <td className="px-4 py-3.5 sm:px-6">
                      <div className="flex flex-col items-start gap-1">
                        {admin.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[3px] text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Faol</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[3px] text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Nofaol</span>
                          </span>
                        )}

                        {admin.mustChangePassword && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            Vaqtinchalik parol
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sana */}
                    <td className="px-4 py-3.5 sm:px-6 text-slate-500 text-xs">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sahifalash (Pagination) */}
        {data.totalPages > 1 && (
          <div className="border-t border-slate-200/80 px-4 py-3 sm:px-6 flex items-center justify-between bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Jami <strong>{data.totalCount}</strong> tadan{" "}
              <strong>{(page - 1) * data.pageSize + 1}</strong> -{" "}
              <strong>{Math.min(page * data.pageSize, data.totalCount)}</strong> ko&apos;rsatilmoqda
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={page > 1 ? `/admin/administrators?page=${page - 1}${search ? `&q=${search}` : ""}` : "#"}
                className={`p-1.5 rounded-[3px] border border-slate-200 ${
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
                className={`p-1.5 rounded-[3px] border border-slate-200 ${
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
