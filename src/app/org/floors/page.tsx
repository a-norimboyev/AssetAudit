import Link from "next/link";
import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { getFloorsList, getBuildingsList } from "@/lib/data/locations";
import { AddFloorModal } from "./add-floor-modal";
import { EditFloorModal } from "./edit-floor-modal";
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Qavatlar
          </h1>
        </div>

        <AddFloorModal buildings={buildingOptions} />
      </div>

      {/* Filter Paneli */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Bino filtri:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href="/org/floors"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                buildingId === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Barcha binolar
            </Link>
            {buildingOptions.map((b) => (
              <Link
                key={b.id}
                href={`/org/floors?buildingId=${b.id}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  buildingId === b.id
                    ? "bg-blue-600 text-white shadow-xs"
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
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {floors.length === 0 ? (
          <div className="p-10 sm:p-16 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
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
                  <th scope="col" className="px-5 py-3.5">Bino</th>
                  <th scope="col" className="px-5 py-3.5">Qavat raqami</th>
                  <th scope="col" className="px-5 py-3.5">Qavat nomi</th>
                  <th scope="col" className="px-5 py-3.5">Xonalar soni</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {floors.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">{f.buildingName}</span>
                          <span className="ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {f.buildingCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-blue-700">
                        {f.floorNumber > 0
                          ? `${f.floorNumber}-qavat`
                          : f.floorNumber === 0
                          ? "0 (Zamin qavat)"
                          : `${f.floorNumber} (Yerto‘la)`}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {f.name}
                    </td>

                    <td className="px-5 py-3.5">
                      <Link
                        href={`/org/rooms?floorId=${f.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-100"
                      >
                        <DoorClosed className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{f.roomsCount} ta xona</span>
                      </Link>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <EditFloorModal
                          floor={{
                            id: f.id,
                            name: f.name,
                            floorNumber: f.floorNumber,
                            buildingName: f.buildingName,
                          }}
                        />
                        <Link
                          href={`/org/rooms?floorId=${f.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
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
      </div>
    </div>
  );
}
