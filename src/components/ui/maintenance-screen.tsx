import Link from "next/link";
import { Wrench, ArrowRight, ShieldAlert } from "lucide-react";
import { Logo } from "./logo";

interface MaintenanceScreenProps {
  message?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export function MaintenanceScreen({
  message,
  supportEmail = "support@assetaudit.uz",
  supportPhone = "+998 (71) 200-00-00",
}: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between items-center p-6 sm:p-8">
      <header className="max-w-md w-full flex items-center justify-between">
        <Logo href="/" size="sm" />
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Wrench className="w-3.5 h-3.5 text-amber-600" />
          <span>Texnik Tanaffus</span>
        </span>
      </header>

      <main className="max-w-lg w-full bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-center shadow-xs space-y-6 my-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
          <Wrench className="w-8 h-8 text-amber-600 animate-pulse" />
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Rejaviy Texnik Profilaktika
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            {message ||
              "Hozirda platformada rejaviy texnik ishlar olib borilmoqda. Tizim tez orada to'liq qayta ishga tushiriladi."}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-1.5 text-xs text-slate-600">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <span>Texnik yordam xizmati:</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Telefon: <span className="font-mono font-medium text-slate-700">{supportPhone}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Email: <span className="font-mono font-medium text-slate-700">{supportEmail}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
          >
            <span>Super Admin Boshqaruvi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <footer className="max-w-md w-full text-center text-[11px] text-slate-400">
        &copy; {new Date().getFullYear()} AssetAudit Universal QR Inventarizatsiya Platformasi
      </footer>
    </div>
  );
}
