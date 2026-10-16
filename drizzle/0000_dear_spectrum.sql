CREATE TABLE "universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_universities_name_not_empty" CHECK (char_length(btrim("universities"."name")) > 0),
	CONSTRAINT "chk_universities_code_not_empty" CHECK (char_length(btrim("universities"."code")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_universities_code_unique" ON "universities" USING btree (upper(btrim("code")));
--> statement-breakpoint
CREATE OR REPLACE FUNCTION set_universities_updated_at()
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
DROP TRIGGER IF EXISTS trg_universities_updated_at ON "universities";
CREATE TRIGGER trg_universities_updated_at
    BEFORE UPDATE ON "universities"
    FOR EACH ROW
    EXECUTE FUNCTION set_universities_updated_at();