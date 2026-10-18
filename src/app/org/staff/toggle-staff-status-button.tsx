"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toggleStaffStatusAction } from "@/lib/actions/staff";

interface ToggleStaffStatusButtonProps {
  userId: string;
  fullName: string;
  isActive: boolean;
}

export function ToggleStaffStatusButton({
  userId,
  fullName,
  isActive,
}: ToggleStaffStatusButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    const nextState = !isActive;
    const confirmMessage = nextState
      ? `"${fullName}" xodimini qayta faollashtirmoqchimisiz? U yana tizimga kira oladi.`
      : `"${fullName}" xodimini nofaol (bloklangan) holatga o'tkazmoqchimisiz? Xodimning faol sessiyalari bekor qilinadi (force logout) va tizimga kira olmaydi.`;

    if (!confirm(confirmMessage)) return;

    setIsPending(true);
    try {
      await toggleStaffStatusAction(userId, nextState);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xatolik yuz berdi.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
          : "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
      }`}
      title={isActive ? "Bloklash / Nofaol qilish" : "Faollashtirish"}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isActive ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Faol</span>
        </>
      ) : (
        <>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Nofaol</span>
        </>
      )}
    </button>
  );
}

