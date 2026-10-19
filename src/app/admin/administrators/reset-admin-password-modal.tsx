"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, X, Loader2, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { resetOrganizationAdminPasswordAction, type StaffActionResponse } from "@/lib/actions/staff";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";

interface ResetAdminPasswordModalProps {
  userId: string;
  fullName: string;
  username: string | null;
  organizationName?: string | null;
  onSuccess?: (newPassword: string) => void;
}

export function ResetAdminPasswordModal({
  userId,
  fullName,
  username,
  organizationName,
  onSuccess,
}: ResetAdminPasswordModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  useBodyScrollLock(isOpen);
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

    if (res.success && res.credentials?.temporaryPassword) {
      onSuccess?.(res.credentials.temporaryPassword);
    }
  }

  function handleCopy() {
    if (!result?.credentials) return;
    const text = `AssetAudit Tashkilot Administratori Kirish Ma'lumotlari (Parol Yangilandi):\nKirish emaili: ${result.credentials.username}\nYangi Vaqtinchalik Parol: ${result.credentials.temporaryPassword}\nF.I.SH: ${result.credentials.fullName}\nTashkilot: ${organizationName || "Asosiy"}\nKirish manzili: ${typeof window !== "undefined" ? window.location.origin : ""}/login\n(Eslatma: Tizimga birinchi kirishda yangi shaxsiy parol o'rnatish majburiydir)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setIsOpen(false);
    if (result?.success) {
      router.refresh();
    }
    setResult(null);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Parolni yangilash va faol sessiyalarni bekor qilish"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-amber-700 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-colors cursor-pointer"
      >
        <KeyRound className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
        <span>Parolni reset</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overscroll-contain">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-left overscroll-contain">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Administrator parolini qayta o‘rnatish</h3>
                  <p className="text-[11px] text-slate-500">{fullName} ({username || "Email yo'q"})</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {result?.success && result.credentials ? (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Yangi vaqtinchalik parol tayyor!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Administratorning barcha faol sessiyalari darhol bekor qilindi (force logout). Yangi parolni xavfsiz shaklda yetkazing:
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2.5 font-mono text-xs shadow-inner">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span>YANGILANGAN KIRISH MA&apos;LUMOTLARI</span>
                    <span className="text-amber-400 font-bold">1-kirishda majburiy almashinadi</span>
                  </div>
                  <div>
                    <span className="text-slate-400">F.I.SH:</span>{" "}
                    <span className="text-white font-bold">{result.credentials.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Kirish emaili:</span>{" "}
                    <span className="text-blue-300 font-bold">{result.credentials.username}</span>
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
                    className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
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

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Faol sessiyalar bekor qilinadi:</span>
                    <span className="text-[11px] leading-relaxed">Administrator tizimdan darhol chiqarib yuboriladi va faqat yangi parol bilan kira oladi.</span>
                  </div>
                </div>

                {result && !result.success && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                    {result.message}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
