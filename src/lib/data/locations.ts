import "server-only";
import { db } from "@/lib/db";
import { buildings, floors, rooms, type RoomType } from "@/lib/db/schema/locations";
import { and, or, ilike, eq, asc, sql } from "drizzle-orm";

export interface LocationsStats {
  buildingsCount: number;
  floorsCount: number;
  roomsCount: number;
  totalCapacity: number;
}

export interface BuildingListItem {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address: string | null;
  floorsCount: number;
  isActive: boolean;
  createdAt: Date;
  actualFloorsCount: number;
  roomsCount: number;
}

export interface FloorListItem {
  id: string;
  organizationId: string;
  buildingId: string;
  buildingName: string;
  buildingCode: string;
  floorNumber: number;
  name: string;
  roomsCount: number;
  createdAt: Date;
}

export interface RoomListItem {
  id: string;
  organizationId: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  floorNumber: number;
  roomNumber: string;
  name: string;
  type: RoomType;
  capacity: number | null;
  isActive: boolean;
  createdAt: Date;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * 1. Tashkilot lokatsiya ko'rsatkichlari (Binolar, Qavatlar, Xonalar statistikasi)
 * Qat'iy tenant izolyatsiyasi: Faqat berilgan organizationId bo'yicha
 */
export async function getLocationsStats(organizationId: string): Promise<LocationsStats> {
  const [bRes, fRes, rRes] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(buildings)
      .where(eq(buildings.organizationId, organizationId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(floors)
      .where(eq(floors.organizationId, organizationId)),
    db
      .select({
        count: sql<number>`count(*)::int`,
        capacity: sql<number>`coalesce(sum(${rooms.capacity}), 0)::int`,
      })
      .from(rooms)
      .where(eq(rooms.organizationId, organizationId)),
  ]);

  return {
    buildingsCount: bRes[0]?.count ?? 0,
    floorsCount: fRes[0]?.count ?? 0,
    roomsCount: rRes[0]?.count ?? 0,
    totalCapacity: rRes[0]?.capacity ?? 0,
  };
}

/**
 * 2. Binolar ro'yxati (Tenant izolyatsiyasi, qidiruv va sahifalash bilan)
 */
export async function getBuildingsList(options: {
  organizationId: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<BuildingListItem>> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
  const offset = (page - 1) * pageSize;

  const conditions = [eq(buildings.organizationId, options.organizationId)];

  if (options.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    conditions.push(or(ilike(buildings.name, term), ilike(buildings.code, term))!);
  }

  const whereClause = and(...conditions);

  const [countRes, rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(buildings)
      .where(whereClause),
    db
      .select({
        id: buildings.id,
        organizationId: buildings.organizationId,
        name: buildings.name,
        code: buildings.code,
        address: buildings.address,
        floorsCount: buildings.floorsCount,
        isActive: buildings.isActive,
        createdAt: buildings.createdAt,
        actualFloorsCount: sql<number>`(SELECT count(*)::int FROM floors WHERE floors.building_id = ${buildings.id})`,
        roomsCount: sql<number>`(SELECT count(*)::int FROM rooms WHERE rooms.building_id = ${buildings.id})`,
      })
      .from(buildings)
      .where(whereClause)
      .orderBy(asc(buildings.name))
      .limit(pageSize)
      .offset(offset),
  ]);

  const totalCount = countRes[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    items: rows,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}

/**
 * 3. Qavatlar ro'yxati (Bino bo'yicha filter bilan)
 */
export async function getFloorsList(options: {
  organizationId: string;
  buildingId?: string;
  search?: string;
}): Promise<FloorListItem[]> {
  const conditions = [eq(floors.organizationId, options.organizationId)];

  if (options.buildingId && options.buildingId !== "all") {
    conditions.push(eq(floors.buildingId, options.buildingId));
  }

  if (options.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    conditions.push(or(ilike(floors.name, term), ilike(buildings.name, term))!);
  }

  const rows = await db
    .select({
      id: floors.id,
      organizationId: floors.organizationId,
      buildingId: floors.buildingId,
      buildingName: buildings.name,
      buildingCode: buildings.code,
      floorNumber: floors.floorNumber,
      name: floors.name,
      roomsCount: sql<number>`(SELECT count(*)::int FROM rooms WHERE rooms.floor_id = ${floors.id})`,
      createdAt: floors.createdAt,
    })
    .from(floors)
    .innerJoin(buildings, eq(floors.buildingId, buildings.id))
    .where(and(...conditions))
    .orderBy(asc(buildings.name), asc(floors.floorNumber));

  return rows;
}

/**
 * 4. Xonalar ro'yxati (Bino, Qavat, Tur bo'yicha filtrlar va sahifalash bilan)
 */
export async function getRoomsList(options: {
  organizationId: string;
  buildingId?: string;
  floorId?: string;
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<RoomListItem>> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 25));
  const offset = (page - 1) * pageSize;

  const conditions = [eq(rooms.organizationId, options.organizationId)];

  if (options.buildingId && options.buildingId !== "all") {
    conditions.push(eq(rooms.buildingId, options.buildingId));
  }

  if (options.floorId && options.floorId !== "all") {
    conditions.push(eq(rooms.floorId, options.floorId));
  }

  if (options.type && options.type !== "all") {
    conditions.push(eq(rooms.type, options.type as RoomType));
  }

  if (options.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    conditions.push(
      or(
        ilike(rooms.name, term),
        ilike(rooms.roomNumber, term),
        ilike(buildings.name, term)
      )!
    );
  }

  const whereClause = and(...conditions);

  const [countRes, rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(rooms)
      .innerJoin(buildings, eq(rooms.buildingId, buildings.id))
      .innerJoin(floors, eq(rooms.floorId, floors.id))
      .where(whereClause),
    db
      .select({
        id: rooms.id,
        organizationId: rooms.organizationId,
        buildingId: rooms.buildingId,
        buildingName: buildings.name,
        floorId: rooms.floorId,
        floorName: floors.name,
        floorNumber: floors.floorNumber,
        roomNumber: rooms.roomNumber,
        name: rooms.name,
        type: rooms.type,
        capacity: rooms.capacity,
        isActive: rooms.isActive,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .innerJoin(buildings, eq(rooms.buildingId, buildings.id))
      .innerJoin(floors, eq(rooms.floorId, floors.id))
      .where(whereClause)
      .orderBy(asc(buildings.name), asc(floors.floorNumber), asc(rooms.roomNumber))
      .limit(pageSize)
      .offset(offset),
  ]);

  const totalCount = countRes[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    items: rows,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}
