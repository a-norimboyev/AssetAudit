import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between">
      {/* Yuqori navigatsiya chizig'i */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[4px] bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
              A
            </div>
            <span className="font-semibold text-xl tracking-tight text-slate-900">
              AssetAudit
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-[3px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
            >
              Kirish
            </Link>
            <Link
              href="/preview/dashboard"
              className="text-xs font-medium text-slate-600 hover:text-blue-600 hidden sm:inline-flex transition-colors"
            >
              Demo &rarr;
            </Link>
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-[3px] text-[11px] sm:text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>v1.0 Production</span>
            </span>
          </div>
        </div>
      </header>

      {/* Asosiy qism */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[3px] text-xs font-medium bg-blue-50 text-blue-700 mb-6 border border-blue-200">
          Raqamli aktivlar va mulk nazorati platformasi
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 max-w-2xl">
          Asset<span className="text-blue-600">Audit</span>
        </h1>

        <p className="mt-4 text-xl sm:text-2xl font-medium text-slate-700 max-w-2xl leading-relaxed">
          Inventarlarni raqamli hisobga olish va nazorat qilish platformasi
        </p>

        <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl leading-relaxed">
          Universitetlar va tashkilotlar uchun QR kod orqali inventarlarni hisobga olish, xonalar bo‘yicha tekshirish va joylashuv nomuvofiqliklarini aniqlash tizimi.
        </p>

        {/* Dashboard Demoga o'tish tugmasi */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/preview/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <span>Interaktiv Demoni ko‘rish</span>
            <span className="text-xs bg-blue-500/50 px-2 py-0.5 rounded-[3px] font-normal">
              Demo
            </span>
          </Link>
        </div>

        {/* Asosiy vazifalar kartalari */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
          <div className="p-6 rounded-[4px] border border-slate-200 bg-white shadow-xs">
            <div className="w-8 h-8 rounded-[3px] bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-sm mb-3 border border-blue-100">
              01
            </div>
            <h2 className="font-semibold text-slate-900 text-base mb-1.5">
              QR Identifikatsiya
            </h2>
            <p className="text-sm text-slate-500 leading-normal">
              Har bir inventar uchun unikal QR kod yaratish va xavfsiz ommaviy ko‘rish.
            </p>
          </div>

          <div className="p-6 rounded-[4px] border border-slate-200 bg-white shadow-xs">
            <div className="w-8 h-8 rounded-[3px] bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-sm mb-3 border border-blue-100">
              02
            </div>
            <h2 className="font-semibold text-slate-900 text-base mb-1.5">
              Xona bo‘yicha nazorat
            </h2>
            <p className="text-sm text-slate-500 leading-normal">
              Bino va xonalar bo‘yicha tekshiruv o‘tkazish hamda begona buyumlarni aniqlash.
            </p>
          </div>

          <div className="p-6 rounded-[4px] border border-slate-200 bg-white shadow-xs">
            <div className="w-8 h-8 rounded-[3px] bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-sm mb-3 border border-blue-100">
              03
            </div>
            <h2 className="font-semibold text-slate-900 text-base mb-1.5">
              Aniq audit hisoboti
            </h2>
            <p className="text-sm text-slate-500 leading-normal">
              Haqiqiy ma’lumotlar bazasi ko‘rsatkichlari asosida shaffof hisobotlar.
            </p>
          </div>
        </div>
      </main>

      {/* Pastki qism */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          &copy; 2026 AssetAudit. Barcha huquqlar himoyalangan.
        </div>
      </footer>
    </div>
  );
}

