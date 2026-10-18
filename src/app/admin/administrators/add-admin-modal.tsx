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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const activeOrgs = organizations.filter((o) => o.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setResult(null);

    const effectiveOrgId = orgId || activeOrgs[0]?.id || "";
    const formData = new FormData();
    formData.append("organizationId", effectiveOrgId);
    formData.append("fullName", fullName);
    formData.append("username", username);
    if (phone.trim()) {
      formData.append("phone", phone.trim());
    }
    if (password.trim()) {
      formData.append("password", password.trim());
    }

    try {
      const res = await createOrganizationAdminAction(null, formData);
      setResult(res);
      if (res.success) {
        setFullName("");
        setUsername("");
        setPhone("");
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
    const text = `AssetAudit Tashkilot Administratori:\nKirish emaili: ${result.credentials.username}\nVaqtinchalik parol: ${result.credentials.temporaryPassword}\nTashkilot roli: ${result.credentials.role}`;
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
          if (activeOrgs.length > 0 && (!orgId || !activeOrgs.some((o) => o.id === orgId))) {
            setOrgId(activeOrgs[0].id);
          }
        }}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Yangi admin qo‘shish</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-left">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Yangi Tashkilot Administratori</h3>
                  <p className="text-[11px] text-slate-500">Tashkilotga mas&apos;ul rahbar/admin akkauntini biriktirish</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {result?.success && result.credentials ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{result.message}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs font-mono shadow-inner">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-slate-400 font-sans font-semibold text-[11px]">
                        Yaratilgan Administrator Ma&apos;lumotlari:
                      </span>
                      <button
                        onClick={copyCredentials}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Nusxalandi</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Nusxalash</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-1">
                      <span className="text-slate-500">Kirish emaili: </span>
                      <strong className="text-blue-400 font-semibold">{result.credentials.username}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Vaqtinchalik parol: </span>
                      <strong className="text-amber-400 font-semibold">{result.credentials.temporaryPassword}</strong>
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
                      className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Tugatish
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {result?.message && !result.success && (
                    <div className="p-3.5 rounded-xl text-xs flex items-center gap-2.5 bg-rose-50 text-rose-800 border border-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{result.message}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tashkilot <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={orgId}
                      onChange={(e) => setOrgId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer transition-all"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Administrator F.I.SH <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Abdullayev Nodirbek"
                      required
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                    {result?.fieldErrors?.fullName && (
                      <p className="mt-1 text-[11px] text-rose-600">{result.fieldErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Gmail manzili <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="admin-email"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Gmail manzilini kiriting"
                      required
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono transition-all"
                    />
                    {result?.fieldErrors?.username && (
                      <p className="mt-1 text-[11px] text-rose-600">{result.fieldErrors.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Telefon raqami
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Parol
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Parolni kiriting"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                    {result?.fieldErrors?.password && (
                      <p className="mt-1 text-[11px] text-rose-600">{result.fieldErrors.password}</p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || activeOrgs.length === 0}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
