import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganizationAdmin } from "@/lib/auth/authorization";
import { getItemById, getItemCategoriesList } from "@/lib/data/inventory";
import { getBuildingsList, getFloorsList, getRoomsList } from "@/lib/data/locations";
import { generateQrDataUrl, getPublicQrUrl } from "@/lib/qr";
import { QrPrintCard } from "./qr-print-card";
import { RelocateForm } from "./relocate-form";
import { EditItemModal } from "./edit-item-modal";
import { ItemPhotoManager } from "./item-photo-manager";
import {
  ArrowLeft,
  DoorClosed,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  XCircle,
  AlertCircle,
  Lock,
} from "lucide-react";

export const metadata = {
  title: "Inventar Tafsiloti va QR Yorliq — AssetAudit",
  description: "Asosiy vositaning rasmiy pasporti va bosma QR yorlig‘i",
};

export const instant = false;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: "Faol", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  repair: { label: "Ta’mirda", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Wrench },
  written_off: { label: "Hisobdan chiqarilgan", color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
  transferred: { label: "Ko‘chirilgan", color: "bg-blue-50 text-blue-700 border-blue-200", icon: AlertCircle },
  lost: { label: "Yo‘qolgan", color: "bg-slate-100 text-slate-700 border-slate-300", icon: AlertCircle },
};

export default async function ItemDetailPage({ params }: PageProps) {
  const { organization, profile } = await requireOrganizationAdmin();
  const { id } = await params;

  const [item, buildingsRes, floors, roomsRes, categories] = await Promise.all([
    getItemById({ organizationId: organization.id, itemId: id }),
    getBuildingsList({ organizationId: organization.id, pageSize: 100 }),
    getFloorsList({ organizationId: organization.id }),
    getRoomsList({ organizationId: organization.id, pageSize: 200 }),
    getItemCategoriesList(),
  ]);

  if (!item) {
    notFound();
  }

  const qrDataUrl = await generateQrDataUrl(item.qrToken);
  const publicUrl = getPublicQrUrl(item.qrToken);

  const statusMeta = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
  const StatusIcon = statusMeta.icon;

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

  return (
    <div className="space-y-6">
      {/* Orqaga qaytish havolasi */}
      <div>
        <Link
          href="/org/inventory"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Inventarlar ro‘yxatiga qaytish</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {item.name}
              </h1>
              <span className="font-mono font-bold text-xs bg-slate-900 text-white px-3 py-1 rounded-lg">
                {item.inventoryNumber}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusMeta.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusMeta.label}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <EditItemModal
              item={{
                id: item.id,
                inventoryNumber: item.inventoryNumber,
                name: item.name,
                description: item.description,
                categoryId: item.categoryId,
                status: item.status,
                condition: item.condition,
                price: item.price,
              }}
              categories={categories}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chap ustun: QR Yorliq, Bosma Funksiyalari va Rasm Boshqaruvi */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Rasmiy Bosma QR Yorliq
              </h3>
            </div>

            <QrPrintCard
              itemName={item.name}
              inventoryNumber={item.inventoryNumber}
              organizationName={organization.name}
              organizationCode={organization.code}
              buildingName={item.buildingName}
              roomNumber={item.roomNumber}
              qrDataUrl={qrDataUrl}
              publicUrl={publicUrl}
            />
          </div>

          {/* Fotosurat yuklash va boshqarish (Sprint 14D) */}
          <ItemPhotoManager
            itemId={item.id}
            currentPhotoUrl={item.photoUrl ? `/api/media/items/${item.id}/photo` : null}
            itemName={item.name}
          />
        </div>

        {/* O'ng ustun: Joylashuv, Ko'chirish va Metama'lumotlar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rasmiy Joylashuv Tafsilotlari */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <DoorClosed className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Rasmiy Biriktirilgan Joylashuv
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-medium">Bino</span>
                <div className="font-semibold text-slate-900 mt-1 text-sm">
                  {item.buildingName}
                </div>
                <span className="text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200 inline-block mt-1">
                  {item.buildingCode}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-medium">Qavat</span>
                <div className="font-semibold text-slate-900 mt-1 text-sm">
                  {item.floorName}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-medium">Xona</span>
                <div className="font-semibold text-slate-900 mt-1 text-sm">
                  {item.roomNumber} — {item.roomName}
                </div>
              </div>
            </div>

            {/* Joylashuvni ko'chirish formasi */}
            {profile.role === "organization_admin" ? (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 mb-1.5">
                  Rasmiy Joylashuvni Ko‘chirish (Relocation)
                </h4>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Agar ushbu mulk boshqa xonaga doimiy ko‘chirilgan bo‘lsa, yangi xonani tanlang.
                </p>
                <RelocateForm
                  itemId={item.id}
                  currentBuildingId={item.buildingId}
                  currentFloorId={item.floorId}
                  currentRoomId={item.roomId}
                  buildings={buildingOptions}
                  floors={floorOptions}
                  rooms={roomOptions}
                />
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs text-slate-500">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Rasmiy joylashuvni o‘zgartirish faqat Tashkilot Administratori vakolatiga kiradi.
                </span>
              </div>
            )}
          </div>

          {/* Texnik Pasport va Parametrlar */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Inventar Texnik Pasporti
              </h3>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-slate-500">Toifasi</dt>
                <dd className="font-semibold text-slate-900 mt-1">{item.categoryName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Sifat darajasi</dt>
                <dd className="font-semibold text-slate-900 mt-1 capitalize">{item.condition}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Baza ID</dt>
                <dd className="font-mono text-[11px] text-slate-600 mt-1 truncate">{item.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500">QR Token</dt>
                <dd className="font-mono text-[11px] text-blue-600 mt-1 truncate">{item.qrToken}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Ro‘yxatga olingan sana</dt>
                <dd className="font-medium text-slate-900 mt-1">
                  {new Date(item.createdAt).toLocaleDateString("uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Moddiy javobgar shaxs</dt>
                <dd className="font-medium text-slate-900 mt-1">
                  {item.responsiblePersonName || "Biriktirilmagan"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
