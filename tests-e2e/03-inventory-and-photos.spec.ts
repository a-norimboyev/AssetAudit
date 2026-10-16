import { test, expect } from "@playwright/test";
import path from "node:path";
import { E2E_CREDENTIALS } from "../scripts/seed-e2e-users";

test.describe("3. Inventar, Xavfsiz Rasmlar, QR va Stikerlar", () => {
  const seededInvNumber = "TATU_E2E-INV-001";
  const seededQrToken = "qr_tok_tatu_e2e_inv_001_secret";

  test.beforeEach(async ({ page }) => {
    // Admin login
    await page.goto("/login");
    await page.fill("#login", E2E_CREDENTIALS.admin.username);
    await page.fill("#password", E2E_CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/org", { timeout: 15000 });
  });

  test("3.1. Inventar yaratish va takroriy raqamni bloklash", async ({ page }) => {
    const newInvNumber = `TATU_E2E-NEW-${Date.now().toString().slice(-5)}`;
    await page.goto("/org/inventory/new");
    await expect(page).toHaveURL(/\/org\/inventory\/new/);

    // Maydonlarni to'ldirish
    await page.fill('input[name="name"]', "E2E Yangi Monoblok HP");
    await page.fill('input[name="inventoryNumber"]', newInvNumber);
    await page.selectOption('select[name="categoryId"]', "computer_equipment");

    // Joylashuvni tanlash
    await page.selectOption('select[name="buildingId"]', { index: 1 });
    await page.waitForTimeout(300);
    await page.selectOption('select[name="floorId"]', { index: 1 });
    await page.waitForTimeout(300);
    await page.selectOption('select[name="roomId"]', { index: 1 });

    await page.fill('textarea[name="description"]', "E2E Test uchun yangi monoblok");
    await page.click('form button[type="submit"]');

    // Muvaffaqiyat xabari va yo'naltirish
    await expect(page.locator("body")).toContainText("muvaffaqiyatli");
    await page.waitForURL("**/org/inventory", { timeout: 15000 });

    // Takroriy inventar raqamini bloklashni sinash
    await page.goto("/org/inventory/new");
    await page.fill('input[name="name"]', "E2E Dublikat Monoblok");
    await page.fill('input[name="inventoryNumber"]', newInvNumber); // Aynan bir xil raqam
    await page.selectOption('select[name="categoryId"]', "computer_equipment");
    await page.selectOption('select[name="buildingId"]', { index: 1 });
    await page.waitForTimeout(300);
    await page.selectOption('select[name="floorId"]', { index: 1 });
    await page.waitForTimeout(300);
    await page.selectOption('select[name="roomId"]', { index: 1 });
    await page.click('form button[type="submit"]');

    // Takroriy raqam xatoligi chiqishi shart
    await expect(page.locator("body")).toContainText(/mavjud|takror|band/i);
  });

  test("3.2. Surat yuklash: Magic bytes tekshiruvi (Zararli faylni rad etish va Haqiqiy rasmni saqlash)", async ({ page }) => {
    // Seeded inventarni qidirish va ochish
    await page.goto(`/org/inventory?q=${seededInvNumber}`);
    const itemLink = page.locator(`tr:has-text("${seededInvNumber}") a:has-text("QR / Tafsilot")`).first();
    await expect(itemLink).toBeVisible({ timeout: 10000 });
    await itemLink.click();
    await page.waitForURL(/\/org\/inventory\/[a-f0-9-]+/, { timeout: 15000 });

    // 1. Soxtalashtirilgan zararli faylni (malicious-fake.jpg) yuklashga urinish
    const fakeImagePath = path.resolve(process.cwd(), "tests-e2e", "fixtures", "malicious-fake.jpg");
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(fakeImagePath);

    // Yuklashni tasdiqlash tugmasini bosish
    const uploadBtn = page.locator('button:has-text("Yuklashni tasdiqlash")');
    await expect(uploadBtn).toBeVisible({ timeout: 5000 });
    await uploadBtn.click();

    // Xatolik xabari: haqiqiy rasm emasligi aniqlanishi shart
    await expect(page.locator("body")).toContainText(/haqiqiy rasm emas|zararli|xatolik/i, { timeout: 10000 });

    // 2. Haqiqiy to'g'ri PNG rasmni (valid-sample.png) yuklash
    const validImagePath = path.resolve(process.cwd(), "tests-e2e", "fixtures", "valid-sample.png");
    await fileInput.setInputFiles(validImagePath);

    // Qayta yuklashni tasdiqlash tugmasini bosish
    await expect(uploadBtn).toBeVisible({ timeout: 5000 });
    await uploadBtn.click();

    // Muvaffaqiyat xabari chiqishi kerak
    await expect(page.locator("body")).toContainText(/muvaffaqiyatli yuklandi/i, { timeout: 10000 });

    // Sahifada rasm paydo bo'lishini tekshirish
    const uploadedImg = page.locator('img[src*="/uploads/inventory/"], img[src*="blob:"]').first();
    await expect(uploadedImg).toBeVisible({ timeout: 10000 });
  });

  test("3.3. QR stikerni chop etish ko'rinishi (/org/inventory/print-labels)", async ({ page }) => {
    await page.goto("/org/inventory/print-labels");
    await expect(page).toHaveURL(/\/org\/inventory\/print-labels/);

    // Chop etish tugmasi va stikerlar ko'rinishi
    await expect(page.locator('button:has-text("Chop etish")')).toBeVisible();
    await expect(page.locator("body")).toContainText(seededInvNumber);
  });

  test("3.4. Loginsiz (Ommaviy) QR tekshiruvi — Maxfiy ma'lumotlar chiqmasligi shart", async ({ browser }) => {
    // Anonim (sessiyasiz) brauzer oynasida ochish
    const incognitoContext = await browser.newContext();
    const incognitoPage = await incognitoContext.newPage();

    await incognitoPage.goto(`/qr/${seededQrToken}`);
    await expect(incognitoPage).toHaveTitle(/QR Tekshiruvi|AssetAudit/i);

    // Ommaviy ko'rinadigan maydonlar
    await expect(incognitoPage.locator("body")).toContainText("E2E HP ProOne 440 Monoblok");
    await expect(incognitoPage.locator("body")).toContainText("TATU Axborot Texnologiyalari Universiteti");

    // Maxfiy maydonlar umuman ko'rinmasligi shart
    await expect(incognitoPage.locator("body")).not.toContainText("7500000");
    await expect(incognitoPage.locator("body")).not.toContainText("tatu.e2e.admin");
    await expect(incognitoPage.locator("body")).toContainText("Maxfiylik siyosati");

    await incognitoContext.close();
  });

  test("3.5. Inventarni hisobdan chiqarish (Soft Archive / written_off)", async ({ page }) => {
    await page.goto(`/org/inventory?q=${seededInvNumber}`);
    const itemLink = page.locator(`tr:has-text("${seededInvNumber}") a:has-text("QR / Tafsilot")`).first();
    await expect(itemLink).toBeVisible({ timeout: 10000 });
    await itemLink.click();
    await page.waitForURL(/\/org\/inventory\/[a-f0-9-]+/, { timeout: 15000 });

    // Hisobdan chiqarish tugmasini bosish
    const writeOffBtn = page.locator('button:has-text("Hisobdan chiqarish")');
    if (await writeOffBtn.isVisible()) {
      page.on("dialog", (dialog) => dialog.accept());
      await writeOffBtn.click();
      await page.waitForTimeout(1500);
      await page.reload();
      await expect(page.locator("body")).toContainText(/Hisobdan chiqarilgan/i);
    }
  });
});
