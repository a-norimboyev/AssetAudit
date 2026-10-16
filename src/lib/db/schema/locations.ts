import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  check,
  uniqueIndex,
  unique,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { organizations } from "./organizations";

/**
 * 1. Binolar jadvali (Buildings)
 * Multi-tenant: Tashkilotga tegishli binolar (masalan: Bosh bino, A bino, O'quv binosi)
 */
export const buildings = pgTable(
  "buildings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    address: varchar("address", { length: 500 }),
    floorsCount: integer("floors_count").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("chk_buildings_name_not_empty", sql`char_length(btrim(${table.name})) > 0`),
    check("chk_buildings_code_not_empty", sql`char_length(btrim(${table.code})) > 0`),
    check("chk_buildings_floors_count_valid", sql`${table.floorsCount} >= 1 and ${table.floorsCount} <= 100`),
    unique("uq_buildings_org_id").on(table.organizationId, table.id),
    uniqueIndex("idx_buildings_org_code_unique").on(
      table.organizationId,
      sql`upper(btrim(${table.code}))`
    ),
    index("idx_buildings_organization_id").on(table.organizationId),
  ]
);

export const buildingsRelations = relations(buildings, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [buildings.organizationId],
    references: [organizations.id],
  }),
  floors: many(floors),
  rooms: many(rooms),
}));

export type Building = typeof buildings.$inferSelect;
export type NewBuilding = typeof buildings.$inferInsert;

/**
 * 2. Qavatlar jadvali (Floors)
 * Bino ichidagi qavatlar (masalan: -2, -1 (Yerto'la), 0 (Zamin), 1, 2, 3...)
 */
export const floors = pgTable(
  "floors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    buildingId: uuid("building_id")
      .references(() => buildings.id, { onDelete: "restrict" })
      .notNull(),
    floorNumber: integer("floor_number").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("chk_floors_name_not_empty", sql`char_length(btrim(${table.name})) > 0`),
    check("chk_floors_floor_number_range", sql`${table.floorNumber} >= -10 and ${table.floorNumber} <= 200`),
    unique("uq_floors_org_id").on(table.organizationId, table.id),
    unique("uq_floors_org_bld_id").on(table.organizationId, table.buildingId, table.id),
    foreignKey({
      columns: [table.organizationId, table.buildingId],
      foreignColumns: [buildings.organizationId, buildings.id],
      name: "fk_floors_building_composite",
    }).onDelete("restrict"),
    uniqueIndex("idx_floors_building_number_unique").on(
      table.buildingId,
      table.floorNumber
    ),
    index("idx_floors_organization_building").on(
      table.organizationId,
      table.buildingId
    ),
  ]
);

export const floorsRelations = relations(floors, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [floors.organizationId],
    references: [organizations.id],
  }),
  building: one(buildings, {
    fields: [floors.buildingId],
    references: [buildings.id],
  }),
  rooms: many(rooms),
}));

export type Floor = typeof floors.$inferSelect;
export type NewFloor = typeof floors.$inferInsert;

/**
 * 3. Xonalar jadvali (Rooms)
 * Qavat va bino ichidagi rasmiy xonalar (masalan: 101-xona, Laboratoriya 204)
 */
export const ROOM_TYPES = [
  "classroom",
  "lab",
  "office",
  "warehouse",
  "library",
  "conference",
  "server_room",
  "other",
] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    buildingId: uuid("building_id")
      .references(() => buildings.id, { onDelete: "restrict" })
      .notNull(),
    floorId: uuid("floor_id")
      .references(() => floors.id, { onDelete: "restrict" })
      .notNull(),
    roomNumber: varchar("room_number", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).$type<RoomType>().default("office").notNull(),
    capacity: integer("capacity"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("chk_rooms_number_not_empty", sql`char_length(btrim(${table.roomNumber})) > 0`),
    check("chk_rooms_name_not_empty", sql`char_length(btrim(${table.name})) > 0`),
    unique("uq_rooms_org_id").on(table.organizationId, table.id),
    unique("uq_rooms_hierarchy").on(
      table.organizationId,
      table.buildingId,
      table.floorId,
      table.id
    ),
    foreignKey({
      columns: [table.organizationId, table.buildingId],
      foreignColumns: [buildings.organizationId, buildings.id],
      name: "fk_rooms_building_composite",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.buildingId, table.floorId],
      foreignColumns: [floors.organizationId, floors.buildingId, floors.id],
      name: "fk_rooms_hierarchy_composite",
    }).onDelete("restrict"),
    uniqueIndex("idx_rooms_floor_number_unique").on(
      table.floorId,
      sql`upper(btrim(${table.roomNumber}))`
    ),
    index("idx_rooms_organization_id").on(table.organizationId),
    index("idx_rooms_building_id").on(table.buildingId),
    index("idx_rooms_floor_id").on(table.floorId),
  ]
);

export const roomsRelations = relations(rooms, ({ one }) => ({
  organization: one(organizations, {
    fields: [rooms.organizationId],
    references: [organizations.id],
  }),
  building: one(buildings, {
    fields: [rooms.buildingId],
    references: [buildings.id],
  }),
  floor: one(floors, {
    fields: [rooms.floorId],
    references: [floors.id],
  }),
}));

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
