"use client";

import { useState, useActionState, useEffect } from "react";
import { Edit2, X, Tag, Loader2, CheckCircle2, AlertCircle, Archive } from "lucide-react";
import { updateItemAction, archiveItemAction, type ActionResponse } from "@/lib/actions/inventory";
import { ITEM_STATUSES, ITEM_CONDITIONS, type ItemStatus, type ItemCondition } from "@/lib/db/schema/inventory";

interface EditItemModalProps {
  item: {
    id: string;
    inventoryNumber: string;
    name: string;
    description?: string | null;
    categoryId: string;
    status: ItemStatus;
    condition: ItemCondition;
    price: string | null;
  };
  categories: Array<{ id: string; name: string }>;
}

const STATUS_LABELS: Record<ItemStatus, string> = {
  active: "Faol (Foydalanishda)",
  repair: "Ta’mirda",
  written_off: "Hisobdan chiqarilgan (Arxiv)",
  transferred: "Ko‘chirilgan",
  lost: "Yo‘qolgan",
};

const CONDITION_LABELS: Record<ItemCondition, string> = {
  new: "Yangi",
  good: "Yaxshi",
  fair: "Qoniqarli",
  poor: "Yomon",
  broken: "Yaroqsiz / Buzilgan",
};

export function EditItemModal({ item, categories }: EditItemModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState<ActionResponse | null, FormData>(
    updateItemAction,
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
    if (
      !confirm(
        `Haqiqatan ham "${item.name}" (${item.inventoryNumber}) inventarini hisobdan chiqarmoqchimisiz? Mulk o'chirilmaydi, audit tarixi saqlanadi.`
      )
    ) {
      return;
    }
    setIsArchiving(true);
    setArchiveError(null);
    try {
      const res = await archiveItemAction(item.id);
      if (res.success) {
        setIsOpen(false);
      } else {
        setArchiveError(res.message);
      }
    } catch (err) {
      setArchiveError(err instanceof Error ? err.message : "Arxivlashda xatolik.");
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
      >
        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
        <span>Tahrirlash</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[4px] shadow-xl border border-slate-200 overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[3px] bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Inventar ma&apos;lumotlarini tahrirlash</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Inv №: {item.inventoryNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-[3px] text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form action={formAction} className="p-6 space-y-4">
              <input type="hidden" name="itemId" value={item.id} />

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
                  Inventar nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={item.name}
                  required
                  className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Toifasi
                  </label>
                  <select
                    name="categoryId"
                    defaultValue={item.categoryId}
                    className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Narxi (UZS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    defaultValue={item.price || ""}
                    placeholder="Masalan: 1200000"
                    className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Holati
                  </label>
                  <select
                    name="status"
                    defaultValue={item.status}
                    className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    {ITEM_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABELS[st] || st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sifat darajasi
                  </label>
                  <select
                    name="condition"
                    defaultValue={item.condition}
                    className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    {ITEM_CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {CONDITION_LABELS[cond] || cond}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qo&apos;shimcha tavsif
                </label>
                <textarea
                  name="description"
                  defaultValue={item.description || ""}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isArchiving || isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{isArchiving ? "Arxivlanmoqda..." : "Hisobdan chiqarish"}</span>
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
