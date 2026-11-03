"use client";

import { useState, useRef, type FormEvent } from "react";
import Link from "next/link";
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
  Sparkles,
  Coins,
  Upload,
  Trash2,
} from "lucide-react";
import { createOrganizationAction } from "../actions";
import { validateOrganizationInput, generateCodeFromName } from "@/lib/validations/organization";
import type { OrganizationTypeOption } from "@/lib/data/organizations";

const PRESET_PLANS = [
  { id: "1_month", label: "1 oy", value: 1, unit: "months" as const },
  { id: "3_months", label: "3 oy", value: 3, unit: "months" as const },
  { id: "6_months", label: "6 oy", value: 6, unit: "months" as const },
  { id: "1_year", label: "1 yil", value: 1, unit: "years" as const },
  { id: "2_years", label: "2 yil", value: 2, unit: "years" as const },
  { id: "3_years", label: "3 yil", value: 3, unit: "years" as const },
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

interface NewOrganizationFormProps {
  types: OrganizationTypeOption[];
}

export function NewOrganizationForm({ types }: NewOrganizationFormProps) {
  // Universitet maydonlari
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState(types[0]?.id || "university");
  const [assetLimitMlrd, setAssetLimitMlrd] = useState<number>(500);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  // Dostup muddati va litsenziya
  const [selectedPreset, setSelectedPreset] = useState<string>("1_year");
  const [customValue, setCustomValue] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState<"days" | "months" | "years">("years");
  const [customDate, setCustomDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return formatDateIsoDate(d);
  });

  // Administrator maydonlari (Ismi, Gmail, Telefon va Parol)
  const [adminFullName, setAdminFullName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    typeId?: string;
    adminFullName?: string;
    adminUsername?: string;
    adminPhone?: string;
    adminPassword?: string;
  }>({});

  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    email?: string;
    temporaryPassword?: string;
    fullName: string;
    role: string;
    phone?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Synchronous submission guard
  const isSubmittingRef = useRef(false);

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
      ...Array.from({ length: 10 }, () => getRandom(all)),
    ].sort(() => Math.random() - 0.5).join("");

    setAdminPassword(pass);
    setShowPassword(true);
    if (fieldErrors.adminPassword) {
      setFieldErrors((prev) => ({ ...prev, adminPassword: undefined }));
    }
  }

  function handleCopyCredentials() {
    if (!createdCredentials) return;
    const loginValue = createdCredentials.username || createdCredentials.email?.split("@")[0];
    const text = `AssetAudit — Universitet Administratori:\nUniversitet: ${name}\nAktivlar Limiti: ${assetLimitMlrd} mlrd so'm\nLitsenziya: ${getSummary().label}\nAdmin Logini: ${loginValue}\nParol: ${createdCredentials.temporaryPassword || adminPassword || "Belgilangan parol"}\nRoli: OTM Rahbari/Admini`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    if (selectedPreset === "1_year") label = "1 yillik dostup";
    else if (selectedPreset === "2_years") label = "2 yillik dostup";
    else if (selectedPreset === "3_years") label = "3 yillik dostup";
    else if (selectedPreset === "6_months") label = "6 oylik dostup";
    else if (selectedPreset === "3_months") label = "3 oylik dostup";
    else if (selectedPreset === "1_month") label = "1 oylik dostup";
    else {
      if (customUnit === "years") label = `${customValue} yillik dostup`;
      else if (customUnit === "months") label = `${customValue} oylik dostup`;
      else label = `${customValue} kunlik dostup`;
    }

    const formattedTarget = formatUzbekDate(target);

    return { label, daysRemaining: diffDays, formattedTarget, targetDate: target };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (isSubmittingRef.current || isLoading) {
      return;
    }

    setGeneralError(null);
    setFieldErrors({});

    const clientValidation = validateOrganizationInput({
      name,
      code: generateCodeFromName(name),
      typeId,
      isActive: true,
    });

    const errors: Record<string, string> = {};

    if (!clientValidation.valid) {
      Object.assign(errors, clientValidation.errors);
    }

    if (!adminUsername.trim()) {
      errors.adminUsername = "Admin loginini kiritish majburiy.";
    } else if (adminUsername.trim().length < 3) {
      errors.adminUsername = "Login kamida 3 ta belgidan iborat bo'lishi kerak.";
    }

    if (!adminPassword.trim()) {
      errors.adminPassword = "Parolni kiritish majburiy.";
    } else if (adminPassword.trim().length < 6) {
      errors.adminPassword = "Parol kamida 6 ta belgidan iborat bo'lishi kerak.";
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
        assetLimitMlrd: Number(assetLimitMlrd) || 500,
        subscriptionPlan: selectedPreset,
        subscriptionExpiresAt: summary.targetDate.toISOString(),
        subscriptionNotes: summary.label,
        adminFullName: adminFullName.trim() || `${clientValidation.normalized.name} Bosh Administratori`,
        adminUsername: adminUsername.trim(),
        adminPassword: adminPassword.trim() || undefined,
        adminPhone: adminPhone.trim() || undefined,
        logoUrl: logoUrl || undefined,
      });

      if (!result.success) {
        setGeneralError(result.error || "Tashkilot yaratishda xatolik yuz berdi.");
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
        });
      }
    } catch {
      setGeneralError("Server bilan bog'lanishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }

  // Muvaffaqiyatli yaratilgandan keyin ko'rsatiladigan hisob ma'lumotlari ekrani
  if (createdCredentials) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-semibold">
            Universitet va uning boshqaruvchi administratori muvaffaqiyatli yaratildi!
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-slate-400 font-sans font-semibold text-xs">
              Administrator hisob ma&apos;lumotlari:
            </span>
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-sans font-medium">Nusxalandi</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="font-sans font-medium">Nusxalash</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-1.5 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 font-sans text-xs">Universitet: </span>
              <strong className="text-white font-semibold font-sans">{name}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-sans text-xs">Aktivlar balansi limiti: </span>
              <strong className="text-emerald-400 font-bold font-sans">{assetLimitMlrd} mlrd so‘m</strong>
            </div>
            <div>
              <span className="text-slate-400 font-sans text-xs">Litsenziya muddati: </span>
              <strong className="text-indigo-300 font-semibold font-sans">{getSummary().label} ({getSummary().formattedTarget} gacha)</strong>
            </div>
            <div>
              <span className="text-slate-400 font-sans text-xs">Administrator: </span>
              <strong className="text-white font-semibold font-sans">{createdCredentials.fullName}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-sans text-xs">Admin logini: </span>
              <strong className="text-blue-400 font-bold tracking-wide">{createdCredentials.username || createdCredentials.email?.split("@")[0]}</strong>
            </div>
            {createdCredentials.temporaryPassword && (
              <div>
                <span className="text-slate-400 font-sans text-xs">Parol: </span>
                <strong className="text-amber-400 font-bold tracking-wide">{createdCredentials.temporaryPassword}</strong>
              </div>
            )}
            {createdCredentials.phone && (
              <div>
                <span className="text-slate-400 font-sans text-xs">Telefon: </span>
                <strong className="text-emerald-400 font-bold tracking-wide">{createdCredentials.phone}</strong>
              </div>
            )}
          </div>

          <div className="pt-2 text-[11px] text-slate-400 font-sans leading-relaxed border-t border-slate-800/80">
            Eslatma: Universitet administratori ushbu login va parol orqali tizimga kiradi. Ma&apos;lumotlarni nusxalab, mas&apos;ul shaxsga taqdim eting.
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Link
            href="/admin/organizations"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Building2 className="w-4 h-4" />
            <span>OTMlar ro‘yxatiga o‘tish</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate autoComplete="off" className="space-y-6">
      {/* Umumiy xatolik xabari */}
      {generalError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-200"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Xatolik yuz berdi</p>
            <p className="mt-0.5 leading-relaxed">{generalError}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
        {/* 1-Qism: Universitet ma'lumotlari */}
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <span>Universitet ma&apos;lumotlari</span>
          </h2>
        </div>

        {/* Universitet logotipi */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Universitet logotipi (ixtiyoriy)
          </label>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleLogoFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden relative">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Universitet logosi"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Building2 className="w-7 h-7 stroke-1" />
                </div>
              )}
              {isLogoUploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isLogoUploading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>{logoUrl ? "Logoni almashtirish" : "Logotip yuklash"}</span>
              </button>

              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>O‘chirish</span>
                </button>
              )}
              <span className="text-xs text-slate-400 block w-full">
                PNG, JPG, SVG yoki WebP (maks. 5MB)
              </span>
            </div>
          </div>
          {logoError && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{logoError}</p>
          )}
        </div>

        {/* Universitet rasmiy nomi */}
        <div>
          <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Universitet nomi <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            disabled={isLoading}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            placeholder="Masalan: Toshkent Axborot Texnologiyalari Universiteti"
            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-all outline-hidden focus:ring-2 focus:ring-blue-100 ${
              fieldErrors.name
                ? "border-red-300 bg-red-50/30 text-red-900 focus:border-red-500"
                : "border-slate-200 bg-slate-50/50 text-slate-900 hover:border-slate-300 focus:border-blue-500 focus:bg-white"
            }`}
          />
          {fieldErrors.name && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors.name}</span>
            </p>
          )}
        </div>

        {/* Aktivlar balansi limiti */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="assetLimitMlrd" className="block text-xs sm:text-sm font-semibold text-slate-700">
              Aktivlar balansi limiti <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500">Maksimal nazorat miqdori</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                id="assetLimitMlrd"
                name="assetLimitMlrd"
                type="number"
                min={1}
                max={50000}
                required
                disabled={isLoading}
                value={assetLimitMlrd}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                  setAssetLimitMlrd(val);
                }}
                className="w-full pl-3.5 pr-28 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 hover:border-slate-300 focus:border-blue-500 focus:bg-white font-mono font-bold text-xs sm:text-sm transition-all outline-hidden focus:ring-2 focus:ring-blue-100"
                placeholder="500"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 pointer-events-none">
                mlrd so‘m
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {[100, 250, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAssetLimitMlrd(preset)}
                  className={`flex-1 sm:flex-none px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    assetLimitMlrd === preset
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-100"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {preset >= 1000 ? `${preset / 1000} trln` : `${preset} mlrd`}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            OTM hisobidagi aktivlar uchun ruxsat etilgan limit ({assetLimitMlrd} mlrd so‘m).
          </p>
        </div>

        {/* 2-Qism: Litsenziya muddati */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Hourglass className="w-4 h-4" />
              </div>
              <span>Litsenziya muddati</span>
            </h2>
          </div>

          {/* Tezkor preset tugmalar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Tezkor muddat tanlash:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_PLANS.map((p) => {
                const isSelected = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetClick(p.id, p.value, p.unit)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-100"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* O'zimiz istagan muddatni erkin kiritish maydonlari */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>O‘zingiz istagan muddatni belgilash:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Variant A: Muddat miqdori (Son + Birlik) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Muddat miqdori (Son va birlik kiritish):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={customValue}
                    disabled={isLoading}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      handleCustomDurationChange(val, customUnit);
                    }}
                    placeholder="Masalan: 5"
                    className="w-24 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                  <select
                    value={customUnit}
                    disabled={isLoading}
                    onChange={(e) => {
                      const u = e.target.value as "days" | "months" | "years";
                      handleCustomDurationChange(customValue, u);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="months">Oy</option>
                    <option value="years">Yil</option>
                    <option value="days">Kun</option>
                  </select>
                </div>
              </div>

              {/* Variant B: Aniq tugash sanasi (Kalendar) */}
              <div>
                <label htmlFor="customExpiresAt" className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Yoki aniq tugash sanasini tanlang:
                </label>
                <div className="relative">
                  <input
                    id="customExpiresAt"
                    type="date"
                    min={formatDateIsoDate(new Date())}
                    value={customDate}
                    disabled={isLoading}
                    onChange={(e) => handleCustomDateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Jonli natija banneri */}
            {(() => {
              const summary = getSummary();
              return (
                <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="font-medium text-slate-700">
                      Belgilangan dostup: <strong className="text-indigo-900 font-bold">{summary.label}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                    <span>Tugash sanasi: <strong className="text-slate-900">{summary.formattedTarget}</strong></span>
                    <span className="font-mono px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 font-bold">
                      {summary.daysRemaining} kun
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 3-Qism: Birinchi universitet admini */}
        <div className="border-t border-slate-100 pt-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>Birinchi universitet admini</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Universitet administratori uchun tizimga kirish logini va paroli.
            </p>
          </div>

          {/* Brauzer parollarni avtomatik to'ldirishini to'xtatuvchi yashirin maydonlar */}
          <div style={{ display: "none" }} aria-hidden="true">
            <input type="text" name="prevent_autofill_user" tabIndex={-1} autoComplete="off" />
            <input type="password" name="prevent_autofill_pwd" tabIndex={-1} autoComplete="new-password" />
          </div>

          {/* Administrator Ismi (F.I.SH) */}
          <div>
            <label htmlFor="adminFullName" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Administrator F.I.SH
            </label>
            <input
              id="adminFullName"
              name="adminFullName"
              type="text"
              autoComplete="off"
              placeholder="Masalan: Abdullayev Nodirbek"
              disabled={isLoading}
              value={adminFullName}
              onChange={(e) => setAdminFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-xs sm:text-sm transition-all outline-hidden focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Admin logini */}
          <div>
            <label htmlFor="adminUsername" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Admin logini <span className="text-red-500">*</span>
            </label>
            <input
              id="adminUsername"
              name="adminUsername"
              type="text"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="Masalan: tatu_admin"
              required
              disabled={isLoading}
              value={adminUsername}
              onChange={(e) => {
                setAdminUsername(e.target.value);
                if (fieldErrors.adminUsername) {
                  setFieldErrors((prev) => ({ ...prev, adminUsername: undefined }));
                }
              }}
              className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs sm:text-sm transition-all outline-hidden focus:ring-2 focus:ring-blue-100 ${
                fieldErrors.adminUsername
                  ? "border-red-300 bg-red-50/30 text-red-900 focus:border-red-500"
                  : "border-slate-200 bg-slate-50/50 text-slate-900 hover:border-slate-300 focus:border-blue-500 focus:bg-white"
              }`}
            />
            {fieldErrors.adminUsername ? (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.adminUsername}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500">
                OTM administratori ushbu login va parol bilan tizimga kiradi.
              </p>
            )}
          </div>

          {/* Telefon raqami */}
          <div>
            <label htmlFor="adminPhone" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Telefon raqami
            </label>
            <div className="relative">
              <input
                id="adminPhone"
                name="adminPhone"
                type="text"
                autoComplete="off"
                placeholder="+998 90 123 45 67"
                disabled={isLoading}
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 hover:border-slate-300 focus:border-blue-500 focus:bg-white font-mono text-xs sm:text-sm transition-all outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Administrator bilan bog‘lanish uchun telefon raqami.
            </p>
          </div>

          {/* Parol */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="orgAdminPassword" className="block text-xs sm:text-sm font-semibold text-slate-700">
                Parol <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Tasodifiy parol generatsiya</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="orgAdminPassword"
                name="orgAdminPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                required
                disabled={isLoading}
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  if (fieldErrors.adminPassword) {
                    setFieldErrors((prev) => ({ ...prev, adminPassword: undefined }));
                  }
                }}
                placeholder="Parolni kiriting"
                className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border font-mono text-xs sm:text-sm transition-all outline-hidden focus:ring-2 focus:ring-blue-100 ${
                  fieldErrors.adminPassword
                    ? "border-red-300 bg-red-50/30 text-red-900 focus:border-red-500"
                    : "border-slate-200 bg-slate-50/50 text-slate-900 hover:border-slate-300 focus:border-blue-500 focus:bg-white"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.adminPassword && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.adminPassword}</span>
              </p>
            )}
          </div>
        </div>

        {/* Tugmalar paneli */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/admin/organizations"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold text-center transition-colors shadow-xs"
          >
            Bekor qilish
          </Link>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saqlanmoqda...</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                <span>OTMni saqlash va yaratish</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
