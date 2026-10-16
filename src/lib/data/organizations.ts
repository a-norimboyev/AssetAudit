import "server-only";
import { db } from "@/lib/db";
import { organizations, organizationTypes } from "@/lib/db/schema/organizations";
import { and, or, ilike, eq, desc, sql } from "drizzle-orm";

export interface OrganizationListItem {
  id: string;
  name: string;
  code: string;
  typeId: string;
  typeName: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface OrganizationsStats {
  total: number;
  active: number;
  inactive: number;
  typesCount: number;
}

export interface OrganizationTypeOption {
  id: string;
  name: string;
}

export interface GetOrganizationsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  typeId?: string;
}

export interface PaginatedOrganizationsResult {
  items: OrganizationListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * 1. Haqiqiy PostgreSQL ma'lumotlar bazasidan tashkilotlar statistikasini olish
 * Bitta so'rovda agregatsiya qilinadi (Yuqori unumdorlik)
 */
export async function getOrganizationsStats(): Promise<OrganizationsStats> {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${organizations.isActive} = true)::int`,
      inactive: sql<number>`count(*) filter (where ${organizations.isActive} = false)::int`,
    })
    .from(organizations);

  const [typesStats] = await db
    .select({
      typesCount: sql<number>`count(*)::int`,
    })
    .from(organizationTypes);

  return {
    total: stats?.total ?? 0,
    active: stats?.active ?? 0,
    inactive: stats?.inactive ?? 0,
    typesCount: typesStats?.typesCount ?? 0,
  };
}

/**
 * 2. organization_types katalogi turlarini olish (Filter uchun)
 */
export async function getOrganizationTypesList(): Promise<OrganizationTypeOption[]> {
  const types = await db
    .select({
      id: organizationTypes.id,
      name: organizationTypes.name,
    })
    .from(organizationTypes)
    .orderBy(organizationTypes.name);

  return types;
}

/**
 * 3. Tashkilotlar ro'yxatini parametrlar (qidiruv, tur, sahifalash) asosida o'qish
 * Xavfsizlik: Maxfiy settings JSONB maydoni mijozga qaytarilmaydi!
 */
export async function getOrganizationsList(
  options: GetOrganizationsOptions = {}
): Promise<PaginatedOrganizationsResult> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
  const offset = (page - 1) * pageSize;

  const conditions = [];

  // 1. Qidiruv bo'yicha filter (nomi yoki kodi)
  if (options.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    conditions.push(
      or(
        ilike(organizations.name, term),
        ilike(organizations.code, term)
      )
    );
  }

  // 2. Tashkilot turi bo'yicha filter
  if (options.typeId && options.typeId.trim() && options.typeId !== "all") {
    conditions.push(eq(organizations.typeId, options.typeId.trim()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 3. Umumiy mos keluvchi yozuvlar soni
  const [countRes] = await db
    .select({
      total: sql<number>`count(*)::int`,
    })
    .from(organizations)
    .where(whereClause);

  const totalCount = countRes?.total ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // 4. Sahifalangan yozuvlarni tanlash
  const items = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      code: organizations.code,
      typeId: organizations.typeId,
      typeName: organizationTypes.name,
      isActive: organizations.isActive,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .leftJoin(organizationTypes, eq(organizations.typeId, organizationTypes.id))
    .where(whereClause)
    .orderBy(desc(organizations.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}

/**
 * 4. Tashkilot xatoliklari sinfi (Domain Error)
 */
export class OrganizationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = "OrganizationError";
  }
}

export interface CreateOrganizationInput {
  name: string;
  code: string;
  typeId: string;
  isActive?: boolean;
}

/**
 * 5. Tashkilot kodi band emasligini tekshirish (Real-time duplicate check)
 */
export async function isOrganizationCodeAvailable(code: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return false;

  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(sql`upper(btrim(${organizations.code}))`, normalized))
    .limit(1);

  return !existing;
}

/**
 * 6. Yangi tashkilotni PostgreSQL bazasiga kiritish (Drizzle ORM Parameterized INSERT)
 * Xavfsizlik:
 * - defaultQrVisibility: 'restricted' (boshlang'ich maxfiylik himoyasi)
 * - inventoryPrefix: `${code}-`
 * - unique constraint (23505) va foreign key (23503) xatolari tutiladi
 */
export async function createOrganization(input: CreateOrganizationInput) {
  const normalizedCode = input.code.trim().toUpperCase();
  const trimmedName = input.name.trim();
  const trimmedTypeId = input.typeId.trim().toLowerCase();
  const isActive = input.isActive ?? true;

  try {
    const [inserted] = await db
      .insert(organizations)
      .values({
        name: trimmedName,
        code: normalizedCode,
        typeId: trimmedTypeId,
        isActive,
        settings: {
          defaultQrVisibility: "restricted",
          inventoryPrefix: `${normalizedCode}-`,
          allowPublicScanLogs: false,
        },
      })
      .returning({
        id: organizations.id,
        name: organizations.name,
        code: organizations.code,
        typeId: organizations.typeId,
        isActive: organizations.isActive,
        createdAt: organizations.createdAt,
      });

    return inserted;
  } catch (error: unknown) {
    const err = error as {
      code?: string;
      constraint?: string;
      cause?: { code?: string; constraint?: string };
    } | null;

    // Drizzle ORM PostgreSQL xatosini error.cause ichiga joylaydi
    const pgCode = err?.code || err?.cause?.code;
    const pgConstraint = err?.constraint || err?.cause?.constraint;

    // 1. PostgreSQL 23505: Unique violation (kod takrorlanishi)
    if (pgCode === "23505" || pgConstraint === "idx_organizations_code_unique") {
      throw new OrganizationError(
        "ORGANIZATION_CODE_ALREADY_EXISTS",
        `"${normalizedCode}" kodi bilan tashkilot allaqachon ro'yxatga olingan. Iltimos, boshqa unikal kod kiriting.`,
        409
      );
    }

    // 2. PostgreSQL 23503: Foreign key violation (tashkilot turi mavjud emas)
    if (pgCode === "23503") {
      throw new OrganizationError(
        "INVALID_ORGANIZATION_TYPE",
        "Tanlangan tashkilot turi bazada mavjud emas.",
        400
      );
    }

    // 3. PostgreSQL 42501: Insufficient privilege (INSERT huquqi berilmagan)
    if (pgCode === "42501") {
      throw new OrganizationError(
        "DATABASE_PERMISSION_DENIED",
        "Ma'lumotlar bazasida tashkilot yaratish huquqi (INSERT privilege) yetarli emas. Iltimos, administratorga murojaat qiling.",
        500
      );
    }

    throw error;
  }
}

export interface UpdateOrganizationInput {
  id: string;
  name: string;
  typeId: string;
}

/**
 * 7. Tashkilot ma'lumotlarini yangilash (Update Organization)
 */
export async function updateOrganization(input: UpdateOrganizationInput) {
  const trimmedName = input.name.trim();
  const trimmedTypeId = input.typeId.trim().toLowerCase();

  try {
    const [updated] = await db
      .update(organizations)
      .set({
        name: trimmedName,
        typeId: trimmedTypeId,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, input.id))
      .returning({
        id: organizations.id,
        name: organizations.name,
        code: organizations.code,
        typeId: organizations.typeId,
        isActive: organizations.isActive,
        createdAt: organizations.createdAt,
      });

    return updated;
  } catch (error: unknown) {
    const err = error as { code?: string; cause?: { code?: string } } | null;
    const pgCode = err?.code || err?.cause?.code;

    if (pgCode === "23503") {
      throw new OrganizationError(
        "INVALID_ORGANIZATION_TYPE",
        "Tanlangan tashkilot turi bazada mavjud emas.",
        400
      );
    }
    throw error;
  }
}

/**
 * 8. Tashkilot faollik holatini o'zgartirish (Toggle Active / Inactive)
 */
export async function toggleOrganizationStatus(id: string, isActive: boolean) {
  const [updated] = await db
    .update(organizations)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, id))
    .returning({
      id: organizations.id,
      name: organizations.name,
      code: organizations.code,
      isActive: organizations.isActive,
    });

  if (!updated) {
    throw new OrganizationError("ORGANIZATION_NOT_FOUND", "Tashkilot topilmadi.", 404);
  }

  return updated;
}

