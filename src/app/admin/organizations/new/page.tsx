import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { getOrganizationTypesList } from "@/lib/data/organizations";
import { NewOrganizationForm } from "./organization-form";

export const metadata = {
  title: "Yangi OTM qo‘shish — AssetAudit",
  description: "Platformaga yangi universitet yoki institutni ro‘yxatga olish",
};

export const instant = false;

export default async function NewOrganizationPage() {
  // 1. Faqat Platforma Super Admini ruxsat etilgan (Server-side guard)
  try {
    await requirePlatformAdmin();
  } catch (e) {
    if (process.env.NODE_ENV === "production") {
      throw e;
    }
  }

  // 2. PostgreSQL bazasidan haqiqiy tashkilot turlari klassifikatorini yuklash
  const types = await getOrganizationTypesList();

  return (
    <div className="space-y-6">
      {/* Interaktiv Forma Komponenti */}
      <NewOrganizationForm types={types} />
    </div>
  );
}
