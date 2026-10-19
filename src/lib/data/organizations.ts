import "server-only";
import { db } from "@/lib/db";
import { organizations, organizationTypes, type OrganizationSettings } from "@/lib/db/schema/organizations";
import { profiles } from "@/lib/db/schema/profiles";
import { user } from "@/lib/db/schema/auth";
import { and, or, ilike, eq, desc, sql, inArray } from "drizzle-orm";
import { getPlatformSettings } from "@/lib/data/platform-settings";

export interface OrganizationAdminInfo {
  userId?: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  phone?: string;
  createdAt?: Date;
}

export interface OrganizationSubscriptionInfo {
  plan: string;
  planLabel: string;
  startsAt: Date;
  expiresAt: Date;
  daysRemaining: number;
  status: "active" | "expiring_soon" | "expired";
  statusLabel: string;
}

export interface OrganizationListItem {
  id: string;
  name: string;
  code: string;
  typeId: string;
  typeName: string | null;
  isActive: boolean;
  settings: OrganizationSettings;
  createdAt: Date;
  admin: OrganizationAdminInfo | null;
  subscription: OrganizationSubscriptionInfo;
}

export function computeSubscriptionInfo(
  createdAt: Date,
  settings: OrganizationSettings = {}
): OrganizationSubscriptionInfo {
  const startsAt = settings.subscriptionStartsAt
    ? new Date(settings.subscriptionStartsAt)
    : new Date(createdAt);

  const plan = settings.subscriptionPlan || "1_year";

  let expiresAt: Date;
  if (settings.subscriptionExpiresAt) {
    expiresAt = new Date(settings.subscriptionExpiresAt);
  } else {
    expiresAt = new Date(startsAt);
    if (plan === "2_years") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 2);
    } else if (plan === "3_years") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 3);
    } else if (plan === "6_months") {
      expiresAt.setMonth(expiresAt.getMonth() + 6);
    } else if (plan === "trial") {
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else {
      // 1_year
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }
  }

  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const planLabels: Record<string, string> = {
    "1_year": "1 yillik dostup",
    "2_years": "2 yillik dostup",
    "3_years": "3 yillik dostup",
    "6_months": "6 oylik dostup",
    "3_months": "3 oylik dostup",
    "1_month": "1 oylik dostup",
    "trial": "1 oylik dostup",
    "custom": "Maxsus muddat",
  };
  
  let planLabel = planLabels[plan];
  if (settings.subscriptionNotes && settings.subscriptionNotes.trim()) {
    planLabel = settings.subscriptionNotes.trim();
  } else if (!planLabel || plan === "custom") {
    const totalDays = Math.max(1, Math.round((expiresAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24)));
    if (totalDays >= 700 && totalDays <= 760) {
      planLabel = "2 yillik dostup";
    } else if (totalDays >= 340 && totalDays <= 380) {
      planLabel = "1 yillik dostup";
    } else if (totalDays >= 170 && totalDays <= 190) {
      planLabel = "6 oylik dostup";
    } else if (totalDays >= 80 && totalDays <= 100) {
      planLabel = "3 oylik dostup";
    } else if (totalDays >= 28 && totalDays <= 32) {
      planLabel = "1 oylik dostup";
    } else if (totalDays % 30 === 0) {
      planLabel = `${Math.round(totalDays / 30)} oylik dostup`;
    } else if (totalDays >= 30) {
      const months = Math.floor(totalDays / 30);
      const remDays = totalDays % 30;
      planLabel = remDays > 0 ? `${months} oy ${remDays} kunlik dostup` : `${months} oylik dostup`;
    } else {
      planLabel = `${totalDays} kunlik dostup`;
    }
  }

  let status: "active" | "expiring_soon" | "expired";
  let statusLabel: string;

  if (daysRemaining < 0) {
    status = "expired";
    statusLabel = "Muddati tugagan";
  } else if (daysRemaining <= 30) {
    status = "expiring_soon";
    statusLabel = `${daysRemaining} kun qoldi`;
  } else {
    status = "active";
    statusLabel = `${daysRemaining} kun qoldi`;
  }

  return {
    plan,
    planLabel,
    startsAt,
    expiresAt,
    daysRemaining,
    status,
    statusLabel,
  };
}

export interface OrganizationsStats {
  total: number;
  active: number;
  inactive: number;
  typesCount: number;
  expiringCount?: number;
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
  const rawItems = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      code: organizations.code,
      typeId: organizations.typeId,
      typeName: organizationTypes.name,
      isActive: organizations.isActive,
      settings: organizations.settings,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .leftJoin(organizationTypes, eq(organizations.typeId, organizationTypes.id))
    .where(whereClause)
    .orderBy(desc(organizations.createdAt))
    .limit(pageSize)
    .offset(offset);

  const orgIds = rawItems.map((o) => o.id);

  // 5. Tashkilot administratorlarini olish
  const adminsMap = new Map<string, OrganizationAdminInfo>();
  if (orgIds.length > 0) {
    const adminRows = await db
      .select({
        organizationId: profiles.organizationId,
        userId: profiles.userId,
        name: user.name,
        username: user.username,
        email: user.email,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .innerJoin(user, eq(user.id, profiles.userId))
      .where(
        and(
          inArray(profiles.organizationId, orgIds),
          eq(profiles.role, "organization_admin")
        )
      )
      .orderBy(desc(profiles.createdAt));

    for (const row of adminRows) {
      if (row.organizationId && !adminsMap.has(row.organizationId)) {
        adminsMap.set(row.organizationId, {
          userId: row.userId,
          name: row.name,
          username: row.username || (row.email ? row.email.split("@")[0] : "admin"),
          email: row.email,
          createdAt: row.createdAt,
        });
      }
    }
  }

  const items: OrganizationListItem[] = rawItems.map((org) => {
    const rawAdmin = adminsMap.get(org.id) || null;
    const admin = rawAdmin
      ? {
          ...rawAdmin,
          password: undefined,
          phone: (org.settings?.adminPhone as string) || undefined,
        }
      : null;
    const safeSettings = org.settings ? { ...org.settings } : {};
    delete safeSettings.adminPassword;
    delete (safeSettings as Record<string, unknown>).password;

    const subscription = computeSubscriptionInfo(org.createdAt, safeSettings);
    return {
      ...org,
      settings: safeSettings,
      admin,
      subscription,
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
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
  subscriptionNotes?: string;
  logoUrl?: string;
  adminPhone?: string;
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
export async function createOrganization(
  input: CreateOrganizationInput,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executor: any = db
) {
  const normalizedCode = input.code.trim().toUpperCase();
  const trimmedName = input.name.trim();
  const trimmedTypeId = input.typeId.trim().toLowerCase();
  const isActive = input.isActive ?? true;

  const plan = input.subscriptionPlan || "1_year";
  const now = new Date();
  let expiresAtStr = input.subscriptionExpiresAt;
  if (!expiresAtStr) {
    const expDate = new Date(now);
    if (plan === "2_years") expDate.setFullYear(expDate.getFullYear() + 2);
    else if (plan === "3_years") expDate.setFullYear(expDate.getFullYear() + 3);
    else if (plan === "6_months") expDate.setMonth(expDate.getMonth() + 6);
    else if (plan === "3_months") expDate.setMonth(expDate.getMonth() + 3);
    else if (plan === "1_month" || plan === "trial") expDate.setDate(expDate.getDate() + 30);
    else expDate.setFullYear(expDate.getFullYear() + 1);
    expiresAtStr = expDate.toISOString();
  }

  try {
    const platformSettings = getPlatformSettings();
    const [inserted] = await executor
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
          maxItems: platformSettings.quotas.defaultMaxItems,
          maxStorageMb: platformSettings.quotas.defaultMaxStorageMb,
          maxConcurrentAudits: platformSettings.quotas.defaultMaxConcurrentAudits,
          subscriptionPlan: plan,
          subscriptionStartsAt: now.toISOString(),
          subscriptionExpiresAt: expiresAtStr,
          subscriptionNotes: input.subscriptionNotes,
          logoUrl: input.logoUrl?.trim() || undefined,
          adminPhone: input.adminPhone?.trim() || undefined,
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
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
  subscriptionNotes?: string;
}

/**
 * 7. Tashkilot ma'lumotlarini yangilash (Update Organization)
 */
export async function updateOrganization(input: UpdateOrganizationInput) {
  const trimmedName = input.name.trim();
  const trimmedTypeId = input.typeId.trim().toLowerCase();

  try {
    const [existing] = await db
      .select({ settings: organizations.settings, createdAt: organizations.createdAt })
      .from(organizations)
      .where(eq(organizations.id, input.id))
      .limit(1);

    const currentSettings = existing?.settings || {};
    let newSettings = { ...currentSettings };

    if (input.subscriptionPlan) {
      const plan = input.subscriptionPlan;
      let expiresAtStr = input.subscriptionExpiresAt;
      if (!expiresAtStr) {
        const currentExp = currentSettings.subscriptionExpiresAt
          ? new Date(currentSettings.subscriptionExpiresAt)
          : (existing?.createdAt || new Date());
        const baseDate = new Date(currentExp.getTime() < Date.now() ? Date.now() : currentExp.getTime());
        const expDate = new Date(baseDate);
        if (plan === "2_years") expDate.setFullYear(expDate.getFullYear() + 2);
        else if (plan === "3_years") expDate.setFullYear(expDate.getFullYear() + 3);
        else if (plan === "6_months") expDate.setMonth(expDate.getMonth() + 6);
        else if (plan === "3_months") expDate.setMonth(expDate.getMonth() + 3);
        else if (plan === "1_month" || plan === "trial") expDate.setDate(expDate.getDate() + 30);
        else expDate.setFullYear(expDate.getFullYear() + 1);
        expiresAtStr = expDate.toISOString();
      }

      let note = input.subscriptionNotes;
      if (note === undefined) {
        if (plan === "1_year") note = "1 yillik dostup";
        else if (plan === "2_years") note = "2 yillik dostup";
        else if (plan === "3_years") note = "3 yillik dostup";
        else if (plan === "6_months") note = "6 oylik dostup";
        else if (plan === "3_months") note = "3 oylik dostup";
        else if (plan === "1_month" || plan === "trial") note = "1 oylik dostup";
      }

      newSettings = {
        ...newSettings,
        subscriptionPlan: plan,
        subscriptionExpiresAt: expiresAtStr,
        ...(note !== undefined ? { subscriptionNotes: note } : {}),
      };
    } else if (input.subscriptionExpiresAt) {
      newSettings = {
        ...newSettings,
        subscriptionExpiresAt: input.subscriptionExpiresAt,
      };
    }

    if (input.subscriptionNotes !== undefined && !input.subscriptionPlan) {
      newSettings = {
        ...newSettings,
        subscriptionNotes: input.subscriptionNotes,
      };
    }

    const [updated] = await db
      .update(organizations)
      .set({
        name: trimmedName,
        typeId: trimmedTypeId,
        settings: newSettings,
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

export interface DashboardOverviewData {
  stats: OrganizationsStats & { expiringCount: number };
  recentOrganizations: OrganizationListItem[];
  expiringOrganizations: OrganizationListItem[];
  types: OrganizationTypeOption[];
}

/**
 * 9. Super Admin Bosh sahifasi (Dashboard) uchun to'liq tahliliy ko'rsatkichlarni olish
 */
export async function getDashboardOverview(): Promise<DashboardOverviewData> {
  const [stats, orgsResult, types] = await Promise.all([
    getOrganizationsStats(),
    getOrganizationsList({ page: 1, pageSize: 20 }),
    getOrganizationTypesList(),
  ]);

  const expiringOrganizations = orgsResult.items
    .filter((o) => o.subscription.status === "expiring_soon" || o.subscription.status === "expired")
    .sort((a, b) => a.subscription.daysRemaining - b.subscription.daysRemaining);

  return {
    stats: {
      ...stats,
      expiringCount: expiringOrganizations.length,
    },
    recentOrganizations: orgsResult.items,
    expiringOrganizations,
    types,
  };
}

