"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { Search, Filter, X, Loader2, Plus } from "lucide-react";
import type { OrganizationTypeOption } from "@/lib/data/organizations";

interface Props {
  types: OrganizationTypeOption[];
  currentSearch?: string;
  currentType?: string;
}

export function OrganizationFilters({ types, currentSearch = "", currentType = "all" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [selectedType, setSelectedType] = useState(currentType);

  function applyFilters(newSearch: string, newType: string) {
    const params = new URLSearchParams(searchParams.toString());

    // 1. Qidiruv parametri
    if (newSearch && newSearch.trim()) {
      params.set("q", newSearch.trim());
    } else {
      params.delete("q");
    }

    // 2. Tur parametri
    if (newType && newType !== "all") {
      params.set("type", newType);
    } else {
      params.delete("type");
    }

    // Filter o'zgarganda 1-sahifaga qaytish
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    applyFilters(searchTerm, selectedType);
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextType = e.target.value;
    setSelectedType(nextType);
    applyFilters(searchTerm, nextType);
  }

  function handleClear() {
    setSearchTerm("");
    setSelectedType("all");
    applyFilters("", "all");
  }

  const hasActiveFilters = Boolean(
    (currentSearch && currentSearch.trim()) ||
    (currentType && currentType !== "all")
  );

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Qidiruv Inputi */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tashkilot nomi yoki kodi bo‘yicha qidirish..."
            className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                applyFilters("", selectedType);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Qidiruvni tozalash"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tashkilot Turi Tanlovi (Dropdown) */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <select
            value={selectedType}
            onChange={handleTypeChange}
            aria-label="Tashkilot turi bo'yicha filtrlash"
            className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs sm:text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all cursor-pointer appearance-none"
          >
            <option value="all">Barcha tashkilot turlari</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
            ▼
          </div>
        </div>

        {/* Yangi tashkilot qo'shish tugmasi (Qidirish o'rnida) */}
        <Link
          href="/admin/organizations/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi tashkilot qo‘shish</span>
        </Link>

        {/* Filtrlarni tozalash */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isPending}
            className="px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs sm:text-sm font-semibold transition-colors shrink-0 cursor-pointer"
            title="Barcha filtrlarni tozalash"
          >
            Tozalash
          </button>
        )}
      </form>
    </div>
  );
}
