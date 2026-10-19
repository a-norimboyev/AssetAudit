"use client";

import React from "react";
import { Menu, Search, Bell } from "lucide-react";

interface DashboardHeaderProps {
  onMenuToggle: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onMenuToggle,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Chap qism: Menyu tugmasi va Qidiruv */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Menyuni ochish"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Qidiruv */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Inventar raqami, buyum yoki xonani qidirish..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      {/* O'ng qism: Demo bildirishnomalar va Profil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* SaaS Status belgisi */}
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Faol SaaS Muhiti</span>
        </span>

        {/* Bildirishnomalar */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Bildirishnomalar"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Foydalanuvchi qisqacha ma'lumoti */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
            OA
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              Otabek Aliyev
            </div>
            <div className="text-[11px] text-slate-500 leading-tight">
              Universitet Admini
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
