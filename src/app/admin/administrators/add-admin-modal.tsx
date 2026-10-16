"use client";

import { useState } from "react";
import { Plus, X, UserPlus, Loader2, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { createOrganizationAdminAction, type StaffActionResponse } from "@/lib/actions/staff";

interface AddAdminModalProps {
  organizations: Array<{ id: string; name: string; code: string; isActive: boolean }>;
}

export function AddAdminModal({ organizations }: AddAdminModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<StaffActionResponse | null>(null);

  const [orgId, setOrgId] = useState(organizations[0]?.id || "");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const activeOrgs = organizations.filter((o) => o.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setResult(null);

    const formData = new FormData();
    formData.append("organizationId", orgId);
    formData.append("fullName", fullName);
    formData.append("username", username);
    if (password.trim()) {
      formData.append("password", password.trim());
    }

    try {
      const res = await createOrganizationAdminAction(null, formData);
      setResult(res);
      if (res.success) {
        setFullName("");
        setUsername("");
        setPassword("");
      }
    } catch {
      setResult({
        success: false,
        message: "Kutilmagan xatolik yuz berdi.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const copyCredentials = () => {
    if (!result?.credentials) return;
    const text = `AssetAudit Tashkilot Administratori:\nLogin: ${result.credentials.username}\nEmail: ${result.credentials.email}\nVaqtinchalik parol: ${result.credentials.temporaryPassword}\nTashkilot roli: ${result.credentials.role}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setResult(null);
        }}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Yangi admin qo‘shish</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[4px] shadow-xl border border-slate-200 overflow-hidden text-left">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[3px] bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Yangi Tashkilot Administratori</h3>
                  <p className="text-[11px] text-slate-500">Tashkilotga mas&apos;ul rahbar/admin akkauntini biriktirish</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-[3px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {result?.success && result.credentials ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-[3px] bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{result.message}</span>
                  </div>

                  <div className="p-4 rounded-[4px] bg-slate-900 text-white space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-slate-400 font-sans font-semibold text-[11px]">
                        Yaratilgan Administrator Ma&apos;lumotlari:
                      </span>
                      <button
                        onClick={copyCredentials}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Nusxalandi</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Nusxalash</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <span className="text-slate-500">Login: </span>
                      <strong className="text-blue-400">{result.credentials.username}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Email: </span>
                      <span className="text-slate-300">{result.credentials.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Vaqtinchalik parol: </span>
                      <strong className="text-amber-400">{result.credentials.temporaryPassword}</strong>
                    </div>
                    <div className="pt-2 text-[10px] text-slate-400 font-sans leading-relaxed">
                      Eslatma: Foydalanuvchi birinchi marta tizimga kirganda ushbu vaqtinchalik parolni shaxsiy yangi parolga almashtirishi shart.
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setResult(null);
                      }}
                      className="px-4 py-2 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Tugatish
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {result?.message && !result.success && (
                    <div className="p-3 rounded-[3px] text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{result.message}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tashkilot <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={orgId}
                      onChange={(e) => setOrgId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500 bg-white"
                    >
                      {activeOrgs.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.code})
                        </option>
                      ))}
                    </select>
                    {result?.fieldErrors?.organizationId && (
                      <p className="mt-1 text-[11px] text-rose-600">{result.fieldErrors.organizationId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      To&apos;liq ism (F.I.SH) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Masalan: Abdullayev Temur"
                      required
                      className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500"
                    />
                    {result?.fieldErrors?.fullName && (
                      <p className="mt-1 text-[11px] text-rose-600">{result.fieldErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Login (Username) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masalan: admin (avtomatik prefiks bilan yaratiladi)"
                      required
                      className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500 font-mono"
                    />
                    {result?.fieldErrors?.username && (
                      <p className="mt-1 text-[11px] text-rose-600">{result.fieldErrors.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Boshlang&apos;ich parol (ixtiyoriy)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Bo'sh qoldirilsa, avtomatik xavfsiz parol generatsiya qilinadi"
                      className="w-full px-3 py-2 text-xs rounded-[3px] border border-slate-300 focus:outline-hidden focus:border-blue-500"
                    />
                    {result?.fieldErrors?.password && (
                      <p className="mt-1 text-[11px] text-rose-600">{result.fieldErrors.password}</p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-3 py-2 rounded-[3px] text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || activeOrgs.length === 0}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Yaratilmoqda...</span>
                        </>
                      ) : (
                        <span>Admin yaratish</span>
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

