import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { getOrganizationTypesList } from "@/lib/data/organizations";
import { NewOrganizationForm } from "./organization-form";
import { ArrowLeft, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Yangi tashkilot qo‘shish — AssetAudit Platformasi",
  description: "Platformaga yangi tashkilot yoki muassasani ro‘yxatga olish",
};

export const instant = false;

export default async function NewOrganizationPage() {
  // 1. Faqat Platforma Super Admini ruxsat etilgan (Server-side guard)
  await requirePlatformAdmin();

  // 2. PostgreSQL bazasidan haqiqiy tashkilot turlari klassifikatorini yuklash
  const types = await getOrganizationTypesList();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Non bo'laklari (Breadcrumbs) va Sarlavha */}
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin" className="hover:text-slate-800 transition-colors">
            Boshqaruv
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/admin/organizations" className="hover:text-slate-800 transition-colors">
            Tashkilotlar
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-medium">Yangi tashkilot</span>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/organizations"
            className="p-2 rounded-[3px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
            title="Tashkilotlar ro'yxatiga qaytish"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Yangi tashkilot qo‘shish</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Tizimga yangi universitet, institut, maktab yoki korxonani ro‘yxatga oling.
            </p>
          </div>
        </div>
      </div>

      {/* Interaktiv Forma Komponenti */}
      <NewOrganizationForm types={types} />
    </div>
  );
}
