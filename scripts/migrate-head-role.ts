import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Applying head role constraints to PostgreSQL database...");
  await db.execute(sql`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_profiles_role_valid;`);
  await db.execute(sql`ALTER TABLE profiles ADD CONSTRAINT chk_profiles_role_valid CHECK (role IN ('super_admin', 'organization_admin', 'head', 'inspector', 'registrar'));`);
  await db.execute(sql`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_profiles_role_organization;`);
  await db.execute(sql`ALTER TABLE profiles ADD CONSTRAINT chk_profiles_role_organization CHECK ((role = 'super_admin' AND organization_id IS NULL) OR (role IN ('organization_admin', 'head', 'inspector', 'registrar') AND organization_id IS NOT NULL));`);
  console.log("Constraints updated successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  });
