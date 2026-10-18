/**
 * AssetAudit — Sprint 13: Izolyatsiyalangan HTTP Auth Test Runner
 * Maqsad: 3 SKIP testni alohida 3005-portda test DB ga ulangan Next.js orqali PASS qilish.
 */

import { spawn, execSync, ChildProcess } from "node:child_process";
import * as http from "node:http";

const TEST_PORT = parseInt(process.env.TEST_PORT || process.env.PORT || "3001", 10);
const TEST_BASE_URL = process.env.TEST_SERVER_URL || `http://localhost:${TEST_PORT}`;
const EXPECTED_TEST_DB = "mulknazorat_sprint05b_test";
const TEST_DB_URL = `postgresql://postgres@127.0.0.1:5432/${EXPECTED_TEST_DB}`;

interface ProbeResult {
  isRunning: boolean;
  isTestDb: boolean;
  dbName?: string;
}

function probeServerDb(url: string, timeoutMs = 2000): Promise<ProbeResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: ProbeResult) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    const req = http.get(
      `${url}/api/health`,
      {
        headers: {
          "x-assetaudit-test-probe": "mulknazorat-test-isolation-probe",
        },
        timeout: timeoutMs,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            if (res.statusCode && res.statusCode < 500) {
              const data = JSON.parse(body);
              const isolatedDb = data?.database?.isolatedTestDb;
              if (isolatedDb === EXPECTED_TEST_DB) {
                return finish({ isRunning: true, isTestDb: true, dbName: isolatedDb });
              }
              return finish({ isRunning: true, isTestDb: false, dbName: isolatedDb || "nomalum_baza" });
            }
          } catch {
            // parsing error yoki non-JSON
          }
          finish({ isRunning: true, isTestDb: false, dbName: "aniqlanmadi" });
        });
      }
    );

    req.on("error", () => finish({ isRunning: false, isTestDb: false }));
    req.on("timeout", () => {
      req.destroy();
      finish({ isRunning: false, isTestDb: false });
    });
  });
}

async function waitForVerifiedServer(url: string, timeoutMs = 35000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const probe = await probeServerDb(url, 1500);
    if (probe.isRunning && probe.isTestDb) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

function killProcessTree(pid: number) {
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(-pid, "SIGTERM");
    }
  } catch {
    // Jarayon allaqachon to'xtatilgan bo'lishi mumkin
  }
}

async function run() {
  console.log("==================================================================");
  console.log("  ASSETAUDIT: IZOLYATSIYALANGAN NEXT.JS HTTP AUTH TEST");
  console.log(`  Target URL: ${TEST_BASE_URL} | DB: ${EXPECTED_TEST_DB} (Port 5432)`);
  console.log("==================================================================");

  let nextProc: ChildProcess | null = null;

  const cleanup = () => {
    if (nextProc && nextProc.pid) {
      console.log("Vaqtinchalik test serveri xavfsiz to'xtatilmoqda...");
      killProcessTree(nextProc.pid);
      nextProc = null;
    }
  };

  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });

  try {
    const isWindows = process.platform === "win32";
    console.log("[1/4] Server va izolyatsiyalangan test bazasi tekshirilmoqda...");
    const initialProbe = await probeServerDb(TEST_BASE_URL, 1500);

    if (initialProbe.isRunning) {
      if (!initialProbe.isTestDb) {
        console.error(
          `XATO: ${TEST_BASE_URL} da ishlayotgan mavjud server test bazasiga ("${EXPECTED_TEST_DB}") ulanmagan!`
        );
        console.error(
          `Aniqlangan baza: "${initialProbe.dbName}". Begona yoki ishlab chiqish/ishlab chiqarish bazasini tasodifan ifloslantirmaslik uchun test to'xtatildi.`
        );
        console.error("Iltimos, ushbu portdagi boshqa serverni to'xtating yoki boshqa TEST_PORT belgilang.");
        process.exit(1);
      }
      console.log(`      OK — Mavjud Next.js serveri (${TEST_BASE_URL}) tasdiqlandi (DB: ${initialProbe.dbName}).`);
    } else {
      console.log(`[1/4] Alohida test Next.js serveri (${TEST_PORT}-port) ishga tushirilmoqda...`);
      const nextCmd = isWindows ? "npx.cmd" : "npx";

      const env = {
        ...process.env,
        PORT: String(TEST_PORT),
        DATABASE_URL: TEST_DB_URL,
        BETTER_AUTH_URL: TEST_BASE_URL,
        BETTER_AUTH_SECRET: "d58b4089ebc2d1b6a7d9c4707cfc960dfbd9f74c4b1356dbdb79a8652823f5b8",
        NODE_ENV: "development" as const,
      };

      nextProc = spawn(nextCmd, ["next", "dev", "-p", String(TEST_PORT), "-H", "127.0.0.1"], {
        env,
        stdio: "pipe",
        shell: true,
      });

      console.log("[2/4] Server va test DB ulanishi kutilmoqda...");
      const ready = await waitForVerifiedServer(TEST_BASE_URL, 35000);
      if (!ready) {
        console.error("XATO: Test serveri 35 soniya ichida tayyor bo'lmadi yoki test bazasiga ulanmadi.");
        cleanup();
        process.exit(1);
      }
      console.log(`      OK — Test serveri ${TEST_BASE_URL} da tayyor (DB: ${EXPECTED_TEST_DB}).`);
    }

    console.log("[3/4] Barcha 4 ta HTTP test fayllari (11 ta test) bajarilmoqda...");
    const testRunner = spawn(
      isWindows ? "npx.cmd" : "npx",
      [
        "tsx",
        "--conditions=react-server",
        "--env-file=.env.test",
        "--test",
        "src/lib/auth/__tests__/logout-session-security.test.ts",
        "src/lib/auth/__tests__/organization-creation.test.ts",
        "src/lib/auth/__tests__/organizations-module.test.ts",
        "src/lib/auth/__tests__/sprint05c-final-verification.test.ts",
      ],
      {
        env: {
          ...process.env,
          TEST_SERVER_URL: TEST_BASE_URL,
          DATABASE_URL: TEST_DB_URL,
          BETTER_AUTH_URL: TEST_BASE_URL,
          BETTER_AUTH_SECRET: "d58b4089ebc2d1b6a7d9c4707cfc960dfbd9f74c4b1356dbdb79a8652823f5b8",
        },
        stdio: "inherit",
        shell: true,
      }
    );

    const testExitCode = await new Promise<number>((resolve) => {
      testRunner.on("close", (code) => resolve(code ?? 1));
    });

    console.log(`[4/4] Test yakunlandi (Exit code: ${testExitCode}).`);
    cleanup();
    process.exit(testExitCode);
  } finally {
    cleanup();
  }
}

run();
