import "server-only";
import { db } from "@/lib/db";
import { items, itemCategories, type ItemStatus, type ItemCondition } from "@/lib/db/schema/inventory";
import { buildings, floors, rooms } from "@/lib/db/schema/locations";
import { organizations, type OrganizationSettings } from "@/lib/db/schema/organizations";
import { user } from "@/lib/db/schema/auth";
import { and, or, ilike, eq, desc, sql } from "drizzle-orm";

export interface ItemCategoryOption {
  id: string;
  name: string;
  description: string | null;
}

export interface InventoryStats {
  totalItems: number;
  activeItems: number;
  repairItems: number;
  writtenOffItems: number;
  totalValue: number;
}

export interface ItemListItem {
  id: string;
  organizationId: string;
  inventoryNumber: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  buildingId: string;
  buildingName: string;
  buildingCode: string;
  floorId: string;
  floorName: string;
  roomId: string;
  roomNumber: string;
  roomName: string;
  status: ItemStatus;
  condition: ItemCondition;
  photoUrl: string | null;
  qrToken: string;
  price: string | null;
  currency: string;
  responsiblePersonName: string | null;
  createdAt: Date;
}

export interface PaginatedInventoryResult {
  items: ItemListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PublicQrItemView {
  id: string;
  name: string;
  inventoryNumber: string;
  organizationName: string;
  organizationCode: string;
  categoryName: string;
  buildingName: string;
  floorName: string;
  roomNumber: string;
  roomName: string;
  status: ItemStatus;
  condition: ItemCondition;
  qrVisibility: "public" | "restricted" | "private";
  verifiedOfficial: boolean;
}

/**
 * 1. Inventar toifalari ro'yxatini olish
 */
export async function getItemCategoriesList(): Promise<ItemCategoryOption[]> {
  try {
    const rows = await db
      .select({
        id: itemCategories.id,
        name: itemCategories.name,
        description: itemCategories.description,
      })
      .from(itemCategories)
      .orderBy(itemCategories.name);

    if (rows.length > 0) return rows;
  } catch {
    // Agar DB jadvallari hali bo'sh bo'lsa
  }

  // Standart toifalar
  return [
    { id: "computer_equipment", name: "Kompyuter va orgtexnika", description: "Monobloklar, printerlar" },
    { id: "furniture", name: "Mebel va jihozlar", description: "Stol, stul, shkaflar" },
    { id: "appliances", name: "Maishiy va iqlim texnikasi", description: "Konditsionerlar" },
    { id: "laboratory", name: "Laboratoriya jihozlari", description: "O'quv asboblari" },
    { id: "network", name: "Tarmoq uskunalari", description: "Serverlar va routerlar" },
    { id: "vehicles", name: "Transport vositalari", description: "Avtomashinalar" },
    { id: "other", name: "Boshqa asosiy vositalar", description: "Boshqa mulklar" },
  ];
}

/**
 * 2. Tashkilot inventarlari statistikasi (Tenant Isolation)
 */
export async function getInventoryStats(organizationId: string): Promise<InventoryStats> {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${items.status} = 'active')::int`,
      repair: sql<number>`count(*) filter (where ${items.status} = 'repair')::int`,
      writtenOff: sql<number>`count(*) filter (where ${items.status} = 'written_off')::int`,
      totalValue: sql<number>`coalesce(sum(${items.price}::numeric), 0)::float`,
    })
    .from(items)
    .where(eq(items.organizationId, organizationId));

  return {
    totalItems: stats?.total ?? 0,
    activeItems: stats?.active ?? 0,
    repairItems: stats?.repair ?? 0,
    writtenOffItems: stats?.writtenOff ?? 0,
    totalValue: stats?.totalValue ?? 0,
  };
}

/**
 * 3. Inventarlar ro'yxatini olish (Filtrlar va Sahifalash bilan)
 */
export async function getInventoryList(options: {
  organizationId: string;
  categoryId?: string;
  buildingId?: string;
  roomId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedInventoryResult> {
  const page = Math.max(1, options.page || 1);
  const maxAllowed = options.pageSize && options.pageSize > 100 ? 10000 : 100;
  const pageSize = Math.min(maxAllowed, Math.max(1, options.pageSize || 20));
  const offset = (page - 1) * pageSize;

  const conditions = [eq(items.organizationId, options.organizationId)];

  if (options.categoryId && options.categoryId !== "all") {
    conditions.push(eq(items.categoryId, options.categoryId));
  }

  if (options.buildingId && options.buildingId !== "all") {
    conditions.push(eq(items.buildingId, options.buildingId));
  }

  if (options.roomId && options.roomId !== "all") {
    conditions.push(eq(items.roomId, options.roomId));
  }

  if (options.status && options.status !== "all") {
    conditions.push(eq(items.status, options.status as ItemStatus));
  }

  if (options.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    conditions.push(
      or(
        ilike(items.name, term),
        ilike(items.inventoryNumber, term),
        ilike(rooms.roomNumber, term),
        ilike(buildings.name, term)
      )!
    );
  }

  const whereClause = and(...conditions);

  const [countRes, rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .innerJoin(buildings, eq(items.buildingId, buildings.id))
      .innerJoin(rooms, eq(items.roomId, rooms.id))
      .where(whereClause),
    db
      .select({
        id: items.id,
        organizationId: items.organizationId,
        inventoryNumber: items.inventoryNumber,
        name: items.name,
        description: items.description,
        categoryId: items.categoryId,
        categoryName: itemCategories.name,
        buildingId: items.buildingId,
        buildingName: buildings.name,
        buildingCode: buildings.code,
        floorId: items.floorId,
        floorName: floors.name,
        roomId: items.roomId,
        roomNumber: rooms.roomNumber,
        roomName: rooms.name,
        status: items.status,
        condition: items.condition,
        photoUrl: items.photoUrl,
        qrToken: items.qrToken,
        price: items.price,
        currency: items.currency,
        responsiblePersonName: user.name,
        createdAt: items.createdAt,
      })
      .from(items)
      .innerJoin(itemCategories, eq(items.categoryId, itemCategories.id))
      .innerJoin(buildings, eq(items.buildingId, buildings.id))
      .innerJoin(floors, eq(items.floorId, floors.id))
      .innerJoin(rooms, eq(items.roomId, rooms.id))
      .leftJoin(user, eq(items.responsiblePersonId, user.id))
      .where(whereClause)
      .orderBy(desc(items.createdAt))
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
 * 4. Bitta inventarni to'liq ma'lumotlari bilan olish
 */
export async function getItemById(options: {
  organizationId: string;
  itemId: string;
}): Promise<ItemListItem | null> {
  const [item] = await db
    .select({
      id: items.id,
      organizationId: items.organizationId,
      inventoryNumber: items.inventoryNumber,
      name: items.name,
      description: items.description,
      categoryId: items.categoryId,
      categoryName: itemCategories.name,
      buildingId: items.buildingId,
      buildingName: buildings.name,
      buildingCode: buildings.code,
      floorId: items.floorId,
      floorName: floors.name,
      roomId: items.roomId,
      roomNumber: rooms.roomNumber,
      roomName: rooms.name,
      status: items.status,
      condition: items.condition,
      photoUrl: items.photoUrl,
      qrToken: items.qrToken,
      price: items.price,
      currency: items.currency,
      responsiblePersonName: user.name,
      createdAt: items.createdAt,
    })
    .from(items)
    .innerJoin(itemCategories, eq(items.categoryId, itemCategories.id))
    .innerJoin(buildings, eq(items.buildingId, buildings.id))
    .innerJoin(floors, eq(items.floorId, floors.id))
    .innerJoin(rooms, eq(items.roomId, rooms.id))
    .leftJoin(user, eq(items.responsiblePersonId, user.id))
    .where(and(eq(items.id, options.itemId), eq(items.organizationId, options.organizationId)))
    .limit(1);

  return item || null;
}

/**
 * 5. QR Token orqali ommaviy/cheklangan ko'rinish ma'lumotlarini olish
 * Xavfsizlik: Tashkilot maxfiylik siyosatiga (restricted) mos holda,
 * narx, xodim shaxsi yoki audit sirlarini oshkor qilmaydi!
 */
export async function getItemByQrToken(qrToken: string): Promise<PublicQrItemView | null> {
  const [row] = await db
    .select({
      id: items.id,
      name: items.name,
      inventoryNumber: items.inventoryNumber,
      status: items.status,
      condition: items.condition,
      categoryName: itemCategories.name,
      buildingName: buildings.name,
      floorName: floors.name,
      roomNumber: rooms.roomNumber,
      roomName: rooms.name,
      organizationName: organizations.name,
      organizationCode: organizations.code,
      organizationSettings: organizations.settings,
    })
    .from(items)
    .innerJoin(organizations, eq(items.organizationId, organizations.id))
    .innerJoin(itemCategories, eq(items.categoryId, itemCategories.id))
    .innerJoin(buildings, eq(items.buildingId, buildings.id))
    .innerJoin(floors, eq(items.floorId, floors.id))
    .innerJoin(rooms, eq(items.roomId, rooms.id))
    .where(eq(items.qrToken, qrToken))
    .limit(1);

  if (!row) return null;

  const orgSettings = row.organizationSettings as OrganizationSettings;
  const qrVisibility = orgSettings?.defaultQrVisibility || "restricted";

  if (qrVisibility === "private") {
    return null;
  }

  const isRestricted = qrVisibility === "restricted";

  return {
    id: row.id,
    name: row.name,
    inventoryNumber: row.inventoryNumber,
    organizationName: row.organizationName,
    organizationCode: row.organizationCode,
    categoryName: row.categoryName,
    buildingName: isRestricted ? "" : row.buildingName,
    floorName: isRestricted ? "" : row.floorName,
    roomNumber: isRestricted ? "" : row.roomNumber,
    roomName: isRestricted ? "" : row.roomName,
    status: row.status,
    condition: row.condition,
    qrVisibility,
    verifiedOfficial: true,
  };
}
