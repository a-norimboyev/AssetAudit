"use client";

import { useState, useActionState, useEffect } from "react";
import { Plus, X, Building, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createBuildingAction, type ActionResponse } from "@/lib/actions/locations";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";

export function AddBuildingModal() {
  const [isOpen, setIsOpen] = useState(false);
  useBodyScrollLock(isOpen);
  const [state, formAction, isPending] = useActionState<ActionResponse | null, FormData>(
    createBuildingAction,
    null
  );

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
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Yangi bino qo‘shish</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overscroll-contain">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden overscroll-contain">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Yangi bino qo‘shish</h3>
                  <p className="text-[11px] text-slate-500">Tashkilot hududidagi bino parametrlari</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bino nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Masalan: Bosh o‘quv binosi yoki A bino"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
                />
                {state?.fieldErrors?.name && (
                  <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Qavatlar soni <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="floorsCount"
                  defaultValue={4}
                  min={1}
                  max={50}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
                />
                {state?.fieldErrors?.floorsCount && (
                  <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.floorsCount}</p>
                )}
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
                    <span>Binoni saqlash</span>
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
