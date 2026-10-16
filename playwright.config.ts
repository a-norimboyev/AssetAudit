import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests-e2e",
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:3000",
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    video: "off",
    screenshot: "only-on-failure",
  },
});
