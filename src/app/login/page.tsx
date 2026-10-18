"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Phone,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

import { mapLoginError, NETWORK_ERROR_MESSAGE } from "@/lib/auth/login-errors";

export default function LoginPage() {
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronous submission guard
  const isSubmittingRef = useRef(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (isSubmittingRef.current || isLoading) {
      return;
    }

    setErrorMessage(null);

    const trimmedLogin = login.trim();
    if (!trimmedLogin) {
      setErrorMessage("Kirish emailini kiriting.");
      return;
    }

    if (!password) {
      setErrorMessage("Parolni kiriting.");
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      let result;
      const normalizedLogin = trimmedLogin.toLowerCase();

      // Super Admin yagona kirish logini: super@admin
      if (
        normalizedLogin === "super@admin" ||
        normalizedLogin === "superadmin" ||
        normalizedLogin === "superadmin@auth.assetaudit.uz"
      ) {
        result = await signIn.email({
          email: "superadmin@auth.assetaudit.uz",
          password,
          rememberMe: true,
        });
      } else if (normalizedLogin.includes("@") && normalizedLogin.includes(".")) {
        result = await signIn.email({
          email: normalizedLogin,
          password,
          rememberMe: true,
        });
        if (result.error) {
          const uRes = await signIn.username({
            username: normalizedLogin,
            password,
            rememberMe: true,
          });
          if (!uRes.error) {
            result = uRes;
          }
        }
      } else {
        result = await signIn.username({
          username: normalizedLogin,
          password,
          rememberMe: true,
        });
        if (result.error && normalizedLogin.includes("@")) {
          const eRes = await signIn.email({
            email: normalizedLogin,
            password,
            rememberMe: true,
          });
          if (!eRes.error) {
            result = eRes;
          }
        }
      }

      const { data, error } = result;

      if (error) {
        setErrorMessage(mapLoginError(error));
        isSubmittingRef.current = false;
        setIsLoading(false);
        return;
      }

      if (data) {
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

        router.push(targetUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage(NETWORK_ERROR_MESSAGE);
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Yuqori header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <Logo href="/" size="md" />

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xavfsiz portal</span>
            </span>
          </div>
        </div>
      </header>

      {/* Asosiy forma qismi */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col justify-center">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-100 shadow-xs">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tizimga kirish
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              AssetAudit inventarizatsiya platformasi boshqaruv portali
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs sm:text-sm text-red-800"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Kirish emaili:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="Emailni kiriting"
                  autoComplete="username"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>


            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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

          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500 leading-relaxed">
              Tizimga kirish administrator tomonidan taqdim etilgan login va parol orqali amalga oshiriladi.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Bog‘lanish:</span>
              <a
                href="tel:+998933642030"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                +998 (93) 364-20-30
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
          >
            <span>&larr;</span>
            <span>Bosh sahifaga qaytish</span>
          </Link>
        </div>
      </main>

      {/* Pastki footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-400">
        <div className="w-full px-4 sm:px-8 text-center">
          &copy; 2026 AssetAudit. Barcha huquqlar himoyalangan.
        </div>
      </footer>
    </div>
  );
}
