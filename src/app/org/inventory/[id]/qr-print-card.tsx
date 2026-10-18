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
      {/* Chop etiladigan Stiker Kartasi (50x30mm / 70x35mm nisbatga mos) */}
      <div
        id="printable-qr-sticker"
        className="p-4 sm:p-5 rounded-xl bg-white border-2 border-slate-900 shadow-2xs text-slate-900 max-w-sm mx-auto sm:mx-0"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-[11px] font-bold">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
              A
            </span>
            <span className="tracking-tight truncate" title={organizationName}>
              {organizationName}
            </span>
          </div>
          <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            {organizationCode}
          </span>
        </div>

        <div className="py-3 flex items-center gap-3">
          <div className="shrink-0 p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR kod: ${inventoryNumber}`}
              className="w-24 h-24 object-contain"
            />
          </div>
          <div className="min-w-0 text-left">
            <div className="font-mono font-black text-sm text-slate-950 tracking-tight">
              {inventoryNumber}
            </div>
            <div className="font-semibold text-xs text-slate-800 line-clamp-2 mt-0.5 leading-snug">
              {itemName}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span>{buildingName}</span>
              <span>•</span>
              <span className="font-mono font-bold text-slate-700">{roomNumber}-xona</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>Kamera orqali skanerlang</span>
          <span>AssetAudit Rasmiy Mulk</span>
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
