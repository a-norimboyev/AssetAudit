import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  timestamp,
  check,
  uniqueIndex,
  unique,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { organizations } from "./organizations";
import { buildings, floors, rooms } from "./locations";
import { items } from "./inventory";
import { user } from "./auth";

export const CYCLE_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type CycleStatus = (typeof CYCLE_STATUSES)[number];

export const ROOM_AUDIT_STATUSES = [
  "pending",
  "in_progress",
  "completed",
] as const;
export type RoomAuditStatus = (typeof ROOM_AUDIT_STATUSES)[number];

export const CONFLICT_STATUSES = [
  "open",
  "resolved_relocated",
  "resolved_returned",
  "dismissed",
] as const;
export type ConflictStatus = (typeof CONFLICT_STATUSES)[number];

/**
 * 1. Inventarizatsiya Sikllari (Inventory Cycles)
 * Masalan: "2026-yil Kuzgi audit", "TATU A bino rejaviy sanog'i"
 */
export const inventoryCycles = pgTable(
  "inventory_cycles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    status: varchar("status", { length: 30 })
      .$type<CycleStatus>()
      .default("planned")
      .notNull(),
    startDate: timestamp("start_date", { withTimezone: true, mode: "date" }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true, mode: "date" }),
    createdBy: text("created_by")
      .references(() => user.id, { onDelete: "restrict" })
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "chk_cycles_title_not_empty",
      sql`char_length(btrim(${table.title})) > 0`
    ),
    unique("uq_cycles_org_id").on(table.organizationId, table.id),
    index("idx_cycles_organization_status").on(
      table.organizationId,
      table.status
    ),
  ]
);

export const inventoryCyclesRelations = relations(
  inventoryCycles,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [inventoryCycles.organizationId],
      references: [organizations.id],
    }),
    creator: one(user, {
      fields: [inventoryCycles.createdBy],
      references: [user.id],
    }),
    cycleItems: many(cycleItems),
    roomAudits: many(roomAudits),
    scanEvents: many(scanEvents),
    conflicts: many(cycleConflicts),
  })
);

export type InventoryCycle = typeof inventoryCycles.$inferSelect;
export type NewInventoryCycle = typeof inventoryCycles.$inferInsert;

/**
 * 2. Sikl Doirasidagi Muzlatilgan Inventar Holati (Immutable Cycle Snapshot)
 * Sikl boshlangan paytdagi kutilgan barcha faol mulklar ko'chirmasi
 */
export const cycleItems = pgTable(
  "cycle_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cycleId: uuid("cycle_id")
      .references(() => inventoryCycles.id, { onDelete: "restrict" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    itemId: uuid("item_id")
      .references(() => items.id, { onDelete: "restrict" })
      .notNull(),
    expectedBuildingId: uuid("expected_building_id")
      .references(() => buildings.id, { onDelete: "restrict" })
      .notNull(),
    expectedFloorId: uuid("expected_floor_id")
      .references(() => floors.id, { onDelete: "restrict" })
      .notNull(),
    expectedRoomId: uuid("expected_room_id")
      .references(() => rooms.id, { onDelete: "restrict" })
      .notNull(),
    inventoryNumber: varchar("inventory_number", { length: 100 }).notNull(),
    itemName: varchar("item_name", { length: 255 }).notNull(),
    categoryId: varchar("category_id", { length: 50 }).notNull(),
    condition: varchar("condition", { length: 30 }).notNull(),
    price: numeric("price", { precision: 15, scale: 2 }),
    snapshotAt: timestamp("snapshot_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("uq_cycle_items_cycle_item").on(table.cycleId, table.itemId),
    foreignKey({
      columns: [table.organizationId, table.cycleId],
      foreignColumns: [inventoryCycles.organizationId, inventoryCycles.id],
      name: "fk_cycle_items_cycle_composite",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.itemId],
      foreignColumns: [items.organizationId, items.id],
      name: "fk_cycle_items_item_composite",
    }).onDelete("restrict"),
    foreignKey({
      columns: [
        table.organizationId,
        table.expectedBuildingId,
        table.expectedFloorId,
        table.expectedRoomId,
      ],
      foreignColumns: [
        rooms.organizationId,
        rooms.buildingId,
        rooms.floorId,
        rooms.id,
      ],
      name: "fk_cycle_items_hierarchy_composite",
    }).onDelete("restrict"),
    index("idx_cycle_items_cycle_id").on(table.cycleId),
    index("idx_cycle_items_org_id").on(table.organizationId),
    index("idx_cycle_items_room_id").on(table.expectedRoomId),
  ]
);

export const cycleItemsRelations = relations(cycleItems, ({ one }) => ({
  cycle: one(inventoryCycles, {
    fields: [cycleItems.cycleId],
    references: [inventoryCycles.id],
  }),
  item: one(items, {
    fields: [cycleItems.itemId],
    references: [items.id],
  }),
  expectedRoom: one(rooms, {
    fields: [cycleItems.expectedRoomId],
    references: [rooms.id],
  }),
}));

export type CycleItem = typeof cycleItems.$inferSelect;
export type NewCycleItem = typeof cycleItems.$inferInsert;

/**
 * 3. Xonalar Auditi Holati (Room Audits)
 * Har bir sikl doirasida xonaning tekshirilish holati (pending, in_progress, completed)
 */
export const roomAudits = pgTable(
  "room_audits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cycleId: uuid("cycle_id")
      .references(() => inventoryCycles.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    roomId: uuid("room_id")
      .references(() => rooms.id, { onDelete: "restrict" })
      .notNull(),
    status: varchar("status", { length: 30 })
      .$type<RoomAuditStatus>()
      .default("pending")
      .notNull(),
    auditedBy: text("audited_by").references(() => user.id, {
      onDelete: "set null",
    }),
    auditedAt: timestamp("audited_at", { withTimezone: true, mode: "date" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_room_audits_cycle_room_unique").on(
      table.cycleId,
      table.roomId
    ),
    foreignKey({
      columns: [table.organizationId, table.cycleId],
      foreignColumns: [inventoryCycles.organizationId, inventoryCycles.id],
      name: "fk_room_audits_cycle_composite",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.roomId],
      foreignColumns: [rooms.organizationId, rooms.id],
      name: "fk_room_audits_room_composite",
    }).onDelete("restrict"),
    index("idx_room_audits_organization_cycle").on(
      table.organizationId,
      table.cycleId
    ),
    index("idx_room_audits_room_id").on(table.roomId),
  ]
);

export const roomAuditsRelations = relations(roomAudits, ({ one }) => ({
  cycle: one(inventoryCycles, {
    fields: [roomAudits.cycleId],
    references: [inventoryCycles.id],
  }),
  room: one(rooms, {
    fields: [roomAudits.roomId],
    references: [rooms.id],
  }),
  auditor: one(user, {
    fields: [roomAudits.auditedBy],
    references: [user.id],
  }),
}));

export type RoomAudit = typeof roomAudits.$inferSelect;
export type NewRoomAudit = typeof roomAudits.$inferInsert;

/**
 * 4. QR Skanerlash Hodisalari (Scan Events)
 * Har bir audit skanining xolis append-only jurnali (WORM)
 */
export const scanEvents = pgTable(
  "scan_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    cycleId: uuid("cycle_id").references(() => inventoryCycles.id, {
      onDelete: "restrict",
    }),
    itemId: uuid("item_id")
      .references(() => items.id, { onDelete: "restrict" })
      .notNull(),
    expectedRoomId: uuid("expected_room_id")
      .references(() => rooms.id, { onDelete: "restrict" })
      .notNull(),
    scannedRoomId: uuid("scanned_room_id")
      .references(() => rooms.id, { onDelete: "restrict" })
      .notNull(),
    isMatch: boolean("is_match").notNull(),
    isConflict: boolean("is_conflict").notNull(),
    scannedBy: text("scanned_by")
      .references(() => user.id, { onDelete: "restrict" })
      .notNull(),
    scannedAt: timestamp("scanned_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    notes: text("notes"),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.itemId],
      foreignColumns: [items.organizationId, items.id],
      name: "fk_scan_events_item_composite",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.expectedRoomId],
      foreignColumns: [rooms.organizationId, rooms.id],
      name: "fk_scan_events_exp_room_composite",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.scannedRoomId],
      foreignColumns: [rooms.organizationId, rooms.id],
      name: "fk_scan_events_scanned_room_composite",
    }).onDelete("restrict"),
    index("idx_scan_events_org_cycle_item").on(
      table.organizationId,
      table.cycleId,
      table.itemId
    ),
    index("idx_scan_events_org_scanned_at").on(
      table.organizationId,
      table.scannedAt
    ),
    index("idx_scan_events_is_conflict").on(table.isConflict),
  ]
);

export const scanEventsRelations = relations(scanEvents, ({ one }) => ({
  cycle: one(inventoryCycles, {
    fields: [scanEvents.cycleId],
    references: [inventoryCycles.id],
  }),
  item: one(items, {
    fields: [scanEvents.itemId],
    references: [items.id],
  }),
  expectedRoom: one(rooms, {
    fields: [scanEvents.expectedRoomId],
    references: [rooms.id],
  }),
  scannedRoom: one(rooms, {
    fields: [scanEvents.scannedRoomId],
    references: [rooms.id],
  }),
  scanner: one(user, {
    fields: [scanEvents.scannedBy],
    references: [user.id],
  }),
}));

export type ScanEvent = typeof scanEvents.$inferSelect;
export type NewScanEvent = typeof scanEvents.$inferInsert;

/**
 * 5. Sikl Konfliktlari va Ularni Hal Qilish Jurnali (Cycle Conflicts Resolution)
 */
export const cycleConflicts = pgTable(
  "cycle_conflicts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cycleId: uuid("cycle_id")
      .references(() => inventoryCycles.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    itemId: uuid("item_id")
      .references(() => items.id, { onDelete: "restrict" })
      .notNull(),
    scanEventId: uuid("scan_event_id")
      .references(() => scanEvents.id, { onDelete: "cascade" })
      .notNull(),
    expectedRoomId: uuid("expected_room_id")
      .references(() => rooms.id, { onDelete: "restrict" })
      .notNull(),
    scannedRoomId: uuid("scanned_room_id")
      .references(() => rooms.id, { onDelete: "restrict" })
      .notNull(),
    status: varchar("status", { length: 30 })
      .$type<ConflictStatus>()
      .default("open")
      .notNull(),
    resolutionNotes: text("resolution_notes"),
    resolvedBy: text("resolved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "chk_conflicts_status_valid",
      sql`${table.status} IN ('open', 'resolved_relocated', 'resolved_returned', 'dismissed')`
    ),
    unique("uq_cycle_conflicts_cycle_item").on(table.cycleId, table.itemId),
    foreignKey({
      columns: [table.organizationId, table.cycleId],
      foreignColumns: [inventoryCycles.organizationId, inventoryCycles.id],
      name: "fk_cycle_conflicts_cycle_composite",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.itemId],
      foreignColumns: [items.organizationId, items.id],
      name: "fk_cycle_conflicts_item_composite",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.expectedRoomId],
      foreignColumns: [rooms.organizationId, rooms.id],
      name: "fk_cycle_conflicts_exp_room_composite",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.scannedRoomId],
      foreignColumns: [rooms.organizationId, rooms.id],
      name: "fk_cycle_conflicts_scanned_room_composite",
    }).onDelete("restrict"),
    index("idx_cycle_conflicts_cycle_status").on(table.cycleId, table.status),
    index("idx_cycle_conflicts_org_id").on(table.organizationId),
  ]
);

export const cycleConflictsRelations = relations(cycleConflicts, ({ one }) => ({
  cycle: one(inventoryCycles, {
    fields: [cycleConflicts.cycleId],
    references: [inventoryCycles.id],
  }),
  item: one(items, {
    fields: [cycleConflicts.itemId],
    references: [items.id],
  }),
  scanEvent: one(scanEvents, {
    fields: [cycleConflicts.scanEventId],
    references: [scanEvents.id],
  }),
  expectedRoom: one(rooms, {
    fields: [cycleConflicts.expectedRoomId],
    references: [rooms.id],
  }),
  scannedRoom: one(rooms, {
    fields: [cycleConflicts.scannedRoomId],
    references: [rooms.id],
  }),
  resolver: one(user, {
    fields: [cycleConflicts.resolvedBy],
    references: [user.id],
  }),
}));

export type CycleConflict = typeof cycleConflicts.$inferSelect;
export type NewCycleConflict = typeof cycleConflicts.$inferInsert;
