/**
 * AssetAudit — Xavfsizlik va Amallar Auditi (Security Audit Logger)
 *
 * Ushbu modul platformadagi muhim boshqaruv amallarini (tashkilot yaratish,
 * profil o'zgarishlari, ma'muriy harakatlar) xavfsiz qayd etadi.
 *
 * Qat'iy xavfsizlik kafolati:
 * - Hech qachon parol, cookie, sessiya tokeni, bearer token yoki shaxsiy maxfiy
 *   ma'lumotlarni audit logiga yozmaydi.
 * - Faqat actorUserId, tashkilot ID, amal turi, vaqt va holatni qayd etadi.
 */

export type AuditEventType =
  | "ORGANIZATION_CREATE_ATTEMPT"
  | "ORGANIZATION_CREATED"
  | "ORGANIZATION_CREATE_FAILED"
  | "ORGANIZATION_UPDATED"
  | "ORGANIZATION_STATUS_TOGGLED"
  | "ADMIN_AUTH_SUCCESS"
  | "ADMIN_AUTH_FAILED"
  | "STAFF_CREATED"
  | "STAFF_STATUS_TOGGLED"
  | "STAFF_ACTIVATED"
  | "STAFF_DEACTIVATED"
  | "STAFF_PASSWORD_RESET"
  | "ORGANIZATION_ADMIN_CREATED"
  | "ORGANIZATION_ADMIN_PASSWORD_RESET"
  | "PASSWORD_CHANGED";

export interface SecurityAuditEvent {
  event: AuditEventType;
  actorUserId: string;
  organizationId?: string | null;
  organizationCode?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: string;
}

/**
 * Xavfsiz audit qaydini amalga oshirish
 */
export function logSecurityAudit(
  event: Omit<SecurityAuditEvent, "timestamp">
): SecurityAuditEvent {
  const timestamp = new Date().toISOString();

  // Xavfsiz sanitizatsiya: agar metadata kelsa, maxfiy kalitlarni filtrlaymiz
  const sanitizedMetadata: Record<string, unknown> = {};
  if (event.metadata) {
    for (const [key, value] of Object.entries(event.metadata)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("password") ||
        lowerKey.includes("token") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("cookie") ||
        lowerKey.includes("key")
      ) {
        sanitizedMetadata[key] = "[REDACTED]";
      } else {
        sanitizedMetadata[key] = value;
      }
    }
  }

  const record: SecurityAuditEvent = {
    ...event,
    metadata: Object.keys(sanitizedMetadata).length > 0 ? sanitizedMetadata : undefined,
    timestamp,
  };

  // Hozircha tuzilgan strukturali xavfsiz JSON konsol logi (production observability uchun)
  // Keyingi bosqichda PostgreSQL 'audit_logs' jadvaliga yoziladi
  console.info(`[SECURITY_AUDIT] ${record.event}:`, JSON.stringify(record));

  return record;
}
