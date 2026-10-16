"use client";

import { useState, useActionState, useTransition } from "react";
import {
  DoorClosed,
  CheckCircle2,
  AlertCircle,
  CheckCheck,
  Loader2,
  Scan,
} from "lucide-react";
import { recordScanAction, completeRoomAuditAction, type ScanActionResult } from "@/lib/actions/audit";

interface RoomOption {
  id: string;
  roomNumber: string;
  name: string;
  buildingName: string;
}

export function ScanInterface({
  rooms,
  initialRoomId,
  cycleId,
}: {
  rooms: RoomOption[];
  initialRoomId?: string;
  cycleId?: string;
}) {
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId || (rooms[0]?.id ?? ""));
  const [tokenOrCode, setTokenOrCode] = useState("");
  const [scanHistory, setScanHistory] = useState<Array<{
    id: string;
    name: string;
    invNumber: string;
    isMatch: boolean;
    isConflict: boolean;
    time: string;
  }>>([]);

  const [state, formAction, isPending] = useActionState<ScanActionResult | null, FormData>(
    async (prev, formData) => {
      const res = await recordScanAction(prev, formData);
      if (res.success && res.item) {
        setScanHistory((prevHistory) => [
          {
            id: res.item!.id,
            name: res.item!.name,
            invNumber: res.item!.inventoryNumber,
            isMatch: Boolean(res.isMatch),
            isConflict: Boolean(res.isConflict),
            time: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
          },
          ...prevHistory,
        ]);
        setTokenOrCode("");
      }
      return res;
    },
    null
  );

  const [isCompleting, startCompleting] = useTransition();
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);

  async function handleCompleteRoom() {
    if (!selectedRoomId || !cycleId) return;
    const formData = new FormData();
    formData.append("roomId", selectedRoomId);
    formData.append("cycleId", cycleId);

    startCompleting(async () => {
      const res = await completeRoomAuditAction(null, formData);
      if (res.success) {
        setCompleteMessage("Ushbu xona auditi muvaffaqiyatli yakunlandi!");
      }
    });
  }

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="space-y-6">
      {/* 1. Xonani tanlash bloki */}
      <div className="bg-white p-5 rounded-[4px] border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <DoorClosed className="w-4 h-4 text-blue-600" />
          <span>Hozir siz turgan xona:</span>
        </div>

        <select
          value={selectedRoomId}
          onChange={(e) => {
            setSelectedRoomId(e.target.value);
            setCompleteMessage(null);
          }}
          className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200 rounded-[3px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900"
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.buildingName} • {r.roomNumber}-xona ({r.name})
            </option>
          ))}
        </select>
      </div>

      {/* 2. QR Kod / Barkod Skaneri va Kiritish */}
      <div className="bg-white p-5 sm:p-6 rounded-[4px] border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">QR Skanerlash</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {selectedRoom ? `${selectedRoom.roomNumber}-xona` : ""}
          </span>
        </div>

        {/* Natija / Xabar Banneri */}
        {state?.message && (
          <div
            className={`p-4 rounded-[4px] text-xs sm:text-sm flex items-start gap-3 ${
              state.isConflict
                ? "bg-amber-50 text-amber-900 border border-amber-200"
                : state.success
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-rose-50 text-rose-900 border border-rose-200"
            }`}
          >
            {state.isConflict ? (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : state.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold">{state.message}</div>
              {state.item && (
                <div className="mt-1 text-xs opacity-90">
                  Buyum: <strong>{state.item.name}</strong> • Kutilgan xona:{" "}
                  <strong>{state.item.expectedRoomNumber}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="scannedRoomId" value={selectedRoomId} />
          {cycleId && <input type="hidden" name="cycleId" value={cycleId} />}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              QR Token yoki Inventar Raqami
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="tokenOrCode"
                value={tokenOrCode}
                onChange={(e) => setTokenOrCode(e.target.value)}
                autoFocus
                required
                placeholder="QR token yoki TATU-2026-0001..."
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-[3px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900"
              />
              <button
                type="submit"
                disabled={isPending || !tokenOrCode.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Scan className="w-4 h-4" />
                )}
                <span>Qayd etish</span>
              </button>
            </div>
          </div>
        </form>

        {/* Xona tekshiruvini yakunlash tugmasi */}
        {cycleId && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Ushbu xonadagi barcha mulklar skanerlandi-mi?
            </span>
            <button
              onClick={handleCompleteRoom}
              disabled={isCompleting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
            >
              {isCompleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Xonani yakunlash</span>
            </button>
          </div>
        )}

        {completeMessage && (
          <div className="p-3 rounded-[4px] bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{completeMessage}</span>
          </div>
        )}
      </div>

      {/* 3. Ushbu sessiyadagi skanlar jurnali */}
      <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Joriy sessiyada skanerlangan buyumlar
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {scanHistory.length} ta skan
          </span>
        </div>

        {scanHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Hali birorta inventar skanerlanmadi. Yuqoridagi maydonga QR yoki raqamni kiriting.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {scanHistory.map((h, idx) => (
              <div
                key={idx}
                className="p-3 sm:px-5 flex items-center justify-between text-xs hover:bg-slate-50"
              >
                <div>
                  <div className="font-semibold text-slate-900">{h.name}</div>
                  <div className="text-[11px] font-mono text-slate-500">{h.invNumber}</div>
                </div>

                <div className="flex items-center gap-3">
                  {h.isMatch ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>O‘z xonasida</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <span>Konflikt</span>
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono">{h.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
