import { notFound } from "next/navigation";
import Link from "next/link";
import { getItemByQrToken } from "@/lib/data/inventory";
import {
  Building2,
  Building,
  DoorClosed,
  Lock,
  CheckCircle2,
  QrCode,
  Tag,
} from "lucide-react";

export const metadata = {
  title: "AssetAudit — QR Tekshiruvi",
  description: "O‘zbekiston Respublikasi tashkilotlari mulkini rasmiy QR tekshirish tizimi",
};

export const instant = false;

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function PublicQrPage({ params }: PageProps) {
  const { token } = await params;

  if (!token || token.length < 16) {
    notFound();
  }

  // Oddiy QR ko'rish inventar sanog'i (audit scan) hisoblanmaydi!
  const item = await getItemByQrToken(token);

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <main className="max-w-md w-full bg-white rounded-[4px] border border-slate-200/80 p-6 sm:p-8 text-center shadow-xs">
          <div className="w-16 h-16 rounded-[4px] bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            QR Kod Tizimda Topilmadi
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Skanerlangan QR kod AssetAudit platformasining rasmiy bazasida ro‘yxatdan o‘tmagan yoki eskirgan.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-slate-900 text-white text-xs font-semibold shadow-xs"
            >
              Bosh sahifaga o‘tish
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Yuqori Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[4px] bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            A
          </div>
          <span className="font-semibold text-slate-900 text-sm tracking-tight">
            Asset<span className="text-blue-600">Audit</span>
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Rasmiy Mulk</span>
        </span>
      </header>

      {/* Asosiy Kartasi */}
      <main className="max-w-md w-full mx-auto bg-white rounded-[4px] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Mulk Sarlavhasi */}
        <div className="text-center pb-4 border-b border-slate-100">
          <span className="px-2.5 py-1 rounded-[3px] text-xs font-mono font-bold bg-slate-900 text-white">
            {item.inventoryNumber}
          </span>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mt-3">
            {item.name}
          </h1>
          <p className="mt-1 text-xs text-slate-500 flex items-center justify-center gap-1">
            <Tag className="w-3 h-3" />
            <span>{item.categoryName}</span>
          </p>
        </div>

        {/* Tashkilot va Joylashuv Tafsilotlari */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-[4px] bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-medium text-slate-400">Tashkilot</div>
            <div className="font-semibold text-slate-900 text-xs sm:text-sm mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{item.organizationName}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">Kod: {item.organizationCode}</div>
          </div>

          {item.buildingName ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-[4px] bg-slate-50 border border-slate-100">
                <div className="text-[11px] font-medium text-slate-400">Bino / Qavat</div>
                <div className="font-semibold text-slate-900 text-xs sm:text-sm mt-0.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{item.buildingName}</span>
                </div>
                {item.floorName && (
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.floorName}</div>
                )}
              </div>

              <div className="p-3.5 rounded-[4px] bg-slate-50 border border-slate-100">
                <div className="text-[11px] font-medium text-slate-400">Rasmiy Xona</div>
                <div className="font-semibold text-slate-900 text-xs sm:text-sm mt-0.5 flex items-center gap-1.5">
                  <DoorClosed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{item.roomNumber}-xona</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.roomName}</div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[4px] bg-amber-50/70 border border-amber-200/80 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-amber-950">
                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Cheklangan Kirish (Restricted Siyosati)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Tashkilot maxfiylik siyosatiga ko‘ra aniq joylashuv (bino, qavat, xona) va ichki ko‘rsatkichlar faqat tizimga kirgan vakolatli xodimlarga ko‘rsatiladi.
              </p>
              <div className="pt-1">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 underline underline-offset-2"
                >
                  Xodim sifatida tizimga kirish &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Maxfiylik va Himoya Eslatmasi */}
        <div className="p-3 rounded-[4px] bg-blue-50/50 border border-blue-100 flex items-start gap-2 text-xs text-blue-900">
          <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Maxfiylik siyosati:</strong> Tashkilot xavfsizlik sozlamalariga ko‘ra shaxsiy xodim ma’lumotlari, buxgalteriya qiymati va audit jurnallari ommaga oshkor etilmaydi.
          </p>
        </div>
      </main>

      {/* Pastki Footer */}
      <footer className="max-w-md w-full mx-auto text-center pt-6 text-[11px] text-slate-400">
        &copy; 2026 AssetAudit Universal QR Inventarizatsiya Platformasi
      </footer>
    </div>
  );
}
