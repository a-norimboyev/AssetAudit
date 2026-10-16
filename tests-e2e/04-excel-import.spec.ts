import { test, expect } from "@playwright/test";
import path from "node:path";
import { E2E_CREDENTIALS } from "../scripts/seed-e2e-users";

test.describe("4. Excel / CSV Import Dvigateli", () => {
  test.beforeEach(async ({ page }) => {
    // Admin login
    await page.goto("/login");
    await page.fill("#login", E2E_CREDENTIALS.admin.username);
    await page.fill("#password", E2E_CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/org", { timeout: 15000 });
  });

  test("4.1. CSV orqali to'g'ri inventarlarni ommaviy import qilish", async ({ page }) => {
    await page.goto("/org/inventory/import");
    await expect(page).toHaveURL(/\/org\/inventory\/import/);

    const validCsvPath = path.resolve(process.cwd(), "tests-e2e", "fixtures", "valid-import.csv");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(validCsvPath);

    // Yuklash tugmasini bosish
    const submitBtn = page.locator('button[type="submit"]:has-text("Inventarlarni import qilish")');
    await submitBtn.click();

    // Natija xabarini tekshirish
    await expect(page.locator("body")).toContainText(/Muvaffaqiyatli kiritildi|Jami/i, { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Import Natijalari Xulosasi");
  });

  test("4.2. Noto'g'ri CSV qatorlarini rad etish va xatoliklar jadvalini ko'rsatish", async ({ page }) => {
    await page.goto("/org/inventory/import");
    await expect(page).toHaveURL(/\/org\/inventory\/import/);

    const invalidCsvPath = path.resolve(process.cwd(), "tests-e2e", "fixtures", "invalid-import.csv");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidCsvPath);

    const submitBtn = page.locator('button[type="submit"]:has-text("Inventarlarni import qilish")');
    await submitBtn.click();

    // Xatolar jurnali chiqishi kerak
    await expect(page.locator("body")).toContainText(/Xatolik tufayli kiritilmagan/i, { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Inventar raqami kiritilmagan");
  });
});
