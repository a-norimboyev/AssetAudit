"use client";

import { useState, useActionState } from "react";
import { Plus, X, UserPlus, Loader2, CheckCircle2, AlertCircle, Copy, Check, Eye, EyeOff, Info, KeyRound } from "lucide-react";
import { createStaffMemberAction, type StaffActionResponse } from "@/lib/actions/staff";

export function AddStaffModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const [state, formAction, isPending] = useActionState<StaffActionResponse | null, FormData>(
    createStaffMemberAction,
    null
  );

  function generateRandomPassword() {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*";
    let pass = "Asset2026!";
    for (let i = 0; i < 5; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  const [passwordValue, setPasswordValue] = useState("");

  function handleOpen() {
    setPasswordValue(generateRandomPassword());
    setIsOpen(true);
  }

  function handleCopyCredentials() {
    if (!state?.credentials) return;
    const text = `AssetAudit Tizimi Kirish Ma'lumotlari:\nKirish emaili: ${state.credentials.username}\nVaqtinchalik Parol: ${state.credentials.temporaryPassword}\nRoli: ${state.credentials.role}\nF.I.SH: ${state.credentials.fullName}\nKirish manzili: ${window.location.origin}/login\n(Eslatma: Birinchi kirishda parolni o'zgartirish talab qilinadi)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Yangi xodim qo‘shish</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Yangi xodim qo‘shish</h3>
                  <p className="text-[11px] text-slate-500">Inspektor yoki Moddiy javobgar shaxs</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {state?.success && state.credentials ? (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Xodim muvaffaqiyatli yaratildi!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Parol xavfsizlik maqsadida faqat bir marta ko‘rsatiladi. Quyidagi kirish ma’lumotlarini nusxalab xodimga shaxsan topshiring:
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2.5 font-mono text-xs shadow-inner">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span>LMS KIRISH HISOBI</span>
                    <span className="text-amber-400">1-kirishda majburiy almashinadi</span>
                  </div>
                  <div>
                    <span className="text-slate-400">F.I.SH:</span>{" "}
                    <span className="text-slate-100 font-sans font-semibold">{state.credentials.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Roli:</span>{" "}
                    <span className="text-slate-200">{state.credentials.role}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg">
                    <span className="text-blue-400 font-bold">KIRISH EMAILI:</span>{" "}
                    <span className="text-white font-bold text-sm select-all">{state.credentials.username}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg text-amber-300">
                    <span className="text-amber-400 font-bold">PAROL:</span>{" "}
                    <span className="font-bold text-sm select-all">{state.credentials.temporaryPassword}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleCopyCredentials}
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
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-2xs hover:shadow-xs transition-all"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            ) : (
              <form action={formAction} className="p-6 space-y-4">
                {state?.message && !state.success && (
                  <div className="p-3.5 rounded-xl text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{state.message}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Xodimning to‘liq ismi (F.I.SH) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="Masalan: Jamshid Aliyev"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
                  />
                  {state?.fieldErrors?.fullName && (
                    <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kirish emaili: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    placeholder="Masalan: nodir@gmail.com yoki inspector@tatu.uz"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Xodimning shaxsiy yoki xizmat emailini kiriting (masalan: <code className="text-blue-600 font-semibold font-mono bg-blue-50 px-1 py-0.5 rounded">nodir@gmail.com</code>).
                  </p>
                  {state?.fieldErrors?.username && (
                    <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Xodim roli va vakolati <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="role"
                    defaultValue="inspector"
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
                  >
                    <option value="inspector">
                      Inventarizatsiya Tekshiruvchisi (Inspector) — faqat QR skanerlaydi
                    </option>
                    <option value="registrar">
                      Moddiy Javobgar Shaxs (Registrar) — yangi inventar kiritadi
                    </option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Boshlang‘ich vaqtinchalik parol <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPasswordValue(generateRandomPassword())}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      Qayta generatsiya
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-mono bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {state?.fieldErrors?.password && (
                    <p className="mt-1 text-[11px] text-rose-600">{state.fieldErrors.password}</p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs hover:shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Yaratilmoqda...</span>
                      </>
                    ) : (
                      <span>Akkauntni yaratish</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
