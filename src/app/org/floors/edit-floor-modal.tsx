"use client";

import { useState, useActionState, useEffect } from "react";
import { Edit2, X, Layers, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updateFloorAction, type ActionResponse } from "@/lib/actions/locations";

interface EditFloorModalProps {
  floor: {
    id: string;
    name: string;
    floorNumber: number;
    buildingName: string;
  };
}

export function EditFloorModal({ floor }: EditFloorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(floor.name);
  const [state, formAction, isPending] = useActionState<ActionResponse | null, FormData>(
    updateFloorAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="p-1.5 rounded-[3px] text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
        title="Qavat nomini tahrirlash"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-[4px] shadow-xl border border-slate-200 overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[3px] bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Qavatni tahrirlash</h3>
                  <p className="text-[11px] text-slate-500">
                    {floor.buildingName} • {floor.floorNumber}-qavat
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                className="p-1 rounded-[3px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={formAction} className="p-6 space-y-4">
              <input type="hidden" name="floorId" value={floor.id} />

              {state?.message && (
                <div
                  className={`p-3 rounded-[4px] text-xs flex items-center gap-2 ${
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
                  Qavat nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Masalan: 3-qavat yoki IT Fakulteti qavati"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-[3px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-[3px] border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saqlanmoqda...</span>
                    </>
                  ) : (
                    <span>Saqlash</span>
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
