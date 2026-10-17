"use client";

import { useState } from "react";
import { KeyRound, X, Loader2, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { resetOrganizationAdminPasswordAction, type StaffActionResponse } from "@/lib/actions/staff";

interface ResetAdminPasswordModalProps {
  userId: string;
  fullName: string;
  username: string | null;
  organizationName?: string | null;
}

export function ResetAdminPasswordModal({
  userId,
  fullName,
  username,
  organizationName,
}: ResetAdminPasswordModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<StaffActionResponse | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleReset() {
    setIsPending(true);
    setResult(null);

    const formData = new FormData();
    formData.append("userId", userId);

    const res = await resetOrganizationAdminPasswordAction(formData);
    setResult(res);
    setIsPending(false);
  }

  function handleCopy() {
    if (!result?.credentials) return;
    const text = `AssetAudit Tashkilot Administratori Kirish Ma'lumotlari (Parol Yangilandi):\nLogin: ${result.credentials.username}\nYangi Vaqtinchalik Parol: ${result.credentials.temporaryPassword}\nF.I.SH: ${result.credentials.fullName}\nTashkilot: ${organizationName || "Asosiy"}\nKirish manzili: ${typeof window !== "undefined" ? window.location.origin : ""}/login\n(Eslatma: Tizimga birinchi kirishda yangi shaxsiy parol o'rnatish majburiydir)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setIsOpen(false);
    setResult(null);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Parolni yangilash va faol sessiyalarni bekor qilish"
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-xs font-medium text-slate-600 hover:text-amber-700 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-colors cursor-pointer"
      >
        <KeyRound className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
        <span>Parolni reset</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-[4px] shadow-xl border border-slate-200 overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[3px] bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Administrator parolini qayta o‘rnatish</h3>
                  <p className="text-[11px] text-slate-500">{fullName} ({username || "Login yo'q"})</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-[3px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {result?.success && result.credentials ? (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-[4px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Yangi vaqtinchalik parol tayyor!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Administratorning barcha faol sessiyalari darhol bekor qilindi (force logout). Yangi parolni xavfsiz shaklda yetkazing:
                  </p>
                </div>

                <div className="p-4 rounded-[4px] bg-slate-900 text-white space-y-2.5 font-mono text-xs shadow-inner">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span>YANGILANGAN KIRISH MA&apos;LUMOTLARI</span>
                    <span className="text-amber-400 font-bold">1-kirishda majburiy almashinadi</span>
                  </div>
                  <div>
                    <span className="text-slate-400">F.I.SH:</span>{" "}
                    <span className="text-white font-bold">{result.credentials.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Login:</span>{" "}
                    <span className="text-blue-300 font-bold">{result.credentials.username}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Email:</span>{" "}
                    <span className="text-slate-300">{result.credentials.email}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Vaqtinchalik Parol:</span>
                      <span className="text-amber-300 font-bold text-sm tracking-wider">
                        {result.credentials.temporaryPassword}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Nusxalandi</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Nusxa olish</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-[3px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Administrator paroli tasodifiy yuqori entropiyali xavfsiz vaqtinchalik parolga almashtiriladi. Administrator ushbu parol bilan birinchi marta tizimga kirganida, yangi shaxsiy parol o‘rnatishi talab qilinadi.
                </p>

                <div className="p-3.5 rounded-[4px] bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Faol sessiyalar bekor qilinadi:</span>
                    <span>Administrator tizimdan darhol chiqarib yuboriladi va faqat yangi parol bilan kira oladi.</span>
                  </div>
                </div>

                {result && !result.success && (
                  <div className="p-3 rounded-[3px] bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                    {result.message}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="px-4 py-2 rounded-[3px] border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Yangilanmoqda...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Ha, parolni yangilash</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
