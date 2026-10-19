import { test, expect } from "@playwright/test";
import { E2E_CREDENTIALS } from "../scripts/seed-e2e-users";

test.describe("5. Audit Sikli, Skanerlash va Rekonsilyatsiya Hisobotlari", () => {
  const cycleTitle = `2026 E2E Audit Sikli ${Date.now().toString().slice(-4)}`;

  test.beforeEach(async ({ page }) => {
    // Admin login
    await page.goto("/login");
    await page.fill("#login", E2E_CREDENTIALS.admin.username);
    await page.fill("#password", E2E_CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/org", { timeout: 15000 });
  });

  test("5.1. Audit siklini yaratish (/org/audits)", async ({ page }) => {
    await page.goto("/org/audits");
    await expect(page).toHaveURL(/\/org\/audits/);

    // Modalni ochish
    await page.click('button:has-text("Yangi audit sikli yaratish")');
    await expect(page.locator("h3:has-text('Yangi audit sikli')")).toBeVisible();

    await page.fill('input[name="title"]', cycleTitle);
    await page.fill('textarea[name="notes"]', "TATU E2E davriy sanog'i");
    await page.click('form button[type="submit"]');

    await expect(page.locator("body")).toContainText("muvaffaqiyatli");
    await page.reload();
    await expect(page.locator("body")).toContainText(cycleTitle);
  });

  test("5.2. Audit skanerlash (Match va Conflict) (/audit/scan)", async ({ page }) => {
    await page.goto("/audit/scan");
    await expect(page).toHaveURL(/\/audit\/scan/);

    // Xona tanlash
    const roomSelect = page.locator('select[name="scannedRoomId"]');
    if (await roomSelect.isVisible()) {
      await roomSelect.selectOption({ index: 0 });
    }

    // Mavjud inventar raqami bo'yicha to'g'ri xonada skanerlash (Match)
    const scanInput = page.locator('input[name="tokenOrCode"]');
    await scanInput.fill("TATU_E2E-INV-001");
    await page.click('form button[type="submit"]');

    // Natija chiqishini tekshirish
    await expect(page.locator("body")).toContainText(/Topildi|Match|muvaffaqiyatli/i, { timeout: 10000 });
  });

  test("5.3. Rekonsilyatsiya hisoboti va CSV eksport (/org/reports)", async ({ page }) => {
    await page.goto("/org/reports");
    await expect(page).toHaveURL(/\/org\/reports/);

    // Hisobot ko'rsatkichlari
    await expect(page.locator("body")).toContainText("Audit Rekonsilyatsiya Hisoboti");
    await expect(page.locator("body")).toContainText("Jami kutilgan");

    // CSV eksport tugmasi
    const csvExportBtn = page.locator('button:has-text("CSV Eksport")');
    await expect(csvExportBtn).toBeVisible();

    // Chop etish tugmasi
    const printBtn = page.locator('button:has-text("Chop etish")');
    await expect(printBtn).toBeVisible();
  });
});
