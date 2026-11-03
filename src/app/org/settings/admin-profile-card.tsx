"use client";

import { useState } from "react";
import { Shield, Phone, CheckCircle2, AlertCircle, Loader2, Save, User } from "lucide-react";
import { updateAdminOwnProfileAction } from "@/lib/actions/staff";

interface AdminProfileCardProps {
  initialFullName: string;
  initialUsername: string;
  initialPhone: string;
  role: string;
}

export function AdminProfileCard({
  initialFullName,
  initialUsername,
  initialPhone,
  role,
}: AdminProfileCardProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("fullName", fullName.trim());
    formData.append("phone", phone.trim());

    try {
      const res = await updateAdminOwnProfileAction(formData);
      if (res.success) {
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    } catch {
      setMessage({ type: "error", text: "Saqlashda xatolik yuz berdi." });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-xs transition-shadow space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Joriy Mas&apos;ul Administrator</h2>
          <p className="text-[11px] text-slate-500">Boshqaruv hisobi va aloqa ma&apos;lumotlari</p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* F.I.SH */}
        <div>
          <label className="text-slate-600 font-medium block mb-1">
            F.I.SH (To&apos;liq ism) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Ism-sharifingizni kiriting"
              className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-semibold text-slate-900 transition-all"
            />
          </div>
        </div>

        {/* Admin Logini */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-600 font-medium block">Admin Logini</label>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              🔒 Faqat Super Admin o‘zgartira oladi
            </span>
          </div>
          <div className="font-mono font-bold text-slate-800 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
            {initialUsername || "-"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Universitet administratorining logini faqat Super Admin tomonidan o‘zgartiriladi.
          </p>
        </div>

        {/* Telefon raqami */}
        <div>
          <label className="text-slate-600 font-medium block mb-1">
            Telefon raqami
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono font-semibold text-slate-900 transition-all"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Ushbu raqam Super Admin paneli bilan 2 tomonlama avtomatik sinxronlashadi.
          </p>
        </div>

        {/* Tizimdagi Roli */}
        <div>
          <label className="text-slate-600 font-medium block mb-1">Tizimdagi Roli</label>
          <div className="font-semibold text-blue-700 bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/80">
            {role || "Universitet Bosh Administratori (organization_admin)"}
          </div>
        </div>

        {/* Saqlash tugmasi */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saqlanmoqda...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Ma&apos;lumotlarni saqlash</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
