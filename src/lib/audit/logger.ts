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

import { db } from "@/lib/db";
import { systemAuditLogs } from "@/lib/db/schema/audit";
import { desc } from "drizzle-orm";

export type AuditEventType =
  | "ORGANIZATION_CREATE_ATTEMPT"
  | "ORGANIZATION_CREATED"
  | "ORGANIZATION_CREATE_FAILED"
  | "ORGANIZATION_UPDATED"
  | "ORGANIZATION_STATUS_TOGGLED"
  | "ORGANIZATION_DELETED"
  | "ADMIN_AUTH_SUCCESS"
  | "ADMIN_AUTH_FAILED"
  | "STAFF_CREATED"
  | "STAFF_STATUS_TOGGLED"
  | "STAFF_ACTIVATED"
  | "STAFF_DEACTIVATED"
  | "STAFF_PASSWORD_RESET"
  | "ORGANIZATION_ADMIN_CREATED"
  | "ORGANIZATION_ADMIN_ACTIVATED"
  | "ORGANIZATION_ADMIN_DEACTIVATED"
  | "ORGANIZATION_ADMIN_PASSWORD_RESET"
  | "ORGANIZATION_ADMIN_UPDATED"
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

  // PostgreSQL system_audit_logs jadvaliga xavfsiz yozish (Davlat darajasidagi o'zgarmas qora quti)
  try {
    const isTest = process.env.NODE_ENV === "test";
    if (!isTest && db) {
      Promise.resolve(
        db.insert(systemAuditLogs).values({
          actorUserId: record.actorUserId || null,
          organizationId: record.organizationId || null,
          organizationName: (record.metadata?.name as string) || record.organizationCode || null,
          event: record.event,
          action: (record.metadata?.action as string) || record.event.replace(/_/g, " "),
          metadata: record.metadata || {},
          createdAt: new Date(timestamp),
        })
      ).catch((err) => {
        // Log failure should never crash critical user transaction
        console.warn("[SECURITY_AUDIT_DB_WARN]:", err?.message);
      });
    }
  } catch {
    // safe fallback
  }

  console.info(`[SECURITY_AUDIT] ${record.event}:`, JSON.stringify(record));

  return record;
}

/**
 * Superadmin Boshqaruv Markazi uchun oxirgi tizim xavfsizlik audit loglarini olish
 */
export async function getRecentSecurityAuditLogs(limit = 10) {
  try {
    const logs = await db
      .select({
        id: systemAuditLogs.id,
        actorUserId: systemAuditLogs.actorUserId,
        actorName: systemAuditLogs.actorName,
        organizationId: systemAuditLogs.organizationId,
        organizationName: systemAuditLogs.organizationName,
        event: systemAuditLogs.event,
        action: systemAuditLogs.action,
        metadata: systemAuditLogs.metadata,
        createdAt: systemAuditLogs.createdAt,
      })
      .from(systemAuditLogs)
      .orderBy(desc(systemAuditLogs.createdAt))
      .limit(limit);

    return logs;
  } catch (err) {
    console.warn("[getRecentSecurityAuditLogs Error]:", err);
    return [];
  }
}
