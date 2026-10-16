import Link from "next/link";
import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { getRoomsList, getBuildingsList, getFloorsList } from "@/lib/data/locations";
import { AddRoomModal } from "./add-room-modal";
import { EditRoomModal } from "./edit-room-modal";
import {
  DoorClosed,
  Building,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Xonalar — AssetAudit",
  description: "Tashkilot xonalari va auditoriyalari boshqaruvi",
};

export const instant = false;

interface PageProps {
  searchParams: Promise<{
    buildingId?: string;
    floorId?: string;
    type?: string;
    q?: string;
    page?: string;
  }>;
}

const ROOM_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  classroom: { label: "Auditoriya", color: "bg-blue-50 text-blue-700 border-blue-200" },
  lab: { label: "Laboratoriya", color: "bg-purple-50 text-purple-700 border-purple-200" },
  office: { label: "Xizmat xonasi", color: "bg-slate-50 text-slate-700 border-slate-200" },
  warehouse: { label: "Omborxona", color: "bg-amber-50 text-amber-700 border-amber-200" },
  library: { label: "Kutubxona", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  conference: { label: "Majlislar zali", color: "bg-sky-50 text-sky-700 border-sky-200" },
  server_room: { label: "Server xonasi", color: "bg-rose-50 text-rose-700 border-rose-200" },
  other: { label: "Boshqa", color: "bg-slate-50 text-slate-600 border-slate-200" },
};

export default async function OrgRoomsPage({ searchParams }: PageProps) {
  const { organization } = await requireOrganizationAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const buildingId = params.buildingId || "all";
  const floorId = params.floorId || "all";
  const type = params.type || "all";
  const search = params.q?.trim() || "";

  const [buildingsRes, floorsRes, roomsRes] = await Promise.all([
    getBuildingsList({ organizationId: organization.id, pageSize: 100 }),
    getFloorsList({ organizationId: organization.id }),
    getRoomsList({
      organizationId: organization.id,
      buildingId,
      floorId,
      type,
      search,
      page,
      pageSize: 25,
    }),
  ]);

  const buildingOptions = buildingsRes.items.map((b) => ({
    id: b.id,
    name: b.name,
    code: b.code,
  }));

  const floorOptions = floorsRes.map((f) => ({
    id: f.id,
    buildingId: f.buildingId,
    floorNumber: f.floorNumber,
    name: f.name,
  }));

  return (
    <div className="space-y-6">
      {/* Sarlavha va Harakat tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Xonalar va Auditoriyalar
            </h1>
            <span className="px-2.5 py-0.5 rounded-[3px] text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {roomsRes.totalCount} ta xona
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {organization.name} binolari va qavatlaridagi barcha rasmiy xonalar
          </p>
        </div>

        <AddRoomModal buildings={buildingOptions} floors={floorOptions} />
      </div>

      {/* Filter va Qidiruv Paneli */}
      <div className="bg-white p-4 rounded-[4px] border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Bino bo'yicha filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Bino:</span>
            <div className="flex items-center gap-1 overflow-x-auto max-w-xs sm:max-w-md pb-1">
              <Link
                href="/org/rooms"
                className={`px-2.5 py-1 rounded-[3px] text-xs font-medium whitespace-nowrap transition-colors ${
                  buildingId === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Barchasi
              </Link>
              {buildingOptions.map((b) => (
                <Link
                  key={b.id}
                  href={`/org/rooms?buildingId=${b.id}`}
                  className={`px-2.5 py-1 rounded-[3px] text-xs font-medium whitespace-nowrap transition-colors ${
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
      </div>

      {/* Xonalar Jadvali */}
      <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-xs overflow-hidden">
        {roomsRes.items.length === 0 ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-[4px] bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <DoorClosed className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Xonalar topilmadi
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              {buildingOptions.length === 0
                ? "Xona qo‘shish uchun avval bino va qavat yaratishingiz kerak."
                : "Ushbu parametr bo‘yicha xona mavjud emas. Yuqoridagi tugma orqali yangi xona qo‘shing."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Xona raqami</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Xona nomi</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Bino & Qavat</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Xona turi</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Sig‘im</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Holati</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6 text-right">Inventarlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-normal">
                {roomsRes.items.map((r) => {
                  const typeMeta = ROOM_TYPE_LABELS[r.type] || ROOM_TYPE_LABELS.other;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 sm:px-6">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-[3px] border border-blue-200">
                          {r.roomNumber}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 sm:px-6 font-semibold text-slate-900">
                        {r.name}
                      </td>

                      <td className="px-4 py-3.5 sm:px-6 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.buildingName}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-500">{r.floorName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 sm:px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-semibold border ${typeMeta.color}`}
                        >
                          {typeMeta.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 sm:px-6 text-xs text-slate-500">
                        {r.capacity ? (
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{r.capacity} o‘rin</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 sm:px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Faol</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EditRoomModal
                            room={{
                              id: r.id,
                              roomNumber: r.roomNumber,
                              name: r.name,
                              type: r.type,
                              capacity: r.capacity,
                              isActive: r.isActive,
                              buildingName: r.buildingName,
                              floorName: r.floorName,
                            }}
                          />
                          <Link
                            href={`/org/inventory?roomId=${r.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Mulklar</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginatsiya */}
        {roomsRes.totalPages > 1 && (() => {
          const getPageHref = (targetPage: number) => {
            const sp = new URLSearchParams();
            if (buildingId && buildingId !== "all") sp.set("buildingId", buildingId);
            if (floorId && floorId !== "all") sp.set("floorId", floorId);
            if (type && type !== "all") sp.set("type", type);
            if (search) sp.set("q", search);
            sp.set("page", targetPage.toString());
            return `/org/rooms?${sp.toString()}`;
          };

          return (
            <div className="border-t border-slate-200/80 px-4 py-3 sm:px-6 flex items-center justify-between bg-slate-50/50">
              <div className="text-xs text-slate-500">
                Jami <strong>{roomsRes.totalCount}</strong> tadan{" "}
                <strong>{(page - 1) * roomsRes.pageSize + 1}</strong> -{" "}
                <strong>{Math.min(page * roomsRes.pageSize, roomsRes.totalCount)}</strong> ko‘rsatilmoqda
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={page > 1 ? getPageHref(page - 1) : "#"}
                  className={`p-1.5 rounded-[3px] border border-slate-200 ${
                    page > 1 ? "bg-white text-slate-700 hover:bg-slate-100" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <span className="text-xs font-medium text-slate-600">
                  {page} / {roomsRes.totalPages}
                </span>
                <Link
                  href={page < roomsRes.totalPages ? getPageHref(page + 1) : "#"}
                  className={`p-1.5 rounded-[3px] border border-slate-200 ${
                    page < roomsRes.totalPages ? "bg-white text-slate-700 hover:bg-slate-100" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
