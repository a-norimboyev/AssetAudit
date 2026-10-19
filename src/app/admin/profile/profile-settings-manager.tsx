"use client";

import { useState, useTransition } from "react";
import {
  Lock,
  Globe,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Mail,
} from "lucide-react";
import {
  updateUsernameAction,
  updatePasswordAction,
  updateLanguageAction,
} from "./actions";

interface ProfileSettingsManagerProps {
  currentUsername: string;
  fullName: string;
  currentLanguage?: string;
}

export function ProfileSettingsManager({
  currentUsername,
  fullName,
  currentLanguage = "uz-latn",
}: ProfileSettingsManagerProps) {
  // 1. Login holati
  const [username, setUsername] = useState(currentUsername);
  const [usernameFeedback, setUsernameFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isUsernamePending, startUsernameTransition] = useTransition();

  // 2. Parol holati
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

  // 3. Til holati
  const [selectedLang, setSelectedLang] = useState(currentLanguage);
  const [langFeedback, setLangFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isLangPending, startLangTransition] = useTransition();

  // Loginni yangilash
  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameFeedback(null);

    startUsernameTransition(async () => {
      const res = await updateUsernameAction(username);
      if (res.success) {
        setUsernameFeedback({
          type: "success",
          message: res.message || "Login muvaffaqiyatli saqlandi!",
        });
      } else {
        setUsernameFeedback({
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

    startPasswordTransition(async () => {
      const res = await updatePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setPasswordFeedback({
          type: "success",
          message: res.message || "Parol yangilandi!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordFeedback({
          type: "error",
          message: res.error || "Xatolik yuz berdi.",
        });
      }
    });
  };

  // Tilni yangilash
  const handleUpdateLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    setLangFeedback(null);

    startLangTransition(async () => {
      const res = await updateLanguageAction(langCode);
      if (res.success) {
        setLangFeedback({
          type: "success",
          message: res.message || "Til muvaffaqiyatli saqlandi!",
        });
      } else {
        setLangFeedback({
          type: "error",
          message: res.error || "Xatolik yuz berdi.",
        });
      }
    });
  };

  const languages = [
    { code: "uz-latn", name: "O'zbekcha", flag: "🇺🇿", variant: "Lotin yozuvida" },
    { code: "uz-cyrl", name: "Ўзбекча", flag: "🇺🇿", variant: "Кирилл ёзувида" },
    { code: "ru", name: "Русский", flag: "🇷🇺", variant: "Русский язык" },
    { code: "en", name: "English", flag: "🇬🇧", variant: "English language" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. KIRISH EMAILINI O'ZGARTIRISH KARTASI */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Kirish Emaili
              </h2>
              <p className="text-xs text-slate-500">
                Tizimga kirish uchun shaxsiy email (Gmail) manzilini o&apos;zgartirish
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateUsername} className="mt-5 space-y-4">
            {usernameFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  usernameFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {usernameFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{usernameFeedback.message}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Hozirgi foydalanuvchi
              </label>
              <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-between">
                <span>{fullName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Super Admin
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="user-login" className="text-xs font-semibold text-slate-700">
                Yangi Kirish Emaili (Gmail)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="user-login"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                  required
                  disabled={isUsernamePending}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  placeholder="masalan: superadmin@gmail.com"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Tizimga kirishda ushbu email yoki foydalanuvchi nomidan foydalaniladi.
              </p>
            </div>

            <button
              type="submit"
              disabled={isUsernamePending || username === currentUsername}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isUsernamePending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Kirish emailini saqlash</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 2. PAROLNI O'ZGARTIRISH KARTASI */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Maxfiy Parol
            </h2>
            <p className="text-xs text-slate-500">
              Xavfsizlik uchun hisob parolini yangilash
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {passwordFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                passwordFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {passwordFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
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

      {/* 3. INTERFEYS TILI (TILNI O'ZGARTIRISH) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5 lg:col-span-2">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Interfeys Tili
              </h2>
              <p className="text-xs text-slate-500">
                Tizim menyulari va hisobotlari uchun asosiy tilni tanlang
              </p>
            </div>
          </div>

          {isLangPending && (
            <span className="text-xs text-purple-600 flex items-center gap-1.5 font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saqlanmoqda...</span>
            </span>
          )}
        </div>

        {langFeedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              langFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {langFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{langFeedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {languages.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleUpdateLanguage(lang.code)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{lang.flag}</span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">
                    {lang.name}
                  </div>
                  <div className="text-[11px] text-slate-400">{lang.variant}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
