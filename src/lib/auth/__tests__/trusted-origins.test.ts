import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getTrustedOrigins } from "@/lib/auth";

describe("AssetAudit — Trusted Origins & CSRF Security Policy", () => {
  const originalEnv = { ...process.env };

  const resetEnv = () => {
    process.env = { ...originalEnv };
  };

  it("1. Production mode restricts origins strictly to official HTTPS domains", () => {
    try {
      Object.assign(process.env, {
        NODE_ENV: "production",
        BETTER_AUTH_URL: "https://assetaudit.uz/",
      });

      const origins = getTrustedOrigins();

      assert.ok(origins.includes("https://assetaudit.uz"), "Production must trust https://assetaudit.uz");
      assert.ok(origins.includes("https://www.assetaudit.uz"), "Production must trust https://www.assetaudit.uz");

      // Verify NO localhost or 127.0.0.1 is permitted in production
      for (const origin of origins) {
        assert.ok(!origin.includes("localhost"), `Production must never trust localhost: ${origin}`);
        assert.ok(!origin.includes("127.0.0.1"), `Production must never trust 127.0.0.1: ${origin}`);
        assert.ok(origin.startsWith("https://"), `All production trusted origins must use HTTPS: ${origin}`);
      }

      // Verify no wildcard
      assert.ok(!origins.includes("*"), "Wildcard * origin is strictly forbidden");
    } finally {
      resetEnv();
    }
  });

  it("2. Production mode rejects non-HTTPS custom BETTER_AUTH_URL", () => {
    try {
      Object.assign(process.env, {
        NODE_ENV: "production",
        BETTER_AUTH_URL: "http://malicious-or-unencrypted.com",
      });

      const origins = getTrustedOrigins();

      assert.ok(!origins.includes("http://malicious-or-unencrypted.com"), "Insecure HTTP URL must not be added in production");
      assert.ok(origins.includes("https://assetaudit.uz"));
    } finally {
      resetEnv();
    }
  });

  it("3. Development and test environments allow local loopback origins with standard ports", () => {
    try {
      Object.assign(process.env, {
        NODE_ENV: "development",
      });
      delete process.env.BETTER_AUTH_URL;

      const origins = getTrustedOrigins();

      assert.ok(origins.includes("http://localhost:3000"));
      assert.ok(origins.includes("http://localhost:3001"));
      assert.ok(origins.includes("http://localhost:3005"));
      assert.ok(origins.includes("http://127.0.0.1:3000"));
      assert.ok(origins.includes("http://127.0.0.1:3001"));
      assert.ok(origins.includes("http://127.0.0.1:3005"));

      assert.ok(!origins.includes("*"), "Wildcard * origin must never be permitted");
    } finally {
      resetEnv();
    }
  });

  it("4. Normalizes trailing slashes on custom BETTER_AUTH_URL", () => {
    try {
      Object.assign(process.env, {
        NODE_ENV: "development",
        BETTER_AUTH_URL: "http://127.0.0.1:3001/",
      });

      const origins = getTrustedOrigins();

      assert.ok(origins.includes("http://127.0.0.1:3001"), "Trailing slash must be stripped");
      assert.ok(!origins.includes("http://127.0.0.1:3001/"), "Raw URL with trailing slash must not exist in set");
    } finally {
      resetEnv();
    }
  });
});
