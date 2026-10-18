"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, Copy, Check } from "lucide-react";

interface AdminPasswordCellProps {
  password?: string;
}

export function AdminPasswordCell({ password }: AdminPasswordCellProps) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!password) {
    return (
      <span className="font-mono text-slate-400 text-xs italic">
        ••••••••
      </span>
    );
  }

  function handleCopy() {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 w-fit shadow-2xs">
      <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span className="font-mono text-xs font-bold text-slate-800 tracking-wide">
        {show ? password : "••••••••"}
      </span>
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 ml-1 cursor-pointer"
        title={show ? "Parolni yashirish" : "Parolni ko'rsatish"}
      >
        {show ? <EyeOff className="w-3.5 h-3.5 text-slate-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="text-slate-400 hover:text-emerald-600 transition-colors p-0.5 cursor-pointer"
        title="Paroldan nusxa olish"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
