"use client";

import { useState, useActionState, useTransition } from "react";
import {
  SlidersHorizontal,
  X,
  Plus,
  Trash2,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Pencil,
  Check,
} from "lucide-react";
import {
  addRoomTypeAction,
  removeRoomTypeAction,
  resetRoomTypesAction,
  updateRoomTypeAction,
  type RoomTypeActionResponse,
} from "@/lib/actions/room-types";
import type { RoomTypeOption } from "@/lib/constants/room-types";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";

export function RoomTypesModal({ roomTypes }: { roomTypes: RoomTypeOption[] }) {
  const [isOpen, setIsOpen] = useState(false);
  useBodyScrollLock(isOpen);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const [addState, addAction, isAdding] = useActionState<RoomTypeActionResponse | null, FormData>(
    addRoomTypeAction,
    null
  );

  async function handleSaveEdit(typeId: string) {
    if (!editingText.trim()) return;
    startTransition(async () => {
      const res = await updateRoomTypeAction(typeId, editingText.trim());
      if (res.success) {
        setNotice({ type: "success", text: res.message });
        setEditingId(null);
        setEditingText("");
      } else {
        setNotice({ type: "error", text: res.message });
      }
    });
  }

  async function handleRemove(typeId: string, label: string) {
    if (!confirm(`Haqiqatan ham "${label}" xona turini olib tashlamoqchimisiz?`)) {
      return;
    }
    startTransition(async () => {
      const res = await removeRoomTypeAction(typeId);
      if (res.success) {
        setNotice({ type: "success", text: res.message });
      } else {
        setNotice({ type: "error", text: res.message });
      }
    });
  }

  async function handleReset() {
    if (!confirm("Barcha xona turlarini universitetning standart ro‘yxatiga qaytarmoqchimisiz?")) {
      return;
    }
    startTransition(async () => {
      const res = await resetRoomTypesAction();
      if (res.success) {
        setNotice({ type: "success", text: res.message });
      } else {
        setNotice({ type: "error", text: res.message });
      }
    });
  }

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setNotice(null);
        }}
        type="button"
        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        title="Xona turlarini sozlash"
      >
        <SlidersHorizontal className="w-4 h-4 text-slate-500" />
        <span>Xona turlarini sozlash</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overscroll-contain">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh] overscroll-contain">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Xona turlarini boshqarish</h3>
                  <p className="text-[11px] text-slate-500">
                    Universitetga mos xona turlarini qo‘shish, o‘chirish va tahrirlash
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 overscroll-contain">
              {/* Notifications */}
              {(notice || addState?.message) && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                    (notice?.type === "success" || addState?.success)
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {(notice?.type === "success" || addState?.success) ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{notice?.text || addState?.message}</span>
                </div>
              )}

              {/* Yangi tur qo'shish formasi */}
              <form action={addAction} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Yangi xona turi qo‘shish:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="label"
                    required
                    placeholder="Masalan: Ma‘ruza xonasi, Lingafon kabineti, Sport zali..."
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs hover:shadow-xs disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isAdding ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Qo‘shish</span>
                  </button>
                </div>
              </form>

              {/* Mavjud turlar ro'yxati */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Faol xona turlari ({roomTypes.length} ta)
                  </span>
                  <button
                    onClick={handleReset}
                    disabled={isPending}
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-600 transition-colors font-medium"
                    title="Birlamchi universitet ro‘yxatini tiklash"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Standart turlarni tiklash</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                  {roomTypes.map((t) => {
                    const isEditing = editingId === t.id;

                    return (
                      <div
                        key={t.id}
                        className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors gap-3"
                      >
                        {isEditing ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSaveEdit(t.id);
                            }}
                            className="flex-1 flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  setEditingId(null);
                                  setEditingText("");
                                }
                              }}
                              autoFocus
                              className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-white border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-900 transition-all font-medium"
                            />
                            <button
                              type="submit"
                              disabled={isPending || !editingText.trim()}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Saqlash"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingText("");
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Bekor qilish"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                  t.color || "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                {t.label}
                              </span>
                              {t.isCustom && (
                                <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  Maxsus
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingId(t.id);
                                  setEditingText(t.label);
                                }}
                                disabled={isPending}
                                type="button"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition-colors cursor-pointer"
                                title="Tahrirlash"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleRemove(t.id, t.label)}
                                disabled={isPending || roomTypes.length <= 1}
                                type="button"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors cursor-pointer"
                                title="Olib tashlash"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                O‘zgarishlar darhol xona qo‘shish oynasida aks etadi.
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                Tayyor
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
