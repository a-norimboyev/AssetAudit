"use client";

import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { LogOut, Loader2, AlertCircle } from "lucide-react";

export function OrgLogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      const res = await signOut();
      if (res && "error" in res && res.error) {
        setIsLoggingOut(false);
        setLogoutError("Tizimdan chiqishda xatolik yuz berdi. Qayta urinib ko'ring.");
        return;
      }

      // Xavfsiz chiqish: router cache, bfcache va in-memory sessiyani tozalash uchun window.location.replace
      window.location.replace("/login");
    } catch {
      setIsLoggingOut(false);
      setLogoutError("Tarmoq xatosi tufayli tizimdan chiqib bo'lmadi.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {logoutError && (
        <span
          role="alert"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md"
        >
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{logoutError}</span>
        </span>
      )}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
        title="Tizimdan chiqish"
      >
        {isLoggingOut ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
            <span className="hidden sm:inline">Chiqilmoqda...</span>
          </>
        ) : (
          <>
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Chiqish</span>
          </>
        )}
      </button>
    </div>
  );
}
