"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
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
} from "lucide-react";
import { updateOrganizationAdminAction } from "@/lib/actions/staff";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import type { OrganizationAdminListItem } from "@/lib/data/administrators";

interface AdminDetailsModalProps {
  admin: OrganizationAdminListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: {
    userId: string;
    fullName: string;
    username: string;
    phone?: string;
    isActive: boolean;
  }) => void;
}

export function AdminDetailsModal({
  admin,
  isOpen,
  onClose,
  onSuccess,
}: AdminDetailsModalProps) {
  useBodyScrollLock(isOpen);
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (admin) {
      setFullName(admin.fullName || "");
      const initialLogin =
        admin.username ||
        (admin.email?.endsWith("@auth.assetaudit.uz")
          ? admin.email.split("@")[0]
          : admin.email || "");
      setUsername(initialLogin);
      setPhone(admin.phone || "");
      setIsActive(admin.isActive !== false);
      setNewPassword("");
      setError(null);
      setSuccessMessage(null);
      setShowPassword(false);
      setCopiedPassword(false);
    }
  }, [admin, isOpen]);

  if (!isOpen || !admin) return null;

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
      if (onSuccess && res.updatedAdmin) {
        onSuccess(res.updatedAdmin);
      }
      router.refresh();

      setTimeout(() => {
        setIsPending(false);
        onClose();
      }, 1000);
    } catch {
      setError("Server bilan aloqa uzildi.");
      setIsPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Administrator ma&apos;lumotlari
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {admin.organizationName || "OTM biriktirilmagan"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="p-7 space-y-4">
          {/* Brauzer avtomatik saqlangan login/parolni to'ldirib qo'ymasligi uchun yashirin dummy inputlar */}
          <input
            type="text"
            name="prevent_autofill_user"
            style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
            tabIndex={-1}
            aria-hidden="true"
          />
          <input
            type="password"
            name="prevent_autofill_pwd"
            style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
            tabIndex={-1}
            aria-hidden="true"
          />
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
              <span className="truncate">{admin.organizationName || "Mavjud emas"}</span>
            </div>
          </div>

          {/* Ism */}
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
                name="admin_edit_username_unique"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Login"
                autoComplete="off"
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
                name="admin_edit_password_unique"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yangi parol (ixtiyoriy)"
                autoComplete="new-password"
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

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
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
