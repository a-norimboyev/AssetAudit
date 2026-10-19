"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs hover:shadow-xs"
    >
      <Printer className="w-4 h-4 text-white" />
      <span>Yorliqlarni chop etish</span>
    </button>
  );
}
