"use client";

import { useActionState, useEffect } from "react";
import { KeyRound, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { changeTemporaryPasswordAction, type StaffActionResponse } from "@/lib/actions/staff";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function ForceChangePasswordCard() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<StaffActionResponse | null, FormData>(
    changeTemporaryPasswordAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4">
      <main className="max-w-md w-full bg-white border border-slate-200 rounded-[4px] p-6 sm:p-8 shadow-sm">
        <div className="w-12 h-12 rounded-[4px] bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-6 h-6" />
        </div>

        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 text-center">
          Dastlabki parolni yangilang
        </h1>
        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed text-center">
          Xavfsizlik talablariga muvofiq, tizimdan foydalanishni davom ettirish uchun yangi mustahkam shaxsiy parol o‘rnatishingiz shart.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          {state?.message && (
            <div
              className={`p-3 rounded-[3px] text-xs flex items-center gap-2 ${
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Joriy (vaqtinchalik) parol <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                name="currentPassword"
                required
                placeholder="Admin bergan vaqtinchalik parol"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-[3px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900"
              />
            </div>
            {state?.fieldErrors?.currentPassword && (
              <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yangi shaxsiy parol <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                name="newPassword"
                required
                placeholder="Kamida 12 ta belgi (harf, raqam, maxsus)"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-[3px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900"
              />
            </div>
            {state?.fieldErrors?.newPassword && (
              <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.newPassword}</p>
            )}
            <p className="mt-1 text-[10px] text-slate-500">
              Talab: kamida 12 belgi, katta harf, kichik harf, raqam va maxsus belgi (!@#$%^&*).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yangi parolni tasdiqlash <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="Yangi parolni qayta kiriting"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-[3px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900"
              />
            </div>
            {state?.fieldErrors?.confirmPassword && (
              <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Yangi parolni saqlash</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-[3px] transition-colors"
            >
              Chiqish (Logout)
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
