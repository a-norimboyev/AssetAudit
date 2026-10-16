import type { Profile, UserRole } from "@/lib/db/schema/profiles";
import type { Organization } from "@/lib/db/schema/organizations";
import type { AuthErrorCode } from "./authorization";

export interface AuthorizationResult {
  allowed: boolean;
  errorCode?: AuthErrorCode;
  errorMessage?: string;
}

/**
 * 1. Foydalanuvchi profili mavjudligi va faolligini tekshirish
 */
export function verifyProfileStatus(
  profile: Profile | null | undefined,
  options?: { allowMustChangePassword?: boolean }
): AuthorizationResult {
  if (!profile) {
    return {
      allowed: false,
      errorCode: "PROFILE_NOT_FOUND",
      errorMessage: "Foydalanuvchiga biriktirilgan biznes-profil topilmadi.",
    };
  }

  if (!profile.isActive) {
    return {
      allowed: false,
      errorCode: "ACCOUNT_INACTIVE",
      errorMessage: "Akkauntingiz faolsizlantirilgan. Administratorga murojaat qiling.",
    };
  }

  if (profile.mustChangePassword && !options?.allowMustChangePassword) {
    return {
      allowed: false,
      errorCode: "PASSWORD_CHANGE_REQUIRED",
      errorMessage: "Xavfsizlik talablariga ko'ra, dastlabki vaqtinchalik parolni o'zgartirishingiz shart.",
    };
  }

  return { allowed: true };
}

/**
 * 2. Tashkilot faolligini tekshirish
 */
export function verifyOrganizationStatus(
  profile: Profile,
  organization: Organization | null | undefined
): AuthorizationResult {
  // Super Admin tashkilotga bog'lanmagan
  if (profile.role === "super_admin") {
    return { allowed: true };
  }

  if (!organization || !organization.isActive) {
    return {
      allowed: false,
      errorCode: "ORGANIZATION_INACTIVE",
      errorMessage: "Tashkilot faoliyati vaqtincha to'xtatilgan yoki topilmadi.",
    };
  }

  return { allowed: true };
}

// O'tish davri uchun alias
export const verifyUniversityStatus = verifyOrganizationStatus;

/**
 * 3. Platforma Bosh Administratori (Super Admin) tekshiruvi
 */
export function verifyPlatformAdmin(profile: Profile): AuthorizationResult {
  const statusCheck = verifyProfileStatus(profile);
  if (!statusCheck.allowed) return statusCheck;

  if (profile.role !== "super_admin") {
    return {
      allowed: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Ushbu amal faqat Platforma Bosh Administratori (Super Admin) uchun ruxsat etilgan.",
    };
  }

  if (profile.organizationId !== null) {
    return {
      allowed: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Xavfsizlik buzilishi: Super Admin birorta tashkilotga biriktirilgan bo'lishi mumkin emas.",
    };
  }

  return { allowed: true };
}

/**
 * 3b. Tashkilot Administratori (Organization Admin) tekshiruvi
 */
export function verifyTenantAdmin(
  profile: Profile,
  organization: Organization | null | undefined
): AuthorizationResult {
  const statusCheck = verifyProfileStatus(profile);
  if (!statusCheck.allowed) return statusCheck;

  // Super Admin tashkilot administratori emas — platforma ma'muri
  if (profile.role === "super_admin") {
    return {
      allowed: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Super Admin platforma ma'muri bo'lib, tashkilot administratori paneliga to'g'ridan-to'g'ri kirmaydi.",
    };
  }

  if (profile.role !== "organization_admin") {
    return {
      allowed: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Ushbu amal faqat Tashkilot Administratori uchun ruxsat etilgan.",
    };
  }

  if (!profile.organizationId) {
    return {
      allowed: false,
      errorCode: "TENANT_ACCESS_DENIED",
      errorMessage: "Foydalanuvchi birorta tashkilotga biriktirilmagan.",
    };
  }

  const orgCheck = verifyOrganizationStatus(profile, organization);
  if (!orgCheck.allowed) return orgCheck;

  return { allowed: true };
}

/**
 * 4. Rol bo'yicha ruxsatni tekshirish (RBAC)
 */
export function verifyRole(profile: Profile, allowedRoles: UserRole[]): AuthorizationResult {
  const statusCheck = verifyProfileStatus(profile);
  if (!statusCheck.allowed) return statusCheck;

  if (!allowedRoles.includes(profile.role)) {
    return {
      allowed: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Ushbu amalni bajarish uchun vakolatingiz yetarli emas.",
    };
  }

  return { allowed: true };
}

/**
 * 5. Tashkilot ichki ma'lumotlariga qat'iy kirish (Tenant Isolation)
 *
 * Qoida:
 * - Super Admin'ga umumiy bypass YO'Q.
 * - Xodim faqat o'zi biriktirilgan tashkilotga kirishi shart.
 */
export function verifyTenantAccess(
  profile: Profile,
  targetOrganizationId: string,
  allowedRoles?: UserRole[]
): AuthorizationResult {
  const statusCheck = verifyProfileStatus(profile);
  if (!statusCheck.allowed) return statusCheck;

  // Super Admin ichki tenant ma'lumotlarini odatiy tarzda ko'ra olmaydi
  if (profile.role === "super_admin") {
    return {
      allowed: false,
      errorCode: "TENANT_ACCESS_DENIED",
      errorMessage: "Super Admin platforma ma'muri bo'lib, tashkilotning ichki inventar va audit ma'lumotlariga to'g'ridan-to'g'ri kira olmaydi.",
    };
  }

  // Tashkilot xodimi faqat o'z tashkilotiga kirishi shart
  if (!profile.organizationId || profile.organizationId !== targetOrganizationId) {
    return {
      allowed: false,
      errorCode: "TENANT_ACCESS_DENIED",
      errorMessage: "Boshqa tashkilot ma'lumotlariga kirish yoki o'zgartirish qat'iyan taqiqlanadi.",
    };
  }

  // Muayyan rollar talab qilingan bo'lsa
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return {
      allowed: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Ushbu tashkilot amalini bajarish uchun xodim vakolati yetarli emas.",
    };
  }

  return { allowed: true };
}

/**
 * 6. Biznes amallari bo'yicha aniq huquqlar matritsasi (Fine-Grained Permissions)
 */

/**
 * Rasmiy inventar fotosuratini yuklash yoki o'zgartirish huquqi
 * Qat'iy qoida: Faqat Organization Admin ruxsat etilgan. Inspector va Registrar yuklay OLMAYDI.
 */
export function canUploadOfficialItemPhoto(role: UserRole): boolean {
  return role === "organization_admin";
}

/**
 * Yangi inventarni darhol rasmiy ro'yxatga olish huquqi
 * Qat'iy qoida: Registrar Admin tasdig'isiz darhol ro'yxatga oladi; Organization Admin ham yarata oladi.
 */
export function canCreateNewItem(role: UserRole): boolean {
  return role === "organization_admin" || role === "registrar";
}

/**
 * Mavjud inventarning rasmiy joylashuvini o'zgartirish (ko'chirish) huquqi
 * Qat'iy qoida: Faqat Organization Admin ruxsat etilgan. Registrar joylashuvni o'zgartira OLMAYDI.
 */
export function canRelocateItem(role: UserRole): boolean {
  return role === "organization_admin";
}

/**
 * Inventarizatsiya tekshiruvini (audit/sanash) o'tkazish huquqi
 */
export function canPerformAudit(role: UserRole): boolean {
  return role === "organization_admin" || role === "inspector";
}

/**
 * Tashkilot xodimlarini boshqarish huquqi
 */
export function canManageOrganizationUsers(role: UserRole): boolean {
  return role === "organization_admin";
}

/**
 * Platforma tashkilotlarini boshqarish (Akkreditatsiya) huquqi
 */
export function canManagePlatformOrganizations(role: UserRole): boolean {
  return role === "super_admin";
}
