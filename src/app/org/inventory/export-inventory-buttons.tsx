"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  exportInventoryExcelAction,
  exportInventoryDataAction,
} from "@/lib/actions/inventory";
import { buildCsvRow } from "@/lib/utils/csv";

interface ExportInventoryButtonsProps {
  filters: {
    categoryId?: string;
    buildingId?: string;
    roomId?: string;
    status?: string;
    search?: string;
  };
}

export function ExportInventoryButtons({ filters }: ExportInventoryButtonsProps) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  async function handleExportCsv() {
    setIsExportingCsv(true);
    try {
      const res = await exportInventoryDataAction(filters);
      if (!res.success || !res.data) {
        alert(res.message || "CSV ma'lumotlarini yuklashda xatolik.");
        return;
      }

      let csv = `ASSETAUDIT INVENTARLAR REESTRI\n`;
      csv += buildCsvRow([
        "Inventar raqami",
        "Nomi",
        "Turkum",
        "Bino",
        "Xona raqami",
        "Xona nomi",
        "Holati",
        "Texnik holati",
        "Narxi (UZS)",
        "Tavsif",
        "Yaratilgan sana",
      ]) + "\n";

      for (const row of res.data) {
        csv += buildCsvRow([
          row.inventoryNumber,
          row.name,
          row.categoryName || "",
          row.buildingName || "",
          row.roomNumber || "",
          row.roomName || "",
          row.status,
          row.condition,
          row.price || 0,
          row.description || "",
          row.createdAt,
        ]) + "\n";
      }

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csv);
      const link = document.createElement("a");
      link.setAttribute("href", csvContent);
      link.setAttribute("download", `inventarlar_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(err instanceof Error ? err.message : "CSV eksport qilishda xatolik.");
    } finally {
      setIsExportingCsv(false);
    }
  }

  async function handleExportExcel() {
    setIsExportingExcel(true);
    try {
      const res = await exportInventoryExcelAction(filters);
      if (!res.success || !res.base64) {
        alert(res.message || "Excel faylini shakllantirishda xatolik yuz berdi.");
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
      link.download = res.filename || `inventarlar_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Excel eksport qilishda xatolik.");
    } finally {
      setIsExportingExcel(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportExcel}
        disabled={isExportingExcel}
        type="button"
        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition cursor-pointer disabled:opacity-50"
        title="Joriy filtrlangan inventarlarni to'liq Excel (.xlsx) formatida yuklab olish"
      >
        {isExportingExcel ? (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        )}
        <span>Excel Eksport</span>
      </button>

      <button
        onClick={handleExportCsv}
        disabled={isExportingCsv}
        type="button"
        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition cursor-pointer disabled:opacity-50"
        title="Joriy inventarlarni CSV formatida yuklab olish"
      >
        {isExportingCsv ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        ) : (
          <Download className="w-4 h-4 text-blue-600" />
        )}
        <span>CSV Eksport</span>
      </button>
    </div>
  );
}
