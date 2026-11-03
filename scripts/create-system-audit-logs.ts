import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS system_audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_user_id TEXT,
      actor_name VARCHAR(255),
      organization_id UUID,
      organization_name VARCHAR(255),
      event VARCHAR(100) NOT NULL,
      action VARCHAR(255) NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_system_audit_logs_created_at ON system_audit_logs (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_system_audit_logs_event ON system_audit_logs (event);
  `);

  console.log("system_audit_logs table verified successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
