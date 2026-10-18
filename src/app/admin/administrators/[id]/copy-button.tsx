"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  title?: string;
  className?: string;
}

export function CopyButton({ text, title = "Nusxa olish", className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-slate-200/60 cursor-pointer shrink-0 ${className}`}
      title={title}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
