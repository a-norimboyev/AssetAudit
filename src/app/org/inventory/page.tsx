import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/authorization";
import { getInventoryList, getInventoryStats, getItemCategoriesList } from "@/lib/data/inventory";
import { getBuildingsList } from "@/lib/data/locations";
import { InventoryFilters } from "./inventory-filters";
import { ExportInventoryButtons } from "./export-inventory-buttons";
import {
  QrCode,
  Plus,
  Printer,
  FileSpreadsheet,
  Building,
  DoorClosed,
  CheckCircle2,
  AlertCircle,
  Wrench,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Tag,
} from "lucide-react";

export const metadata = {
  title: "Inventarlar — AssetAudit",
  description: "Tashkilotning barcha QR kodli inventarlari va asosiy vositalari",
};

export const instant = false;

interface PageProps {
  searchParams: Promise<{
    categoryId?: string;
    buildingId?: string;
    roomId?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: "Faol", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  repair: { label: "Ta’mirda", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Wrench },
  written_off: { label: "Hisobdan chiqarilgan", color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
  transferred: { label: "Ko‘chirilgan", color: "bg-blue-50 text-blue-700 border-blue-200", icon: AlertCircle },
  lost: { label: "Yo‘qolgan", color: "bg-slate-100 text-slate-700 border-slate-300", icon: AlertCircle },
};

const CONDITION_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "Yangi", color: "text-emerald-700" },
  good: { label: "Yaxshi", color: "text-blue-700" },
  fair: { label: "Qoniqarli", color: "text-amber-700" },
  poor: { label: "Eskirgan", color: "text-orange-700" },
  broken: { label: "Nosoz", color: "text-rose-700" },
};

export default async function OrgInventoryPage({ searchParams }: PageProps) {
  const { profile, organization } = await requireAuthenticatedUser();

  if (!organization || (profile.role !== "organization_admin" && profile.role !== "registrar")) {
    redirect("/org");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const categoryId = params.categoryId || "all";
  const buildingId = params.buildingId || "all";
  const roomId = params.roomId || "all";
  const status = params.status || "all";
  const search = params.q?.trim() || "";

  const [stats, categories, buildingsRes, inventoryRes] = await Promise.all([
    getInventoryStats(organization.id),
    getItemCategoriesList(),
    getBuildingsList({ organizationId: organization.id, pageSize: 100 }),
    getInventoryList({
      organizationId: organization.id,
      categoryId,
      buildingId,
      roomId,
      status,
      search,
      page,
      pageSize: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Sarlavha va Harakat tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Inventarlar Ro‘yxati
            </h1>
            <span className="px-2.5 py-0.5 rounded-[3px] text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {inventoryRes.totalCount} ta inventar
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {organization.name} tashkilotining QR kod bilan markirovkalangan asosiy vositalari
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/org/inventory/print-labels"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>QR chop etish</span>
          </Link>
          <ExportInventoryButtons
            filters={{
              categoryId: categoryId === "all" ? undefined : categoryId,
              buildingId: buildingId === "all" ? undefined : buildingId,
              roomId: roomId === "all" ? undefined : roomId,
              status: status === "all" ? undefined : status,
              search: search || undefined,
            }}
          />
          <Link
            href="/org/inventory/import"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV Import</span>
          </Link>
          <Link
            href="/org/inventory/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi inventar qo‘shish</span>
          </Link>
        </div>
      </div>

      {/* KPI Kartalari */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Jami inventarlar</span>
            <QrCode className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.totalItems} <span className="text-xs font-normal text-slate-400">dona</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Bazada mavjud</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Faol vositalar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.activeItems}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Foydalanishda</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ta’mirda</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.repairItems}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Nosoz yoki profilaktikada</div>
        </div>

        <div className="p-4 sm:p-5 rounded-[4px] bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Hisobdan chiqarilgan</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {stats.writtenOffItems}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Akt qilingan</div>
        </div>
      </div>

      {/* Interaktiv Qidiruv, Filterlar va Eksport Paneli */}
      <InventoryFilters
        categories={categories}
        buildings={buildingsRes.items.map((b) => ({ id: b.id, name: b.name, code: b.code }))}
        currentCategoryId={categoryId}
        currentBuildingId={buildingId}
        currentStatus={status}
        currentSearch={search}
      />

      {/* Inventarlar Jadvali */}
      <div className="bg-white rounded-[4px] border border-slate-200/80 shadow-xs overflow-hidden">
        {inventoryRes.items.length === 0 ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-[4px] bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {search ? "Mos inventarlar topilmadi" : "Hozircha inventarlar kiritilmagan"}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
              {search
                ? `"${search}" qidiruv so‘rovi bo‘yicha inventar topilmadi.`
                : "Tashkilot mulklarini markirovkalash va audit o‘tkazish uchun yangi inventar qo‘shing."}
            </p>
            <div className="mt-5">
              <Link
                href="/org/inventory/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi inventar qo‘shish</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Inventar raqami & QR</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Nomi & Toifasi</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Rasmiy joylashuv</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Holati</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Sifati</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6 text-right">Batafsil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-normal">
                {inventoryRes.items.map((item) => {
                  const statusMeta = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
                  const condMeta = CONDITION_CONFIG[item.condition] || CONDITION_CONFIG.good;
                  const StatusIcon = statusMeta.icon;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-[3px] bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <QrCode className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-900">{item.inventoryNumber}</span>
                            <div className="text-[10px] text-slate-500 font-mono">Token: {item.qrToken.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{item.categoryName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 sm:px-6 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.buildingName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <DoorClosed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.roomNumber} ({item.roomName})</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[11px] font-semibold border ${statusMeta.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusMeta.label}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 sm:px-6">
                        <span className={`text-xs font-semibold ${condMeta.color}`}>
                          {condMeta.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 sm:px-6 text-right">
                        <Link
                          href={`/org/inventory/${item.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>QR / Tafsilot</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginatsiya */}
        {inventoryRes.totalPages > 1 && (() => {
          const getPageHref = (targetPage: number) => {
            const sp = new URLSearchParams();
            if (categoryId && categoryId !== "all") sp.set("categoryId", categoryId);
            if (buildingId && buildingId !== "all") sp.set("buildingId", buildingId);
            if (roomId && roomId !== "all") sp.set("roomId", roomId);
            if (status && status !== "all") sp.set("status", status);
            if (search) sp.set("q", search);
            sp.set("page", targetPage.toString());
            return `/org/inventory?${sp.toString()}`;
          };

          return (
            <div className="border-t border-slate-200/80 px-4 py-3 sm:px-6 flex items-center justify-between bg-slate-50/50">
              <div className="text-xs text-slate-500">
                Jami <strong>{inventoryRes.totalCount}</strong> tadan{" "}
                <strong>{(page - 1) * inventoryRes.pageSize + 1}</strong> -{" "}
                <strong>{Math.min(page * inventoryRes.pageSize, inventoryRes.totalCount)}</strong> ko‘rsatilmoqda
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={page > 1 ? getPageHref(page - 1) : "#"}
                  className={`p-1.5 rounded-[3px] border border-slate-200 ${
                    page > 1 ? "bg-white text-slate-700 hover:bg-slate-100" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <span className="text-xs font-medium text-slate-600">
                  {page} / {inventoryRes.totalPages}
                </span>
                <Link
                  href={page < inventoryRes.totalPages ? getPageHref(page + 1) : "#"}
                  className={`p-1.5 rounded-[3px] border border-slate-200 ${
                    page < inventoryRes.totalPages ? "bg-white text-slate-700 hover:bg-slate-100" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
