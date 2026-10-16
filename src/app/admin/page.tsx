import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { getOrganizationsStats } from "@/lib/data/organizations";
import {
  Building2,
  Lock,
  Database,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  Layers,
} from "lucide-react";

export const metadata = {
  title: "Platforma Boshqaruvi — AssetAudit",
  description: "AssetAudit SaaS platformasining boshqaruv paneli (Faqat Super Admin)",
};

export const instant = false;

export default async function AdminPage() {
  const context = await requirePlatformAdmin();
  const { profile, user } = context;

  // Haqiqiy PostgreSQL ma'lumotlar bazasidan statistika
  const stats = await getOrganizationsStats();

  return (
    <div className="space-y-6">
      {/* Xush kelibsiz kartasi */}
      <div className="p-6 sm:p-8 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
              <span className="w-2 h-2 rounded-[2px] bg-emerald-500 animate-pulse" />
              <span>Super Admin Sessiyasi Faol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Xush kelibsiz, {profile.fullName}!
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Siz AssetAudit SaaS platformasining Bosh Administratori sifatida tizimdasiz. Ushbu konsol orqali O‘zbekistondagi universitetlar, maktablar, davlat idoralari va korxonalarni markazlashgan tarzda boshqarish amalga oshiriladi.
            </p>
          </div>

          <div className="p-4 rounded-[4px] bg-slate-50 border border-slate-200/80 shrink-0 text-left sm:text-right">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Administrator
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{profile.fullName}</div>
            <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
          </div>
        </div>
      </div>

      {/* Haqiqiy Statistik Kartalar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Jami tashkilotlar</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">Platformadagi tashkilotlar</div>
        </div>

        <div className="p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Faol tashkilotlar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.active}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Tizimdan foydalanmoqda</div>
        </div>

        <div className="p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Nofaol tashkilotlar</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.inactive}</div>
          <div className="text-[11px] text-slate-500 mt-1">Bloklangan yoki kutilmoqda</div>
        </div>

        <div className="p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tashkilot turlari</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.typesCount} ta</div>
          <div className="text-[11px] text-slate-500 mt-1">OTM, maktab, korxona va h.k.</div>
        </div>
      </div>

      {/* Tezkor O'tish Kartasi (Tashkilotlar Bo'limiga) */}
      <div className="p-6 rounded-[4px] bg-blue-600 text-white shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Tashkilotlar Boshqaruvi Moduli</h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
            Platformaga ulangan tashkilotlar ro‘yxatini ko‘rish, turi bo‘yicha filtrlash, qidirish va holatini tekshirish.
          </p>
        </div>
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[3px] bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <span>Tashkilotlar ro‘yxatiga o‘tish</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Eslatma / Reja banneri */}
      <div className="p-5 rounded-[4px] bg-blue-50/70 border border-blue-200/80 flex items-start gap-3.5 text-blue-900">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-semibold text-blue-950">Xabarnoma: </strong>
          Tashkilotlarni ro‘yxatga olish, yangi tenantlarni akkreditatsiyadan o‘tkazish va audit boshqaruvi to‘liq holatda. Hozirda autentifikatsiya, real ma’lumotlar bazasi integratsiyasi va metadata boshqaruvi faol.
        </div>
      </div>

      {/* Xavfsizlik ko'rsatkichlari kartalari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-[3px] bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Multi-Tenant Izolyatsiyasi
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Qat’iy qoida: Super Admin platformani boshqaradi, ammo tashkilotlarning ichki inventar va auditlariga ruxsatsiz kira olmaydi.
          </p>
          <div className="mt-3 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Qat’iy himoyalangan</span>
          </div>
        </div>

        <div className="p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="w-9 h-9 rounded-[3px] bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            PostgreSQL Klasteri
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            PostgreSQL mustaqil klasteri, Drizzle ORM migratsiyalari va least-privilege rollari to‘liq soz holatda.
          </p>
          <div className="mt-3 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Jadvallar online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
