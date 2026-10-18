"use client";

import { useState, useActionState, useEffect } from "react";
import { Plus, X, DoorClosed, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createRoomAction, type ActionResponse } from "@/lib/actions/locations";

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

export function AddRoomModal({
  buildings,
  floors,
}: {
  buildings: BuildingOption[];
  floors: FloorOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [state, formAction, isPending] = useActionState<ActionResponse | null, FormData>(
    createRoomAction,
    null
  );

  const availableFloors = selectedBuildingId
    ? floors.filter((f) => f.buildingId === selectedBuildingId)
    : floors;

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={buildings.length === 0 || floors.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        title={
          buildings.length === 0 || floors.length === 0
            ? "Avval bino va qavat qo'shing"
            : "Yangi xona qo'shish"
        }
      >
        <Plus className="w-4 h-4" />
        <span>Yangi xona qo‘shish</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DoorClosed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Yangi xona qo‘shish</h3>
                  <p className="text-[11px] text-slate-500">Bino va qavatga biriktirilgan rasmiy xona</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={formAction} className="p-6 space-y-4">
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

              {/* Bino va Qavat selektori (Kaskad) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bino <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="buildingId"
                    required
                    value={selectedBuildingId}
                    onChange={(e) => setSelectedBuildingId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
                  >
                    <option value="">Binoni tanlang...</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                  {state?.fieldErrors?.buildingId && (
                    <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.buildingId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Qavat <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="floorId"
                    required
                    disabled={!selectedBuildingId}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 disabled:opacity-50 transition-all"
                  >
                    <option value="">Qavatni tanlang...</option>
                    {availableFloors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.floorNumber}-qavat)
                      </option>
                    ))}
                  </select>
                  {state?.fieldErrors?.floorId && (
                    <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.floorId}</p>
                  )}
                </div>
              </div>

              {/* Xona raqami va Xona nomi */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Xona raqami <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="roomNumber"
                    required
                    placeholder="Masalan: 101 yoki 204-A"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
                  />
                  {state?.fieldErrors?.roomNumber && (
                    <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.roomNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Xona nomi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Masalan: Kafedra mudiri xonasi"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
                  />
                  {state?.fieldErrors?.name && (
                    <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.name}</p>
                  )}
                </div>
              </div>

              {/* Xona turi va Sig'imi */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Xona turi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="type"
                    defaultValue="office"
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
                  >
                    <option value="classroom">O‘quv xonasi (Auditoriya)</option>
                    <option value="lab">Laboratoriya</option>
                    <option value="office">Xizmat xonasi (Ofis)</option>
                    <option value="warehouse">Omborxona</option>
                    <option value="library">Kutubxona / O‘quv zali</option>
                    <option value="conference">Majlislar zali</option>
                    <option value="server_room">Server xonasi</option>
                    <option value="other">Boshqa xona</option>
                  </select>
                  {state?.fieldErrors?.type && (
                    <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    O‘rinlar sig‘imi (ixtiyoriy)
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    min={0}
                    placeholder="Masalan: 30"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isPending || state?.success}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs hover:shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saqlanmoqda...</span>
                    </>
                  ) : (
                    <span>Xonani saqlash</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
