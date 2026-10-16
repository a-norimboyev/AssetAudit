import "server-only";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema/inventory";
import { buildings, floors, rooms } from "@/lib/db/schema/locations";
import { profiles } from "@/lib/db/schema/profiles";
import { inventoryCycles, scanEvents } from "@/lib/db/schema/audit";
import { and, eq, desc, inArray, sql } from "drizzle-orm";

export interface DashboardData {
  stats: {
    totalItems: number;
    activeItems: number;
    repairItems: number;
    writtenOffItems: number;
    totalValue: number;
    buildingsCount: number;
    floorsCount: number;
    roomsCount: number;
    activeStaffCount: number;
    activeCyclesCount: number;
    verifiedItemsCount: number;
    unverifiedItemsCount: number;
    conflictsCount: number;
    progressPercent: number;
  };
  buildingDistribution: Array<{
    id: string;
    name: string;
    code: string;
    itemsCount: number;
    roomsCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: "scan" | "item" | "cycle";
    title: string;
    subtitle: string;
    timestamp: Date;
    statusBadge?: { label: string; variant: "success" | "warning" | "danger" | "info" };
  }>;
}

/**
 * Tashkilot Boshqaruv Paneli (Dashboard) uchun barcha real ko'rsatkichlarni olish
 * QAT'IY QOIDA: Barcha so'rovlar faqat berilgan organizationId bilan izolyatsiyalangan.
 */
export async function getOrgDashboardData(organizationId: string): Promise<DashboardData> {
  // 1. Inventarlar umumiy statistikasi
  const [invStatsRes] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${items.status} = 'active')::int`,
      repair: sql<number>`count(*) filter (where ${items.status} = 'repair')::int`,
      writtenOff: sql<number>`count(*) filter (where ${items.status} = 'written_off')::int`,
      totalValue: sql<number>`coalesce(sum(${items.price}::numeric), 0)::float`,
    })
    .from(items)
    .where(eq(items.organizationId, organizationId));

  const totalItems = invStatsRes?.total ?? 0;
  const activeItems = invStatsRes?.active ?? 0;
  const repairItems = invStatsRes?.repair ?? 0;
  const writtenOffItems = invStatsRes?.writtenOff ?? 0;
  const totalValue = invStatsRes?.totalValue ?? 0;

  // 2. Lokatsiya ko'rsatkichlari (Binolar, Qavatlar, Xonalar)
  const [bRes, fRes, rRes] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(buildings)
      .where(and(eq(buildings.organizationId, organizationId), eq(buildings.isActive, true))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(floors)
      .where(eq(floors.organizationId, organizationId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(rooms)
      .where(and(eq(rooms.organizationId, organizationId), eq(rooms.isActive, true))),
  ]);

  const buildingsCount = bRes[0]?.count ?? 0;
  const floorsCount = fRes[0]?.count ?? 0;
  const roomsCount = rRes[0]?.count ?? 0;

  // 3. Mas'ul xodimlar soni (Inspector va Registrar)
  const [staffRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profiles)
    .where(
      and(
        eq(profiles.organizationId, organizationId),
        eq(profiles.isActive, true),
        inArray(profiles.role, ["inspector", "registrar"])
      )
    );
  const activeStaffCount = staffRes?.count ?? 0;

  // 4. Audit sikllari va progress
  const [cycleStatsRes] = await db
    .select({
      activeCount: sql<number>`count(*) filter (where ${inventoryCycles.status} = 'in_progress')::int`,
      totalCount: sql<number>`count(*)::int`,
    })
    .from(inventoryCycles)
    .where(eq(inventoryCycles.organizationId, organizationId));

  const activeCyclesCount = cycleStatsRes?.activeCount ?? 0;

  // Eng so'nggi faol yoki yakunlangan sikl
  const [latestCycle] = await db
    .select({ id: inventoryCycles.id, title: inventoryCycles.title, status: inventoryCycles.status })
    .from(inventoryCycles)
    .where(eq(inventoryCycles.organizationId, organizationId))
    .orderBy(desc(inventoryCycles.createdAt))
    .limit(1);

  let verifiedItemsCount = 0;
  let conflictsCount = 0;
  let unverifiedItemsCount = totalItems;
  let progressPercent = 0;

  if (latestCycle) {
    const [scans] = await db
      .select({
        matched: sql<number>`count(*) filter (where ${scanEvents.isMatch} = true)::int`,
        conflict: sql<number>`count(*) filter (where ${scanEvents.isConflict} = true)::int`,
        totalScanned: sql<number>`count(distinct ${scanEvents.itemId})::int`,
      })
      .from(scanEvents)
      .where(and(eq(scanEvents.organizationId, organizationId), eq(scanEvents.cycleId, latestCycle.id)));

    verifiedItemsCount = scans?.matched ?? 0;
    conflictsCount = scans?.conflict ?? 0;
    const scannedUnique = scans?.totalScanned ?? 0;
    unverifiedItemsCount = Math.max(0, totalItems - scannedUnique);
    progressPercent = totalItems > 0 ? Math.min(100, Math.round((scannedUnique / totalItems) * 100)) : 0;
  }

  // 5. Binolar bo'yicha inventar taqsimoti
  const buildingDistributionRows = await db
    .select({
      id: buildings.id,
      name: buildings.name,
      code: buildings.code,
      itemsCount: sql<number>`coalesce(count(distinct ${items.id}), 0)::int`,
      roomsCount: sql<number>`coalesce(count(distinct ${rooms.id}), 0)::int`,
    })
    .from(buildings)
    .leftJoin(rooms, and(eq(rooms.buildingId, buildings.id), eq(rooms.isActive, true)))
    .leftJoin(items, eq(items.buildingId, buildings.id))
    .where(and(eq(buildings.organizationId, organizationId), eq(buildings.isActive, true)))
    .groupBy(buildings.id, buildings.name, buildings.code)
    .orderBy(desc(sql`count(distinct ${items.id})`))
    .limit(6);

  // 6. So'nggi faoliyatlar jurnali (Scanlar va yangi inventarlar)
  const recentScans = await db
    .select({
      id: scanEvents.id,
      itemName: items.name,
      invNum: items.inventoryNumber,
      isMatch: scanEvents.isMatch,
      isConflict: scanEvents.isConflict,
      scannedAt: scanEvents.scannedAt,
    })
    .from(scanEvents)
    .innerJoin(items, eq(scanEvents.itemId, items.id))
    .where(eq(scanEvents.organizationId, organizationId))
    .orderBy(desc(scanEvents.scannedAt))
    .limit(4);

  const recentItems = await db
    .select({
      id: items.id,
      name: items.name,
      invNum: items.inventoryNumber,
      createdAt: items.createdAt,
    })
    .from(items)
    .where(eq(items.organizationId, organizationId))
    .orderBy(desc(items.createdAt))
    .limit(3);

  const recentActivity: DashboardData["recentActivity"] = [];

  for (const s of recentScans) {
    recentActivity.push({
      id: s.id,
      type: "scan",
      title: `${s.itemName} (${s.invNum})`,
      subtitle: s.isMatch ? "Rejaviy joylashuvda tasdiqlandi" : "Joylashuv nomuvofiqligi (Konflikt)",
      timestamp: s.scannedAt,
      statusBadge: s.isMatch
        ? { label: "Mos keldi", variant: "success" }
        : { label: "Konflikt", variant: "danger" },
    });
  }

  for (const itm of recentItems) {
    recentActivity.push({
      id: itm.id,
      type: "item",
      title: `${itm.name} (${itm.invNum})`,
      subtitle: "Yangi inventar ro'yxatga olindi",
      timestamp: itm.createdAt,
      statusBadge: { label: "Yangi", variant: "info" },
    });
  }

  // Sanasi bo'yicha kamayish tartibida saralash
  recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    stats: {
      totalItems,
      activeItems,
      repairItems,
      writtenOffItems,
      totalValue,
      buildingsCount,
      floorsCount,
      roomsCount,
      activeStaffCount,
      activeCyclesCount,
      verifiedItemsCount,
      unverifiedItemsCount,
      conflictsCount,
      progressPercent,
    },
    buildingDistribution: buildingDistributionRows,
    recentActivity: recentActivity.slice(0, 6),
  };
}
