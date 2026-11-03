"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Hourglass,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { OrganizationDetailsModal } from "./organizations/organization-details-modal";
import { AddOrganizationModal } from "./organizations/add-organization-modal";
import type { OrganizationListItem, OrganizationsStats } from "@/lib/data/organizations";

interface DashboardOrganizationsTableProps {
  initialOrganizations: OrganizationListItem[];
  types: Array<{ id: string; name: string }>;
  stats?: OrganizationsStats & { expiringCount?: number };
}

export function DashboardOrganizationsTable({
  initialOrganizations,
  types,
  stats,
}: DashboardOrganizationsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "frozen" | "expiring">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Statuslar bo'yicha dinamik hisob-kitob
  const statsCounts = useMemo(() => {
    let active = 0;
    let frozen = 0;
    let expiring = 0;

    for (const org of initialOrganizations) {
      if (!org.isActive) {
        frozen++;
      } else {
        active++;
        if (
          org.subscription?.status === "expiring_soon" ||
          org.subscription?.status === "expired" ||
          (typeof org.subscription?.daysRemaining === "number" && org.subscription.daysRemaining <= 30)
        ) {
          expiring++;
        }
      }
    }

    return {
      all: initialOrganizations.length || stats?.total || 0,
      active: active || stats?.active || 0,
      frozen: frozen || stats?.inactive || 0,
      expiring: expiring || stats?.expiringCount || 0,
    };
  }, [initialOrganizations, stats]);

  // Filtrlangan tashkilotlar
  const filteredOrganizations = useMemo(() => {
    let list = initialOrganizations;

    // 1. Status filtri (Karta yoki tab bosilganda)
    if (statusFilter === "active") {
      list = list.filter((org) => org.isActive);
    } else if (statusFilter === "frozen") {
      list = list.filter((org) => !org.isActive);
    } else if (statusFilter === "expiring") {
      list = list.filter(
        (org) =>
          org.isActive &&
          (org.subscription?.status === "expiring_soon" ||
            org.subscription?.status === "expired" ||
            (typeof org.subscription?.daysRemaining === "number" && org.subscription.daysRemaining <= 30))
      );
    }

    // 2. Qidiruv filtri
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((org) => {
        const nameMatch = org.name.toLowerCase().includes(q);
        const codeMatch = org.code.toLowerCase().includes(q);
        const typeMatch = Boolean(
          org.typeName && org.typeName.toLowerCase().includes(q)
        );
        const adminMatch = Boolean(
          (org.admin?.username && org.admin.username.toLowerCase().includes(q)) ||
            (org.admin?.name && org.admin.name.toLowerCase().includes(q)) ||
            (org.admin?.email && org.admin.email.toLowerCase().includes(q))
        );
        const regionMatch = Boolean(
          (org.settings as Record<string, unknown>)?.region &&
            String((org.settings as Record<string, unknown>).region).toLowerCase().includes(q)
        );
        return nameMatch || codeMatch || typeMatch || adminMatch || regionMatch;
      });
    }

    return list;
  }, [initialOrganizations, statusFilter, searchQuery]);

  // Sahifalash (Pagination: har bir sahifada 25 tadan)
  const totalItems = filteredOrganizations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedOrganizations = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredOrganizations.slice(start, start + pageSize);
  }, [filteredOrganizations, safePage, pageSize]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handleCardClick = (filter: "all" | "active" | "frozen" | "expiring") => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 1. INTERAKTIV STATISTIK KARTALAR (Bosganda jadvalni filtrlaydi) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Jami OTMlar kartasi */}
        <button
          type="button"
          onClick={() => handleCardClick("all")}
          className={`p-5 rounded text-left transition-all cursor-pointer relative select-none ${
            statusFilter === "all"
              ? "bg-white border-2 border-blue-600 shadow-md ring-4 ring-blue-50/80"
              : "bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300"
          }`}
          title="Barcha OTMlar ro‘yxatini ko‘rish"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Jami OTMlar</span>
            <div
              className={`w-9 h-9 rounded flex items-center justify-center transition-colors ${
                statusFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
            {statsCounts.all}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Platforma bo‘yicha</div>
        </button>

        {/* 2. Faol OTMlar kartasi */}
        <button
          type="button"
          onClick={() => handleCardClick("active")}
          className={`p-5 rounded text-left transition-all cursor-pointer relative select-none ${
            statusFilter === "active"
              ? "bg-white border-2 border-emerald-600 shadow-md ring-4 ring-emerald-50/80"
              : "bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300"
          }`}
          title="Faqat faol OTMlarni ko‘rish"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Faol OTMlar</span>
            <div
              className={`w-9 h-9 rounded flex items-center justify-center transition-colors ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
            {statsCounts.active}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Faol holatda</span>
          </div>
        </button>

        {/* 3. Muzlatilgan OTMlar kartasi */}
        <button
          type="button"
          onClick={() => handleCardClick("frozen")}
          className={`p-5 rounded text-left transition-all cursor-pointer relative select-none ${
            statusFilter === "frozen"
              ? "bg-white border-2 border-rose-600 shadow-md ring-4 ring-rose-50/80"
              : "bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300"
          }`}
          title="Faqat muzlatilgan / to‘xtatilgan OTMlarni ko‘rish"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Muzlatilgan OTMlar</span>
            <div
              className={`w-9 h-9 rounded flex items-center justify-center transition-colors ${
                statusFilter === "frozen"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
            {statsCounts.frozen}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Nofaol / to‘xtatilgan</span>
          </div>
        </button>

        {/* 4. Muddati tugayotgan OTMlar kartasi */}
        <button
          type="button"
          onClick={() => handleCardClick("expiring")}
          className={`p-5 rounded text-left transition-all cursor-pointer relative select-none ${
            statusFilter === "expiring"
              ? "bg-amber-50/90 border-2 border-amber-600 shadow-md ring-4 ring-amber-100/80"
              : statsCounts.expiring > 0
              ? "bg-amber-50/50 border border-amber-200 hover:border-amber-300 shadow-2xs hover:shadow-xs"
              : "bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300"
          }`}
          title="Dostup muddati tugayotgan yoki tugagan OTMlarni ko‘rish"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Muddati tugayotgan OTMlar</span>
            <div
              className={`w-9 h-9 rounded flex items-center justify-center transition-colors ${
                statusFilter === "expiring"
                  ? "bg-amber-600 text-white"
                  : statsCounts.expiring > 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {statsCounts.expiring > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Hourglass className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-bold mt-3 tracking-tight ${
              statsCounts.expiring > 0 ? "text-amber-900" : "text-slate-900"
            }`}
          >
            {statsCounts.expiring} ta
          </div>
          <div
            className={`text-[11px] font-medium mt-1 flex items-center gap-1.5 ${
              statsCounts.expiring > 0 ? "text-amber-700" : "text-emerald-600"
            }`}
          >
            {statsCounts.expiring > 0 ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Muddati tugayotgan / tugagan</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Barchasi faol</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* 2. Qidiruv va OTM qo'shish kartochkasi */}
      <div className="bg-white p-4 rounded border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Qidiruv maydoni */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Ism, login yoki OTM bo‘yicha qidirish..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50/60 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              aria-label="Tozalash"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Yangi OTM qo'shish modali */}
        <div className="shrink-0">
          <AddOrganizationModal types={types} />
        </div>
      </div>

      {/* 3. OTMlar ro'yxati Jadvali */}
      <div className="bg-white rounded border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between gap-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>OTMlar ro‘yxati</span>
          </h2>
        </div>

        {filteredOrganizations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            {searchQuery ? (
              <div className="space-y-2">
                <p>
                  Kiritilgan &ldquo;{searchQuery}&rdquo; so‘rovi bo‘yicha birorta
                  ham OTM topilmadi.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Qidiruvni tozalash
                </button>
              </div>
            ) : (
              "Ushbu toifada hozircha birorta ham OTM mavjud emas."
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-5 py-3 text-left">
                    OTM
                  </th>
                  <th scope="col" className="px-5 py-3 text-left">
                    Limit va foiz
                  </th>
                  <th scope="col" className="px-5 py-3 text-left">
                    Litsenziya muddati
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Holati
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedOrganizations.map((org) => {
                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* 1. Universitet logosi va to'liq nomi */}
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        <OrganizationDetailsModal
                          organization={org}
                          types={types}
                          trigger={
                            <div className="flex items-center gap-3 cursor-pointer group text-left">
                              {org.settings?.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={org.settings.logoUrl}
                                  alt={org.name}
                                  className="w-9 h-9 rounded object-contain bg-slate-50 border border-slate-200/80 p-0.5 shrink-0 shadow-2xs"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold border border-blue-100 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  {org.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-xs sm:text-sm line-clamp-1">
                                  {org.name}
                                </span>
                              </div>
                            </div>
                          }
                        />
                      </td>

                      {/* 2. Aktivlar balansi foizi & Limiti */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <OrganizationDetailsModal
                          organization={org}
                          types={types}
                          initialTab="limit"
                          trigger={
                            (() => {
                              const limitMlrd = org.assetUsage?.limitMlrd || org.settings?.assetLimitMlrd || 500;
                              const usedPercent = org.assetUsage?.usedPercent ?? 0;
                              return (
                                <div className="flex flex-col gap-1 min-w-[110px] max-w-[140px] cursor-pointer group/limit">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-800 group-hover/limit:text-blue-600 transition-colors">
                                      {usedPercent}% to‘ldi
                                    </span>
                                    <span className="text-slate-400 font-medium group-hover/limit:text-slate-600">
                                      {limitMlrd} mlrd
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        usedPercent > 90
                                          ? "bg-rose-500"
                                          : usedPercent > 70
                                          ? "bg-amber-500"
                                          : "bg-blue-600"
                                      }`}
                                      style={{ width: `${Math.min(100, Math.max(0, usedPercent))}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })()
                          }
                        />
                      </td>

                      {/* 3. Litsenziya muddati (Qancha vaqtga olgan va qancha vaqt qoldi) */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <OrganizationDetailsModal
                          organization={org}
                          types={types}
                          initialTab="license"
                          trigger={
                            <div className="flex flex-col gap-0.5 cursor-pointer group/lic">
                              <span className="font-semibold text-slate-800 text-xs group-hover/lic:text-blue-600 transition-colors">
                                {org.subscription.planLabel || "1 yillik dostup"}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                                  org.subscription.status === "active"
                                    ? "text-emerald-600"
                                    : org.subscription.status === "expiring_soon"
                                    ? "text-amber-600 font-semibold"
                                    : "text-rose-600 font-semibold"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    org.subscription.status === "active"
                                      ? "bg-emerald-500"
                                      : org.subscription.status === "expiring_soon"
                                      ? "bg-amber-500 animate-pulse"
                                      : "bg-rose-500"
                                  }`}
                                />
                                <span>{org.subscription.statusLabel}</span>
                              </span>
                            </div>
                          }
                        />
                      </td>

                      {/* 4. Holati (Faol yoki Muzlatilgan) */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {org.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Faol</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Muzlatilgan</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Sahifalash (Pagination) Quyi paneli */}
        {filteredOrganizations.length > 0 && (
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            {/* Ma'lumot matni */}
            <div className="font-medium text-slate-500">
              Jami <strong>{totalItems}</strong> tadan{" "}
              <strong>{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalItems)}</strong> ko‘rsatilmoqda
            </div>

            {/* Sahifalar orasida o'tish: Oldingi, Raqamlar, Keyingi */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(safePage - 1)}
                  disabled={safePage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Oldingi</span>
                </button>

                {/* Sahifa raqamlari (max 5 ta) */}
                <div className="flex items-center gap-1 mx-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                    let pageNum = idx + 1;
                    if (totalPages > 5 && safePage > 3) {
                      pageNum = safePage - 3 + idx;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - idx);
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-7 h-7 rounded text-xs font-semibold transition-colors cursor-pointer ${
                          safePage === pageNum
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
                >
                  <span>Keyingi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
