"use client";

import { Printer, Download, ExternalLink } from "lucide-react";
import Link from "next/link";

interface QrPrintCardProps {
  itemName: string;
  inventoryNumber: string;
  organizationName: string;
  organizationCode: string;
  buildingName: string;
  roomNumber: string;
  qrDataUrl: string;
  publicUrl: string;
}

export function QrPrintCard({
  itemName,
  inventoryNumber,
  organizationName,
  organizationCode,
  buildingName,
  roomNumber,
  qrDataUrl,
  publicUrl,
}: QrPrintCardProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-4">
      {/* Chop etiladigan Stiker Kartasi (QR tepada, inventar raqami pastda) */}
      <div
        id="printable-qr-sticker"
        className="p-4 rounded-xl bg-white border-2 border-slate-900 shadow-2xs text-slate-900 w-fit flex flex-col items-center justify-center text-center mx-auto sm:mx-0"
      >
        <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR kod: ${inventoryNumber}`}
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
          />
        </div>
        <div className="mt-2.5 font-mono font-black text-sm sm:text-base text-slate-950 tracking-wider text-center break-all">
          {inventoryNumber}
        </div>
      </div>

      {/* Harakat tugmalari */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Yorliqni chop etish</span>
        </button>

        <a
          href={qrDataUrl}
          download={`QR_${inventoryNumber}.png`}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>PNG yuklab olish</span>
        </a>

        <Link
          href={publicUrl}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-blue-600 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Ommaviy sahifa</span>
        </Link>
      </div>
    </div>
  );
}
