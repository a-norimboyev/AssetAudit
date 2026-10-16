import "server-only";
import { db } from "@/lib/db";
import { inventoryCycles, roomAudits, scanEvents, cycleItems, type CycleStatus, type RoomAuditStatus } from "@/lib/db/schema/audit";
import { items } from "@/lib/db/schema/inventory";
import { rooms, buildings, floors } from "@/lib/db/schema/locations";
import { user } from "@/lib/db/schema/auth";
import { and, or, eq, desc, asc, sql } from "drizzle-orm";

export interface CycleListItem {
  id: string;
  organizationId: string;
  title: string;
  status: CycleStatus;
  startDate: Date;
  endDate: Date | null;
  createdBy: string;
  creatorName: string | null;
  totalRooms: number;
  completedRooms: number;
  scannedItemsCount: number;
  conflictsCount: number;
  createdAt: Date;
}

export interface RoomAuditItem {
  id: string;
  cycleId: string;
  organizationId: string;
  roomId: string;
  roomNumber: string;
  roomName: string;
  buildingName: string;
  floorName: string;
  status: RoomAuditStatus;
  auditedBy: string | null;
  auditedByName: string | null;
  auditedAt: Date | null;
  expectedItemsCount: number;
  scannedItemsCount: number;
}

export interface ReconciliationReport {
  cycleId: string;
  cycleTitle: string;
  status: CycleStatus;
  totalExpectedItems: number;
  totalScannedItems: number;
  matchedItemsCount: number;
  conflictItemsCount: number;
  missingItemsCount: number;
  totalRooms: number;
  completedRooms: number;
  pendingRooms: number;
  conflicts: Array<{
    id: string;
    itemId: string;
    itemName: string;
    inventoryNumber: string;
    expectedRoomNumber: string;
    expectedBuildingName: string;
    scannedRoomNumber: string;
    scannedBuildingName: string;
    scannedAt: Date;
    scannerName: string | null;
  }>;
}

/**
 * 1. Tashkilotning barcha inventarizatsiya sikllarini olish
 */
export async function getInventoryCyclesList(organizationId: string): Promise<CycleListItem[]> {
  const rows = await db
    .select({
      id: inventoryCycles.id,
      organizationId: inventoryCycles.organizationId,
      title: inventoryCycles.title,
      status: inventoryCycles.status,
      startDate: inventoryCycles.startDate,
      endDate: inventoryCycles.endDate,
      createdBy: inventoryCycles.createdBy,
      creatorName: user.name,
      totalRooms: sql<number>`(SELECT count(*)::int FROM room_audits WHERE room_audits.cycle_id = ${inventoryCycles.id})`,
      completedRooms: sql<number>`(SELECT count(*)::int FROM room_audits WHERE room_audits.cycle_id = ${inventoryCycles.id} AND room_audits.status = 'completed')`,
      scannedItemsCount: sql<number>`(SELECT count(distinct item_id)::int FROM scan_events WHERE scan_events.cycle_id = ${inventoryCycles.id})`,
      conflictsCount: sql<number>`(SELECT count(distinct item_id)::int FROM scan_events WHERE scan_events.cycle_id = ${inventoryCycles.id} AND scan_events.is_conflict = true)`,
      createdAt: inventoryCycles.createdAt,
    })
    .from(inventoryCycles)
    .leftJoin(user, eq(inventoryCycles.createdBy, user.id))
    .where(eq(inventoryCycles.organizationId, organizationId))
    .orderBy(desc(inventoryCycles.createdAt));

  return rows;
}

/**
 * 2. Faol inventarizatsiya siklini olish (Tekshiruvchi / Audit Scanner uchun)
 */
export async function getActiveCycle(organizationId: string) {
  const [cycle] = await db
    .select()
    .from(inventoryCycles)
    .where(
      and(
        eq(inventoryCycles.organizationId, organizationId),
        or(eq(inventoryCycles.status, "in_progress"), eq(inventoryCycles.status, "planned"))
      )
    )
    .orderBy(desc(inventoryCycles.createdAt))
    .limit(1);

  return cycle || null;
}

/**
 * 3. Sikl doirasidagi xonalar tekshiruvi ro'yxati (Room Audits)
 */
export async function getRoomAuditsForCycle(options: {
  organizationId: string;
  cycleId: string;
}): Promise<RoomAuditItem[]> {
  const rows = await db
    .select({
      id: roomAudits.id,
      cycleId: roomAudits.cycleId,
      organizationId: roomAudits.organizationId,
      roomId: roomAudits.roomId,
      roomNumber: rooms.roomNumber,
      roomName: rooms.name,
      buildingName: buildings.name,
      floorName: floors.name,
      status: roomAudits.status,
      auditedBy: roomAudits.auditedBy,
      auditedByName: user.name,
      auditedAt: roomAudits.auditedAt,
      expectedItemsCount: sql<number>`(SELECT count(*)::int FROM items WHERE items.room_id = ${rooms.id} AND items.organization_id = ${options.organizationId})`,
      scannedItemsCount: sql<number>`(SELECT count(distinct item_id)::int FROM scan_events WHERE scan_events.cycle_id = ${options.cycleId} AND scan_events.scanned_room_id = ${rooms.id})`,
    })
    .from(roomAudits)
    .innerJoin(rooms, eq(roomAudits.roomId, rooms.id))
    .innerJoin(buildings, eq(rooms.buildingId, buildings.id))
    .innerJoin(floors, eq(rooms.floorId, floors.id))
    .leftJoin(user, eq(roomAudits.auditedBy, user.id))
    .where(
      and(
        eq(roomAudits.organizationId, options.organizationId),
        eq(roomAudits.cycleId, options.cycleId)
      )
    )
    .orderBy(asc(buildings.name), asc(rooms.roomNumber));

  return rows;
}

/**
 * 4. Audit Natijalari va Rekonsilyatsiya Hisoboti (Reconciliation Report)
 *
 * Qat'iy qoidalar:
 * - Hali tekshirilmagan (pending) xonadagi buyumlar yo'qolgan deb hisoblanmaydi!
 * - Faqat completed bo'lgan xonada topilmagan buyumlar missing_items deb olinadi.
 * - Boshqa xonada topilgan buyumlar konflikt sifatida alohida ko'rsatiladi.
 */
export async function getReconciliationReport(options: {
  organizationId: string;
  cycleId: string;
}): Promise<ReconciliationReport | null> {
  const [cycle] = await db
    .select()
    .from(inventoryCycles)
    .where(
      and(
        eq(inventoryCycles.id, options.cycleId),
        eq(inventoryCycles.organizationId, options.organizationId)
      )
    )
    .limit(1);

  if (!cycle) return null;

  // 1. Umumiy hisoblar
  const [totalExpectedRes, cycleSnapshotRes, roomsStatsRes, scanStatsRes] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(eq(items.organizationId, options.organizationId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cycleItems)
      .where(
        and(
          eq(cycleItems.cycleId, options.cycleId),
          eq(cycleItems.organizationId, options.organizationId)
        )
      ),
    db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${roomAudits.status} = 'completed')::int`,
        pending: sql<number>`count(*) filter (where ${roomAudits.status} != 'completed')::int`,
      })
      .from(roomAudits)
      .where(
        and(
          eq(roomAudits.cycleId, options.cycleId),
          eq(roomAudits.organizationId, options.organizationId)
        )
      ),
    db
      .select({
        totalScanned: sql<number>`count(distinct ${scanEvents.itemId})::int`,
        matched: sql<number>`count(distinct ${scanEvents.itemId}) filter (where ${scanEvents.isMatch} = true)::int`,
        conflicts: sql<number>`count(distinct ${scanEvents.itemId}) filter (where ${scanEvents.isConflict} = true)::int`,
      })
      .from(scanEvents)
      .where(
        and(
          eq(scanEvents.cycleId, options.cycleId),
          eq(scanEvents.organizationId, options.organizationId)
        )
      ),
  ]);

  // 2. Konfliktli skanlar ro'yxati
  const conflictRows = await db
    .select({
      id: scanEvents.id,
      itemId: scanEvents.itemId,
      itemName: items.name,
      inventoryNumber: items.inventoryNumber,
      expectedRoomNumber: sql<string>`(SELECT room_number FROM rooms WHERE rooms.id = ${scanEvents.expectedRoomId})`,
      expectedBuildingName: sql<string>`(SELECT buildings.name FROM rooms JOIN buildings ON rooms.building_id = buildings.id WHERE rooms.id = ${scanEvents.expectedRoomId})`,
      scannedRoomNumber: sql<string>`(SELECT room_number FROM rooms WHERE rooms.id = ${scanEvents.scannedRoomId})`,
      scannedBuildingName: sql<string>`(SELECT buildings.name FROM rooms JOIN buildings ON rooms.building_id = buildings.id WHERE rooms.id = ${scanEvents.scannedRoomId})`,
      scannedAt: scanEvents.scannedAt,
      scannerName: user.name,
    })
    .from(scanEvents)
    .innerJoin(items, eq(scanEvents.itemId, items.id))
    .leftJoin(user, eq(scanEvents.scannedBy, user.id))
    .where(
      and(
        eq(scanEvents.cycleId, options.cycleId),
        eq(scanEvents.organizationId, options.organizationId),
        eq(scanEvents.isConflict, true)
      )
    )
    .orderBy(desc(scanEvents.scannedAt));

  // 3. Faqat completed xonalardagi topilmagan buyumlar hisoblanadi (Xolis qoida)
  const completedRoomIdsRes = await db
    .select({ roomId: roomAudits.roomId })
    .from(roomAudits)
    .where(
      and(
        eq(roomAudits.cycleId, options.cycleId),
        eq(roomAudits.organizationId, options.organizationId),
        eq(roomAudits.status, "completed")
      )
    );

  const completedRoomIds = completedRoomIdsRes.map((r) => r.roomId);

  let missingItemsCount = 0;
  if (completedRoomIds.length > 0) {
    const [missingRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(
        and(
          eq(items.organizationId, options.organizationId),
          sql`${items.roomId} IN ${completedRoomIds}`,
          sql`${items.id} NOT IN (SELECT item_id FROM scan_events WHERE scan_events.cycle_id = ${options.cycleId} AND scan_events.organization_id = ${options.organizationId})`
        )
      );
    missingItemsCount = missingRes?.count ?? 0;
  }

  const baselineExpected = (cycleSnapshotRes[0]?.count ?? 0) > 0
    ? cycleSnapshotRes[0]!.count
    : (totalExpectedRes[0]?.count ?? 0);

  return {
    cycleId: cycle.id,
    cycleTitle: cycle.title,
    status: cycle.status,
    totalExpectedItems: baselineExpected,
    totalScannedItems: scanStatsRes[0]?.totalScanned ?? 0,
    matchedItemsCount: scanStatsRes[0]?.matched ?? 0,
    conflictItemsCount: scanStatsRes[0]?.conflicts ?? 0,
    missingItemsCount,
    totalRooms: roomsStatsRes[0]?.total ?? 0,
    completedRooms: roomsStatsRes[0]?.completed ?? 0,
    pendingRooms: roomsStatsRes[0]?.pending ?? 0,
    conflicts: conflictRows,
  };
}
