import "server-only";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth";
import { profiles, type UserRole } from "@/lib/db/schema/profiles";
import { and, eq, desc, inArray, sql } from "drizzle-orm";

export interface StaffListItem {
  userId: string;
  fullName: string;
  username: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
}

export interface StaffStats {
  totalStaff: number;
  inspectorsCount: number;
  registrarsCount: number;
  activeStaffCount: number;
}

/**
 * 1. Tashkilot xodimlari statistikasi (Faqat inspector va registrar)
 * Qat'iy tenant izolyatsiyasi: Faqat berilgan organizationId bo'yicha
 */
export async function getOrganizationStaffStats(organizationId: string): Promise<StaffStats> {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      inspectors: sql<number>`count(*) filter (where ${profiles.role} = 'inspector')::int`,
      registrars: sql<number>`count(*) filter (where ${profiles.role} = 'registrar')::int`,
      active: sql<number>`count(*) filter (where ${profiles.isActive} = true)::int`,
    })
    .from(profiles)
    .where(
      and(
        eq(profiles.organizationId, organizationId),
        inArray(profiles.role, ["inspector", "registrar"])
      )
    );

  return {
    totalStaff: stats?.total ?? 0,
    inspectorsCount: stats?.inspectors ?? 0,
    registrarsCount: stats?.registrars ?? 0,
    activeStaffCount: stats?.active ?? 0,
  };
}

/**
 * 2. Tashkilot xodimlari ro'yxati (Tenant Isolation)
 */
export async function getOrganizationStaffList(organizationId: string): Promise<StaffListItem[]> {
  const rows = await db
    .select({
      userId: profiles.userId,
      fullName: profiles.fullName,
      username: user.username,
      email: user.email,
      role: profiles.role,
      isActive: profiles.isActive,
      mustChangePassword: profiles.mustChangePassword,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .innerJoin(user, eq(profiles.userId, user.id))
    .where(
      and(
        eq(profiles.organizationId, organizationId),
        inArray(profiles.role, ["inspector", "registrar"])
      )
    )
    .orderBy(desc(profiles.createdAt));

  return rows;
}
