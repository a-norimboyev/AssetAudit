"use client";

import { useActionState, useState } from "react";
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { changeAdminOwnPasswordAction, type StaffActionResponse } from "@/lib/actions/staff";

export function ChangePasswordCard() {
  const [state, formAction, isPending] = useActionState<StaffActionResponse | null, FormData>(
    changeAdminOwnPasswordAction,
    null
  );

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-xs transition-shadow space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Administrator Parolini O&apos;zgartirish</h2>
            <p className="text-[11px] text-slate-500">Shaxsiy boshqaruv paroli</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Himoyalangan</span>
        </div>
      </div>

      {state?.message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
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

      <form action={formAction} className="space-y-3.5 text-xs">
        {/* Joriy parol */}
        <div>
          <label className="text-slate-600 font-medium block mb-1">
            Joriy parol <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              name="currentPassword"
              required
              placeholder="Hozirgi parolingizni kiriting"
              className="w-full px-3 py-2 pr-9 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono text-slate-900 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showCurrent ? "Yashirish" : "Ko'rsatish"}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {state?.fieldErrors?.currentPassword && (
            <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.currentPassword}</p>
          )}
        </div>

        {/* Yangi parol */}
        <div>
          <label className="text-slate-600 font-medium block mb-1">
            Yangi parol <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              name="newPassword"
              required
              placeholder="Kamida 6 ta belgi"
              className="w-full px-3 py-2 pr-9 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono text-slate-900 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showNew ? "Yashirish" : "Ko'rsatish"}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {state?.fieldErrors?.newPassword && (
            <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.newPassword}</p>
          )}
        </div>

        {/* Yangi parolni tasdiqlash */}
        <div>
          <label className="text-slate-600 font-medium block mb-1">
            Yangi parolni tasdiqlang <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              required
              placeholder="Yangi parolni qayta kiriting"
              className="w-full px-3 py-2 pr-9 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono text-slate-900 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showConfirm ? "Yashirish" : "Ko'rsatish"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {state?.fieldErrors?.confirmPassword && (
            <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.confirmPassword}</p>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between gap-3">
          <p className="text-[10px] text-slate-400 leading-tight">
            Parol o&apos;zgarganda Super Admin panelidagi ma&apos;lumotlar ham avtomatik yangilanadi.
          </p>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isPending ? "Saqlanmoqda..." : "Parolni saqlash"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
