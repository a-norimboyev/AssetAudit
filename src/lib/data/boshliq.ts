import "server-only";
import { db } from "@/lib/db";
import { buildings, floors, rooms } from "@/lib/db/schema/locations";
import { items, itemCategories, type ItemStatus, type ItemCondition } from "@/lib/db/schema/inventory";
import { organizations } from "@/lib/db/schema/organizations";
import { and, eq, ilike, or, asc, sql } from "drizzle-orm";

export interface BoshliqBuilding {
  id: string;
  name: string;
  code: string;
  address: string | null;
  floorsCount: number;
  roomsCount: number;
  itemsCount: number;
}

export interface BoshliqFloor {
  id: string;
  buildingId: string;
  floorNumber: number;
  name: string;
  roomsCount: number;
}

export interface BoshliqRoom {
  id: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  floorNumber: number;
  roomNumber: string;
  name: string;
  type: string;
  capacity: number | null;
  itemsCount: number;
}

export interface BoshliqItem {
  id: string;
  name: string;
  inventoryNumber: string;
  categoryName: string;
  description: string | null;
  status: ItemStatus;
  condition: ItemCondition;
  photoUrl: string | null;
  qrToken: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  roomId: string;
  roomNumber: string;
  roomName: string;
  createdAt: Date;
}

export interface BoshliqRoomPassport {
  organizationName: string;
  organizationCode: string;
  buildingName: string;
  buildingCode: string;
  floorName: string;
  floorNumber: number;
  roomNumber: string;
  roomName: string;
  roomType: string;
  capacity: number | null;
  items: BoshliqItem[];
}

/**
 * 1. Universitetdagi barcha faol binolar ro'yxati (Boshliq uchun)
 * Qat'iy tenant izolyatsiyasi: Faqat berilgan organizationId bo'yicha
 * Ortiqcha moliyaviy raqamlarsiz, faqat xonalar va jihozlar soni.
 */
export async function getBoshliqBuildings(organizationId: string): Promise<BoshliqBuilding[]> {
  const rows = await db
    .select({
      id: buildings.id,
      name: buildings.name,
      code: buildings.code,
      address: buildings.address,
      floorsCount: buildings.floorsCount,
      roomsCount: sql<number>`count(distinct ${rooms.id})::int`,
      itemsCount: sql<number>`count(distinct ${items.id})::int`,
    })
    .from(buildings)
    .leftJoin(
      rooms,
      and(eq(rooms.buildingId, buildings.id), eq(rooms.organizationId, organizationId), eq(rooms.isActive, true))
    )
    .leftJoin(
      items,
      and(eq(items.buildingId, buildings.id), eq(items.organizationId, organizationId))
    )
    .where(and(eq(buildings.organizationId, organizationId), eq(buildings.isActive, true)))
    .groupBy(buildings.id, buildings.name, buildings.code, buildings.address, buildings.floorsCount)
    .orderBy(asc(buildings.name));

  return rows;
}

/**
 * 2. Tanlangan bino bo'yicha barcha qavatlar va xonalar ro'yxati
 */
export async function getBoshliqFloorsAndRooms(
  organizationId: string,
  buildingId: string
): Promise<{
  building: BoshliqBuilding | null;
  floors: BoshliqFloor[];
  rooms: BoshliqRoom[];
}> {
  // Bino tekshiruvi (Tenant Isolation)
  const [bld] = await db
    .select({
      id: buildings.id,
      name: buildings.name,
      code: buildings.code,
      address: buildings.address,
      floorsCount: buildings.floorsCount,
    })
    .from(buildings)
    .where(
      and(
        eq(buildings.id, buildingId),
        eq(buildings.organizationId, organizationId),
        eq(buildings.isActive, true)
      )
    )
    .limit(1);

  if (!bld) {
    return { building: null, floors: [], rooms: [] };
  }

  // Qavatlar
  const floorRows = await db
    .select({
      id: floors.id,
      buildingId: floors.buildingId,
      floorNumber: floors.floorNumber,
      name: floors.name,
      roomsCount: sql<number>`count(distinct ${rooms.id})::int`,
    })
    .from(floors)
    .leftJoin(
      rooms,
      and(eq(rooms.floorId, floors.id), eq(rooms.organizationId, organizationId), eq(rooms.isActive, true))
    )
    .where(and(eq(floors.buildingId, buildingId), eq(floors.organizationId, organizationId)))
    .groupBy(floors.id, floors.buildingId, floors.floorNumber, floors.name)
    .orderBy(asc(floors.floorNumber));

  // Xonalar va ulardagi jihozlar soni
  const roomRows = await db
    .select({
      id: rooms.id,
      buildingId: rooms.buildingId,
      buildingName: buildings.name,
      floorId: rooms.floorId,
      floorName: floors.name,
      floorNumber: floors.floorNumber,
      roomNumber: rooms.roomNumber,
      name: rooms.name,
      type: rooms.type,
      capacity: rooms.capacity,
      itemsCount: sql<number>`count(distinct ${items.id})::int`,
    })
    .from(rooms)
    .innerJoin(buildings, eq(rooms.buildingId, buildings.id))
    .innerJoin(floors, eq(rooms.floorId, floors.id))
    .leftJoin(
      items,
      and(eq(items.roomId, rooms.id), eq(items.organizationId, organizationId))
    )
    .where(
      and(
        eq(rooms.buildingId, buildingId),
        eq(rooms.organizationId, organizationId),
        eq(rooms.isActive, true)
      )
    )
    .groupBy(
      rooms.id,
      rooms.buildingId,
      buildings.name,
      rooms.floorId,
      floors.name,
      floors.floorNumber,
      rooms.roomNumber,
      rooms.name,
      rooms.type,
      rooms.capacity
    )
    .orderBy(asc(floors.floorNumber), asc(rooms.roomNumber));

  return {
    building: {
      ...bld,
      roomsCount: roomRows.length,
      itemsCount: roomRows.reduce((acc, r) => acc + r.itemsCount, 0),
    },
    floors: floorRows,
    rooms: roomRows,
  };
}

/**
 * 3. Tanlangan xonadagi barcha jihozlar ro'yxati (Boshliq uchun)
 * Hech qanday narx yoki pul hisob-kitoblarisiz.
 */
export async function getBoshliqRoomItems(
  organizationId: string,
  roomId: string
): Promise<{
  room: BoshliqRoom | null;
  items: BoshliqItem[];
}> {
  // Xona va bino/qavat ma'lumoti
  const [roomRow] = await db
    .select({
      id: rooms.id,
      buildingId: rooms.buildingId,
      buildingName: buildings.name,
      floorId: rooms.floorId,
      floorName: floors.name,
      floorNumber: floors.floorNumber,
      roomNumber: rooms.roomNumber,
      name: rooms.name,
      type: rooms.type,
      capacity: rooms.capacity,
      itemsCount: sql<number>`count(distinct ${items.id})::int`,
    })
    .from(rooms)
    .innerJoin(buildings, eq(rooms.buildingId, buildings.id))
    .innerJoin(floors, eq(rooms.floorId, floors.id))
    .leftJoin(
      items,
      and(eq(items.roomId, rooms.id), eq(items.organizationId, organizationId))
    )
    .where(
      and(
        eq(rooms.id, roomId),
        eq(rooms.organizationId, organizationId),
        eq(rooms.isActive, true)
      )
    )
    .groupBy(
      rooms.id,
      rooms.buildingId,
      buildings.name,
      rooms.floorId,
      floors.name,
      floors.floorNumber,
      rooms.roomNumber,
      rooms.name,
      rooms.type,
      rooms.capacity
    )
    .limit(1);

  if (!roomRow) {
    return { room: null, items: [] };
  }

  // Xonadagi jihozlar
  const itemRows = await db
    .select({
      id: items.id,
      name: items.name,
      inventoryNumber: items.inventoryNumber,
      categoryName: itemCategories.name,
      description: items.description,
      status: items.status,
      condition: items.condition,
      photoUrl: items.photoUrl,
      qrToken: items.qrToken,
      buildingId: items.buildingId,
      buildingName: buildings.name,
      floorId: items.floorId,
      floorName: floors.name,
      roomId: items.roomId,
      roomNumber: rooms.roomNumber,
      roomName: rooms.name,
      createdAt: items.createdAt,
    })
    .from(items)
    .innerJoin(itemCategories, eq(items.categoryId, itemCategories.id))
    .innerJoin(buildings, eq(items.buildingId, buildings.id))
    .innerJoin(floors, eq(items.floorId, floors.id))
    .innerJoin(rooms, eq(items.roomId, rooms.id))
    .where(and(eq(items.roomId, roomId), eq(items.organizationId, organizationId)))
    .orderBy(asc(items.inventoryNumber));

  return {
    room: roomRow,
    items: itemRows,
  };
}

/**
 * 4. Tezkor Qidiruv:
 * Qidiruv maydoniga buyum nomini yozsa (masalan: "Proyektor"),
 * o'sha proyektorlar qaysi xonalarda turganini tezda topib ko'rsatish.
 */
export async function searchBoshliqItems(
  organizationId: string,
  searchTerm: string
): Promise<BoshliqItem[]> {
  const term = searchTerm.trim();
  if (!term) return [];

  const pattern = `%${term}%`;

  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      inventoryNumber: items.inventoryNumber,
      categoryName: itemCategories.name,
      description: items.description,
      status: items.status,
      condition: items.condition,
      photoUrl: items.photoUrl,
      qrToken: items.qrToken,
      buildingId: items.buildingId,
      buildingName: buildings.name,
      floorId: items.floorId,
      floorName: floors.name,
      roomId: items.roomId,
      roomNumber: rooms.roomNumber,
      roomName: rooms.name,
      createdAt: items.createdAt,
    })
    .from(items)
    .innerJoin(itemCategories, eq(items.categoryId, itemCategories.id))
    .innerJoin(buildings, eq(items.buildingId, buildings.id))
    .innerJoin(floors, eq(items.floorId, floors.id))
    .innerJoin(rooms, eq(items.roomId, rooms.id))
    .where(
      and(
        eq(items.organizationId, organizationId),
        or(
          ilike(items.name, pattern),
          ilike(items.inventoryNumber, pattern),
          ilike(itemCategories.name, pattern),
          ilike(rooms.roomNumber, pattern)
        )
      )
    )
    .orderBy(asc(items.name))
    .limit(50);

  return rows;
}

/**
 * 5. Tanlangan xonaning to'liq pasporti (Eksport va chop etish uchun)
 */
export async function getBoshliqRoomPassport(
  organizationId: string,
  roomId: string
): Promise<BoshliqRoomPassport | null> {
  const { room, items: roomItems } = await getBoshliqRoomItems(organizationId, roomId);
  if (!room) return null;

  const [org] = await db
    .select({
      name: organizations.name,
      code: organizations.code,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  return {
    organizationName: org?.name ?? "Universitet",
    organizationCode: org?.code ?? "OTM",
    buildingName: room.buildingName,
    buildingCode: "",
    floorName: room.floorName,
    floorNumber: room.floorNumber,
    roomNumber: room.roomNumber,
    roomName: room.name,
    roomType: room.type,
    capacity: room.capacity,
    items: roomItems,
  };
}
