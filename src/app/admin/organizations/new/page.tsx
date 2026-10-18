import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { getOrganizationTypesList } from "@/lib/data/organizations";
import { NewOrganizationForm } from "./organization-form";

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
    <div className="space-y-6">
      {/* Interaktiv Forma Komponenti */}
      <NewOrganizationForm types={types} />
    </div>
  );
}
