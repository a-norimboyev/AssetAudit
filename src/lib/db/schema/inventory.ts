import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  check,
  uniqueIndex,
  unique,
  foreignKey,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { organizations } from "./organizations";
import { buildings, floors, rooms } from "./locations";
import { user } from "./auth";

/**
 * 1. Inventar toifalari (Item Categories)
 */
export const itemCategories = pgTable("item_categories", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export type ItemCategory = typeof itemCategories.$inferSelect;
export type NewItemCategory = typeof itemCategories.$inferInsert;

export const ITEM_STATUSES = [
  "active",
  "repair",
  "written_off",
  "transferred",
  "lost",
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ITEM_CONDITIONS = [
  "new",
  "good",
  "fair",
  "poor",
  "broken",
] as const;
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];

/**
 * 2. Asosiy Inventarlar jadvali (Items)
 * Multi-tenant QR inventarizatsiyaning markaziy jadvali
 */
export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    inventoryNumber: varchar("inventory_number", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    categoryId: varchar("category_id", { length: 50 })
      .references(() => itemCategories.id, { onDelete: "restrict" })
      .notNull(),
    description: text("description"),
    buildingId: uuid("building_id")
      .references(() => buildings.id, { onDelete: "restrict" })
      .notNull(),
    floorId: uuid("floor_id")
      .references(() => floors.id, { onDelete: "restrict" })
      .notNull(),
    roomId: uuid("room_id")
      .references(() => rooms.id, { onDelete: "restrict" })
      .notNull(),
    status: varchar("status", { length: 30 })
      .$type<ItemStatus>()
      .default("active")
      .notNull(),
    condition: varchar("condition", { length: 30 })
      .$type<ItemCondition>()
      .default("good")
      .notNull(),
    photoUrl: text("photo_url"),
    qrToken: varchar("qr_token", { length: 64 }).notNull().unique(),
    responsiblePersonId: text("responsible_person_id").references(() => user.id, {
      onDelete: "set null",
    }),
    price: numeric("price", { precision: 15, scale: 2 }),
    currency: varchar("currency", { length: 10 }).default("UZS").notNull(),
    acquisitionDate: timestamp("acquisition_date", { withTimezone: true, mode: "date" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "chk_items_inv_number_not_empty",
      sql`char_length(btrim(${table.inventoryNumber})) > 0`
    ),
    check(
      "chk_items_name_not_empty",
      sql`char_length(btrim(${table.name})) > 0`
    ),
    check(
      "chk_items_qr_token_not_empty",
      sql`char_length(btrim(${table.qrToken})) > 0`
    ),
    unique("uq_items_org_id").on(table.organizationId, table.id),
    foreignKey({
      columns: [table.organizationId, table.buildingId, table.floorId, table.roomId],
      foreignColumns: [rooms.organizationId, rooms.buildingId, rooms.floorId, rooms.id],
      name: "fk_items_hierarchy_composite",
    }).onDelete("restrict"),
    uniqueIndex("idx_items_org_inv_number_unique").on(
      table.organizationId,
      sql`upper(btrim(${table.inventoryNumber}))`
    ),
    index("idx_items_organization_id").on(table.organizationId),
    index("idx_items_room_id").on(table.roomId),
    index("idx_items_building_id").on(table.buildingId),
    index("idx_items_category_id").on(table.categoryId),
    index("idx_items_status").on(table.status),
    uniqueIndex("idx_items_qr_token_unique").on(table.qrToken),
  ]
);

export const itemsRelations = relations(items, ({ one }) => ({
  organization: one(organizations, {
    fields: [items.organizationId],
    references: [organizations.id],
  }),
  category: one(itemCategories, {
    fields: [items.categoryId],
    references: [itemCategories.id],
  }),
  building: one(buildings, {
    fields: [items.buildingId],
    references: [buildings.id],
  }),
  floor: one(floors, {
    fields: [items.floorId],
    references: [floors.id],
  }),
  room: one(rooms, {
    fields: [items.roomId],
    references: [rooms.id],
  }),
  responsiblePerson: one(user, {
    fields: [items.responsiblePersonId],
    references: [user.id],
  }),
}));

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
