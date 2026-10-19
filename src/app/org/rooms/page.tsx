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
  Layers,
  ArrowRight,
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
    q?: string;
    page?: string;
  }>;
}

const FLOOR_NAMES_UZ: Record<number, string> = {
  1: "Birinchi qavat",
  2: "Ikkinchi qavat",
  3: "Uchinchi qavat",
  4: "To‘rtinchi qavat",
  5: "Beshinchi qavat",
  6: "Oltinchi qavat",
  7: "Yettinchi qavat",
  8: "Sakkizinchi qavat",
  9: "To‘qqizinchi qavat",
  10: "O‘ninchi qavat",
  11: "O‘n birinchi qavat",
  12: "O‘n ikkinchi qavat",
  13: "O‘n uchinchi qavat",
  14: "O‘n to‘rtinchi qavat",
  15: "O‘n beshinchi qavat",
  16: "O‘n oltinchi qavat",
};

export default async function OrgRoomsPage({ searchParams }: PageProps) {
  const { organization } = await requireOrganizationAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const buildingId = params.buildingId || "all";
  const floorId = params.floorId || "all";
  const search = params.q?.trim() || "";

  const [buildingsRes, floorsRes, roomsRes] = await Promise.all([
    getBuildingsList({ organizationId: organization.id, pageSize: 100 }),
    getFloorsList({ organizationId: organization.id }),
    getRoomsList({
      organizationId: organization.id,
      buildingId,
      floorId,
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

  const effectiveBuildingId =
    buildingId !== "all"
      ? buildingId
      : buildingOptions.length === 1
      ? buildingOptions[0].id
      : "all";

  const activeBuilding =
    buildingOptions.find((b) => b.id === effectiveBuildingId) || null;

  const buildingFloors = activeBuilding
    ? floorsRes
        .filter((f) => f.buildingId === activeBuilding.id)
        .sort((a, b) => a.floorNumber - b.floorNumber)
    : [];

  const selectedFloor =
    floorId !== "all"
      ? floorsRes.find((f) => f.id === floorId) || null
      : null;

  return (
    <div className="space-y-6">
      {/* Sarlavha va Harakat tugmalari */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Xonalar va Auditoriyalar
          </h1>
          {activeBuilding && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {activeBuilding.name} binosi xonalari va qavatlari
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <AddRoomModal
            buildings={buildingOptions}
            floors={floorOptions}
            defaultBuildingId={activeBuilding?.id}
            defaultFloorId={selectedFloor?.id}
          />
        </div>
      </div>

      {/* Filter va Qidiruv Paneli */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          {/* Bino bo'yicha filter */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Bino:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
              <Link
                href="/org/rooms"
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  buildingId === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Barchasi
              </Link>
              {buildingOptions.map((b) => (
                <Link
                  key={b.id}
                  href={`/org/rooms?buildingId=${b.id}`}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    effectiveBuildingId === b.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Qavatlar kartochkalari (Birinchi qavat, Ikkinchi qavat, Uchinchi qavat, To'rtinchi qavat) */}
      {buildingFloors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                {activeBuilding ? `${activeBuilding.name} — Qavatlar` : "Qavatlar"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {buildingFloors.length} ta qavat
              </span>
            </div>

            {floorId !== "all" && (
              <Link
                href={`/org/rooms?buildingId=${activeBuilding?.id || ""}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Barcha qavatlarni ko‘rish
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {buildingFloors.map((f) => {
              const isSelected = floorId === f.id;
              const ordinalTitle = FLOOR_NAMES_UZ[f.floorNumber] || `${f.floorNumber}-qavat`;

              return (
                <Link
                  key={f.id}
                  href={
                    isSelected
                      ? `/org/rooms?buildingId=${f.buildingId}`
                      : `/org/rooms?buildingId=${f.buildingId}&floorId=${f.id}`
                  }
                  className={`group p-4 sm:p-5 rounded-2xl border transition-all relative overflow-hidden block ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                      : "bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-sm shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                      }`}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isSelected
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {f.roomsCount || 0} ta xona
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                      {ordinalTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {f.name}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold ${
                        isSelected ? "text-blue-700" : "text-slate-500 group-hover:text-blue-600"
                      }`}
                    >
                      {isSelected ? "Tanlangan qavat" : "Xonalarni ochish"}
                    </span>
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${
                        isSelected ? "text-blue-700" : "text-slate-400 group-hover:text-blue-600"
                      }`}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Xonalar Jadvali */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {roomsRes.items.length === 0 ? (
          <div className="p-10 sm:p-14 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <DoorClosed className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {selectedFloor
                ? `${selectedFloor.name}da xonalar mavjud emas`
                : "Hozircha xonalar mavjud emas"}
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              {selectedFloor
                ? `Ushbu ${selectedFloor.name}ga birinchi xona yoki auditoriyani biriktirish uchun quyidagi tugmani bosing.`
                : "Yuqoridagi qavatlardan birini tanlang yoki yangi xona qo‘shing."}
            </p>
            <div className="mt-4">
              <AddRoomModal
                buildings={buildingOptions}
                floors={floorOptions}
                defaultBuildingId={activeBuilding?.id}
                defaultFloorId={selectedFloor?.id}
              />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Xona raqami</th>
                  <th scope="col" className="px-5 py-3.5">Xona nomi</th>
                  <th scope="col" className="px-5 py-3.5">Bino & Qavat</th>
                  <th scope="col" className="px-5 py-3.5">Holati</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Inventarlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {roomsRes.items.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {r.roomNumber}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {r.name}
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.buildingName}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-500">{r.floorName}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Faol</span>
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
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
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
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
            if (search) sp.set("q", search);
            sp.set("page", targetPage.toString());
            return `/org/rooms?${sp.toString()}`;
          };

          return (
            <div className="border-t border-slate-200/80 px-5 py-3.5 flex items-center justify-between bg-slate-50/50">
              <div className="text-xs text-slate-500">
                Jami <strong>{roomsRes.totalCount}</strong> tadan{" "}
                <strong>{(page - 1) * roomsRes.pageSize + 1}</strong> -{" "}
                <strong>{Math.min(page * roomsRes.pageSize, roomsRes.totalCount)}</strong> ko‘rsatilmoqda
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={page > 1 ? getPageHref(page - 1) : "#"}
                  className={`p-1.5 rounded-lg border border-slate-200 ${
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
                  className={`p-1.5 rounded-lg border border-slate-200 ${
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
