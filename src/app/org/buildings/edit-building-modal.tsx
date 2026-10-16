"use client";

import { useState, useActionState, useEffect } from "react";
import { Edit2, X, Building, Loader2, CheckCircle2, AlertCircle, Archive } from "lucide-react";
import { updateBuildingAction, archiveBuildingAction, type ActionResponse } from "@/lib/actions/locations";

interface EditBuildingModalProps {
  building: {
    id: string;
    name: string;
    code: string;
    address: string | null;
    isActive: boolean;
  };
}

export function EditBuildingModal({ building }: EditBuildingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState<ActionResponse | null, FormData>(
    updateBuildingAction,
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

  async function handleArchive() {
    if (!confirm(`Haqiqatan ham "${building.name}" binosini arxivlamoqchimisiz? Undagi xonalar va inventarlar tarixi saqlanib qoladi.`)) {
      return;
    }
    setIsArchiving(true);
    setArchiveError(null);
    try {
      const res = await archiveBuildingAction(building.id);
      if (res.success) {
        setIsOpen(false);
      } else {
        setArchiveError(res.message);
      }
    } catch (err) {
      setArchiveError(err instanceof Error ? err.message : "Arxivlashda xatolik yuz berdi.");
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-[3px] text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        title="Tahrirlash"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[4px] shadow-xl border border-slate-200 overflow-hidden text-left">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[3px] bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Binoni tahrirlash</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Kod: {building.code}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-[3px] text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form action={formAction} className="p-6 space-y-4">
              <input type="hidden" name="buildingId" value={building.id} />

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

              {archiveError && (
                <div className="p-3 rounded-[3px] text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{archiveError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bino nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={building.name}
                  required
                  className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manzil yoki korpus tavsifi
                </label>
                <input
                  type="text"
                  name="address"
                  defaultValue={building.address || ""}
                  placeholder="Masalan: Amir Temur shox ko'chasi 108"
                  className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id={`is-active-${building.id}`}
                  name="isActive"
                  value="true"
                  defaultChecked={building.isActive}
                  className="w-4 h-4 rounded-[2px] text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor={`is-active-${building.id}`} className="text-xs text-slate-700">
                  Faol holatda saqlash
                </label>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isArchiving || isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{isArchiving ? "Arxivlanmoqda..." : "Arxivlash"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-2 rounded-[3px] text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || isArchiving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saqlanmoqda...</span>
                      </>
                    ) : (
                      <span>O&apos;zgarishlarni saqlash</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
