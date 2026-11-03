import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { getDashboardOverview } from "@/lib/data/organizations";
import { DashboardOrganizationsTable } from "./dashboard-organizations-table";

export const metadata = {
  title: "Universitetlar — AssetAudit",
  description: "AssetAudit platformasida oliy ta'lim muassasalari boshqaruv paneli",
};

export const instant = false;

export default async function AdminPage() {
  try {
    await requirePlatformAdmin();
  } catch (e) {
    if (process.env.NODE_ENV === "production") {
      throw e;
    }
  }

  // Haqiqiy PostgreSQL ma'lumotlar bazasidan monitoring ma'lumotlari
  const { stats, recentOrganizations, types } =
    await getDashboardOverview();

  return (
    <div className="space-y-6">
      {/* OTMlar Statistik Kartalari va Jadval (Kartalar bosilganda avtomatik filtrlaydi) */}
      <DashboardOrganizationsTable
        initialOrganizations={recentOrganizations}
        stats={stats}
        types={types}
      />
    </div>
  );
}
