"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { updateCycleStatusAction } from "@/lib/actions/audit";

interface CycleStatusManagerProps {
  cycleId: string;
  currentStatus: "planned" | "in_progress" | "completed" | "cancelled";
  cycleTitle: string;
}

export function CycleStatusManager({
  cycleId,
  currentStatus,
  cycleTitle,
}: CycleStatusManagerProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleStatusChange(nextStatus: "completed" | "cancelled" | "in_progress") {
    let confirmMsg = "";
    if (nextStatus === "completed") {
      confirmMsg = `"${cycleTitle}" audit siklini rasman YAKUNLAMOQCHIMISIZ? Ushbu sikl bo'yicha yakuniy hisobotlar qulflanadi.`;
    } else if (nextStatus === "cancelled") {
      confirmMsg = `"${cycleTitle}" audit siklini BEKOR QILMOQCHIMISIZ?`;
    } else {
      confirmMsg = `"${cycleTitle}" audit siklini qayta JARAYONDA holatiga o'tkazmoqchimisiz?`;
    }

    if (!confirm(confirmMsg)) return;

    setIsPending(true);
    try {
      const res = await updateCycleStatusAction(cycleId, nextStatus);
      if (!res.success) {
        alert(res.message);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xatolik yuz berdi.");
    } finally {
      setIsPending(false);
    }
  }

  if (currentStatus === "completed") {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Audit Yakunlangan</span>
        </span>
        <button
          onClick={() => handleStatusChange("in_progress")}
          disabled={isPending}
          type="button"
          className="text-[11px] text-slate-500 hover:text-blue-600 underline cursor-pointer disabled:opacity-50"
        >
          {isPending ? "Yangilanmoqda..." : "Qayta ochish"}
        </button>
      </div>
    );
  }

  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
          <span>Bekor qilingan</span>
        </span>
        <button
          onClick={() => handleStatusChange("in_progress")}
          disabled={isPending}
          type="button"
          className="text-[11px] text-slate-500 hover:text-blue-600 underline cursor-pointer disabled:opacity-50"
        >
          {isPending ? "Yangilanmoqda..." : "Qayta faollashtirish"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleStatusChange("completed")}
        disabled={isPending}
        type="button"
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
        title="Audit sanog'ini rasman yakunlash va qulflash"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5" />
        )}
        <span>Siklni yakunlash</span>
      </button>

      <button
        onClick={() => handleStatusChange("cancelled")}
        disabled={isPending}
        type="button"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[3px] bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-medium border border-slate-200 hover:border-rose-200 transition cursor-pointer disabled:opacity-50"
        title="Siklni bekor qilish"
      >
        <XCircle className="w-3.5 h-3.5" />
        <span>Bekor qilish</span>
      </button>
    </div>
  );
}
