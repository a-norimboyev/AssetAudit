"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface AdminFiltersProps {
  currentSearch?: string;
}

export function AdminFilters({ currentSearch = "" }: AdminFiltersProps) {
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
    <div className="bg-white p-4 rounded-[4px] border border-slate-200/80 shadow-xs space-y-3">
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
        {/* Qidiruv kiritish maydoni */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, email yoki tashkilot bo‘yicha qidirish..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-[3px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                applyFilters("");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-[3px]"
              aria-label="Tozalash"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tugmalar */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[3px] bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Qidirish</span>
          </button>

          {hasFilter && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[3px] border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tozalash</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
