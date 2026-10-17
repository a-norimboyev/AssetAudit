"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toggleOrganizationAdminStatusAction } from "@/lib/actions/staff";

interface ToggleAdminStatusButtonProps {
  userId: string;
  fullName: string;
  isActive: boolean;
}

export function ToggleAdminStatusButton({
  userId,
  fullName,
  isActive,
}: ToggleAdminStatusButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    const nextState = !isActive;
    const confirmMessage = nextState
      ? `"${fullName}" administratorini qayta faollashtirmoqchimisiz? U yana boshqaruv paneliga kira oladi.`
      : `"${fullName}" administratorini nofaol (bloklangan) holatga o'tkazmoqchimisiz? Administratorning faol sessiyalari bekor qilinadi (force logout) va tizimga kira olmaydi.`;

    if (!confirm(confirmMessage)) return;

    setIsPending(true);
    try {
      const res = await toggleOrganizationAdminStatusAction(userId, nextState);
      if (!res.success) {
        alert(res.message);
      }
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
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-[3px] text-[11px] font-semibold border transition cursor-pointer disabled:opacity-50 ${
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
          : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
      }`}
      title={isActive ? "Bloklash / Nofaol qilish" : "Faollashtirish"}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isActive ? (
        <>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Faol</span>
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3 text-rose-600" />
          <span>Nofaol</span>
        </>
      )}
    </button>
  );
}
