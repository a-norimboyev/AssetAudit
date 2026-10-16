"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Loader2, Printer } from "lucide-react";
import { exportReportExcelAction } from "@/lib/actions/audit";

interface ExportReportButtonsProps {
  report: {
    cycleId?: string;
    cycleTitle: string;
    totalExpectedItems: number;
    totalScannedItems: number;
    matchedItemsCount: number;
    conflictItemsCount: number;
    missingItemsCount: number;
    completedRooms: number;
    totalRooms: number;
    conflicts: Array<{
      itemName: string;
      inventoryNumber: string;
      expectedRoomNumber: string;
      expectedBuildingName: string;
      scannedRoomNumber: string;
      scannedBuildingName: string;
      scannerName?: string | null;
      scannedAt: Date;
    }>;
    missingItems?: Array<{
      id: string;
      name: string;
      inventoryNumber: string;
      roomNumber: string;
      buildingName: string;
    }>;
  };
}

export function ExportReportButtons({ report }: ExportReportButtonsProps) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  function exportCsv() {
    let csv = `AUDIT REKONSILYATSIYA HISOBOTI - ${report.cycleTitle}\n`;
    csv += `Jami kutilgan mulklar,${report.totalExpectedItems}\n`;
    csv += `Skanerlangan,${report.totalScannedItems}\n`;
    csv += `Mos kelganlar,${report.matchedItemsCount}\n`;
    csv += `Konfliktlar,${report.conflictItemsCount}\n`;
    csv += `Topilmaganlar,${report.missingItemsCount}\n`;
    csv += `Tekshirilgan xonalar,${report.completedRooms}/${report.totalRooms}\n\n`;

    csv += `JOYLASHUV KONFLIKTLARI JURNALI\n`;
    csv += `Inventar raqami,Nomi,Rasmiy kutilgan joy,Amalda topilgan joy,Tekshiruvchi,Sana va vaqt\n`;

    for (const c of report.conflicts) {
      csv += `"${c.inventoryNumber}","${c.itemName}","${c.expectedBuildingName} / ${c.expectedRoomNumber}-xona","${c.scannedBuildingName} / ${c.scannedRoomNumber}-xona","${c.scannerName || "Inspektor"}","${new Date(c.scannedAt).toLocaleString("uz-UZ")}"\n`;
    }

    if (report.missingItems && report.missingItems.length > 0) {
      csv += `\nTEKSHIRILGAN XONALARDA TOPILMAGAN MULKLAR\n`;
      csv += `Inventar raqami,Nomi,Kutilgan joylashuv,Holati\n`;
      for (const m of report.missingItems) {
        csv += `"${m.inventoryNumber}","${m.name}","${m.buildingName} / ${m.roomNumber}-xona","Topilmadi"\n`;
      }
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csv);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `rekonsilyatsiya_${report.cycleTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function exportExcel() {
    if (!report.cycleId) {
      alert("Audit sikli identifikatori topilmadi.");
      return;
    }

    setIsExportingExcel(true);
    try {
      const res = await exportReportExcelAction(report.cycleId);
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
      link.download = res.filename || "rekonsilyatsiya_hisoboti.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Eksport jarayonida xatolik yuz berdi.");
    } finally {
      setIsExportingExcel(false);
    }
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        onClick={exportExcel}
        disabled={isExportingExcel}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
      >
        {isExportingExcel ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
        )}
        <span>{isExportingExcel ? "Tayyorlanmoqda..." : "Excel (.xlsx)"}</span>
      </button>

      <button
        onClick={exportCsv}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-slate-600" />
        <span>CSV Eksport</span>
      </button>

      <button
        onClick={() => window.print()}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
      >
        <Printer className="w-3.5 h-3.5 text-white" />
        <span>Chop etish (Print)</span>
      </button>
    </div>
  );
}

