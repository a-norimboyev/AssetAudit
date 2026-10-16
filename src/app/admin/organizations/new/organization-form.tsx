"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { createOrganizationAction } from "../actions";
import { validateOrganizationInput } from "@/lib/validations/organization";
import type { OrganizationTypeOption } from "@/lib/data/organizations";

interface NewOrganizationFormProps {
  types: OrganizationTypeOption[];
}

export function NewOrganizationForm({ types }: NewOrganizationFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [typeId, setTypeId] = useState(types[0]?.id || "university");
  const [isActive, setIsActive] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    code?: string;
    typeId?: string;
  }>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Synchronous submission guard: React asinxron renderidan qat'i nazar dublikat so'rovlarni bloklash
  const isSubmittingRef = useRef(false);

  const normalizedCodePreview = code.trim().toUpperCase();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // 0. Synchronous Guard: agar so'rov allaqachon jarayonda bo'lsa, rad etish
    if (isSubmittingRef.current || isLoading) {
      return;
    }

    setGeneralError(null);
    setFieldErrors({});

    // 1. Mijoz tomonidagi dastlabki validatsiya
    const clientValidation = validateOrganizationInput({
      name,
      code,
      typeId,
      isActive,
    });

    if (!clientValidation.valid) {
      setFieldErrors(clientValidation.errors);
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      // 2. Server Action orqali xavfsiz yaratish
      const result = await createOrganizationAction({
        name: clientValidation.normalized.name,
        code: clientValidation.normalized.code,
        typeId: clientValidation.normalized.typeId,
        isActive: clientValidation.normalized.isActive,
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

      // 3. Muvaffaqiyatli saqlandi
      setIsSuccess(true);

      // Keshni yangilab tashkilotlar ro'yxatiga qaytish
      router.push("/admin/organizations");
      router.refresh();
    } catch {
      setGeneralError("Server bilan bog'lanishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Umumiy xatolik xabari */}
      {generalError && (
        <div
          role="alert"
          className="p-4 rounded-[4px] bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-200"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Xatolik yuz berdi</p>
            <p className="mt-0.5 leading-relaxed">{generalError}</p>
          </div>
        </div>
      )}

      {/* Muvaffaqiyat xabari */}
      {isSuccess && (
        <div
          role="status"
          className="p-4 rounded-[4px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3 shadow-xs"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-semibold">
            Tashkilot muvaffaqiyatli yaratildi! Ro‘yxatga yo‘naltirilmoqda...
          </p>
        </div>
      )}

      {/* Asosiy Ma'lumotlar Kartasi */}
      <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Tashkilot rekvizitlari</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Yangi subyektning rasmiy nomi, unikal identifikatsiya kodi va soha turini belgilang.
          </p>
        </div>

        {/* 1. Tashkilot rasmiy nomi */}
        <div>
          <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Tashkilotning rasmiy nomi <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            disabled={isLoading || isSuccess}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            placeholder="Masalan: Toshkent Axborot Texnologiyalari Universiteti"
            className={`w-full px-3.5 py-2.5 rounded-[3px] border text-xs sm:text-sm transition-all outline-none focus:ring-2 focus:ring-blue-600/20 ${
              fieldErrors.name
                ? "border-red-300 bg-red-50/30 text-red-900 focus:border-red-500"
                : "border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-blue-600"
            }`}
          />
          {fieldErrors.name ? (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors.name}</span>
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] text-slate-400">
              Universitet, vazirlik, maktab yoki korxonaning to‘liq rasmiy nomi.
            </p>
          )}
        </div>

        {/* 2. Tashkilot kodi va Tashkilot turi (2 ustun) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Tashkilot kodi */}
          <div>
            <label htmlFor="code" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Tashkilot kodi <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="code"
                name="code"
                type="text"
                required
                disabled={isLoading || isSuccess}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (fieldErrors.code) {
                    setFieldErrors((prev) => ({ ...prev, code: undefined }));
                  }
                }}
                placeholder="Masalan: TATU"
                className={`w-full px-3.5 py-2.5 rounded-[3px] border text-xs sm:text-sm font-mono tracking-wider uppercase transition-all outline-none focus:ring-2 focus:ring-blue-600/20 ${
                  fieldErrors.code
                    ? "border-red-300 bg-red-50/30 text-red-900 focus:border-red-500"
                    : "border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-blue-600"
                }`}
              />
              {normalizedCodePreview && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {normalizedCodePreview}
                  </span>
                </div>
              )}
            </div>
            {fieldErrors.code ? (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.code}</span>
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-slate-400" />
                <span>
                  QR inventar prefiksi: <strong>{normalizedCodePreview ? `${normalizedCodePreview}-` : "KOD-"}</strong>
                </span>
              </p>
            )}
          </div>

          {/* Tashkilot turi */}
          <div>
            <label htmlFor="typeId" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Tashkilot turi <span className="text-red-500">*</span>
            </label>
            <select
              id="typeId"
              name="typeId"
              required
              disabled={isLoading || isSuccess}
              value={typeId}
              onChange={(e) => {
                setTypeId(e.target.value);
                if (fieldErrors.typeId) {
                  setFieldErrors((prev) => ({ ...prev, typeId: undefined }));
                }
              }}
              className={`w-full px-3.5 py-2.5 rounded-[3px] border text-xs sm:text-sm transition-all outline-none focus:ring-2 focus:ring-blue-600/20 bg-white ${
                fieldErrors.typeId
                  ? "border-red-300 bg-red-50/30 text-red-900 focus:border-red-500"
                  : "border-slate-300 text-slate-900 hover:border-slate-400 focus:border-blue-600"
              }`}
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
            {fieldErrors.typeId ? (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.typeId}</span>
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-slate-400">
                PostgreSQL klassifikatori bo‘yicha muassasa toifasi.
              </p>
            )}
          </div>
        </div>

        {/* 3. Faol / Nofaol holati */}
        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isActive"
              disabled={isLoading || isSuccess}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="mt-1 w-4 h-4 rounded-[3px] border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                Tashkilot holati: Faol (Active)
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Faol tashkilot tizimda darhol ishlay boshlaydi va unga administrator tayinlash mumkin bo‘ladi.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Xavfsizlik va QR Siyosati Axborot Bloki */}
      <div className="p-4 sm:p-5 rounded-[4px] bg-blue-50/60 border border-blue-100 flex items-start gap-3.5 text-xs text-slate-700">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-blue-900">Multi-Tenancy va QR Xavfsizlik Kafolati</h4>
          <p className="text-blue-800/80 leading-relaxed text-[11px] sm:text-xs">
            Yangi tashkilot yaratilganda uning sukut bo‘yicha QR ko‘rinish siyosati{" "}
            <strong>Cheklangan (Restricted)</strong> holatida o‘rnatiladi. Tashkilotning ichki inventar
            va mol-mulk ma’lumotlari begona shaxslarga ochilmaydi.
          </p>
        </div>
      </div>

      {/* Tugmalar paneli */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
        <Link
          href="/admin/organizations"
          className="w-full sm:w-auto px-5 py-2.5 rounded-[3px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold text-center transition-colors shadow-xs"
        >
          Bekor qilish
        </Link>

        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[3px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saqlanmoqda...</span>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Yaratildi!</span>
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4" />
              <span>Tashkilotni yaratish</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
