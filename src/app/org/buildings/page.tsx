import Link from "next/link";
import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { getLocationsStats, getBuildingsList } from "@/lib/data/locations";
import { AddBuildingModal } from "./add-building-modal";
import { EditBuildingModal } from "./edit-building-modal";
import {
  Building2,
  Building,
  Layers,
  DoorClosed,
  Users,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";

export const metadata = {
  title: "Binolar — AssetAudit",
  description: "Tashkilot binolari va korpuslari boshqaruvi",
};

export const instant = false;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

export default async function OrgBuildingsPage({ searchParams }: PageProps) {
  const { organization } = await requireOrganizationAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const search = params.q?.trim() || "";

  const [stats, data] = await Promise.all([
    getLocationsStats(organization.id),
    getBuildingsList({ organizationId: organization.id, page, search, pageSize: 20 }),
  ]);

  return (
    <div className="space-y-6">
      {/* Sarlavha va Harakat tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Binolar va Korpuslar
            </h1>
            <span className="px-2.5 py-0.5 rounded-[3px] text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {stats.buildingsCount} ta bino
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {organization.name} tashkiloti hududidagi binolar, o‘quv korpuslari va inshootlar
          </p>
        </div>

        <AddBuildingModal />
      </div>

      {/* KPI Kartalari */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Jami binolar</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.buildingsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Faol korpuslar</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Jami qavatlar</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.floorsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ro‘yxatga olingan</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Jami xonalar</span>
            <DoorClosed className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.roomsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Inventar xonalari</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Umumiy sig‘im</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.totalCapacity} <span className="text-xs font-normal text-slate-400">o‘rin</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">O‘quv/xizmat sig‘imi</div>
        </div>
      </div>

      {/* Binolar Ro'yxati Jadvali */}
      <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-xs overflow-hidden">
        {data.items.length === 0 ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-[4px] bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <Building className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {search ? "Mos binolar topilmadi" : "Hozircha binolar kiritilmagan"}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              {search
                ? `"${search}" qidiruv so‘rovi bo‘yicha bino topilmadi.`
                : "Pilot sinovni boshlash uchun dastlab birinchi binoni qo‘shing. Tizim qavatlarni avtomatik generatsiya qiladi."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Bino nomi & Kodi</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Manzil</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Qavatlar</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Xonalar</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Holati</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-normal">
                {data.items.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Bino nomi va kodi */}
                    <td className="px-4 py-3.5 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[3px] bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                          {b.code}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{b.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Kod: {b.code}</div>
                        </div>
                      </div>
                    </td>

                    {/* Manzil */}
                    <td className="px-4 py-3.5 sm:px-6 text-slate-500 text-xs">
                      {b.address ? (
                        <div className="flex items-center gap-1.5 truncate max-w-xs" title={b.address}>
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{b.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Qavatlar soni */}
                    <td className="px-4 py-3.5 sm:px-6">
                      <Link
                        href={`/org/floors?buildingId=${b.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>{b.actualFloorsCount || b.floorsCount} qavat</span>
                      </Link>
                    </td>

                    {/* Xonalar soni */}
                    <td className="px-4 py-3.5 sm:px-6">
                      <Link
                        href={`/org/rooms?buildingId=${b.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        <DoorClosed className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{b.roomsCount} xona</span>
                      </Link>
                    </td>

                    {/* Holati */}
                    <td className="px-4 py-3.5 sm:px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[3px] text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Faol</span>
                      </span>
                    </td>

                    {/* Amallar */}
                    <td className="px-4 py-3.5 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EditBuildingModal building={{ id: b.id, name: b.name, code: b.code, address: b.address, isActive: b.isActive }} />
                        <Link
                          href={`/org/rooms?buildingId=${b.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          <span>Xonalar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginatsiya */}
        {data.totalPages > 1 && (
          <div className="border-t border-slate-200/80 px-4 py-3 sm:px-6 flex items-center justify-between bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Jami <strong>{data.totalCount}</strong> tadan{" "}
              <strong>{(page - 1) * data.pageSize + 1}</strong> -{" "}
              <strong>{Math.min(page * data.pageSize, data.totalCount)}</strong> ko‘rsatilmoqda
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={page > 1 ? `/org/buildings?page=${page - 1}${search ? `&q=${search}` : ""}` : "#"}
                className={`p-1.5 rounded-[3px] border border-slate-200 ${
                  page > 1 ? "bg-white text-slate-700 hover:bg-slate-100" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <span className="text-xs font-medium text-slate-600">
                {page} / {data.totalPages}
              </span>
              <Link
                href={page < data.totalPages ? `/org/buildings?page=${page + 1}${search ? `&q=${search}` : ""}` : "#"}
                className={`p-1.5 rounded-[3px] border border-slate-200 ${
                  page < data.totalPages ? "bg-white text-slate-700 hover:bg-slate-100" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
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
