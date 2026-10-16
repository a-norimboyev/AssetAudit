import { pgTable, text, uuid, varchar, boolean, timestamp, check, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { user } from "./auth";
import { organizations } from "./organizations";

/**
 * 4 ta rasmiy biznes rol:
 * - super_admin: Platforma Boshqaruvchisi
 * - organization_admin: Tashkilot Rahbari (eski university_admin o'rniga)
 * - inspector: Inventarizatsiya Tekshiruvchisi
 * - registrar: Moddiy Javobgar Shaxs / Hisobchi
 */
export const USER_ROLES = ["super_admin", "organization_admin", "inspector", "registrar"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Profiles jadvali — MulkNazorat biznes-profili va rollar boshqaruvi
 * Better Auth `user` jadvalidan ajratilgan holda xavfsiz multi-tenancy va vakolat nazorati.
 */
export const profiles = pgTable(
  "profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    role: varchar("role", { length: 30 }).$type<UserRole>().notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    mustChangePassword: boolean("must_change_password").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // 1. Faqat 4 ta rasmiy biznes rol qabul qilinishi cheklovi
    check(
      "chk_profiles_role_valid",
      sql`${table.role} IN ('super_admin', 'organization_admin', 'inspector', 'registrar')`
    ),
    // 2. Ism bo'sh yoki faqat probellardan iborat bo'lmasligi cheklovi
    check(
      "chk_profiles_full_name_not_empty",
      sql`char_length(btrim(${table.fullName})) > 0`
    ),
    // 3. Rol va tashkilot bog'liqligi qat'iy qoidasi:
    //    super_admin: organization_id NULL bo'lishi shart
    //    organization_admin, inspector, registrar: organization_id majburiy (NOT NULL)
    check(
      "chk_profiles_role_organization",
      sql`(${table.role} = 'super_admin' AND ${table.organizationId} IS NULL) OR (${table.role} IN ('organization_admin', 'inspector', 'registrar') AND ${table.organizationId} IS NOT NULL)`
    ),
    // 4. Multi-tenancy: Tashkilot bo'yicha xodimlarni tezkor filtrlash indeksi
    index("idx_profiles_organization_id").on(table.organizationId),
  ]
);

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(user, {
    fields: [profiles.userId],
    references: [user.id],
  }),
  organization: one(organizations, {
    fields: [profiles.organizationId],
    references: [organizations.id],
  }),
}));

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
