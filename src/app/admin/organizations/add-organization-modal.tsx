"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  Hourglass,
  Plus,
  Minus,
  X,
  UserCheck,
  User,
  Phone,
  Upload,
  Trash2,
} from "lucide-react";
import { createOrganizationAction } from "./actions";
import { validateOrganizationInput, generateCodeFromName } from "@/lib/validations/organization";
import type { OrganizationTypeOption } from "@/lib/data/organizations";
import { useAdminToast } from "../admin-toast-context";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";

const PRESET_PLANS = [
  { id: "1_day", label: "1 kun", value: 1, unit: "days" as const },
  { id: "1_month", label: "1 oy", value: 1, unit: "months" as const },
  { id: "1_year", label: "1 yil", value: 1, unit: "years" as const },
  { id: "custom", label: "O‘zim kiritaman", value: 0, unit: "months" as const },
];

function formatDateIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateTargetDate(base: Date, value: number, unit: "days" | "months" | "years"): Date {
  const d = new Date(base);
  if (unit === "days") {
    d.setDate(d.getDate() + value);
  } else if (unit === "months") {
    d.setMonth(d.getMonth() + value);
  } else if (unit === "years") {
    d.setFullYear(d.getFullYear() + value);
  }
  return d;
}

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"
];

function formatUzbekDate(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return `${d.getDate()}-${UZ_MONTHS[d.getMonth()] || ""}, ${d.getFullYear()}`;
}

interface AddOrganizationModalProps {
  types: OrganizationTypeOption[];
  trigger?: React.ReactNode;
}

export function AddOrganizationModal({ types, trigger }: AddOrganizationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  useBodyScrollLock(isOpen);
  const router = useRouter();
  const { showSuccessToast } = useAdminToast();

  // Universitet maydonlari
  const [name, setName] = useState("");
  const typeId = types[0]?.id || "university";
  const [assetLimitMlrd, setAssetLimitMlrd] = useState<number>(5);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Dostup muddati
  const [selectedPreset, setSelectedPreset] = useState<string>("1_year");
  const [customValue, setCustomValue] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState<"days" | "months" | "years">("years");
  const [customDate, setCustomDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return formatDateIsoDate(d);
  });

  // Administrator maydonlari
  const [adminFullName, setAdminFullName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    adminUsername?: string;
    adminPassword?: string;
  }>({});

  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    email?: string;
    temporaryPassword?: string;
    fullName: string;
    role: string;
    phone?: string;
    orgName: string;
    orgCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const isSubmittingRef = useRef(false);

  function resetForm() {
    setName("");
    setAssetLimitMlrd(5);
    setLogoUrl(null);
    setLogoError(null);
    setIsLogoUploading(false);
    setSelectedPreset("1_year");
    setCustomValue(1);
    setCustomUnit("years");
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setCustomDate(formatDateIsoDate(d));
    setAdminFullName("");
    setAdminUsername("");
    setAdminPhone("");
    setAdminPassword("");
    setShowPassword(false);
    setGeneralError(null);
    setFieldErrors({});
    setCreatedCredentials(null);
    setCopied(false);
    isSubmittingRef.current = false;
  }

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

  function handleDecreaseLimit() {
    setAssetLimitMlrd((prev) => {
      if (prev <= 1) return 1;
      if (prev <= 10) return prev - 1;
      if (prev <= 50) return prev - 5;
      if (prev <= 200) return prev - 25;
      return prev - 50;
    });
  }

  function handleIncreaseLimit() {
    setAssetLimitMlrd((prev) => {
      if (prev < 10) return prev + 1;
      if (prev < 50) return prev + 5;
      if (prev < 200) return prev + 25;
      return prev + 50;
    });
  }

  function handleGeneratePassword() {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnpqrstuvwxyz";
    const digits = "23456789";
    const special = "!@#$%^&*";
    const all = upper + lower + digits + special;
    const getRandom = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
    const pass = [
      getRandom(upper),
      getRandom(lower),
      getRandom(digits),
      getRandom(special),
      ...Array.from({ length: 8 }, () => getRandom(all)),
    ].sort(() => Math.random() - 0.5).join("");

    setAdminPassword(pass);
    setShowPassword(true);
    if (fieldErrors.adminPassword) {
      setFieldErrors((prev) => ({ ...prev, adminPassword: undefined }));
    }
  }

  function handlePresetClick(presetId: string, value: number, unit: "days" | "months" | "years") {
    setSelectedPreset(presetId);
    if (presetId !== "custom") {
      setCustomValue(value);
      setCustomUnit(unit);
      const target = calculateTargetDate(new Date(), value, unit);
      setCustomDate(formatDateIsoDate(target));
    }
  }

  function handleCustomDurationChange(val: number, unit: "days" | "months" | "years") {
    setSelectedPreset("custom");
    setCustomValue(val);
    setCustomUnit(unit);
    const target = calculateTargetDate(new Date(), Math.max(1, val), unit);
    setCustomDate(formatDateIsoDate(target));
  }

  function handleCustomDateChange(dateStr: string) {
    setSelectedPreset("custom");
    setCustomDate(dateStr);
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
  }

  function getSummary() {
    const target = customDate ? new Date(customDate) : calculateTargetDate(new Date(), 1, "years");
    const today = new Date();
    const diffDays = Math.max(1, Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    let label = "";
    if (selectedPreset === "1_day") label = "1 kunlik dostup";
    else if (selectedPreset === "1_month") label = "1 oylik dostup";
    else if (selectedPreset === "1_year") label = "1 yillik dostup";
    else {
      if (customUnit === "years") label = `${customValue} yillik dostup`;
      else if (customUnit === "months") label = `${customValue} oylik dostup`;
      else label = `${customValue} kunlik dostup`;
    }

    const formattedTarget = formatUzbekDate(target);
    return { label, daysRemaining: diffDays, formattedTarget, targetDate: target };
  }

  function handleCopyCredentials() {
    if (!createdCredentials) return;
    const loginVal = createdCredentials.username || createdCredentials.email?.split("@")[0];
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = `AssetAudit — OTM Administratori Kirish Ma'lumotlari:
Universitet: ${createdCredentials.orgName}
Mas'ul administrator: ${createdCredentials.fullName}
Admin logini: ${loginVal}
Parol: ${createdCredentials.temporaryPassword || adminPassword || "Belgilangan parol"}
Telefon: ${createdCredentials.phone || "Kiritilmagan"}
Kirish manzili: ${origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFinishAndClose() {
    setIsOpen(false);
    resetForm();
    showSuccessToast("Muvaffaqiyatli o'zgartirildi");
    router.refresh();
  }

  function handleOpen() {
    resetForm();
    setIsOpen(true);
  }

  function handleClose() {
    if (createdCredentials) {
      handleFinishAndClose();
    } else {
      resetForm();
      setIsOpen(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (isSubmittingRef.current || isLoading) return;

    setGeneralError(null);
    setFieldErrors({});

    const effectiveCode = generateCodeFromName(name);
    const clientValidation = validateOrganizationInput({
      name,
      code: effectiveCode,
      typeId,
      isActive: true,
    });

    const errors: Record<string, string> = {};

    if (!clientValidation.valid) {
      if (clientValidation.errors.name) {
        errors.name = clientValidation.errors.name;
      }
    }

    if (!adminUsername.trim()) {
      errors.adminUsername = "Admin loginini kiritish majburiy.";
    } else if (adminUsername.trim().length < 3) {
      errors.adminUsername = "Login kamida 3 ta belgidan iborat bo‘lishi kerak.";
    }

    if (!adminPassword.trim()) {
      errors.adminPassword = "Parolni kiritish majburiy.";
    } else if (adminPassword.trim().length < 6) {
      errors.adminPassword = "Parol kamida 6 ta belgidan iborat bo‘lishi kerak.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const summary = getSummary();
      const result = await createOrganizationAction({
        name: clientValidation.normalized.name,
        code: clientValidation.normalized.code,
        typeId: clientValidation.normalized.typeId,
        isActive: true,
        assetLimitMlrd: Number(assetLimitMlrd) || 5,
        subscriptionPlan: selectedPreset,
        subscriptionExpiresAt: summary.targetDate.toISOString(),
        subscriptionNotes: summary.label,
        adminFullName: adminFullName.trim() || `${clientValidation.normalized.name} Rahbari`,
        adminUsername: adminUsername.trim(),
        adminPassword: adminPassword.trim() || undefined,
        adminPhone: adminPhone.trim() || undefined,
        logoUrl: logoUrl || undefined,
      });

      if (!result.success) {
        setGeneralError(result.error || "OTM yaratishda xatolik yuz berdi.");
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        isSubmittingRef.current = false;
        setIsLoading(false);
        return;
      }

      if (result.credentials) {
        setCreatedCredentials({
          ...result.credentials,
          phone: adminPhone.trim() || undefined,
          orgName: clientValidation.normalized.name,
          orgCode: clientValidation.normalized.code,
        });
      } else {
        handleFinishAndClose();
      }
    } catch {
      setGeneralError("Server bilan bog‘lanishda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.");
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }

  const summary = getSummary();

  return (
    <>
      {trigger ? (
        <div onClick={handleOpen} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>OTM qo‘shish</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overscroll-contain">
          <div
            className="w-full max-w-5xl lg:max-w-6xl bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs shrink-0 border border-blue-100">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  OTM qo‘shish
                </h2>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
              {createdCredentials ? (
                /* Success View with Credentials Card */
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">
                        Universitet va boshqaruvchi administrator muvaffaqiyatli yaratildi!
                      </p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Quyidagi hisob ma&apos;lumotlarini nusxalab olib, universitet mas&apos;uliga taqdim eting.
                      </p>
                    </div>
                  </div>

                  {/* Credentials Card */}
                  <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          OTM Administratori Hisobi
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs sm:text-sm">
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-400 block text-xs">Universitet:</span>
                        <span className="font-bold text-slate-900 mt-0.5 block truncate">
                          {createdCredentials.orgName}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-400 block text-xs">Mas&apos;ul shaxs:</span>
                        <span className="font-bold text-slate-900 mt-0.5 block truncate">
                          {createdCredentials.fullName}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-400 block text-xs">Admin logini:</span>
                        <span className="font-mono font-bold text-blue-600 mt-0.5 block truncate">
                          {createdCredentials.username || createdCredentials.email?.split("@")[0]}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-400 block text-xs">Vaqtinchalik parol:</span>
                        <span className="font-mono font-bold text-slate-900 mt-0.5 block truncate">
                          {createdCredentials.temporaryPassword || adminPassword || "••••••••"}
                        </span>
                      </div>

                      {createdCredentials.phone && (
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 sm:col-span-2 lg:col-span-4">
                          <span className="text-slate-400 block text-xs">Telefon raqami:</span>
                          <span className="font-mono font-semibold text-slate-900 mt-0.5 block">
                            {createdCredentials.phone}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      <button
                        type="button"
                        onClick={handleCopyCredentials}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Nusxa olindi!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Ma&apos;lumotlardan nusxa olish</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleFinishAndClose}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        Tugatish va jadvalga qaytish
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Creation Form */
                <form
                  id="add-organization-modal-form"
                  onSubmit={handleSubmit}
                  autoComplete="off"
                  className="space-y-6"
                >
                  {/* Browser autofill prevention fake fields */}
                  <input
                    type="text"
                    name="fake_chrome_autofill_user"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    autoComplete="off"
                  />
                  <input
                    type="password"
                    name="fake_chrome_autofill_pwd"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    autoComplete="new-password"
                  />
                  {generalError && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{generalError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 lg:gap-9 items-start">
                    {/* Chap ustun: Universitet va Litsenziya */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                          <Building2 className="w-4.5 h-4.5 text-blue-600" />
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                            Universitet ma&apos;lumotlari
                          </h3>
                        </div>

                        <div className="space-y-4">
                          {/* Universitet logotipi */}
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                              Universitet logotipi
                            </label>
                            <input
                              ref={logoInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              onChange={handleLogoFileChange}
                              className="hidden"
                            />
                            <div className="flex items-center gap-3.5">
                              <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden relative group">
                                {logoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={logoUrl}
                                    alt="Universitet logosi"
                                    className="w-full h-full object-contain p-1.5 bg-white"
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

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => logoInputRef.current?.click()}
                                  disabled={isLogoUploading}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                                >
                                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{logoUrl ? "Logoni almashtirish" : "Logotip yuklash"}</span>
                                </button>

                                {logoUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setLogoUrl(null)}
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>O‘chirish</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            {logoError && (
                              <p className="mt-1 text-xs text-rose-600 font-medium">{logoError}</p>
                            )}
                          </div>

                          {/* OTM to'liq nomi */}
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                              OTM to‘liq nomi <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => {
                                setName(e.target.value);
                                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                              }}
                              placeholder="Masalan: Toshkent Axborot Texnologiyalari Universiteti"
                              className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 transition-all font-medium ${
                                fieldErrors.name
                                  ? "border-rose-300 focus:ring-rose-100 focus:border-rose-500"
                                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
                              }`}
                            />
                            {fieldErrors.name && (
                              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.name}</p>
                            )}
                          </div>

                          {/* Aktivlar balansi limiti (Plus va Minus tugmalari bilan) */}
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                              Aktivlar balansi limiti <span className="text-rose-500">*</span>
                            </label>

                            {/* Stepper Input: Minus, Number input, Plus */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleDecreaseLimit}
                                className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base cursor-pointer transition-colors shadow-2xs active:scale-95"
                                title="Limitni kamaytirish (-)"
                              >
                                <Minus className="w-4 h-4" />
                              </button>

                              <div className="relative flex-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={50000}
                                  value={assetLimitMlrd}
                                  onChange={(e) => setAssetLimitMlrd(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                  className="w-full pl-4 pr-24 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                                  mlrd so‘m
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleIncreaseLimit}
                                className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base cursor-pointer transition-colors shadow-2xs active:scale-95"
                                title="Limitni oshirish (+)"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Litsenziya muddati */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                          <Hourglass className="w-4.5 h-4.5 text-blue-600" />
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                            Litsenziya muddati
                          </h3>
                        </div>

                        <div className="space-y-3">
                          {/* Presets (1 kun, 1 oy, 3 oy, 6 oy, 1 yil, O'zim kiritaman) */}
                          <div className="flex flex-wrap gap-2">
                            {PRESET_PLANS.map((p) => {
                              const isSel = selectedPreset === p.id;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handlePresetClick(p.id, p.value, p.unit)}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                                    isSel
                                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Custom inputs */}
                          {selectedPreset === "custom" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 animate-in fade-in">
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                  Muddat (qiymat va birlik)
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    max={3650}
                                    value={customValue}
                                    onChange={(e) => handleCustomDurationChange(Math.max(1, parseInt(e.target.value, 10) || 1), customUnit)}
                                    className="w-20 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-900"
                                  />
                                  <select
                                    value={customUnit}
                                    onChange={(e) => handleCustomDurationChange(customValue, e.target.value as "days" | "months" | "years")}
                                    className="flex-1 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-900"
                                  >
                                    <option value="days">Kun</option>
                                    <option value="months">Oy</option>
                                    <option value="years">Yil</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                  Yoki aniq tugash sanasi
                                </label>
                                <input
                                  type="date"
                                  value={customDate}
                                  onChange={(e) => handleCustomDateChange(e.target.value)}
                                  className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-900"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* O'ng ustun: Administrator hisobi */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                          <UserCheck className="w-4.5 h-4.5 text-blue-600" />
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                            Administrator hisobi
                          </h3>
                        </div>

                        <div className="space-y-4">
                          {/* Ism va familiyasi */}
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                              Ism va familiyasi
                            </label>
                            <div className="relative">
                              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={adminFullName}
                                onChange={(e) => setAdminFullName(e.target.value)}
                                placeholder="Azizjon Norimboyev"
                                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                              />
                            </div>
                          </div>

                          {/* Telefon raqami */}
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                              Telefon raqami
                            </label>
                            <div className="relative">
                              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={adminPhone}
                                onChange={(e) => setAdminPhone(e.target.value)}
                                placeholder="+998 90 123 45 67"
                                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-mono font-medium"
                              />
                            </div>
                          </div>

                          {/* Admin logini */}
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                              Admin logini <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="org_admin_login"
                              id="org_admin_login"
                              autoComplete="new-password"
                              data-lpignore="true"
                              data-1p-ignore="true"
                              value={adminUsername}
                              onChange={(e) => {
                                setAdminUsername(e.target.value);
                                if (fieldErrors.adminUsername) {
                                  setFieldErrors((prev) => ({ ...prev, adminUsername: undefined }));
                                }
                              }}
                              placeholder="masalan: tatu_admin"
                              className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 transition-all font-mono font-medium ${
                                fieldErrors.adminUsername
                                  ? "border-rose-300 focus:ring-rose-100 focus:border-rose-500"
                                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
                              }`}
                            />
                            {fieldErrors.adminUsername && (
                              <p className="mt-1 text-xs text-rose-600 font-medium">
                                {fieldErrors.adminUsername}
                              </p>
                            )}
                          </div>

                          {/* Parol */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                                Xavfsiz parol <span className="text-rose-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={handleGeneratePassword}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Parol yaratish</span>
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                name="org_admin_pass"
                                id="org_admin_pass"
                                autoComplete="new-password"
                                data-lpignore="true"
                                data-1p-ignore="true"
                                value={adminPassword}
                                onChange={(e) => {
                                  setAdminPassword(e.target.value);
                                  if (fieldErrors.adminPassword) {
                                    setFieldErrors((prev) => ({ ...prev, adminPassword: undefined }));
                                  }
                                }}
                                placeholder="Kamida 6 ta belgi"
                                className={`w-full pl-4 pr-11 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 transition-all font-mono font-medium ${
                                  fieldErrors.adminPassword
                                    ? "border-rose-300 focus:ring-rose-100 focus:border-rose-500"
                                    : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                                aria-label={showPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}
                              >
                                {showPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            {fieldErrors.adminPassword && (
                              <p className="mt-1 text-xs text-rose-600 font-medium">
                                {fieldErrors.adminPassword}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saqlanmoqda...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>OTM qo‘shish</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
