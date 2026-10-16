import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET } from "@/app/api/health/route";

describe("AssetAudit — Production Health Check & Monitoring API", () => {
  it("1. GET /api/health returns 200 and healthy status with live DB connection", async () => {
    const response = await GET();
    assert.equal(response.status, 200, "Health check status must be 200");

    const data = await response.json();
    assert.equal(data.status, "healthy");
    assert.equal(data.database.status, "up");
    assert.ok(typeof data.database.latencyMs === "number", "Latency must be a number");
    assert.ok(data.database.latencyMs >= 0, "Latency must be non-negative");
    assert.ok(typeof data.uptimeSec === "number", "Uptime must be a number");
    assert.ok(typeof data.system.memoryMb.rss === "number", "RSS memory must be reported");
    assert.ok(typeof data.system.memoryMb.heapUsed === "number", "Heap memory must be reported");
  });

  it("2. GET /api/health does NOT leak database credentials or internal secrets", async () => {
    const response = await GET();
    const rawText = await response.text();

    // Check that sensitive env values and connection strings are absent
    assert.doesNotMatch(rawText, /postgresql:\/\//i, "Must not leak raw postgres URL");
    assert.doesNotMatch(rawText, /password/i, "Must not leak password fields");
    assert.doesNotMatch(rawText, /secret/i, "Must not leak secret keys");
    assert.doesNotMatch(rawText, /5432|5433/, "Must not leak port numbers");
    assert.doesNotMatch(rawText, /mulknazorat/, "Must not leak internal DB names");
  });
});
