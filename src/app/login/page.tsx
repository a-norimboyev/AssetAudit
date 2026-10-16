"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { mapLoginError, NETWORK_ERROR_MESSAGE } from "@/lib/auth/login-errors";

export default function LoginPage() {
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronous submission guard: React asinxron renderidan qat'i nazar dublikat so'rovlarni bloklash
  const isSubmittingRef = useRef(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // 0. Synchronous Guard: agar so'rov allaqachon jarayonda bo'lsa (Enter yoki tezkor dublikat bosish), darhol rad etish
    if (isSubmittingRef.current || isLoading) {
      return;
    }

    setErrorMessage(null);

    const trimmedLogin = login.trim();
    if (!trimmedLogin) {
      setErrorMessage("Login yoki email manzilini kiriting.");
      return;
    }

    if (!password) {
      setErrorMessage("Parolni kiriting.");
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      // 1. LMS uslubidagi kirish: agar @ belgisi bo'lsa email orqali (Super Admin),
      // aks holda unikal login (masalan: tatu.admin, tatu.inspector1) orqali Better Auth
      let result;
      if (trimmedLogin.includes("@")) {
        result = await signIn.email({
          email: trimmedLogin.toLowerCase(),
          password,
          rememberMe,
        });
      } else {
        result = await signIn.username({
          username: trimmedLogin.toLowerCase(),
          password,
          rememberMe,
        });
      }

      const { data, error } = result;

      if (error) {
        setErrorMessage(mapLoginError(error));
        isSubmittingRef.current = false;
        setIsLoading(false);
        return;
      }

      if (data) {
        // 2. Serverdan amaldagi profil va rolga mos yo'naltirish manzilini olish
        const meRes = await fetch("/api/auth/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!meRes.ok) {
          const meData = await meRes.json().catch(() => ({}));
          if (meData.code === "ACCOUNT_INACTIVE") {
            setErrorMessage("Akkauntingiz faolsizlantirilgan. Administratorga murojaat qiling.");
          } else {
            setErrorMessage(meData.message || "Foydalanuvchi biznes-profili topilmadi.");
          }
          isSubmittingRef.current = false;
          setIsLoading(false);
          return;
        }

        const meData = await meRes.json();
        const targetUrl = meData.redirectUrl || "/dashboard";

        // Muvaffaqiyatli: sahifa o'tgunga qadar guard va loading holati saqlanadi
        router.push(targetUrl);
        router.refresh();
      }
    } catch {
      // Xavfsizlik: tarmoq xatosida hech qanday maxfiy ma'lumot loglanmaydi
      setErrorMessage(NETWORK_ERROR_MESSAGE);
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Yuqori header */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-[4px] bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-xs group-hover:bg-blue-700 transition-colors">
              A
            </div>
            <span className="font-semibold text-xl tracking-tight text-slate-900">
              Asset<span className="text-blue-600">Audit</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/preview/dashboard"
              className="text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors hidden sm:inline-flex"
            >
              Demo ko‘rish &rarr;
            </Link>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Xavfsiz portal</span>
            </span>
          </div>
        </div>
      </header>

      {/* Asosiy forma qismi */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col justify-center">
        <div className="bg-white border border-slate-200 rounded-[4px] p-6 sm:p-8 shadow-xs">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-[4px] bg-blue-50 text-blue-600 mb-3 border border-blue-100">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tizimga kirish
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              AssetAudit inventarizatsiya platformasi boshqaruv portali
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-[4px] bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-800"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Login yoki Elektron pochta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="tatu.admin yoki admin@assetaudit.uz"
                  autoComplete="username"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-[3px] border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Maxfiy parol
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-2.5 rounded-[3px] border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded-[3px] border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-colors"
                />
                <span className="text-xs text-slate-600 font-medium">Meni eslab qolish</span>
              </label>

              <span className="text-xs text-slate-400">7 kunlik sessiya</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <span>Kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              AssetAudit yopiq korporativ SaaS tizimidir. Ochiq ro‘yxatdan o‘tish cheklangan. Akkaunt faqat tashkilot yoki platforma administratori tomonidan taqdim etiladi.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            &larr; Bosh sahifaga qaytish
          </Link>
        </div>
      </main>

      {/* Pastki footer */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4">
          &copy; 2026 AssetAudit. Barcha huquqlar himoyalangan.
        </div>
      </footer>
    </div>
  );
}
