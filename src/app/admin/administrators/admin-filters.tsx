"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X, Loader2 } from "lucide-react";

import { AddAdminModal } from "./add-admin-modal";

interface AdminFiltersProps {
  currentSearch?: string;
  organizations?: Array<{
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  }>;
}

export function AdminFilters({
  currentSearch = "",
  organizations = [],
}: AdminFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentSearch);

  function applyFilters(newSearch: string) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (newSearch.trim()) {
      params.set("q", newSearch.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters(search);
  }

  function handleReset() {
    setSearch("");
    applyFilters("");
  }

  const hasFilter = Boolean(search);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Qidiruv formasi */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex-1 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, email yoki tashkilot bo‘yicha qidirish..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50/60 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={handleReset}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              aria-label="Tozalash"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtrlarni tozalash tugmasi */}
        {hasFilter && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tozalash</span>
          </button>
        )}
      </form>

      {/* Yangi admin qo'shish modal tugmasi (Mustaqil komponent, formadan tashqarida) */}
      {organizations && (
        <div className="shrink-0">
          <AddAdminModal organizations={organizations} />
        </div>
      )}
    </div>
  );
}
