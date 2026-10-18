import Link from "next/link";
import { LogoIcon } from "@/components/ui/logo";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import {
  CheckCircle2,
  AlertTriangle,
  Building2,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Users,
  QrCode,
  Calendar,
  Check,
  X,
  Phone,
  Send,
  Sparkles,
  School,
  Landmark,
  Hospital,
  Briefcase,
} from "lucide-react";

export const metadata = {
  title: "AssetAudit — Inventarlarni Raqamli Hisobga Olish va Mulk Nazorati",
  description:
    "Universitetlar va davlat tashkilotlari uchun QR kod orqali inventarlarni hisobga olish, xonalar bo'yicha tekshirish va joylashuv nomuvofiqliklarini aniqlash platformasi",
};

export default function Home() {
  const settings = getPlatformSettings();
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* 1. YUQORI NAVIGATSIYA HEADER */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logotip */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="text-slate-900 group-hover:text-blue-600 transition-colors">
              <LogoIcon size={38} />
            </div>
            <div>
              <div className="font-bold text-xl sm:text-2xl tracking-tight text-slate-950 flex items-center">
                Asset<span className="text-blue-600">Audit</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider hidden sm:block">
                Mulk Nazorati Platformasi
              </div>
            </div>
          </Link>

          {/* Menyu Bo'limlari */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">
              Imkoniyatlar
            </a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
              Qanday ishlaydi?
            </a>
            <a href="#comparison" className="hover:text-blue-600 transition-colors">
              Taqqoslash
            </a>
            <a href="#audience" className="hover:text-blue-600 transition-colors">
              Kimlar uchun?
            </a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">
              Bog‘lanish
            </a>
          </nav>

          {/* O'ng tomon: Tezkor aloqa va Kirish */}
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href={`tel:${(settings.system.supportPhone || "+998712000000").replace(/[^+\d]/g, "")}`}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>{settings.system.supportPhone || "+998 (71) 200-00-00"}</span>
            </a>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all"
            >
              <span>Tizimga kirish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO BO'LIMI: ASOSIY DARAK VA MAHSULOT PREVIEW */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 bg-linear-to-b from-white via-slate-50/50 to-slate-100/50 border-b border-slate-200/80">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          {/* Markaziy Sarlavha */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 mb-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>O‘zbekistonda birinchi raqamli QR mulk nazorati platformasi</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.15]">
              Tashkilotingiz mulkini <br className="hidden sm:inline" />
              <span className="text-blue-600">100% raqamli nazoratga</span> oling
            </h1>

            <p className="mt-5 text-base sm:text-xl text-slate-600 leading-relaxed font-normal">
              Qog‘oz jadvallar, chalkashliklar va yo‘qolgan mebellardan xalos bo‘ling. QR kodlar va smartfon kamerasi orqali inventarizatsiya muddatini <strong>2 oydan 2 kunga</strong> qisqartiring.
            </p>

            {/* Asosiy Tugmalar */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <a
                href="#contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold shadow-xs hover:shadow-md transition-all"
              >
                <span>Tashkilotni ulash (Ariza)</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm sm:text-base font-semibold shadow-2xs transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Tizimga kirish</span>
              </Link>
            </div>

            {/* 3 ta Ishonch nishonlari */}
            <div className="mt-8 pt-8 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>0.2 soniyada lahzali QR skaner</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Xonalar bo‘yicha nomuvofiqlikni aniqlash</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>1-klikda solishtirma dalolatnoma</span>
              </div>
            </div>
          </div>

          {/* 3. JONLI MAHSULOT INTERFEYSI MAKETI (BROWSER FRAME MOCKUP) */}
          <div className="mt-14 w-full max-w-6xl xl:max-w-7xl mx-auto rounded-xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
            {/* Brauzer Sarlavha Chizig'i */}
            <div className="h-10 px-4 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="px-4 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-slate-500 truncate max-w-xs">
                https://assetaudit.uz/org
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hidden sm:block">
                TATU (Faol)
              </div>
            </div>

            {/* Dashboard Ichki Vizuali */}
            <div className="p-4 sm:p-6 bg-slate-50/70 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-slate-900">
                      Universitet Boshqaruv Paneli
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      TATU
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    2026-yil 1-davr inventarizatsiyasi: binolar, xonalar va joylashuv nazorati
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-2xs self-start">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>2026-yil Bahor Kampaniyasi</span>
                </div>
              </div>

              {/* 4 ta Asosiy KPI Kartalar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Jami Inventarlar
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                    1,420 <span className="text-xs text-slate-400 font-normal">dona</span>
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    100% Ro‘yxatda
                  </span>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    O‘z Joyida Topilgan
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
                    1,120 <span className="text-xs text-slate-400 font-normal">dona</span>
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    78.8% Mos keldi
                  </span>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Boshqa Xonada
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
                    52 <span className="text-xs text-slate-400 font-normal">ta</span>
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    3.7% Nomuvofiq
                  </span>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Hali Aniqlanmagan
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-700 mt-1">
                    248 <span className="text-xs text-slate-400 font-normal">ta</span>
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    17.5% Kutilmoqda
                  </span>
                </div>
              </div>

              {/* Pastki: Binolar progressi va Biznes Qoida */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>Binolar bo‘yicha tekshiruv holati</span>
                    <span className="text-blue-600 font-medium">5 ta bino</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span className="font-semibold">Bosh bino</span>
                        <span className="font-bold">75% yakunlandi</span>
                      </div>
                      <div className="w-full h-2 rounded bg-slate-100 overflow-hidden">
                        <div className="w-3/4 h-full bg-blue-600 rounded" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span className="font-semibold">A-bino (Fakultet)</span>
                        <span className="font-bold">75% yakunlandi</span>
                      </div>
                      <div className="w-full h-2 rounded bg-slate-100 overflow-hidden">
                        <div className="w-3/4 h-full bg-blue-600 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/80 p-4 rounded-lg border border-amber-200/90 text-xs text-amber-950 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Joylashuv nomuvofiqligi qoidasi:</span>
                  </div>
                  <p className="leading-relaxed">
                    131-xonadagi stol 130-xonada topilsa, u 130-xonaga qo‘shilmaydi. Asl xona avtomatik o‘zgarmaydi. Tizim rektoratga rasmiy nomuvofiqlik xabarini beradi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ASOSIY RAQAMLAR VA METRIKALAR (IMPACT NUMBERS) */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200/80">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-5xl font-extrabold text-blue-600 tracking-tight">
                10x
              </div>
              <div className="mt-2 text-xs sm:text-sm font-semibold text-slate-900">
                Inventarizatsiya tezlashishi
              </div>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                2 oylik tekshiruv 2–3 kunda yakunlanadi
              </p>
            </div>

            <div className="p-4">
              <div className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                0.2 sek
              </div>
              <div className="mt-2 text-xs sm:text-sm font-semibold text-slate-900">
                Kamera orqali QR o‘qish
              </div>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                Qo‘shimcha qimmat uskunasiz, oddiy smartfonda
              </p>
            </div>

            <div className="p-4">
              <div className="text-3xl sm:text-5xl font-extrabold text-emerald-600 tracking-tight">
                100%
              </div>
              <div className="mt-2 text-xs sm:text-sm font-semibold text-slate-900">
                Adashgan mulkni aniqlash
              </div>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                Boshqa xonaga o‘tgan barcha buyumlar fiksatsiyasi
              </p>
            </div>

            <div className="p-4">
              <div className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                0 dona
              </div>
              <div className="mt-2 text-xs sm:text-sm font-semibold text-slate-900">
                Qog‘oz sarfi va xatolik
              </div>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                To‘liq elektron dalolatnoma va 1C integratsiya
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TAQQOSLASH JADVALI (OLDIN vs ASSETAUDIT) */}
      <section id="comparison" className="py-16 sm:py-24 bg-slate-50/60 border-b border-slate-200/80">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Taqqoslash
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-bold text-slate-950 tracking-tight">
              Eski an’anaviy usuldan nima farqi bor?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Qog‘oz daftarlar va qotib qolgan Excel jadvallari bilan zamonaviy avtomatlashtirilgan tizim o‘rtasidagi farq
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {/* Eski Usul */}
              <div className="p-6 sm:p-8 bg-rose-50/20 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-rose-100">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                    <X className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Eski usul (Qog‘oz va Excel)
                    </h3>
                    <div className="text-[11px] text-rose-600 font-semibold">Sekin va noaniq</div>
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Inventarizatsiya 1–2 oy vaqt oladi, xodimlar asosiy ishidan chalg‘iydi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Stol boshqa xonaga o‘tib ketsa, uni topish yoki solishtirish imkonsiz.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Qog‘oz dalolatnomalarda insoniy xatolar va tushunarsiz raqamlar ko‘p.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Har bir inventarning haqiqiy mas’uli va holatini tekshirish qiyin.</span>
                  </li>
                </ul>
              </div>

              {/* AssetAudit Bilan */}
              <div className="p-6 sm:p-8 bg-emerald-50/20 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-emerald-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      AssetAudit Platformasi
                    </h3>
                    <div className="text-[11px] text-emerald-600 font-semibold">100% Avtomatlashgan</div>
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Butun bino va xonalar <strong>2–3 kunda</strong> telefon kamerasi bilan tekshiriladi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Mulk boshqa xonada topilsa, tizim bir zumda <strong>«Nomuvofiqlik»</strong> signali beradi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Buxgalteriya va rektorat uchun rasmiy solishtirma dalolatnoma <strong>1 soniyada</strong> tayyor.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Har bir inventarning unikal QR stikeri va ommaviy raqamli pasporti mavjud.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. QANDAY ISHLAYDI? (3 TA ODDIY QADAM) */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Jarayon
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-bold text-slate-950 tracking-tight">
              Tizim qanday ishlaydi?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Murakkab o‘rnatishlarsiz, 3 ta oddiy qadamda to‘liq nazorat o‘rnatiladi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* 1-qadam */}
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all shadow-xs relative">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-xs">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Baza yuklash va QR stikerlar
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Mavjud inventarlarni Excel yoki 1C fayl orqali bazaga kiritasiz. Tizim avtomatik A4 yoki termo-printerga mos QR stikerlarni chop etishga tayyorlab beradi.
              </p>
            </div>

            {/* 2-qadam */}
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all shadow-xs relative">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-xs">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Smartfonda xonama-xona skaner
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Auditor xonaga kirib, telefon kamerasi bilan buyumlardagi QR kodni 0.2 soniyada skanerlaydi. Tizim avtomatik ravishda buyum o‘z xonasidami yoki yo‘qligini tekshiradi.
              </p>
            </div>

            {/* 3-qadam */}
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all shadow-xs relative">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base mb-4 shadow-xs">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Avtomatik dalolatnoma va hisobot
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tekshiruv yakunlanishi bilan rahbariyat va buxgalteriya uchun solishtirma dalolatnomalar, kamomad va adashgan jihozlar bo‘yicha rasmiy hisobot 1-klikda shakllanadi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. IMKONIYATLAR RO'YXATI (FEATURES GRID) */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50/60 border-b border-slate-200/80">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Funksiyalar
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-bold text-slate-950 tracking-tight">
              Platformaning barcha imkoniyatlari
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Yirik tashkilotlar va oliy o‘quv yurtlari talablariga mos maxsus Enterprise SaaS arxitekturasi
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Bino va xonalar xaritasi
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Har bir kampus, korpus, qavat va auditoriyaning raqamli pasporti va unga biriktirilgan buyumlar ro‘yxati.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Raqamli QR Pasport
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Har bir parta, kompyuter yoki laboratoriya jihozining unikal QR kodi, rasmi va ekspluatatsiya tarixi.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Nomuvofiqliklar nazorati
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Noqonuniy ko‘chirilgan jihozlar bo‘yicha avtomatik xabarnoma va rasmiy akt shakllantirish.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Moddiy javobgarlar hisobi
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Xonadagi mulk uchun qaysi o‘qituvchi, dekanat xodimi yoki omborchi javobgarligi to‘liq ko‘rsatiladi.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Excel va 1C integratsiyasi
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Barcha hisobotlar, dalolatnomalar va inventar ro‘yxatlarini 1-klikda Excel/CSV formatida yuklab olish.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Multi-Tenant xavfsizlik
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Har bir universitet yoki tashkilot ma’lumotlari alohida izolyatsiyalangan va shifrlangan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. KIMLAR UCHUN MO'LJALLANGAN? (SEKTORLAR) */}
      <section id="audience" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Sohalar
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-bold text-slate-950 tracking-tight">
              Platforma kimlar uchun mo‘ljallangan?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Katta hajmdagi mulk va binolarga ega barcha davlat va xususiy sektorlar uchun
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <School className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Universitet va Institutlar</h3>
              <p className="text-[11px] text-slate-500">TATU, O‘zMU, filiallar va o‘quv korpuslari</p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Davlat Tashkilotlari</h3>
              <p className="text-[11px] text-slate-500">Vazirliklar, qo‘mita va hokimiyat idoralari</p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Hospital className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Tibbiyot Markazlari</h3>
              <p className="text-[11px] text-slate-500">Shifoxonalar, klinikalar va tibbiyot omborlari</p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Yirik Korxonalar</h3>
              <p className="text-[11px] text-slate-500">Banklar, logistika va ishlab chiqarish kompaniyalari</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. ARIZA QOLDIRISH VA ALOQA BO'LIMI (LEAD GENERATION FORM) */}
      <section id="contact" className="py-16 sm:py-24 bg-slate-900 text-white relative">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Chap Qism: Axborot */}
            <div className="space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-800">
                Hamkorlik
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Tashkilotingizni tizimga ulamoqchimisiz?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Ma’lumotlaringizni qoldiring — mutaxassisimiz siz bilan 15 daqiqada bog‘lanib, platforma imkoniyatlarini bepul ko‘rsatadi va tashkilotingiz uchun hisoblab beradi.
              </p>

              <div className="space-y-3 pt-3 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Telefon:</div>
                    <a href={`tel:${(settings.system.supportPhone || "+998712000000").replace(/[^+\d]/g, "")}`} className="font-semibold text-white hover:underline">
                      {settings.system.supportPhone || "+998 (71) 200-00-00"}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Telegram rasmiy kanal / bot:</div>
                    <span className="font-semibold text-white">
                      {settings.integrations.telegramBotUsername
                        ? (settings.integrations.telegramBotUsername.startsWith("@")
                            ? settings.integrations.telegramBotUsername
                            : `@${settings.integrations.telegramBotUsername}`)
                        : "@AssetAuditUz"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Xavfsizlik:</div>
                    <span className="font-medium text-slate-200">Rasmiy shartnoma va to‘liq maxfiylik kafolati</span>
                  </div>
                </div>
              </div>
            </div>

            {/* O'ng Qism: Ariza Formasi */}
            <div className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 shadow-2xl">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-1">
                Bepul Maslahat Olish
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Mutaxassisimiz sizga to‘liq tushuntirib beradi
              </p>

              <form
                action="javascript:void(0);"
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ism-familiyangiz
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Otabek Aliyev"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Telefon raqamingiz
                  </label>
                  <input
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tashkilot yoki universitet nomi
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: TATU, Samarqand Davlat Universiteti..."
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                >
                  <span>Arizani Yuborish</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-normal">
                  Ma’lumotlaringiz xavfsizligi kafolatlanadi.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 10. PASTKI FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="text-slate-800">
              <LogoIcon size={24} />
            </div>
            <span className="font-bold text-slate-800">
              Asset<span className="text-blue-600">Audit</span>
            </span>
            <span>&bull; &copy; 2026 Barcha huquqlar himoyalangan.</span>
          </div>

          <div className="flex items-center gap-5 text-slate-500">
            <Link href="/login" className="hover:text-blue-600 font-semibold transition-colors">
              Tizimga kirish
            </Link>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
              Qo‘llanma
            </a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">
              Aloqa
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
