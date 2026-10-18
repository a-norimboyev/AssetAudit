"use client";

import { useState } from "react";
import { KeyRound, X, Loader2, CheckCircle2, AlertCircle, Copy, Check, ShieldAlert } from "lucide-react";
import { resetStaffPasswordAction, type StaffActionResponse } from "@/lib/actions/staff";

interface ResetStaffPasswordModalProps {
  userId: string;
  fullName: string;
  username: string | null;
  role: string;
}

export function ResetStaffPasswordModal({
  userId,
  fullName,
  username,
  role,
}: ResetStaffPasswordModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<StaffActionResponse | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleReset() {
    setIsPending(true);
    setResult(null);

    const formData = new FormData();
    formData.append("userId", userId);

    const res = await resetStaffPasswordAction(formData);
    setResult(res);
    setIsPending(false);
  }

  function handleCopy() {
    if (!result?.credentials) return;
    const text = `AssetAudit Tizimi Kirish Ma'lumotlari (Parol Yangilandi):\nKirish emaili: ${result.credentials.username}\nYangi Vaqtinchalik Parol: ${result.credentials.temporaryPassword}\nF.I.SH: ${result.credentials.fullName}\nRoli: ${result.credentials.role}\nKirish manzili: ${window.location.origin}/login\n(Eslatma: Tizimga kirgach, yangi parol o'rnatish majburiy)`;
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-amber-700 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-colors cursor-pointer"
      >
        <KeyRound className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
        <span>Parolni reset</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Parolni qayta o‘rnatish</h3>
                  <p className="text-[11px] text-slate-500">{fullName} ({username || "Email yo'q"})</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {result?.success && result.credentials ? (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Yangi vaqtinchalik parol tayyor!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Xodimning barcha faol sessiyalari darhol bekor qilindi. Yangi parolni xodimga xavfsiz shaklda yetkazing:
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2.5 font-mono text-xs shadow-inner">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span>YANGILANGAN KIRISH MA&apos;LUMOTLARI</span>
                    <span className="text-amber-400 font-bold">1-kirishda majburiy almashinadi</span>
                  </div>
                  <div>
                    <span className="text-slate-400">F.I.SH:</span>{" "}
                    <span className="text-slate-100 font-sans font-semibold">{result.credentials.fullName}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg">
                    <span className="text-blue-400 font-bold">KIRISH EMAILI:</span>{" "}
                    <span className="text-white font-bold select-all">{result.credentials.username}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg text-amber-300">
                    <span className="text-amber-400 font-bold">YANGI PAROL:</span>{" "}
                    <span className="font-bold text-sm select-all">{result.credentials.temporaryPassword}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Nusxalandi!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ma’lumotlarni nusxalash</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleClose}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs hover:shadow-xs cursor-pointer transition-all"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {result?.message && !result.success && (
                  <div className="p-3.5 rounded-xl text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{result.message}</span>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-950">Diqqat: Xavfsizlik qoidasi</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Parol qayta o‘rnatilganda, xodimning barcha faol qurilmalardagi sessiyalari (kompyuter, telefon) darhol to‘xtatiladi. Xodim yangi vaqtinchalik parol bilan kirib, birinchi urinishdayoq parolini almashtirishi shart bo‘ladi.
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                  <div>
                    <span className="font-semibold text-slate-700">Xodim:</span> {fullName}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Kirish emaili:</span>{" "}
                    <code className="text-blue-600 font-mono font-semibold bg-blue-50 px-1.5 py-0.5 rounded">{username || "—"}</code>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Roli:</span> {role === "inspector" ? "Inspektor" : "Moddiy Javobgar (Registrar)"}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs hover:shadow-xs disabled:opacity-50 cursor-pointer transition-all"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Qayta o‘rnatilmoqda...</span>
                      </>
                    ) : (
                      <span>Ha, parolni reset qilish</span>
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
