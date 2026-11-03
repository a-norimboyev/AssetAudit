"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  User,
  Camera,
  Upload,
  Trash2,
  Loader2,
  LogOut,
} from "lucide-react";
import {
  updateAdminProfileAction,
  updateUsernameAction,
  updatePasswordAction,
  updateAvatarAction,
} from "./actions";
import { AdminLogoutButton } from "../admin-logout-button";
import { useAdminToast } from "../admin-toast-context";

interface ProfileSettingsManagerProps {
  currentUsername: string;
  fullName: string;
  currentAvatar?: string | null;
}

function getInitials(name?: string | null): string {
  if (!name) return "SA";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export function ProfileSettingsManager({
  currentUsername,
  fullName,
  currentAvatar,
}: ProfileSettingsManagerProps) {
  const router = useRouter();
  const { showSuccessToast } = useAdminToast();

  // 1. Profil rasmi (Avatar) holati
  const [avatar, setAvatar] = useState<string | null>(currentAvatar || null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Ism va Login holati
  const [name, setName] = useState(fullName);
  const [username, setUsername] = useState(currentUsername);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();

  // 3. Parol holati
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPasswordPending, startPasswordTransition] = useTransition();

  // Avatar yuklash
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarFeedback({
        type: "error",
        message: "Faqat JPG, PNG yoki WebP formatidagi rasmlar qabul qilinadi.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarFeedback({
        type: "error",
        message: "Rasm hajmi 5MB dan oshmasligi kerak.",
      });
      return;
    }

    setIsAvatarUploading(true);
    setAvatarFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!data.success || !data.url) {
        setAvatarFeedback({
          type: "error",
          message: data.error || "Rasmni yuklashda xatolik yuz berdi.",
        });
        setIsAvatarUploading(false);
        return;
      }

      const res = await updateAvatarAction(data.url);
      if (res.success) {
        setAvatar(data.url);
        setAvatarFeedback(null);
        showSuccessToast("Muvaffaqiyatli o'zgartirildi");
        router.refresh();
      } else {
        setAvatarFeedback({
          type: "error",
          message: res.error || "Bazada rasmni saqlashda xatolik.",
        });
      }
    } catch {
      setAvatarFeedback({
        type: "error",
        message: "Server bilan bog'lanishda xatolik yuz berdi.",
      });
    } finally {
      setIsAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Avatarni o'chirish
  const handleRemoveAvatar = async () => {
    setIsAvatarUploading(true);
    setAvatarFeedback(null);

    try {
      const res = await updateAvatarAction(null);
      if (res.success) {
        setAvatar(null);
        setAvatarFeedback(null);
        showSuccessToast("Muvaffaqiyatli o'zgartirildi");
        router.refresh();
      } else {
        setAvatarFeedback({
          type: "error",
          message: res.error || "Rasmni o'chirishda xatolik.",
        });
      }
    } catch {
      setAvatarFeedback({
        type: "error",
        message: "Server bilan bog'lanishda xatolik yuz berdi.",
      });
    } finally {
      setIsAvatarUploading(false);
    }
  };

  // Ism va loginni yangilash
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setProfileFeedback({
        type: "error",
        message: "Ism va familiya kamida 2 ta belgidan iborat bo'lishi kerak.",
      });
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername || trimmedUsername.length < 3) {
      setProfileFeedback({
        type: "error",
        message: "Login kamida 3 ta belgidan iborat bo'lishi kerak.",
      });
      return;
    }

    startProfileTransition(async () => {
      const res = await updateAdminProfileAction({
        fullName: trimmedName,
        username: trimmedUsername,
      });
      if (res.success) {
        setProfileFeedback(null);
        showSuccessToast("Muvaffaqiyatli o'zgartirildi");
        router.refresh();
      } else {
        setProfileFeedback({
          type: "error",
          message: res.error || "Xatolik yuz berdi.",
        });
      }
    });
  };

  // Parolni yangilash
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({
        type: "error",
        message: "Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "Kiritilgan yangi parollar bir-biriga mos kelmadi.",
      });
      return;
    }

    startPasswordTransition(async () => {
      const res = await updatePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setPasswordFeedback(null);
        showSuccessToast("Muvaffaqiyatli o'zgartirildi");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordFeedback({
          type: "error",
          message: res.error || "Parolni yangilashda xatolik.",
        });
      }
    });
  };

  const initials = getInitials(name);

  return (
    <div className="space-y-6">
      {/* 1. PROFIL RASMI KARTASI */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Profil Rasmi
          </h2>
        </div>

        {avatarFeedback && avatarFeedback.type === "error" && (
          <div className="p-3.5 rounded-xl text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{avatarFeedback.message}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
          {/* Avatar ko'rinishi */}
          <div className="relative group shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 text-white font-bold text-2xl flex items-center justify-center border-2 border-slate-200 shadow-sm">
                {initials}
              </div>
            )}
            {isAvatarUploading && (
              <div className="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center backdrop-blur-2xs">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Tugmalar */}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="font-bold text-sm text-slate-900">{name}</div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAvatarUploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isAvatarUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Yuklanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{avatar ? "Rasmni almashtirish" : "Rasm yuklash"}</span>
                  </>
                )}
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isAvatarUploading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Rasmni o‘chirish</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. ADMIN ISMI VA LOGININI O'ZGARTIRISH KARTASI */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Admin Ma&apos;lumotlari
              </h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
              {profileFeedback && profileFeedback.type === "error" && (
                <div className="p-3.5 rounded-xl text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{profileFeedback.message}</span>
                </div>
              )}

              {/* Ism va familiya maydoni */}
              <div className="space-y-1.5">
                <label htmlFor="user-fullname" className="text-xs font-semibold text-slate-700">
                  Ism va familiya
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="user-fullname"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isProfilePending}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900"
                    placeholder="Masalan: Azizjon Norimboyev"
                  />
                </div>
              </div>

              {/* Login maydoni */}
              <div className="space-y-1.5">
                <label htmlFor="user-login" className="text-xs font-semibold text-slate-700">
                  Login
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="user-login"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    required
                    disabled={isProfilePending}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900"
                    placeholder="masalan: superadmin"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProfilePending || (name.trim() === fullName.trim() && username.trim() === currentUsername.trim())}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProfilePending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saqlanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Saqlash</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 3. PAROLNI O'ZGARTIRISH KARTASI */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Parolni yangilash
            </h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {passwordFeedback && passwordFeedback.type === "error" && (
              <div className="p-3.5 rounded-xl text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            {/* Joriy parol */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Joriy Maxfiy Parol
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isPasswordPending}
                  placeholder="Hozirgi parolingizni kiriting"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Yangi parol */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Yangi Maxfiy Parol
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isPasswordPending}
                  placeholder="Kamida 8 ta belgi"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Yangi parolni tasdiqlash */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Yangi Parolni Qayta Kiriting
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={isPasswordPending}
                placeholder="Yangi parolni tasdiqlang"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <button
              type="submit"
              disabled={isPasswordPending}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPasswordPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Parolni yangilash</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 4. TIZIMDAN XAVFSIZ CHIQISH KARTASI */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Profildan chiqish
          </h3>
        </div>

        <AdminLogoutButton />
      </div>
    </div>
  );
}
