import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type Session, type User } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, type Profile, type UserRole } from "@/lib/db/schema/profiles";
import { organizations, type Organization } from "@/lib/db/schema/organizations";
import { eq } from "drizzle-orm";
import {
  verifyProfileStatus,
  verifyOrganizationStatus,
  verifyPlatformAdmin,
  verifyTenantAdmin,
  verifyRole,
  verifyTenantAccess,
} from "./authorization-rules";

export type AuthErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "PROFILE_NOT_FOUND"
  | "ACCOUNT_INACTIVE"
  | "ORGANIZATION_INACTIVE"
  | "UNIVERSITY_INACTIVE"
  | "PASSWORD_CHANGE_REQUIRED"
  | "FORBIDDEN"
  | "TENANT_ACCESS_DENIED";

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthenticatedContext {
  session: Session;
  user: User;
  profile: Profile;
  organization: Organization | null;
  /** @deprecated Use organization instead */
  university: Organization | null;
}

export interface TenantAdminContext extends AuthenticatedContext {
  organization: Organization;
}

/**
 * 1. Tizimga kirgan va faol profili mavjud foydalanuvchini tekshirish
 * Server Components, Server Actions va API Route'lar uchun asosiy himoya filtri.
 */
export async function requireAuthenticatedUser(
  options?: { allowMustChangePassword?: boolean }
): Promise<AuthenticatedContext> {
  const reqHeaders = await headers();
  const authSession = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!authSession || !authSession.user) {
    throw new AuthError("AUTHENTICATION_REQUIRED", "Tizimga kirish talab qilinadi.");
  }

  // 1. Biznes profilini PostgreSQL'dan olish
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, authSession.user.id))
    .limit(1);

  const profileCheck = verifyProfileStatus(profile, options);
  if (!profileCheck.allowed) {
    throw new AuthError(profileCheck.errorCode!, profileCheck.errorMessage!);
  }

  // 2. Tashkilot faolligini tekshirish
  let organization: Organization | null = null;
  if (profile.organizationId) {
    const [foundOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, profile.organizationId))
      .limit(1);

    const orgCheck = verifyOrganizationStatus(profile, foundOrg);
    if (!orgCheck.allowed) {
      throw new AuthError(orgCheck.errorCode!, orgCheck.errorMessage!);
    }
    organization = foundOrg;
  }

  return {
    session: authSession.session,
    user: authSession.user,
    profile,
    organization,
    university: organization,
  };
}

/**
 * 2. Platforma Boshqaruvi Himoyasi (Faqat Super Admin)
 */
export async function requirePlatformAdmin(): Promise<AuthenticatedContext> {
  const context = await requireAuthenticatedUser();
  const check = verifyPlatformAdmin(context.profile);
  if (!check.allowed) {
    throw new AuthError(check.errorCode!, check.errorMessage!);
  }
  return context;
}

/**
 * 2b. Tashkilot Administratori (Organization Admin) Himoyasi (/org marshruti)
 * Multi-tenant izolyatsiya qoidasi:
 * - Super Admin kirganda avtomatik /admin ga yo'naltiriladi (Strict isolation)
 * - Faqat organization_admin ruxsat etiladi
 * - Tashkilot mavjud va faol (is_active = true) bo'lishi shart
 */
export async function requireOrganizationAdmin(): Promise<TenantAdminContext> {
  const context = await requireAuthenticatedUser();

  // Super Admin /org ga kirganda uni /admin ga yo'naltirish (Strict isolation)
  if (context.profile.role === "super_admin") {
    redirect("/admin");
  }

  const check = verifyTenantAdmin(context.profile, context.organization);
  if (!check.allowed) {
    throw new AuthError(check.errorCode!, check.errorMessage!);
  }

  return {
    ...context,
    organization: context.organization!,
  };
}

/**
 * 3. Foydalanuvchi rolini tekshirish (Role-Based Access Control)
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedContext> {
  const context = await requireAuthenticatedUser();
  const check = verifyRole(context.profile, allowedRoles);
  if (!check.allowed) {
    throw new AuthError(check.errorCode!, check.errorMessage!);
  }
  return context;
}

/**
 * 4. Multi-Tenant izolyatsiyasi: Tashkilot ichki ma'lumotlariga qat'iy kirish
 * Qat'iy qoida: Super Admin'ga umumiy bypass BERILMAYDI.
 */
export async function requireOrganizationAccess(
  targetOrganizationId: string,
  allowedRoles?: UserRole[]
): Promise<AuthenticatedContext> {
  const context = await requireAuthenticatedUser();
  const check = verifyTenantAccess(context.profile, targetOrganizationId, allowedRoles);
  if (!check.allowed) {
    throw new AuthError(check.errorCode!, check.errorMessage!);
  }
  return context;
}

// O'tish davri uchun qulay alias
export const requireUniversityAccess = requireOrganizationAccess;

export * from "./authorization-rules";
