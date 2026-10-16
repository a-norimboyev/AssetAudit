import "server-only";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth";
import { profiles } from "@/lib/db/schema/profiles";
import { organizations } from "@/lib/db/schema/organizations";
import { and, or, ilike, eq, desc, sql } from "drizzle-orm";

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

  return {
    items: rows,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}
