CREATE TABLE "organization_types" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "organization_types" ("id", "name", "description") VALUES
	('university', 'Universitet / OTM', 'Oliy ta''lim muassasalari va universitetlar'),
	('institute', 'Institut / Ilmiy markaz', 'Ilmiy tadqiqot institutlari va markazlar'),
	('school', 'Umumta''lim maktabi', 'Davlat va xususiy umumta''lim maktablari'),
	('college', 'Kollej va texnikum', 'O''rta maxsus kasb-hunar ta''limi muassasalari'),
	('ministry', 'Vazirlik / Qo''mita', 'Markaziy davlat hokimiyati organlari'),
	('municipality', 'Hokimlik', 'Viloyat, shahar va tuman hokimliklari'),
	('state_agency', 'Davlat idorasi / Agentlik', 'Davlat agentliklari, inspeksiyalar va fondlar'),
	('enterprise', 'Davlat va xususiy korxona', 'Davlat ulushiga ega va xususiy xo''jalik yurituvchi subyektlar'),
	('other', 'Boshqa tashkilot', 'Boshqa turdagi jamoat va xususiy tashkilotlar')
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "universities" RENAME TO "organizations";--> statement-breakpoint
ALTER TABLE "profiles" RENAME COLUMN "university_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT "chk_universities_name_not_empty";--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT "chk_universities_code_not_empty";--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "chk_profiles_role_university";--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "chk_profiles_role_valid";--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_university_id_universities_id_fk";
--> statement-breakpoint
DROP INDEX "idx_universities_code_unique";--> statement-breakpoint
DROP INDEX "idx_profiles_university_id";--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "type_id" varchar(50);--> statement-breakpoint
UPDATE "organizations" SET "type_id" = 'university' WHERE "type_id" IS NULL;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "type_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_type_id_organization_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."organization_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_organizations_code_unique" ON "organizations" USING btree (upper(btrim("code")));--> statement-breakpoint
CREATE INDEX "idx_profiles_organization_id" ON "profiles" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "chk_organizations_name_not_empty" CHECK (char_length(btrim("organizations"."name")) > 0);--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "chk_organizations_code_not_empty" CHECK (char_length(btrim("organizations"."code")) > 0);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "chk_profiles_role_organization" CHECK (("profiles"."role" = 'super_admin' AND "profiles"."organization_id" IS NULL) OR ("profiles"."role" IN ('organization_admin', 'inspector', 'registrar') AND "profiles"."organization_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "chk_profiles_role_valid" CHECK ("profiles"."role" IN ('super_admin', 'organization_admin', 'inspector', 'registrar'));
--> statement-breakpoint
CREATE OR REPLACE FUNCTION set_organizations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_universities_updated_at ON "organizations";
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON "organizations";
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON "organizations"
    FOR EACH ROW
    EXECUTE FUNCTION set_organizations_updated_at();
--> statement-breakpoint
REVOKE ALL ON TABLE "organization_types" FROM PUBLIC;
GRANT SELECT ON TABLE "organization_types" TO mulknazorat_app;
GRANT SELECT ON TABLE "organizations" TO mulknazorat_app;