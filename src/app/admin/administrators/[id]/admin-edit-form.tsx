"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  KeyRound,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { updateOrganizationAdminAction } from "@/lib/actions/staff";
import type { OrganizationAdminDetails } from "@/lib/data/administrators";

interface AdminEditFormProps {
  admin: OrganizationAdminDetails;
}

export function AdminEditForm({ admin }: AdminEditFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(admin.fullName || "");
  const initialLogin =
    admin.username ||
    (admin.email?.endsWith("@auth.assetaudit.uz")
      ? admin.email.split("@")[0]
      : admin.email || "");
  const [username, setUsername] = useState(initialLogin);
  const [phone, setPhone] = useState(admin.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [isActive, setIsActive] = useState(admin.isActive !== false);

  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let pass = "Admin";
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += "!" + Math.floor(100 + Math.random() * 900);
    setNewPassword(pass);
    setShowPassword(true);
  };

  const copyPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await updateOrganizationAdminAction({
        userId: admin.userId,
        fullName: fullName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        newPassword: newPassword.trim() || undefined,
        isActive,
      });

      if (!res.success) {
        setError(res.message || "Saqlashda xatolik yuz berdi.");
        setIsPending(false);
        return;
      }

      setSuccessMessage(res.message);
      router.refresh();
      setIsPending(false);
    } catch {
      setError("Server bilan aloqa uzildi.");
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Orqaga qaytish */}
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/admin/administrators"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Administratorlar ro&apos;yxatiga qaytish</span>
        </Link>
      </div>

      {/* Asosiy Tahrirlash Kartasi */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Karta boshi */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Administrator ma&apos;lumotlari
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {admin.organizationName || "OTM biriktirilmagan"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {isActive ? "Faol" : "Nofaol"}
            </span>
          </div>
        </div>

        {/* Forma */}
        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 bg-rose-50 text-rose-800 border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* OTM */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              OTM
            </label>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800">
              <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{admin.organizationName || "Biriktirilmagan"}</span>
            </div>
          </div>

          {/* F.I.SH */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Administrator F.I.SH <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Ism va familiya"
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-medium text-slate-900 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Login */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Admin logini <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Login"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono font-medium text-slate-900 transition-all"
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Telefon raqami
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono text-slate-900 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Yangi Parol */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Yangi parol</span>
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Tasodifiy parol</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yangi parol (ixtiyoriy)"
                className="w-full px-4 py-3 pr-20 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono text-slate-900 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {newPassword && (
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                    title="Nusxa olish"
                  >
                    {copiedPassword ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? "Yashirish" : "Ko'rsatish"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Holati */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              Holati
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs"
                    : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Faol
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isActive
                    ? "bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs"
                    : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Nofaol
              </button>
            </div>
          </div>

          {/* Saqlash tugmasi */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Saqlash</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
