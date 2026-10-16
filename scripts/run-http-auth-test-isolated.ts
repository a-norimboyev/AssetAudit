/**
 * AssetAudit — Sprint 13: Izolyatsiyalangan HTTP Auth Test Runner
 * Maqsad: 3 SKIP testni alohida 3005-portda test DB ga ulangan Next.js orqali PASS qilish.
 */

import { spawn, ChildProcess } from "node:child_process";
import * as http from "node:http";

const TEST_PORT = 3005;
const TEST_BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const TEST_DB_URL = "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";

function waitForServer(url: string, timeoutMs = 25000): Promise<boolean> {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      if (Date.now() - start > timeoutMs) {
        return resolve(false);
      }
      const req = http.get(`${url}/login`, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
        } else {
          setTimeout(check, 600);
        }
      });
      req.on("error", () => {
        setTimeout(check, 600);
      });
    };
    check();
  });
}

async function run() {
  console.log("==================================================================");
  console.log("  ASSETAUDIT: IZOLYATSIYALANGAN NEXT.JS HTTP AUTH TEST");
  console.log(`  Port: ${TEST_PORT} | DB: mulknazorat_sprint05b_test (Port 5432)`);
  console.log("==================================================================");

  let nextProc: ChildProcess | null = null;

  try {
    console.log("[1/4] Alohida test Next.js serveri ishga tushirilmoqda...");
    const isWindows = process.platform === "win32";
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

    console.log("[2/4] Server tayyor bo'lishi kutilmoqda...");
    const ready = await waitForServer(TEST_BASE_URL, 30000);
    if (!ready) {
      console.error("XATO: Test serveri 30 soniya ichida javob bermadi.");
      process.exit(1);
    }
    console.log(`      OK — Test serveri ${TEST_BASE_URL} da tayyor.`);

    console.log("[3/4] sprint05c-final-verification.test.ts bajarilmoqda...");
    const testRunner = spawn(
      isWindows ? "npx.cmd" : "npx",
      [
        "tsx",
        "--conditions=react-server",
        "--env-file=.env.test",
        "--test",
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
    process.exit(testExitCode);
  } finally {
    if (nextProc && nextProc.pid) {
      console.log("Vaqtinchalik test serveri xavfsiz to'xtatilmoqda...");
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/PID", String(nextProc.pid), "/T", "/F"]);
        } else {
          nextProc.kill("SIGTERM");
        }
      } catch {
        // ignore cleanup error
      }
    }
  }
}

run();
