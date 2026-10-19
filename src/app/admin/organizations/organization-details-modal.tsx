"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ShieldCheck,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  Phone,
  Check,
  Copy,
  X,
  Hourglass,
  Tag,
  AlertTriangle,
} from "lucide-react";
import type { OrganizationListItem, OrganizationTypeOption } from "@/lib/data/organizations";
import { EditOrganizationModal } from "./edit-organization-modal";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"
];

function formatUzbekDate(date?: Date | string | null, includeTime = false): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const day = d.getDate();
  const month = UZ_MONTHS[d.getMonth()] || "";
  const year = d.getFullYear();
  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}-${month}, ${year} ${hours}:${minutes}`;
  }
  return `${day}-${month}, ${year}`;
}

interface OrganizationDetailsModalProps {
  organization: OrganizationListItem;
  types: OrganizationTypeOption[];
  trigger?: React.ReactNode;
}

export function OrganizationDetailsModal({
  organization,
  types,
  trigger,
}: OrganizationDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  useBodyScrollLock(isOpen);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const org = organization;
  const admin = org.admin;
  const sub = org.subscription;
  const adminPassword = admin?.password;

  const formattedCreatedDate = formatUzbekDate(org.createdAt, true);
  const formattedStartDate = formatUzbekDate(sub.startsAt);
  const formattedExpiresDate = formatUzbekDate(sub.expiresAt);

  function handleCopyId() {
    navigator.clipboard.writeText(org.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  function handleCopyLogin() {
    const loginText = admin?.username || admin?.email || "";
    if (loginText) {
      navigator.clipboard.writeText(loginText);
      setCopiedLogin(true);
      setTimeout(() => setCopiedLogin(false), 2000);
    }
  }

  function handleCopyPassword() {
    if (adminPassword) {
      navigator.clipboard.writeText(adminPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  }

  function handleCopyPhone() {
    const phoneText = admin?.phone || "+998 (93) 364-20-30";
    navigator.clipboard.writeText(phoneText);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="text-left font-semibold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer group"
        >
          {org.name}
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overscroll-contain">
          <div
            className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-slate-50/75 border-b border-slate-200/80 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-base font-bold shadow-sm shrink-0 overflow-hidden">
                  {org.settings?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={org.settings.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                  ) : (
                    org.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900 truncate">
                      {org.name}
                    </h2>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      {org.code}
                    </span>
                    {org.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Faol</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>Bloklangan</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                    <span>ID: {org.id}</span>
                    <button
                      onClick={handleCopyId}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                      title="ID nusxalash"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 overscroll-contain">
              {/* 1. Dostup muddati va Litsenziya Bloki */}
              <div className="p-5 rounded-xl border border-slate-200/80 bg-gradient-to-br from-blue-50/40 via-white to-slate-50">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4">
                  <div className="flex items-center gap-2">
                    <Hourglass className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Dostup muddati va litsenziya
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      sub.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : sub.status === "expiring_soon"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {sub.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-[11px] font-medium text-slate-400">Reja / Tarif</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {sub.planLabel}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-medium text-slate-400">O‘rnatilgan sana</div>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedStartDate}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-medium text-slate-400">Dostup tugash sanasi</div>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedExpiresDate}</span>
                    </div>
                  </div>
                </div>

                {sub.daysRemaining > 0 ? (
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Amal qilish muddatiga <strong>{sub.daysRemaining} kun</strong> qoldi
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Yillik davr
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-rose-200 flex items-center gap-2 text-xs text-rose-600 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Ushbu tashkilotning dostup muddati tugagan. Muddatni uzaytirish zarur!</span>
                  </div>
                )}
              </div>

              {/* 2. Tashkilot Administratori va Kirish Ma'lumotlari */}
              <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Tashkilot Mas&apos;ul Administratori
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    Boshqaruv hisobi
                  </span>
                </div>

                {admin ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Administrator profili */}
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {admin.name || "Tashkilot Administratori"}
                        </div>
                        <div className="text-xs text-blue-600 font-semibold mt-0.5">
                          Tashkilot Rahbari (Admin)
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Biriktirilgan: {formatUzbekDate(admin.createdAt)}</span>
                        </div>
                        {admin.userId && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/70">
                            <Link
                              href={`/admin/administrators/${admin.userId}`}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Profil va ishlarni kuzatish &rarr;</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kirish hisobi ma'lumotlari: Gmail va Parol */}
                    <div className="space-y-2 text-xs">
                      {/* Gmail manzili */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-slate-500 shrink-0 font-medium">Gmail manzili:</span>
                          <span className="font-mono font-bold text-slate-900 truncate">
                            {admin.username || admin.email}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyLogin}
                          className="text-slate-400 hover:text-blue-600 transition-colors ml-2 shrink-0 p-1 rounded-md hover:bg-slate-200/50 cursor-pointer"
                          title="Gmail manzilidan nusxa olish"
                        >
                          {copiedLogin ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Parol */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-slate-500 shrink-0 font-medium">Parol:</span>
                          {adminPassword ? (
                            <span className="font-mono font-bold text-slate-900 truncate">
                              {showPassword ? adminPassword : "••••••••"}
                            </span>
                          ) : (
                            <span className="font-mono text-slate-700 font-bold truncate">
                              ••••••••
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {adminPassword && (
                            <>
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-200/50 cursor-pointer"
                                title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                              >
                                {showPassword ? (
                                  <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={handleCopyPassword}
                                className="text-slate-400 hover:text-emerald-600 transition-colors p-1 rounded-md hover:bg-slate-200/50 cursor-pointer"
                                title="Paroldan nusxa olish"
                              >
                                {copiedPassword ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Telefon raqami */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-slate-500 shrink-0 font-medium">Telefon:</span>
                          <a
                            href={`tel:${(admin.phone || "+998933642030").replace(/[^+\d]/g, "")}`}
                            className="font-mono font-bold text-slate-900 hover:text-emerald-600 transition-colors truncate"
                          >
                            {admin.phone || "+998 (93) 364-20-30"}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyPhone}
                          className="text-slate-400 hover:text-emerald-600 transition-colors ml-2 shrink-0 p-1 rounded-md hover:bg-slate-200/50 cursor-pointer"
                          title="Telefon raqamidan nusxa olish"
                        >
                          {copiedPhone ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">
                    Ushbu tashkilotga hali administrator biriktirilmagan.
                  </div>
                )}
              </div>

              {/* 3. Tashkilot Asosiy Ko'rsatkichlari */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="text-[11px] font-medium text-slate-400">Tashkilot turi</div>
                  <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{org.typeName || org.typeId}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="text-[11px] font-medium text-slate-400">O‘rnatilgan sana va vaqt</div>
                  <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate">{formattedCreatedDate}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="text-[11px] font-medium text-slate-400">Multi-tenant Izolyatsiya</div>
                  <div className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Qat&apos;iy himoyalangan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                AssetAudit SaaS &bull; Platforma Boshqaruvi
              </div>

              <div className="flex items-center gap-2">
                <EditOrganizationModal organization={org} types={types} />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
