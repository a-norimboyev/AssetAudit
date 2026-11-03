"use client";

import { useState, useRef } from "react";
import { Edit2, X, Building2, Loader2, CheckCircle2, AlertCircle, Power, Hourglass, Sparkles, Upload, Trash2 } from "lucide-react";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import {
  updateOrganizationAction,
  toggleOrganizationStatusAction,
  type UpdateOrganizationActionResult,
} from "./actions";
import { useAdminToast } from "../admin-toast-context";

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
    settings?: {
      logoUrl?: string;
      assetLimitMlrd?: number;
      [key: string]: unknown;
    };
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
  const { showSuccessToast } = useAdminToast();
  const [name, setName] = useState(organization.name);
  const [typeId, setTypeId] = useState(organization.typeId);
  const [logoUrl, setLogoUrl] = useState<string | null>(organization.settings?.logoUrl || null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [assetLimitMlrd, setAssetLimitMlrd] = useState<number>(
    organization.settings?.assetLimitMlrd || 500
  );
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

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)) {
      setLogoError("Faqat JPG, PNG, WebP yoki SVG formatidagi rasmlar qabul qilinadi.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Rasm hajmi 5MB dan oshmasligi kerak.");
      return;
    }

    setIsLogoUploading(true);
    setLogoError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "logos");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!data.success || !data.url) {
        setLogoError(data.error || "Logoni yuklashda xatolik yuz berdi.");
        setIsLogoUploading(false);
        return;
      }

      setLogoUrl(data.url);
      setLogoError(null);
    } catch {
      setLogoError("Server bilan aloqa uzildi.");
    } finally {
      setIsLogoUploading(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
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
        logoUrl?: string | null;
        assetLimitMlrd?: number;
        subscriptionPlan?: string;
        subscriptionExpiresAt?: string;
        subscriptionNotes?: string;
      } = {
        id: organization.id,
        name,
        typeId,
        logoUrl,
        assetLimitMlrd: Number(assetLimitMlrd) || 500,
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
        showSuccessToast("Muvaffaqiyatli o'zgartirildi");
        setIsOpen(false);
        setResult(null);
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
      ? `"${organization.name}" OTMini faollashtirmoqchimisiz?`
      : `"${organization.name}" OTMini muzlatilgan holatga o'tkazmoqchimisiz? Undagi foydalanuvchilar kirishi to'xtatiladi.`;

    if (!confirm(confirmText)) return;

    setIsTogglingStatus(true);
    setToggleMessage(null);

    try {
      const res = await toggleOrganizationStatusAction(organization.id, nextState);
      if (res.success) {
        showSuccessToast("Muvaffaqiyatli o'zgartirildi");
        setIsOpen(false);
        setToggleMessage(null);
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
          className="p-2 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
          title="OTMni tahrirlash"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overscroll-contain">
          <div className="w-full max-w-3xl lg:max-w-4xl bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden text-left overscroll-contain max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">OTMni tahrirlash</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Kod: {organization.code}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {result?.error && (
                <div className="p-3.5 rounded text-xs flex items-center gap-2.5 bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{result.error}</span>
                </div>
              )}

              {toggleMessage && (
                <div className="p-3.5 rounded text-xs flex items-center gap-2.5 bg-blue-50 text-blue-800 border border-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{toggleMessage}</span>
                </div>
              )}

              {/* Universitet logotipi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Universitet logotipi
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt="OTM logosi"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Building2 className="w-6 h-6 stroke-1" />
                      </div>
                    )}
                    {isLogoUploading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isLogoUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>{logoUrl ? "Logoni almashtirish" : "Logotip yuklash"}</span>
                    </button>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl(null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>O‘chirish</span>
                      </button>
                    )}
                    <span className="text-[11px] text-slate-400 block w-full">
                      PNG, JPG, SVG yoki WebP (maks. 5MB)
                    </span>
                  </div>
                </div>
                {logoError && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{logoError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  OTM nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all"
                />
                {result?.fieldErrors?.name && (
                  <p className="mt-1 text-[11px] text-rose-600">{result.fieldErrors.name}</p>
                )}
              </div>

              {/* Aktivlar balansi limiti */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Aktivlar balansi limiti <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {assetLimitMlrd} mlrd
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={1}
                      max={50000}
                      value={assetLimitMlrd}
                      onChange={(e) => setAssetLimitMlrd(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full pl-3.5 pr-16 py-2 text-xs sm:text-sm font-mono font-bold rounded border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                      mlrd
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {[100, 250, 500, 1000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAssetLimitMlrd(preset)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded border transition-all cursor-pointer ${
                          assetLimitMlrd === preset
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {preset >= 1000 ? `${preset / 1000} trln` : `${preset} mlrd`}
                      </button>
                    ))}
                  </div>
                </div>
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
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
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
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100 flex items-center justify-between">
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
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
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
                  <div className="p-3.5 rounded border border-indigo-100 bg-indigo-50/50 space-y-3">
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
                            className="w-20 px-3 py-2 rounded border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                          />
                          <select
                            value={customUnit}
                            onChange={(e) => {
                              const u = e.target.value as "days" | "months" | "years";
                              handleCustomDurationChange(customValue, u);
                            }}
                            className="flex-1 px-3 py-2 rounded border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer"
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
                          className="w-full px-3 py-2 rounded border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-indigo-700 bg-white p-2 rounded border border-indigo-200 flex items-center justify-between">
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors cursor-pointer ${
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
                  className="px-4 py-2 rounded text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  disabled={isPending || isTogglingStatus}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
