import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";


/**
 * GET /api/health
 * Production Server & Database Health Check Endpoint.
 * Xavfsizlik qoidasi: Hech qanday maxfiy connection string, IP, DB nomi yoki credential chiqmaydi.
 */
export async function GET(request?: Request) {
  const startTime = performance.now();
  const mem = process.memoryUsage();

  try {
    const pool = getPool();
    // 2 soniyali timeout bilan SELECT 1
    const client = await pool.connect();
    let currentDbName: string | undefined;
    try {
      const res = await client.query("SELECT 1 AS health, current_database() AS db_name");
      const probeHeader = request?.headers?.get("x-assetaudit-test-probe");
      if (
        process.env.NODE_ENV !== "production" &&
        probeHeader === "mulknazorat-test-isolation-probe"
      ) {
        currentDbName = res.rows[0]?.db_name;
      }
    } finally {
      client.release();
    }

    const latencyMs = Math.round(performance.now() - startTime);

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptimeSec: Math.floor(process.uptime()),
        database: {
          status: "up",
          latencyMs,
          ...(currentDbName ? { isolatedTestDb: currentDbName } : {}),
        },
        system: {
          nodeVersion: process.version,
          memoryMb: {
            rss: Math.round(mem.rss / (1024 * 1024)),
            heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
          },
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch {
    const latencyMs = Math.round(performance.now() - startTime);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: {
          status: "down",
          latencyMs,
        },
        error: "Database connectivity check failed",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }
}
