"use client";

import { useState } from "react";
import { Edit2, X, Building2, Loader2, CheckCircle2, AlertCircle, Power } from "lucide-react";
import {
  updateOrganizationAction,
  toggleOrganizationStatusAction,
  type UpdateOrganizationActionResult,
} from "./actions";

interface EditOrganizationModalProps {
  organization: {
    id: string;
    name: string;
    code: string;
    typeId: string;
    typeName: string | null;
    isActive: boolean;
  };
  types: Array<{ id: string; name: string }>;
}

export function EditOrganizationModal({ organization, types }: EditOrganizationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [name, setName] = useState(organization.name);
  const [typeId, setTypeId] = useState(organization.typeId);
  const [result, setResult] = useState<UpdateOrganizationActionResult | null>(null);
  const [toggleMessage, setToggleMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setResult(null);

    try {
      const res = await updateOrganizationAction({
        id: organization.id,
        name,
        typeId,
      });
      setResult(res);
      if (res.success) {
        setTimeout(() => {
          setIsOpen(false);
          setResult(null);
        }, 1000);
      }
    } catch {
      setResult({
        success: false,
        error: "Kutilmagan xatolik yuz berdi.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleToggleStatus = async () => {
    const nextState = !organization.isActive;
    const confirmText = nextState
      ? `"${organization.name}" tashkilotini faollashtirmoqchimisiz?`
      : `"${organization.name}" tashkilotini nofaol (bloklangan) holatga o'tkazmoqchimisiz? Undagi foydalanuvchilar kirishi to'xtatiladi.`;

    if (!confirm(confirmText)) return;

    setIsTogglingStatus(true);
    setToggleMessage(null);

    try {
      const res = await toggleOrganizationStatusAction(organization.id, nextState);
      if (res.success) {
        setToggleMessage(`Tashkilot holati muvaffaqiyatli o'zgartirildi.`);
        setTimeout(() => {
          setIsOpen(false);
          setToggleMessage(null);
        }, 1000);
      } else {
        setToggleMessage(res.error || "Holatni o'zgartirishda xatolik yuz berdi.");
      }
    } catch {
      setToggleMessage("Server bilan aloqa xatosi.");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-[3px] text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
        title="Tashkilotni tahrirlash"
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
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tashkilotni tahrirlash</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Kod: {organization.code}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-[3px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {result?.success && (
                <div className="p-3 rounded-[3px] text-xs flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tashkilot ma&apos;lumotlari muvaffaqiyatli saqlandi.</span>
                </div>
              )}

              {result?.error && (
                <div className="p-3 rounded-[3px] text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{result.error}</span>
                </div>
              )}

              {toggleMessage && (
                <div className="p-3 rounded-[3px] text-xs flex items-center gap-2 bg-blue-50 text-blue-800 border border-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{toggleMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tashkilot nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500"
                />
                {result?.fieldErrors?.name && (
                  <p className="mt-1 text-[11px] text-rose-600">{result.fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tashkilot turi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500 bg-white"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {result?.fieldErrors?.typeId && (
                  <p className="mt-1 text-[11px] text-rose-600">{result.fieldErrors.typeId}</p>
                )}
              </div>

              {/* Status Section */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Faollik holati</div>
                  <div className="text-[11px] text-slate-500">
                    Joriy holat:{" "}
                    <strong className={organization.isActive ? "text-emerald-600" : "text-slate-500"}>
                      {organization.isActive ? "Faol" : "Nofaol (bloklangan)"}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={isTogglingStatus || isPending}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold border transition cursor-pointer ${
                    organization.isActive
                      ? "text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                      : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>
                    {isTogglingStatus
                      ? "O'zgartirilmoqda..."
                      : organization.isActive
                      ? "Nofaol qilish"
                      : "Faollashtirish"}
                  </span>
                </button>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 rounded-[3px] text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  disabled={isPending || isTogglingStatus}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
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

