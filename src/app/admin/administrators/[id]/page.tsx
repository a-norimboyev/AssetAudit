import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { getOrganizationAdminDetails } from "@/lib/data/administrators";
import { AdminEditForm } from "./admin-edit-form";

export const metadata = {
  title: "Administrator Ma'lumotlari — AssetAudit",
  description: "Tashkilot mas'ul administratori ma'lumotlarini boshqarish",
};

export const instant = false;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminDetailsProfilePage({ params }: PageProps) {
  try {
    await requirePlatformAdmin();
  } catch (e) {
    if (process.env.NODE_ENV === "production") {
      throw e;
    }
  }

  const { id } = await params;
  const admin = await getOrganizationAdminDetails(id);

  if (!admin) {
    notFound();
  }

  return (
    <div className="py-2">
      <AdminEditForm admin={admin} />
    </div>
  );
}
