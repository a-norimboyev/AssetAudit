"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Search, X, Loader2 } from "lucide-react";
import type { OrganizationTypeOption } from "@/lib/data/organizations";
import { AddOrganizationModal } from "./add-organization-modal";

interface Props {
  types?: OrganizationTypeOption[];
  currentSearch?: string;
  currentType?: string;
}

export function OrganizationFilters({ types = [], currentSearch = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(currentSearch);

  function applyFilters(newSearch: string) {
    const params = new URLSearchParams(searchParams.toString());

    // 1. Qidiruv parametri
    if (newSearch && newSearch.trim()) {
      params.set("q", newSearch.trim());
    } else {
      params.delete("q");
    }

    params.delete("type");
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    applyFilters(searchTerm);
  }

  function handleClear() {
    setSearchTerm("");
    applyFilters("");
  }

  const hasActiveFilters = Boolean(currentSearch && currentSearch.trim());

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
            placeholder="OTM nomi yoki kodi bo‘yicha qidirish..."
            className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                applyFilters("");
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Qidiruvni tozalash"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Yangi OTM qo'shish modali */}
        <AddOrganizationModal types={types} />

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
