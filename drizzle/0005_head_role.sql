ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "chk_profiles_role_valid";--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "chk_profiles_role_valid" CHECK ("profiles"."role" IN ('super_admin', 'organization_admin', 'head', 'inspector', 'registrar'));--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "chk_profiles_role_organization";--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "chk_profiles_role_organization" CHECK (("profiles"."role" = 'super_admin' AND "profiles"."organization_id" IS NULL) OR ("profiles"."role" IN ('organization_admin', 'head', 'inspector', 'registrar') AND "profiles"."organization_id" IS NOT NULL));
