"use client";

import { useState, useActionState } from "react";
import { ArrowRightLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { relocateItemAction, type ActionResponse } from "@/lib/actions/inventory";

interface BuildingOption {
  id: string;
  name: string;
  code: string;
}

interface FloorOption {
  id: string;
  buildingId: string;
  floorNumber: number;
  name: string;
}

interface RoomOption {
  id: string;
  buildingId: string;
  floorId: string;
  roomNumber: string;
  name: string;
}

export function RelocateForm({
  itemId,
  currentBuildingId,
  currentFloorId,
  currentRoomId,
  buildings,
  floors,
  rooms,
}: {
  itemId: string;
  currentBuildingId: string;
  currentFloorId: string;
  currentRoomId: string;
  buildings: BuildingOption[];
  floors: FloorOption[];
  rooms: RoomOption[];
}) {
  const [selectedBuildingId, setSelectedBuildingId] = useState(currentBuildingId);
  const [selectedFloorId, setSelectedFloorId] = useState(currentFloorId);
  const [selectedRoomId, setSelectedRoomId] = useState(currentRoomId);

  const [state, formAction, isPending] = useActionState<ActionResponse | null, FormData>(
    relocateItemAction,
    null
  );

  const availableFloors = selectedBuildingId
    ? floors.filter((f) => f.buildingId === selectedBuildingId)
    : [];

  const availableRooms = selectedFloorId
    ? rooms.filter((r) => r.floorId === selectedFloorId)
    : [];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="itemId" value={itemId} />

      {state?.message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            state.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {state.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{state.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
            Yangi bino
          </label>
          <select
            name="buildingId"
            required
            value={selectedBuildingId}
            onChange={(e) => {
              setSelectedBuildingId(e.target.value);
              setSelectedFloorId("");
              setSelectedRoomId("");
            }}
            className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
            Yangi qavat
          </label>
          <select
            name="floorId"
            required
            value={selectedFloorId}
            disabled={!selectedBuildingId}
            onChange={(e) => {
              setSelectedFloorId(e.target.value);
              setSelectedRoomId("");
            }}
            className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 disabled:opacity-50 transition-all"
          >
            <option value="">Qavatni tanlang...</option>
            {availableFloors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.floorNumber}-qavat)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
            Yangi xona
          </label>
          <select
            name="roomId"
            required
            value={selectedRoomId}
            disabled={!selectedFloorId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 disabled:opacity-50 transition-all"
          >
            <option value="">Xonani tanlang...</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.roomNumber} — {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs hover:shadow-xs disabled:opacity-50 transition-all cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Ko‘chirilmoqda...</span>
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Joylashuvni yangilash</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
