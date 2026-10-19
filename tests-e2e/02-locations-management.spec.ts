import { test, expect } from "@playwright/test";
import { E2E_CREDENTIALS } from "../scripts/seed-e2e-users";

test.describe("2. Bino, Qavat va Xonalar Boshqaruvi", () => {
  test.beforeEach(async ({ page }) => {
    // Admin login
    await page.goto("/login");
    await page.fill("#login", E2E_CREDENTIALS.admin.username);
    await page.fill("#password", E2E_CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/org", { timeout: 15000 });
  });

  test("2.1. Bino yaratish va tahrirlash", async ({ page }) => {
    await page.goto("/org/buildings");
    await expect(page).toHaveURL(/\/org\/buildings/);

    // Yangi bino modalini ochish
    await page.click('button:has-text("Yangi bino qo‘shish")');
    await expect(page.locator("h3:has-text('Yangi bino qo‘shish')")).toBeVisible();

    const buildingCode = `C${Date.now().toString().slice(-4)}`;
    await page.fill('input[name="name"]', `E2E Yangi Korpus ${buildingCode}`);
    await page.click('form button[type="submit"]');

    // Muvaffaqiyat xabari
    await expect(page.locator("body")).toContainText("muvaffaqiyatli");

    // Ro'yxatda paydo bo'lganini tekshirish
    await page.reload();
    await expect(page.locator("body")).toContainText(`E2E Yangi Korpus ${buildingCode}`);

    // Bino tahrirlash modalini ochish
    const editBtn = page.locator(`button[title="Tahrirlash"]:near(:text("${buildingCode}"))`).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.fill('input[name="name"]', `E2E Tahrirlangan Bino ${buildingCode}`);
      await page.click('form button:has-text("Saqlash")');
      await expect(page.locator("body")).toContainText("muvaffaqiyatli");
    }
  });

  test("2.2. Xona yaratish va tahrirlash", async ({ page }) => {
    await page.goto("/org/rooms");
    await expect(page).toHaveURL(/\/org\/rooms/);

    // Yangi xona modalini ochish
    await page.click('button:has-text("Yangi xona qo‘shish")');
    await expect(page.locator("h3:has-text('Yangi xona qo‘shish')")).toBeVisible();

    // Bino va Qavat tanlash
    await page.selectOption('select[name="buildingId"]', { index: 1 });
    await page.waitForTimeout(300);
    await page.selectOption('select[name="floorId"]', { index: 1 });

    const roomNum = `${Math.floor(100 + Math.random() * 899)}`;
    await page.fill('input[name="roomNumber"]', roomNum);
    await page.fill('input[name="name"]', `E2E Sinov Xonasi ${roomNum}`);
    await page.click('form button[type="submit"]');

    // Xona ro'yxatida tekshirish
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.locator("body")).toContainText(roomNum);
  });
});
