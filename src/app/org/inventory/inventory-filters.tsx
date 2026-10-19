"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";

interface BuildingOption {
  id: string;
  name: string;
  code: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface InventoryFiltersProps {
  categories?: CategoryOption[];
  buildings: BuildingOption[];
  currentCategoryId?: string;
  currentBuildingId: string;
  currentStatus: string;
  currentSearch: string;
}

export function InventoryFilters({
  buildings,
  currentBuildingId,
  currentStatus,
  currentSearch,
}: InventoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentSearch);
  const [isPending, startTransition] = useTransition();

  function updateQuery(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`/org/inventory?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateQuery({ q: search.trim() || null });
  }

  function clearSearch() {
    setSearch("");
    updateQuery({ q: null });
  }

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Qidiruv formasi */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Inventar raqami yoki nomi bo‘yicha qidiruv..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50/60 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Qidirish"}
          </button>
        </form>

        {/* Bino va Holat Selektorlari */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bino Selektori */}
          <div className="relative min-w-[140px]">
            <select
              value={currentBuildingId}
              onChange={(e) => updateQuery({ buildingId: e.target.value })}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 text-xs sm:text-sm font-medium bg-slate-50/60 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700 cursor-pointer transition-all"
            >
              <option value="all">Barcha binolar</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Holat Selektori */}
          <div className="relative min-w-[130px]">
            <select
              value={currentStatus}
              onChange={(e) => updateQuery({ status: e.target.value })}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 text-xs sm:text-sm font-medium bg-slate-50/60 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700 cursor-pointer transition-all"
            >
              <option value="all">Barcha holatlar</option>
              <option value="active">Faol</option>
              <option value="repair">Ta’mirda</option>
              <option value="written_off">Hisobdan chiqqan</option>
              <option value="transferred">Ko‘chirilgan</option>
              <option value="lost">Yo‘qolgan</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
