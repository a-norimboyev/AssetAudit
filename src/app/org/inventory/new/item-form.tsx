"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  DoorClosed,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
} from "lucide-react";
import { createItemAction, type ActionResponse } from "@/lib/actions/inventory";

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

interface CategoryOption {
  id: string;
  name: string;
}

export function NewItemForm({
  buildings,
  floors,
  rooms,
  categories,
  defaultPrefix,
}: {
  buildings: BuildingOption[];
  floors: FloorOption[];
  rooms: RoomOption[];
  categories: CategoryOption[];
  defaultPrefix: string;
}) {
  const router = useRouter();
  const [selectedBuildingId, setSelectedBuildingId] = useState(
    buildings.length === 1 ? buildings[0].id : ""
  );
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [state, formAction, isPending] = useActionState<ActionResponse | null, FormData>(
    createItemAction,
    null
  );

  const availableFloors = selectedBuildingId
    ? floors.filter((f) => f.buildingId === selectedBuildingId)
    : [];

  const availableRooms = selectedFloorId
    ? rooms.filter((r) => r.floorId === selectedFloorId)
    : [];

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/org/inventory");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.message && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3 ${
            state.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {state.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{state.message}</span>
        </div>
      )}

      {/* 1. Asosiy identifikatsiya */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <QrCode className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Inventar Asosiy Identifikatsiyasi
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Inventar nomi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Masalan: Monoblok HP 24-cb1003ci yoki Parta ikki o‘rinli"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
            />
            {state?.fieldErrors?.name && (
              <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Inventar raqami <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="inventoryNumber"
              required
              defaultValue={`${defaultPrefix}${new Date().getFullYear()}-`}
              placeholder={`Masalan: ${defaultPrefix}2026-0001`}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono uppercase bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
            />
            {state?.fieldErrors?.inventoryNumber && (
              <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.inventoryNumber}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kategoriya <span className="text-rose-500">*</span>
            </label>
            <select
              name="categoryId"
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 cursor-pointer transition-all"
            >
              <option value="">Toifani tanlang...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Holati <span className="text-rose-500">*</span>
            </label>
            <select
              name="status"
              defaultValue="active"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 cursor-pointer transition-all"
            >
              <option value="active">Faol</option>
              <option value="repair">Ta’mirda</option>
              <option value="written_off">Hisobdan chiqarilgan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Sifat darajasi <span className="text-rose-500">*</span>
            </label>
            <select
              name="condition"
              defaultValue="good"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 cursor-pointer transition-all"
            >
              <option value="new">Yangi</option>
              <option value="good">Yaxshi</option>
              <option value="fair">Qoniqarli</option>
              <option value="poor">Eskirgan</option>
              <option value="broken">Nosoz</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Rasmiy Joylashuv (Kaskad: Bino -> Qavat -> Xona) */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <DoorClosed className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Rasmiy Joylashuv
            </h3>
            <p className="text-[11px] text-slate-500">
              Audit paytida skanerlangan xona shu rasmiy manzil bilan tekshiriladi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bino <span className="text-rose-500">*</span>
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
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 cursor-pointer transition-all"
            >
              <option value="">Binoni tanlang...</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
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
              value={selectedFloorId}
              disabled={!selectedBuildingId}
              onChange={(e) => {
                setSelectedFloorId(e.target.value);
                setSelectedRoomId("");
              }}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 disabled:opacity-50 cursor-pointer transition-all"
            >
              <option value="">
                {selectedBuildingId
                  ? availableFloors.length > 0
                    ? "Qavatni tanlang..."
                    : "Ushbu binoda qavatlar yo‘q"
                  : "Avval binoni tanlang..."}
              </option>
              {availableFloors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {state?.fieldErrors?.floorId && (
              <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.floorId}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Xona <span className="text-rose-500">*</span>
            </label>
            <select
              name="roomId"
              required
              value={selectedRoomId}
              disabled={!selectedFloorId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 disabled:opacity-50 cursor-pointer transition-all"
            >
              <option value="">
                {selectedFloorId
                  ? availableRooms.length > 0
                    ? "Xonani tanlang..."
                    : "Ushbu qavatda xonalar yo‘q"
                  : "Avval qavatni tanlang..."}
              </option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber} — {r.name}
                </option>
              ))}
            </select>
            {state?.fieldErrors?.roomId && (
              <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.roomId}</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Qo'shimcha Tafsilotlar va Surat */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Qo‘shimcha tavsif yoki seriya raqami
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Texnik xususiyatlari, seriya raqami yoki xarid tafsilotlari..."
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
          ></textarea>
        </div>

        {/* Xolis Storage Eslatmasi */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <Camera className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <strong className="text-slate-900">Fotosurat va Media Arxitekturasi:</strong>
            <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
              Tizim xavfsiz Object Storage bilan integratsiya qilinadi. Storage bucket to‘liq ulanmaguncha, fotosuratlar soxta yuklanmaydi va inventar ro‘yxatga olingandan so‘ng biriktirilishi mumkin.
            </p>
          </div>
        </div>
      </div>

      {/* Tugmalar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Bekor qilish
        </button>
        <button
          type="submit"
          disabled={isPending || state?.success}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm disabled:opacity-50 transition-all cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saqlanmoqda...</span>
            </>
          ) : (
            <span>Inventarni ro‘yxatga olish</span>
          )}
        </button>
      </div>
    </form>
  );
}
