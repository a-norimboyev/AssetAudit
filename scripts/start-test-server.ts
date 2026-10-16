/**
 * AssetAudit — Sprint 15: Izolyatsiyalangan Test Serverini Ishga Tushirish
 * Port: 3005 | DB: mulknazorat_sprint05b_test (Port 5432)
 * Production .env.local hech qachon bu jarayonga aralashmaydi.
 */

import { spawn, type ChildProcess } from "node:child_process";

const TEST_PORT = 3005;
const TEST_DB_URL = "postgresql://postgres@127.0.0.1:5432/mulknazorat_sprint05b_test";
const TEST_BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

console.log("==================================================================");
console.log("  ASSETAUDIT: TEST SERVER ISHGA TUSHIRILMOQDA");
console.log(`  Port: ${TEST_PORT} | DB: mulknazorat_sprint05b_test (5432)`);
console.log("==================================================================");

const isWindows = process.platform === "win32";
const nextCmd = isWindows ? "npx.cmd" : "npx";

const env: NodeJS.ProcessEnv = {
  ...process.env,
  PORT: String(TEST_PORT),
  DATABASE_URL: TEST_DB_URL,
  TEST_DATABASE_URL: TEST_DB_URL,
  BETTER_AUTH_URL: TEST_BASE_URL,
  BETTER_AUTH_SECRET: "d58b4089ebc2d1b6a7d9c4707cfc960dfbd9f74c4b1356dbdb79a8652823f5b8",
  RATE_LIMIT_ENABLED: "false",
  NODE_ENV: "production",
};

const child: ChildProcess = spawn(nextCmd, ["next", "start", "-p", String(TEST_PORT), "-H", "127.0.0.1"], {
  env,
  stdio: "inherit",
  shell: true,
});

child.on("error", (err: Error) => {
  console.error("Test server xatosi:", err);
});

child.on("exit", (code: number | null) => {
  console.log(`Test server to'xtadi (kod: ${code})`);
});
