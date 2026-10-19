import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { getInventoryList } from "@/lib/data/inventory";
import { generateQrDataUrl } from "@/lib/qr";
import { ArrowLeft, QrCode } from "lucide-react";
import { PrintButton } from "./print-button";

export const metadata = {
  title: "Ommaviy QR Yorliqlar — AssetAudit",
  description: "Tashkilot inventarlari uchun ommaviy bosma QR yorliqlar varaqasi",
};

export const instant = false;

interface PageProps {
  searchParams: Promise<{
    buildingId?: string;
    roomId?: string;
    page?: string;
  }>;
}

export default async function BulkPrintLabelsPage({ searchParams }: PageProps) {
  const { organization } = await requireAuthenticatedUser({ allowMustChangePassword: true });
  if (!organization) return null;

  const params = await searchParams;
  const buildingId = params.buildingId;
  const roomId = params.roomId;

  const inventoryRes = await getInventoryList({
    organizationId: organization.id,
    buildingId: buildingId && buildingId !== "all" ? buildingId : undefined,
    roomId: roomId && roomId !== "all" ? roomId : undefined,
    status: "active",
    pageSize: 60, // A4 varaqlariga moslab 60 tagacha bir sahifada
    page: 1,
  });

  // Har bir inventar uchun QR DataURL generatsiya qilish
  const itemsWithQr = await Promise.all(
    inventoryRes.items.map(async (item) => {
      const qrDataUrl = await generateQrDataUrl(item.qrToken);
      return {
        ...item,
        qrDataUrl,
      };
    })
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Chop etishda ko'rinmaydigan boshqaruv qismi */}
      <div className="print:hidden space-y-4">
        <Link
          href="/org/inventory"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Inventarlar ro‘yxatiga qaytish</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <span>Ommaviy QR Yorliqlar</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Chop etiladigan QR Yorliqlar Tarmog'i (Grid) */}
      {itemsWithQr.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          Chop etish uchun faol inventarlar topilmadi.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
          {itemsWithQr.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white border border-slate-900 shadow-2xs text-slate-900 break-inside-avoid"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-[10px] font-bold">
                <span className="truncate max-w-[140px]">{organization.name}</span>
                <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200">
                  {organization.code}
                </span>
              </div>

              <div className="py-2.5 flex items-center gap-3">
                <div className="shrink-0 p-1 bg-white border border-slate-200 rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.qrDataUrl}
                    alt={`QR: ${item.inventoryNumber}`}
                    className="w-16 h-16 object-contain"
                  />
                </div>

                <div className="min-w-0 space-y-1 text-left flex-1">
                  <div className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md inline-block">
                    {item.inventoryNumber}
                  </div>
                  <div className="font-semibold text-slate-900 text-xs truncate" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {item.buildingCode} / {item.roomNumber}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>assetaudit.uz</span>
                <span>{item.categoryName}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
