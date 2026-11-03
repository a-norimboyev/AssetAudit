"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  QrCode,
  Check,
  SlidersHorizontal,
  FileText,
  Tag,
} from "lucide-react";

export type PrintPaperFormat = "50x30" | "40x25" | "a4";

interface StickerItem {
  id: string;
  inventoryNumber: string;
  name: string;
  qrDataUrl: string;
}

export function MinimalistPrintClient({
  items,
  organizationCode,
}: {
  items: StickerItem[];
  organizationCode: string;
}) {
  const [format, setFormat] = useState<PrintPaperFormat>("50x30");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(items.map((i) => i.id))
  );

  const activeItems = items.filter((i) => selectedIds.has(i.id));

  function toggleItem(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  function toggleAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Print CSS for selected paper format */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-hidden-element {
            display: none !important;
          }

          ${format === "50x30"
            ? `
            @page {
              size: 50mm 30mm;
              margin: 0mm;
            }
            .sticker-container-print {
              display: block !important;
            }
            .sticker-card {
              width: 50mm !important;
              height: 30mm !important;
              page-break-after: always !important;
              break-after: page !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              box-sizing: border-box !important;
              padding: 1.5mm !important;
              border: none !important;
              box-shadow: none !important;
              background: #ffffff !important;
            }
            .sticker-qr {
              width: 20mm !important;
              height: 20mm !important;
              object-fit: contain !important;
            }
            .sticker-code {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
              font-size: 11pt !important;
              font-weight: 800 !important;
              letter-spacing: 0.05em !important;
              color: #000000 !important;
              line-height: 1 !important;
              margin-top: 1mm !important;
            }
          `
            : format === "40x25"
            ? `
            @page {
              size: 40mm 25mm;
              margin: 0mm;
            }
            .sticker-container-print {
              display: block !important;
            }
            .sticker-card {
              width: 40mm !important;
              height: 25mm !important;
              page-break-after: always !important;
              break-after: page !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              box-sizing: border-box !important;
              padding: 1mm !important;
              border: none !important;
              box-shadow: none !important;
              background: #ffffff !important;
            }
            .sticker-qr {
              width: 16mm !important;
              height: 16mm !important;
              object-fit: contain !important;
            }
            .sticker-code {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
              font-size: 9pt !important;
              font-weight: 800 !important;
              letter-spacing: 0.05em !important;
              color: #000000 !important;
              line-height: 1 !important;
              margin-top: 0.8mm !important;
            }
          `
            : `
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            .sticker-container-print {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 3mm !important;
            }
            .sticker-card {
              height: 33mm !important;
              border: 1px dashed #94a3b8 !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              box-sizing: border-box !important;
              padding: 2mm !important;
              background: #ffffff !important;
            }
            .sticker-qr {
              width: 22mm !important;
              height: 22mm !important;
              object-fit: contain !important;
            }
            .sticker-code {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
              font-size: 11pt !important;
              font-weight: 800 !important;
              letter-spacing: 0.05em !important;
              color: #000000 !important;
              line-height: 1 !important;
              margin-top: 1mm !important;
            }
          `}
        }
      `}</style>

      {/* Ekrandagi boshqaruv paneli (Chop etishda ko'rinmaydi) */}
      <div className="print-hidden-element space-y-4">
        <Link
          href="/org/inventory"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Inventarlar ro'yxatiga qaytish</span>
        </Link>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <span>Minimalist QR-stikerlarni Chop Etish</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Stikerda FAQAT 2 ta narsa: Tepada toza QR-kod, pastida aniq qisqa kod (masalan:{" "}
                <span className="font-mono font-bold text-slate-900">B1-210-0001</span>).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                disabled={activeItems.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {activeItems.length} ta stikerni chop etish (Pechat)
                </span>
              </button>
            </div>
          </div>

          {/* Qog'oz / Printer formati tanlovi */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                Qog'oz formati:
              </span>

              <button
                type="button"
                onClick={() => setFormat("50x30")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  format === "50x30"
                    ? "bg-blue-50 text-blue-700 border-blue-300 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Termoprinter (50x30 mm)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("40x25")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  format === "40x25"
                    ? "bg-blue-50 text-blue-700 border-blue-300 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Termoprinter (40x25 mm)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("a4")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  format === "a4"
                    ? "bg-blue-50 text-blue-700 border-blue-300 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Oddiy A4 varaq (24 talik)</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={toggleAll}
                className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline"
              >
                {selectedIds.size === items.length
                  ? "Barchasini bekor qilish"
                  : "Barchasini tanlash"}
              </button>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 font-medium">
                Jami: <strong className="text-slate-900">{items.length}</strong> tadan{" "}
                <strong className="text-blue-600">{activeItems.length}</strong> tasi tanlangan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ekrandagi va Chop etiladigan Minimalist Stikerlar to'plami */}
      {activeItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          Chop etish uchun birorta ham stiker tanlanmadi.
        </div>
      ) : (
        <div
          className={`sticker-container-print ${
            format === "a4"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 print:grid-cols-3"
              : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
          }`}
        >
          {activeItems.map((item) => {
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`sticker-card relative rounded-xl border bg-white p-3 text-center transition-all cursor-pointer select-none ${
                  isSelected
                    ? "border-slate-300 shadow-2xs hover:border-blue-400"
                    : "opacity-40 border-slate-200"
                } ${
                  format === "50x30"
                    ? "aspect-[50/30] flex flex-col items-center justify-center"
                    : format === "40x25"
                    ? "aspect-[40/25] flex flex-col items-center justify-center"
                    : "aspect-[70/36] flex flex-col items-center justify-center border-dashed"
                }`}
              >
                {/* Tepada: Toza QR-kod */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.qrDataUrl}
                  alt={item.inventoryNumber}
                  className={`sticker-qr object-contain ${
                    format === "40x25"
                      ? "w-16 h-16 max-h-[60%]"
                      : "w-20 h-20 max-h-[65%]"
                  }`}
                />

                {/* Pastida: Aniq qisqa kod */}
                <div className="sticker-code font-mono font-extrabold tracking-wider text-slate-950 text-xs sm:text-sm mt-1">
                  {item.inventoryNumber}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
