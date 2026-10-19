"use client";

import { useState } from "react";
import { Edit2, X, Building2, Loader2, CheckCircle2, AlertCircle, Power, Hourglass, Sparkles } from "lucide-react";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import {
  updateOrganizationAction,
  toggleOrganizationStatusAction,
  type UpdateOrganizationActionResult,
} from "./actions";

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"
];

function formatUzbekDate(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return `${d.getDate()}-${UZ_MONTHS[d.getMonth()] || ""}, ${d.getFullYear()}`;
}

interface EditOrganizationModalProps {
  organization: {
    id: string;
    name: string;
    code: string;
    typeId: string;
    typeName: string | null;
    isActive: boolean;
    subscription?: {
      plan: string;
      planLabel: string;
      startsAt: Date | string;
      expiresAt: Date | string;
      daysRemaining: number;
      status: "active" | "expiring_soon" | "expired";
      statusLabel: string;
    };
  };
  types: Array<{ id: string; name: string }>;
  trigger?: React.ReactNode;
}

export function EditOrganizationModal({ organization, types, trigger }: EditOrganizationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  useBodyScrollLock(isOpen);
  const [isPending, setIsPending] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [name, setName] = useState(organization.name);
  const [typeId, setTypeId] = useState(organization.typeId);
  const [subscriptionAction, setSubscriptionAction] = useState<string>("keep");
  const [customValue, setCustomValue] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState<"days" | "months" | "years">("years");
  const [customExpiresAt, setCustomExpiresAt] = useState<string>(() => {
    if (organization.subscription?.expiresAt) {
      const d = new Date(organization.subscription.expiresAt);
      return d.toISOString().split("T")[0];
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [result, setResult] = useState<UpdateOrganizationActionResult | null>(null);
  const [toggleMessage, setToggleMessage] = useState<string | null>(null);

  const handleCustomDurationChange = (val: number, unit: "days" | "months" | "years") => {
    setSubscriptionAction("custom");
    setCustomValue(val);
    setCustomUnit(unit);
    const base = organization.subscription?.expiresAt
      ? new Date(organization.subscription.expiresAt)
      : new Date();
    const d = new Date(base.getTime() < Date.now() ? Date.now() : base.getTime());
    if (unit === "days") d.setDate(d.getDate() + val);
    else if (unit === "months") d.setMonth(d.getMonth() + val);
    else if (unit === "years") d.setFullYear(d.getFullYear() + val);
    setCustomExpiresAt(d.toISOString().split("T")[0]);
  };

  const handleCustomDateChange = (dateStr: string) => {
    setSubscriptionAction("custom");
    setCustomExpiresAt(dateStr);
    if (dateStr) {
      const target = new Date(dateStr);
      const today = new Date();
      const diffMs = target.getTime() - today.getTime();
      const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      if (diffDays % 365 === 0 && diffDays >= 365) {
        setCustomValue(diffDays / 365);
        setCustomUnit("years");
      } else if (diffDays % 30 === 0 && diffDays >= 30) {
        setCustomValue(Math.round(diffDays / 30));
        setCustomUnit("months");
      } else {
        setCustomValue(diffDays);
        setCustomUnit("days");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setResult(null);

    try {
      const payload: {
        id: string;
        name: string;
        typeId: string;
        subscriptionPlan?: string;
        subscriptionExpiresAt?: string;
        subscriptionNotes?: string;
      } = {
        id: organization.id,
        name,
        typeId,
      };

      if (subscriptionAction !== "keep") {
        payload.subscriptionPlan = subscriptionAction;
        if (subscriptionAction === "custom") {
          payload.subscriptionExpiresAt = new Date(customExpiresAt).toISOString();
          let note = "";
          if (customUnit === "years") note = `${customValue} yillik dostup`;
          else if (customUnit === "months") note = `${customValue} oylik dostup`;
          else note = `${customValue} kunlik dostup`;
          payload.subscriptionNotes = note;
        }
      }

      const res = await updateOrganizationAction(payload);
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
      {trigger ? (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer inline-flex">
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
          title="Tashkilotni tahrirlash"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overscroll-contain">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-left overscroll-contain max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tashkilotni tahrirlash</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Kod: {organization.code}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {result?.success && (
                <div className="p-3.5 rounded-xl text-xs flex items-center gap-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tashkilot ma&apos;lumotlari muvaffaqiyatli saqlandi.</span>
                </div>
              )}

              {result?.error && (
                <div className="p-3.5 rounded-xl text-xs flex items-center gap-2.5 bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{result.error}</span>
                </div>
              )}

              {toggleMessage && (
                <div className="p-3.5 rounded-xl text-xs flex items-center gap-2.5 bg-blue-50 text-blue-800 border border-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{toggleMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tashkilot nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all"
                />
                {result?.fieldErrors?.name && (
                  <p className="mt-1 text-[11px] text-rose-600">{result.fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tashkilot turi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
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

              {/* Litsenziya / Muddatni uzaytirish */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hourglass className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Dostup muddati va litsenziya
                    </span>
                  </div>
                  {organization.subscription && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        organization.subscription.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : organization.subscription.status === "expiring_soon"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {organization.subscription.statusLabel}
                    </span>
                  )}
                </div>

                {organization.subscription && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span>Joriy: <strong>{organization.subscription.planLabel}</strong></span>
                    <span>Tugash: <strong>{new Intl.DateTimeFormat("uz-UZ").format(new Date(organization.subscription.expiresAt))}</strong></span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Muddatni o‘zgartirish / uzaytirish
                  </label>
                  <select
                    value={subscriptionAction}
                    onChange={(e) => setSubscriptionAction(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="keep">O‘zgarishsiz qoldirish</option>
                    <option value="1_month">+1 oyga uzaytirish</option>
                    <option value="3_months">+3 oyga uzaytirish</option>
                    <option value="6_months">+6 oyga uzaytirish</option>
                    <option value="1_year">+1 yilga uzaytirish</option>
                    <option value="2_years">+2 yilga uzaytirish</option>
                    <option value="3_years">+3 yilga uzaytirish</option>
                    <option value="custom">O‘zim kiritaman</option>
                  </select>
                </div>

                {subscriptionAction === "custom" && (
                  <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Maxsus muddatni belgilash:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Muddat miqdori (Son va birlik):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={customValue}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              handleCustomDurationChange(val, customUnit);
                            }}
                            className="w-20 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                          />
                          <select
                            value={customUnit}
                            onChange={(e) => {
                              const u = e.target.value as "days" | "months" | "years";
                              handleCustomDurationChange(customValue, u);
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer"
                          >
                            <option value="months">Oy</option>
                            <option value="years">Yil</option>
                            <option value="days">Kun</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Yangi tugash sanasi:
                        </label>
                        <input
                          type="date"
                          required
                          value={customExpiresAt}
                          onChange={(e) => handleCustomDateChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-indigo-700 bg-white p-2 rounded-lg border border-indigo-200 flex items-center justify-between">
                      <span>Hisoblangan sana: <strong>{formatUzbekDate(customExpiresAt)}</strong></span>
                      <span className="font-semibold">
                        {customValue} {customUnit === "years" ? "yillik" : customUnit === "months" ? "oylik" : "kunlik"} dostup
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Section */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Faollik holati</div>
                  <div className="text-[11px] text-slate-500">
                    Joriy holat:{" "}
                    <strong className={organization.isActive ? "text-emerald-600" : "text-slate-500"}>
                      {organization.isActive ? "Faol" : "Nofaol"}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={isTogglingStatus || isPending}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    organization.isActive
                      ? "text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                      : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
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
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  disabled={isPending || isTogglingStatus}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
