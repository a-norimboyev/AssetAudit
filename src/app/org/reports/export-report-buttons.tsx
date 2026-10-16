"use client";

import { Download, Printer } from "lucide-react";

interface ExportReportButtonsProps {
  report: {
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
  };
}

export function ExportReportButtons({ report }: ExportReportButtonsProps) {
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

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `rekonsilyatsiya_${report.cycleTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        onClick={exportCsv}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-emerald-600" />
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
