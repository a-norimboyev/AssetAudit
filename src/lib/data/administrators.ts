import "server-only";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth";
import { profiles } from "@/lib/db/schema/profiles";
import { organizations } from "@/lib/db/schema/organizations";
import { items } from "@/lib/db/schema/inventory";
import { buildings, rooms } from "@/lib/db/schema/locations";
import { inventoryCycles } from "@/lib/db/schema/audit";
import { getOrgDashboardData, type DashboardData } from "@/lib/data/dashboard";
import { and, or, ilike, eq, ne, desc, sql } from "drizzle-orm";

export interface OrganizationAdminListItem {
  userId: string;
  fullName: string;
  username: string | null;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  organizationId: string | null;
  organizationName: string | null;
  organizationCode: string | null;
  password?: string;
  phone?: string;
}

export interface OrganizationAdminStats {
  total: number;
  active: number;
  inactive: number;
  organizationsCount: number;
}

export interface GetOrganizationAdminsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  organizationId?: string;
}

export interface PaginatedAdminsResult {
  items: OrganizationAdminListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * 1. Tashkilot administratorlari statistikasi (Super Admin uchun)
 */
export async function getOrganizationAdminsStats(): Promise<OrganizationAdminStats> {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${profiles.isActive} = true)::int`,
      inactive: sql<number>`count(*) filter (where ${profiles.isActive} = false)::int`,
      organizationsCount: sql<number>`count(distinct ${profiles.organizationId})::int`,
    })
    .from(profiles)
    .where(eq(profiles.role, "organization_admin"));

  return {
    total: stats?.total ?? 0,
    active: stats?.active ?? 0,
    inactive: stats?.inactive ?? 0,
    organizationsCount: stats?.organizationsCount ?? 0,
  };
}

/**
 * 2. Tashkilot administratorlari ro'yxati (Super Admin uchun)
 * user, profiles va organizations jadvallari JOIN qilinadi
 */
export async function getOrganizationAdminsList(
  options: GetOrganizationAdminsOptions = {}
): Promise<PaginatedAdminsResult> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
  const offset = (page - 1) * pageSize;

  const conditions = [eq(profiles.role, "organization_admin")];

  // 1. Qidiruv bo'yicha filter (ism, email, tashkilot nomi yoki kodi)
  if (options.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    conditions.push(
      or(
        ilike(profiles.fullName, term),
        ilike(user.email, term),
        ilike(user.username, term),
        ilike(organizations.name, term),
        ilike(organizations.code, term)
      )!
    );
  }

  // 2. Muayyan tashkilot bo'yicha filter
  if (options.organizationId && options.organizationId !== "all") {
    conditions.push(eq(profiles.organizationId, options.organizationId));
  }

  const whereClause = and(...conditions);

  // Parallel so'rov: Ro'yxat + Jami soni
  const [countRes, rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .leftJoin(organizations, eq(profiles.organizationId, organizations.id))
      .where(whereClause),

    db
      .select({
        userId: profiles.userId,
        fullName: profiles.fullName,
        username: user.username,
        email: user.email,
        role: profiles.role,
        isActive: profiles.isActive,
        mustChangePassword: profiles.mustChangePassword,
        createdAt: profiles.createdAt,
        organizationId: profiles.organizationId,
        organizationName: organizations.name,
        organizationCode: organizations.code,
        settings: organizations.settings,
      })
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .leftJoin(organizations, eq(profiles.organizationId, organizations.id))
      .where(whereClause)
      .orderBy(desc(profiles.createdAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const totalCount = countRes[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const items: OrganizationAdminListItem[] = rows.map((r) => {
    const settings = (r.settings as Record<string, unknown>) || {};
    return {
      userId: r.userId,
      fullName: r.fullName,
      username: r.username,
      email: r.email,
      role: r.role,
      isActive: r.isActive,
      mustChangePassword: r.mustChangePassword,
      createdAt: r.createdAt,
      organizationId: r.organizationId,
      organizationName: r.organizationName,
      organizationCode: r.organizationCode,
      password: undefined,
      phone: (settings.adminPhone as string) || undefined,
    };
  });

  return {
    items,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}

export interface OrganizationAdminDetails extends OrganizationAdminListItem {
  updatedAt?: Date;
  dashboard?: DashboardData;
  recentItems: Array<{
    id: string;
    name: string;
    inventoryNumber: string;
    status: string;
    price: string | null;
    createdAt: Date;
    roomName: string | null;
    roomNumber: string | null;
    buildingName: string | null;
  }>;
  staffMembers: Array<{
    userId: string;
    fullName: string;
    role: string;
    isActive: boolean;
    email: string;
    createdAt: Date;
  }>;
  cyclesList: Array<{
    id: string;
    title: string;
    status: string;
    startDate: Date;
    endDate: Date | null;
    createdAt: Date;
  }>;
}

/**
 * 3. Muayyan tashkilot administratorining to'liq profili va tashkilot faoliyati
 * (Super Admin kuzatuvi va monitoringi uchun)
 */
export async function getOrganizationAdminDetails(
  userId: string
): Promise<OrganizationAdminDetails | null> {
  const [row] = await db
    .select({
      userId: profiles.userId,
      fullName: profiles.fullName,
      username: user.username,
      email: user.email,
      role: profiles.role,
      isActive: profiles.isActive,
      mustChangePassword: profiles.mustChangePassword,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
      organizationId: profiles.organizationId,
      organizationName: organizations.name,
      organizationCode: organizations.code,
      settings: organizations.settings,
    })
    .from(profiles)
    .innerJoin(user, eq(profiles.userId, user.id))
    .leftJoin(organizations, eq(profiles.organizationId, organizations.id))
    .where(and(eq(profiles.userId, userId), eq(profiles.role, "organization_admin")))
    .limit(1);

  if (!row) {
    return null;
  }

  const settings = (row.settings as Record<string, unknown>) || {};
  let dashboard: DashboardData | undefined;
  let recentItems: OrganizationAdminDetails["recentItems"] = [];
  let staffMembers: OrganizationAdminDetails["staffMembers"] = [];
  let cyclesList: OrganizationAdminDetails["cyclesList"] = [];

  if (row.organizationId) {
    try {
      dashboard = await getOrgDashboardData(row.organizationId);
    } catch (e) {
      console.warn("Failed to get org dashboard data for admin details:", e);
    }

    try {
      recentItems = await db
        .select({
          id: items.id,
          name: items.name,
          inventoryNumber: items.inventoryNumber,
          status: items.status,
          price: items.price,
          createdAt: items.createdAt,
          roomName: rooms.name,
          roomNumber: rooms.roomNumber,
          buildingName: buildings.name,
        })
        .from(items)
        .leftJoin(rooms, eq(items.roomId, rooms.id))
        .leftJoin(buildings, eq(items.buildingId, buildings.id))
        .where(eq(items.organizationId, row.organizationId))
        .orderBy(desc(items.createdAt))
        .limit(10);
    } catch (e) {
      console.warn("Failed to get recent items for admin details:", e);
    }

    try {
      staffMembers = await db
        .select({
          userId: profiles.userId,
          fullName: profiles.fullName,
          role: profiles.role,
          isActive: profiles.isActive,
          email: user.email,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .innerJoin(user, eq(user.id, profiles.userId))
        .where(
          and(
            eq(profiles.organizationId, row.organizationId),
            ne(profiles.userId, userId)
          )
        )
        .orderBy(desc(profiles.createdAt))
        .limit(10);
    } catch (e) {
      console.warn("Failed to get staff for admin details:", e);
    }

    try {
      cyclesList = await db
        .select({
          id: inventoryCycles.id,
          title: inventoryCycles.title,
          status: inventoryCycles.status,
          startDate: inventoryCycles.startDate,
          endDate: inventoryCycles.endDate,
          createdAt: inventoryCycles.createdAt,
        })
        .from(inventoryCycles)
        .where(eq(inventoryCycles.organizationId, row.organizationId))
        .orderBy(desc(inventoryCycles.createdAt))
        .limit(5);
    } catch (e) {
      console.warn("Failed to get cycles for admin details:", e);
    }
  }

  return {
    userId: row.userId,
    fullName: row.fullName,
    username: row.username,
    email: row.email,
    role: row.role,
    isActive: row.isActive,
    mustChangePassword: row.mustChangePassword,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    organizationCode: row.organizationCode,
    password: undefined,
    phone: (settings.adminPhone as string) || undefined,
    dashboard,
    recentItems,
    staffMembers,
    cyclesList,
  };
}

