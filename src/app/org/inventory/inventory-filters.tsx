"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";
import { exportInventoryDataAction, exportInventoryExcelAction } from "@/lib/actions/inventory";
import { buildCsvRow } from "@/lib/utils/csv";

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
  categories: CategoryOption[];
  buildings: BuildingOption[];
  currentCategoryId: string;
  currentBuildingId: string;
  currentStatus: string;
  currentSearch: string;
}

export function InventoryFilters({
  categories,
  buildings,
  currentCategoryId,
  currentBuildingId,
  currentStatus,
  currentSearch,
}: InventoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentSearch);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
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

  async function handleExportCsv() {
    setIsExportingCsv(true);
    try {
      const res = await exportInventoryDataAction({
        categoryId: currentCategoryId !== "all" ? currentCategoryId : undefined,
        buildingId: currentBuildingId !== "all" ? currentBuildingId : undefined,
        status: currentStatus !== "all" ? currentStatus : undefined,
        search: currentSearch || undefined,
      });

      if (!res.success || !res.data) {
        alert(res.message || "Eksport qilishda xatolik yuz berdi.");
        return;
      }

      let csv = "\uFEFF";
      csv += buildCsvRow([
        "Inventar raqami",
        "Nomi",
        "Toifasi",
        "Bino",
        "Xona",
        "Holati",
        "Sifati",
        "Narxi",
        "Tavsif",
        "Kiritilgan sana",
      ]) + "\n";

      for (const row of res.data) {
        csv += buildCsvRow([
          row.inventoryNumber,
          row.name,
          row.categoryName,
          row.buildingName,
          `${row.roomNumber} (${row.roomName})`,
          row.status,
          row.condition,
          row.price || "",
          row.description || "",
          row.createdAt,
        ]) + "\n";
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `inventarlar_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      alert("CSV eksport qilishda tarmoq xatosi yuz berdi.");
    } finally {
      setIsExportingCsv(false);
    }
  }

  async function handleExportExcel() {
    setIsExportingExcel(true);
    try {
      const res = await exportInventoryExcelAction({
        categoryId: currentCategoryId !== "all" ? currentCategoryId : undefined,
        buildingId: currentBuildingId !== "all" ? currentBuildingId : undefined,
        status: currentStatus !== "all" ? currentStatus : undefined,
        search: currentSearch || undefined,
      });

      if (!res.success || !res.base64) {
        alert(res.message || "Excel eksport qilishda xatolik yuz berdi.");
        return;
      }

      const byteCharacters = atob(res.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", res.filename || `inventarlar_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      alert("Excel eksport qilishda tarmoq xatosi yuz berdi.");
    } finally {
      setIsExportingExcel(false);
    }
  }

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
      {/* 1-qator: Qidiruv, Bino va Holat filtrlari + Eksport tugmalari */}
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

          {/* Eksport Tugmalari */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
            <button
              onClick={handleExportCsv}
              disabled={isExportingCsv || isExportingExcel}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Filtrlangan inventarlarni CSV formatida yuklab olish"
            >
              {isExportingCsv ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <FileText className="w-4 h-4 text-emerald-600" />
              )}
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExportingCsv || isExportingExcel}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Filtrlangan inventarlarni to'liq Excel (.xlsx) formatida yuklab olish"
            >
              {isExportingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              )}
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-qator: Toifalar bo'yicha tezkor filtr tugmalari */}
      <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="font-semibold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>Toifa:</span>
        </span>
        <button
          type="button"
          onClick={() => updateQuery({ categoryId: "all" })}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
            currentCategoryId === "all"
              ? "bg-blue-600 text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Barchasi
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => updateQuery({ categoryId: c.id })}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
              currentCategoryId === c.id
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
