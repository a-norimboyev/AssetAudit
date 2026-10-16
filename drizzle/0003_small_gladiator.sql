CREATE TABLE "buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"address" varchar(500),
	"floors_count" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_buildings_org_id" UNIQUE("organization_id","id"),
	CONSTRAINT "chk_buildings_name_not_empty" CHECK (char_length(btrim("buildings"."name")) > 0),
	CONSTRAINT "chk_buildings_code_not_empty" CHECK (char_length(btrim("buildings"."code")) > 0),
	CONSTRAINT "chk_buildings_floors_count_valid" CHECK ("buildings"."floors_count" >= 1 AND "buildings"."floors_count" <= 100)
);
--> statement-breakpoint
CREATE TABLE "floors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"building_id" uuid NOT NULL,
	"floor_number" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_floors_org_id" UNIQUE("organization_id","id"),
	CONSTRAINT "uq_floors_org_bld_id" UNIQUE("organization_id","building_id","id"),
	CONSTRAINT "chk_floors_name_not_empty" CHECK (char_length(btrim("floors"."name")) > 0),
	CONSTRAINT "chk_floors_floor_number_range" CHECK ("floors"."floor_number" >= -10 AND "floors"."floor_number" <= 200)
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"building_id" uuid NOT NULL,
	"floor_id" uuid NOT NULL,
	"room_number" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) DEFAULT 'office' NOT NULL,
	"capacity" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_rooms_org_id" UNIQUE("organization_id","id"),
	CONSTRAINT "uq_rooms_hierarchy" UNIQUE("organization_id","building_id","floor_id","id"),
	CONSTRAINT "chk_rooms_number_not_empty" CHECK (char_length(btrim("rooms"."room_number")) > 0),
	CONSTRAINT "chk_rooms_name_not_empty" CHECK (char_length(btrim("rooms"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "item_categories" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"inventory_number" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" varchar(50) NOT NULL,
	"description" text,
	"building_id" uuid NOT NULL,
	"floor_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	"condition" varchar(30) DEFAULT 'good' NOT NULL,
	"photo_url" text,
	"qr_token" varchar(64) NOT NULL,
	"responsible_person_id" text,
	"price" numeric(15, 2),
	"currency" varchar(10) DEFAULT 'UZS' NOT NULL,
	"acquisition_date" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_qr_token_unique" UNIQUE("qr_token"),
	CONSTRAINT "uq_items_org_id" UNIQUE("organization_id","id"),
	CONSTRAINT "chk_items_inv_number_not_empty" CHECK (char_length(btrim("items"."inventory_number")) > 0),
	CONSTRAINT "chk_items_name_not_empty" CHECK (char_length(btrim("items"."name")) > 0),
	CONSTRAINT "chk_items_qr_token_not_empty" CHECK (char_length(btrim("items"."qr_token")) > 0)
);
--> statement-breakpoint
CREATE TABLE "cycle_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"scan_event_id" uuid NOT NULL,
	"expected_room_id" uuid NOT NULL,
	"scanned_room_id" uuid NOT NULL,
	"status" varchar(30) DEFAULT 'open' NOT NULL,
	"resolution_notes" text,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_cycle_conflicts_cycle_item" UNIQUE("cycle_id","item_id"),
	CONSTRAINT "chk_conflicts_status_valid" CHECK ("cycle_conflicts"."status" IN ('open', 'resolved_relocated', 'resolved_returned', 'dismissed'))
);
--> statement-breakpoint
CREATE TABLE "cycle_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"expected_building_id" uuid NOT NULL,
	"expected_floor_id" uuid NOT NULL,
	"expected_room_id" uuid NOT NULL,
	"inventory_number" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"category_id" varchar(50) NOT NULL,
	"condition" varchar(30) NOT NULL,
	"price" numeric(15, 2),
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_cycle_items_cycle_item" UNIQUE("cycle_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"status" varchar(30) DEFAULT 'planned' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"created_by" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_cycles_org_id" UNIQUE("organization_id","id"),
	CONSTRAINT "chk_cycles_title_not_empty" CHECK (char_length(btrim("inventory_cycles"."title")) > 0)
);
--> statement-breakpoint
CREATE TABLE "room_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"audited_by" text,
	"audited_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"cycle_id" uuid,
	"item_id" uuid NOT NULL,
	"expected_room_id" uuid NOT NULL,
	"scanned_room_id" uuid NOT NULL,
	"is_match" boolean NOT NULL,
	"is_conflict" boolean NOT NULL,
	"scanned_by" text NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floors" ADD CONSTRAINT "floors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floors" ADD CONSTRAINT "floors_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floors" ADD CONSTRAINT "fk_floors_building_composite" FOREIGN KEY ("organization_id","building_id") REFERENCES "public"."buildings"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "fk_rooms_building_composite" FOREIGN KEY ("organization_id","building_id") REFERENCES "public"."buildings"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "fk_rooms_hierarchy_composite" FOREIGN KEY ("organization_id","building_id","floor_id") REFERENCES "public"."floors"("organization_id","building_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_item_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."item_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_responsible_person_id_user_id_fk" FOREIGN KEY ("responsible_person_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "fk_items_hierarchy_composite" FOREIGN KEY ("organization_id","building_id","floor_id","room_id") REFERENCES "public"."rooms"("organization_id","building_id","floor_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_conflicts" ADD CONSTRAINT "cycle_conflicts_cycle_id_inventory_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."inventory_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_conflicts" ADD CONSTRAINT "cycle_conflicts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_conflicts" ADD CONSTRAINT "cycle_conflicts_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_conflicts" ADD CONSTRAINT "cycle_conflicts_scan_event_id_scan_events_id_fk" FOREIGN KEY ("scan_event_id") REFERENCES "public"."scan_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_conflicts" ADD CONSTRAINT "cycle_conflicts_expected_room_id_rooms_id_fk" FOREIGN KEY ("expected_room_id") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_conflicts" ADD CONSTRAINT "cycle_conflicts_scanned_room_id_rooms_id_fk" FOREIGN KEY ("scanned_room_id") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_conflicts" ADD CONSTRAINT "cycle_conflicts_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_conflicts" ADD CONSTRAINT "fk_cycle_conflicts_cycle_composite" FOREIGN KEY ("organization_id","cycle_id") REFERENCES "public"."inventory_cycles"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_conflicts" ADD CONSTRAINT "fk_cycle_conflicts_item_composite" FOREIGN KEY ("organization_id","item_id") REFERENCES "public"."items"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_conflicts" ADD CONSTRAINT "fk_cycle_conflicts_exp_room_composite" FOREIGN KEY ("organization_id","expected_room_id") REFERENCES "public"."rooms"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_conflicts" ADD CONSTRAINT "fk_cycle_conflicts_scanned_room_composite" FOREIGN KEY ("organization_id","scanned_room_id") REFERENCES "public"."rooms"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_items" ADD CONSTRAINT "cycle_items_cycle_id_inventory_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."inventory_cycles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_items" ADD CONSTRAINT "cycle_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_items" ADD CONSTRAINT "cycle_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_items" ADD CONSTRAINT "cycle_items_expected_building_id_buildings_id_fk" FOREIGN KEY ("expected_building_id") REFERENCES "public"."buildings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_items" ADD CONSTRAINT "cycle_items_expected_floor_id_floors_id_fk" FOREIGN KEY ("expected_floor_id") REFERENCES "public"."floors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_items" ADD CONSTRAINT "cycle_items_expected_room_id_rooms_id_fk" FOREIGN KEY ("expected_room_id") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_items" ADD CONSTRAINT "fk_cycle_items_cycle_composite" FOREIGN KEY ("organization_id","cycle_id") REFERENCES "public"."inventory_cycles"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_items" ADD CONSTRAINT "fk_cycle_items_item_composite" FOREIGN KEY ("organization_id","item_id") REFERENCES "public"."items"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_items" ADD CONSTRAINT "fk_cycle_items_hierarchy_composite" FOREIGN KEY ("organization_id","expected_building_id","expected_floor_id","expected_room_id") REFERENCES "public"."rooms"("organization_id","building_id","floor_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_cycles" ADD CONSTRAINT "inventory_cycles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_cycles" ADD CONSTRAINT "inventory_cycles_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_audits" ADD CONSTRAINT "room_audits_cycle_id_inventory_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."inventory_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_audits" ADD CONSTRAINT "room_audits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_audits" ADD CONSTRAINT "room_audits_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_audits" ADD CONSTRAINT "room_audits_audited_by_user_id_fk" FOREIGN KEY ("audited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_audits" ADD CONSTRAINT "fk_room_audits_cycle_composite" FOREIGN KEY ("organization_id","cycle_id") REFERENCES "public"."inventory_cycles"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_audits" ADD CONSTRAINT "fk_room_audits_room_composite" FOREIGN KEY ("organization_id","room_id") REFERENCES "public"."rooms"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_cycle_id_inventory_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."inventory_cycles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_expected_room_id_rooms_id_fk" FOREIGN KEY ("expected_room_id") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_scanned_room_id_rooms_id_fk" FOREIGN KEY ("scanned_room_id") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_scanned_by_user_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "fk_scan_events_item_composite" FOREIGN KEY ("organization_id","item_id") REFERENCES "public"."items"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "fk_scan_events_exp_room_composite" FOREIGN KEY ("organization_id","expected_room_id") REFERENCES "public"."rooms"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "fk_scan_events_scanned_room_composite" FOREIGN KEY ("organization_id","scanned_room_id") REFERENCES "public"."rooms"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_buildings_org_code_unique" ON "buildings" USING btree ("organization_id",upper(btrim("code")));--> statement-breakpoint
CREATE INDEX "idx_buildings_organization_id" ON "buildings" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_floors_building_number_unique" ON "floors" USING btree ("building_id","floor_number");--> statement-breakpoint
CREATE INDEX "idx_floors_organization_building" ON "floors" USING btree ("organization_id","building_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rooms_floor_number_unique" ON "rooms" USING btree ("floor_id",upper(btrim("room_number")));--> statement-breakpoint
CREATE INDEX "idx_rooms_organization_id" ON "rooms" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_rooms_building_id" ON "rooms" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "idx_rooms_floor_id" ON "rooms" USING btree ("floor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_items_org_inv_number_unique" ON "items" USING btree ("organization_id",upper(btrim("inventory_number")));--> statement-breakpoint
CREATE INDEX "idx_items_organization_id" ON "items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_items_room_id" ON "items" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_items_building_id" ON "items" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "idx_items_category_id" ON "items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_items_status" ON "items" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_items_qr_token_unique" ON "items" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX "idx_cycle_conflicts_cycle_status" ON "cycle_conflicts" USING btree ("cycle_id","status");--> statement-breakpoint
CREATE INDEX "idx_cycle_conflicts_org_id" ON "cycle_conflicts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_cycle_items_cycle_id" ON "cycle_items" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "idx_cycle_items_org_id" ON "cycle_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_cycle_items_room_id" ON "cycle_items" USING btree ("expected_room_id");--> statement-breakpoint
CREATE INDEX "idx_cycles_organization_status" ON "inventory_cycles" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_room_audits_cycle_room_unique" ON "room_audits" USING btree ("cycle_id","room_id");--> statement-breakpoint
CREATE INDEX "idx_room_audits_organization_cycle" ON "room_audits" USING btree ("organization_id","cycle_id");--> statement-breakpoint
CREATE INDEX "idx_room_audits_room_id" ON "room_audits" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_scan_events_org_cycle_item" ON "scan_events" USING btree ("organization_id","cycle_id","item_id");--> statement-breakpoint
CREATE INDEX "idx_scan_events_org_scanned_at" ON "scan_events" USING btree ("organization_id","scanned_at");--> statement-breakpoint
CREATE INDEX "idx_scan_events_is_conflict" ON "scan_events" USING btree ("is_conflict");
--> statement-breakpoint
INSERT INTO "item_categories" ("id", "name", "description") VALUES
	('computer_equipment', 'Kompyuter va orgtexnika', 'Monobloklar, noutbuklar, monitorlar, printerlar'),
	('furniture', 'Mebel va jihozlar', 'Partalar, stollar, stullar, shkaflar'),
	('appliances', 'Maishiy va iqlim texnikasi', 'Konditsionerlar, televizorlar, sovutgichlar'),
	('laboratory', 'Laboratoriya va o''quv jihozlari', 'Mikroskoplar, stendlar, asbob-uskunalar'),
	('network', 'Tarmoq va server uskunalari', 'Serverlar, marshrutizatorlar, kommutatorlar'),
	('vehicles', 'Transport vositalari', 'Avtomashinalar va maxsus transport'),
	('other', 'Boshqa asosiy vositalar', 'Boshqa inventarizatsiya ob''yektlari')
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
REVOKE ALL ON TABLE "buildings", "floors", "rooms", "item_categories", "items", "inventory_cycles", "cycle_items", "room_audits", "scan_events", "cycle_conflicts" FROM PUBLIC;
--> statement-breakpoint
GRANT SELECT ON TABLE "item_categories" TO mulknazorat_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "buildings", "floors", "rooms", "items" TO mulknazorat_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE "inventory_cycles", "room_audits", "cycle_conflicts" TO mulknazorat_app;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "cycle_items", "scan_events" TO mulknazorat_app;