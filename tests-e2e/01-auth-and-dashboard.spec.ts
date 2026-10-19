import { test, expect } from "@playwright/test";
import { E2E_CREDENTIALS } from "../scripts/seed-e2e-users";

test.describe("1. Autentifikatsiya, Dashboard va Sessiya Boshqaruvi", () => {
  test("1.1. Organization Admin login, Dashboard ko'rsatkichlari va Logout/Qayta login", async ({ page }) => {
    // 1. Login sahifasiga kirish
    await page.goto("/login");
    await expect(page).toHaveTitle(/Kirish|AssetAudit/i);

    // 2. Foydalanuvchi login va parolini kiritish
    await page.fill("#login", E2E_CREDENTIALS.admin.username);
    await page.fill("#password", E2E_CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');

    // 3. /org boshqaruv paneliga yo'naltirilganini kutish
    await page.waitForURL("**/org", { timeout: 15000 });
    await expect(page).toHaveURL(/\/org$/);

    // 4. Dashboard kartalarini tekshirish
    await expect(page.locator("body")).toContainText("TATU Axborot Texnologiyalari Universiteti (E2E)");
    await expect(page.locator("body")).toContainText(/jami inventarlar/i);
    await expect(page.locator("body")).toContainText(/binolar/i);
    await expect(page.locator("body")).toContainText(/audit/i);

    // 5. Chiqish (Logout)
    const logoutBtn = page.locator('button[title="Tizimdan chiqish"]');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // 6. Login sahifasiga qaytganini tekshirish
    await page.waitForURL("**/login", { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);

    // 7. Qayta login qilish
    await page.fill("#login", E2E_CREDENTIALS.admin.username);
    await page.fill("#password", E2E_CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/org", { timeout: 15000 });
    await expect(page).toHaveURL(/\/org$/);
  });
});
