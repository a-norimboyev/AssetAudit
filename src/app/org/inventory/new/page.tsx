import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { canCreateNewItem } from "@/lib/auth/authorization-rules";
import { getItemCategoriesList } from "@/lib/data/inventory";
import { getBuildingsList, getFloorsList, getRoomsList } from "@/lib/data/locations";
import { NewItemForm } from "./item-form";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Yangi Inventar — AssetAudit",
  description: "Yangi mulkni rasmiy ro‘yxatga olish va QR kod biriktirish",
};

export const instant = false;

export default async function NewInventoryPage() {
  const { profile, organization } = await requireAuthenticatedUser({ allowMustChangePassword: true });

  if (!organization || !canCreateNewItem(profile.role)) {
    redirect("/org");
  }

  const [categories, buildingsRes, floors, roomsRes] = await Promise.all([
    getItemCategoriesList(),
    getBuildingsList({ organizationId: organization.id, pageSize: 100 }),
    getFloorsList({ organizationId: organization.id }),
    getRoomsList({ organizationId: organization.id, pageSize: 200 }),
  ]);

  const buildingOptions = buildingsRes.items.map((b) => ({
    id: b.id,
    name: b.name,
    code: b.code,
  }));

  const floorOptions = floors.map((f) => ({
    id: f.id,
    buildingId: f.buildingId,
    floorNumber: f.floorNumber,
    name: f.name,
  }));

  const roomOptions = roomsRes.items.map((r) => ({
    id: r.id,
    buildingId: r.buildingId,
    floorId: r.floorId,
    roomNumber: r.roomNumber,
    name: r.name,
  }));

  const settings = (organization.settings as { inventoryPrefix?: string }) || {};
  const defaultPrefix = settings.inventoryPrefix || `${organization.code}-`;

  return (
    <div className="w-full space-y-6">
      {/* Orqaga qaytish havolasi va Sarlavha */}
      <div>
        <Link
          href="/org/inventory"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Inventarlar ro‘yxatiga qaytish</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Yangi Inventar Qo‘shish
        </h1>
      </div>

      <NewItemForm
        buildings={buildingOptions}
        floors={floorOptions}
        rooms={roomOptions}
        categories={categories}
        defaultPrefix={defaultPrefix}
      />
    </div>
  );
}
