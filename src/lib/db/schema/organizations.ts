import { pgTable, uuid, varchar, boolean, timestamp, check, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * 1. Tashkilot turlari klassifikatori (Organization Types)
 * Turlar: university, institute, school, college, ministry, municipality, state_agency, enterprise, other
 */
export const organizationTypes = pgTable("organization_types", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export type OrganizationType = typeof organizationTypes.$inferSelect;
export type NewOrganizationType = typeof organizationTypes.$inferInsert;

export interface OrganizationSettings {
  defaultQrVisibility?: "public" | "restricted" | "private";
  inventoryPrefix?: string;
  allowPublicScanLogs?: boolean;
  subscriptionPlan?: "1_year" | "2_years" | "3_years" | "6_months" | "trial" | "custom" | string;
  subscriptionStartsAt?: string; // ISO date string
  subscriptionExpiresAt?: string; // ISO date string
  subscriptionNotes?: string;
  logoUrl?: string;
  adminPassword?: string;
  adminPhone?: string;
  [key: string]: unknown;
}

/**
 * 2. Tashkilotlar jadvali (Organizations) — MulkNazorat universal multi-tenant ildizi
 * (Eski universities jadvalining evolyutsion davomi)
 */
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    typeId: varchar("type_id", { length: 50 })
      .references(() => organizationTypes.id, { onDelete: "restrict" })
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    settings: jsonb("settings").$type<OrganizationSettings>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("chk_organizations_name_not_empty", sql`char_length(btrim(${table.name})) > 0`),
    check("chk_organizations_code_not_empty", sql`char_length(btrim(${table.code})) > 0`),
    uniqueIndex("idx_organizations_code_unique").on(sql`upper(btrim(${table.code}))`),
  ]
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

// O'tish davri uchun qulay aliaslar (Backward compatibility)
export { organizations as universities };
export type { Organization as University, NewOrganization as NewUniversity };
