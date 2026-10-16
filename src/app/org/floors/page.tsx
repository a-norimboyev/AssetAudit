import Link from "next/link";
import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { getFloorsList, getBuildingsList } from "@/lib/data/locations";
import { AddFloorModal } from "./add-floor-modal";
import {
  Layers,
  Building,
  DoorClosed,
  ArrowRight,
  Filter,
} from "lucide-react";

export const metadata = {
  title: "Qavatlar — AssetAudit",
  description: "Tashkilot binolari qavatlari boshqaruvi",
};

export const instant = false;

interface PageProps {
  searchParams: Promise<{
    buildingId?: string;
    q?: string;
  }>;
}

export default async function OrgFloorsPage({ searchParams }: PageProps) {
  const { organization } = await requireOrganizationAdmin();

  const params = await searchParams;
  const buildingId = params.buildingId || "all";
  const search = params.q?.trim() || "";

  const [buildingsRes, floors] = await Promise.all([
    getBuildingsList({ organizationId: organization.id, pageSize: 100 }),
    getFloorsList({ organizationId: organization.id, buildingId, search }),
  ]);

  const buildingOptions = buildingsRes.items.map((b) => ({
    id: b.id,
    name: b.name,
    code: b.code,
  }));

  return (
    <div className="space-y-6">
      {/* Sarlavha va Harakat tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Qavatlar
            </h1>
            <span className="px-2.5 py-0.5 rounded-[3px] text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {floors.length} ta qavat
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {organization.name} binolaridagi barcha qavatlar iyerarxiyasi
          </p>
        </div>

        <AddFloorModal buildings={buildingOptions} />
      </div>

      {/* Filter Paneli */}
      <div className="bg-white p-4 rounded-[4px] border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Bino bo‘yicha filter:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href="/org/floors"
              className={`px-3 py-1.5 rounded-[3px] text-xs font-medium transition-colors ${
                buildingId === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Barcha binolar
            </Link>
            {buildingOptions.map((b) => (
              <Link
                key={b.id}
                href={`/org/floors?buildingId=${b.id}`}
                className={`px-3 py-1.5 rounded-[3px] text-xs font-medium transition-colors ${
                  buildingId === b.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {b.name} ({b.code})
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Qavatlar Jadvali */}
      <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-xs overflow-hidden">
        {floors.length === 0 ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-[4px] bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Qavatlar topilmadi
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              {buildingOptions.length === 0
                ? "Qavat qo‘shishdan oldin kamida bitta bino yaratishingiz kerak."
                : "Ushbu parametr bo‘yicha qavat mavjud emas. Yuqoridagi tugma orqali yangi qavat qo‘shishingiz mumkin."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Bino</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Qavat raqami</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Qavat nomi</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Xonalar soni</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-normal">
                {floors.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 sm:px-6">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="font-semibold text-slate-900">{f.buildingName}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono bg-slate-100 text-slate-600">
                            {f.buildingCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 sm:px-6">
                      <span className="font-mono font-bold text-blue-600">
                        {f.floorNumber > 0
                          ? `${f.floorNumber}-qavat`
                          : f.floorNumber === 0
                          ? "0 (Zamin qavat)"
                          : `${f.floorNumber} (Yerto‘la)`}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 sm:px-6 font-medium text-slate-900">
                      {f.name}
                    </td>

                    <td className="px-4 py-3.5 sm:px-6">
                      <Link
                        href={`/org/rooms?floorId=${f.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        <DoorClosed className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{f.roomsCount} ta xona</span>
                      </Link>
                    </td>

                    <td className="px-4 py-3.5 sm:px-6 text-right">
                      <Link
                        href={`/org/rooms?floorId=${f.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <span>Xonalar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
