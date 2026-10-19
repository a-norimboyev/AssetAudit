import { test, expect } from "@playwright/test";
import { E2E_CREDENTIALS } from "../scripts/seed-e2e-users";

test.describe("6. Xavfsizlik, Multi-Tenant Izolyatsiyasi va RBAC Cheklovlari", () => {
  test("6.1. Anonim foydalanuvchi himoyalangan sahifalarga kira olmasligi shart", async ({ page }) => {
    // Sessiyasiz /org ga kirish
    await page.goto("/org");
    await expect(page).toHaveURL(/\/login/);

    // Sessiyasiz /admin ga kirish
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);

    // Sessiyasiz /audit ga kirish
    await page.goto("/audit");
    await expect(page).toHaveURL(/\/login/);
  });

  test("6.2. Cross-Tenant Qat'iy Izolyatsiya: Org B adminga Org A ma'lumotlari ko'rinmasligi shart", async ({ page }) => {
    // Samarqand Davlat Universiteti (Org B) admini sifatida kirish
    await page.goto("/login");
    await page.fill("#login", E2E_CREDENTIALS.samduAdmin.username);
    await page.fill("#password", E2E_CREDENTIALS.samduAdmin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/org", { timeout: 15000 });

    // Samarqand tashkiloti ko'rinishi kerak
    await expect(page.locator("body")).toContainText("Samarqand Davlat Universiteti (E2E)");
    await expect(page.locator("body")).not.toContainText("TATU Axborot Texnologiyalari Universiteti (E2E)");

    // Org B binolari ro'yxatida TATU binosi yo'qligini tekshirish
    await page.goto("/org/buildings");
    await expect(page.locator("body")).not.toContainText("TATU Bosh Bino (E2E)");
    await expect(page.locator("body")).not.toContainText("BB-E2E");

    // Org B inventarlar ro'yxatida TATU inventari yo'qligini tekshirish
    await page.goto("/org/inventory");
    await expect(page.locator("body")).not.toContainText("TATU_E2E-IMP-001");
    await expect(page.locator("body")).not.toContainText("Dell OptiPlex 7090");
  });

  test("6.3. RBAC: Moddiy javobgar shaxs (Registrar) platforma /admin ga kira olmasligi shart", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#login", E2E_CREDENTIALS.registrar.username);
    await page.fill("#password", E2E_CREDENTIALS.registrar.password);
    await page.click('button[type="submit"]');

    // Registrar o'z paneliga yo'naltiriladi
    await page.waitForURL(/\/org/, { timeout: 15000 });

    // Platforma /admin boshqaruviga urinish 403 bilan cheklanishi shart
    await page.goto("/admin");
    await expect(page.locator("body")).toContainText("Kirish cheklangan");
  });

  test("6.4. RBAC: Inspektor /org boshqaruviga yoki /admin ga kira olmasligi shart", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#login", E2E_CREDENTIALS.inspector.username);
    await page.fill("#password", E2E_CREDENTIALS.inspector.password);
    await page.click('button[type="submit"]');

    // Inspektor /audit ga yo'naltirilishi kerak
    await page.waitForURL(/\/audit/, { timeout: 15000 });

    // Inspektor /org ga kirishga uringanda FORBIDDEN blokirovkasi ko'rsatilishi shart
    await page.goto("/org");
    await expect(page.locator("body")).toContainText("Kirish cheklangan (FORBIDDEN)");
  });
});
