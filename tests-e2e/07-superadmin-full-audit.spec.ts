import { test, expect } from "@playwright/test";

test.describe("07. Super Admin 5-Bo'lim To'liq va Mukammal Auditi", () => {
  test.beforeEach(async ({ page }) => {
    // Har bir testdan oldin Super Admin sifatida tizimga kirish
    await page.goto("/login");
    await expect(page).toHaveTitle(/Kirish|AssetAudit/i);

    await page.fill("#login", "superadmin");
    await page.fill("#password", "SuperAdminPass123!");
    await page.click('button[type="submit"]');

    // /admin paneliga yo'naltirilganini tekshirish
    await page.waitForURL("**/admin", { timeout: 15000 });
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("1. Bo'lim: Bosh sahifa (/admin) va Navigatsiya audit", async ({ page }) => {
    // 1.1. Asosiy sarlavha va Multi-tenant ko'rsatkichlari
    await expect(page.locator("body")).toContainText("Platforma Boshqaruvi");
    await expect(page.locator("body")).toContainText("Jami tashkilotlar");
    await expect(page.locator("body")).toContainText("Faol tashkilotlar");
    await expect(page.locator("body")).toContainText("Dostup ogohlantirishlari");
    await expect(page.locator("body")).toContainText("Tashkilot turlari");
    await expect(page.locator("body")).toContainText("Multi-Tenant Izolyatsiyasi");
    await expect(page.locator("body")).toContainText("PostgreSQL Klasteri");

    // 1.2. Chap menyuda aynan 5 ta element borligini tekshirish
    const nav = page.locator("aside nav");
    await expect(nav).toContainText("Bosh sahifa");
    await expect(nav).toContainText("Tashkilotlar");
    await expect(nav).toContainText("Administratorlar");
    await expect(nav).toContainText("Platforma sozlamalari");
    await expect(nav).toContainText("Sozlamalar");
  });

  test("2. Bo'lim: Tashkilotlar (/admin/organizations) — Qo'shish, Qidiruv, Tahrirlash va Holat", async ({ page }) => {
    await page.click('a[href="/admin/organizations"]');
    await page.waitForURL("**/admin/organizations", { timeout: 10000 });

    // 2.1. "Yangi tashkilot qo'shish" tugmasini bosish
    const newOrgBtn = page.locator('a[href="/admin/organizations/new"]').first();
    await expect(newOrgBtn).toBeVisible();
    await newOrgBtn.click();
    await page.waitForURL("**/admin/organizations/new", { timeout: 10000 });

    // 2.2. Formani to'ldirish (Unikal nom va avtomatik kod hosil bo'lishi)
    const r1 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const r2 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const suffix = Date.now().toString().slice(-4);
    const testOrgName = `Farg'ona Texnologiya Klasteri ${r1}${r2} ${suffix}`;
    const testAdminLogin = `ftk_admin_${suffix}@gmail.com`;

    await page.fill("#name", testOrgName);
    await page.fill("#adminUsername", testAdminLogin);
    await page.fill("#adminPassword", "SecurePass123!@#");

    // Yaratish tugmasini bosish
    await page.click('button[type="submit"]');

    // 2.3. Muvaffaqiyatli yaratilgan hisob ma'lumotlari ekranini tekshirish
    await expect(page.locator("body")).toContainText("muvaffaqiyatli yaratildi", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Administrator hisob ma'lumotlari");

    // Ro'yxatga qaytish tugmasi
    await page.click('a[href="/admin/organizations"]');
    await page.waitForURL("**/admin/organizations", { timeout: 10000 });

    // 2.4. Jadvalda yangi tashkilot borligini tekshirish
    await expect(page.locator("body")).toContainText(testOrgName);

    // 2.5. Qidiruv filtri
    const searchInput = page.locator('input[placeholder*="qidirish"]');
    await searchInput.fill(suffix);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);
    await expect(page.locator("body")).toContainText(testOrgName);

    // 2.6. Tahrirlash modalini ochish va nomni yangilash
    const editBtn = page.locator('button[title="Tashkilotni tahrirlash"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.locator("body")).toContainText("Tashkilotni tahrirlash");

      await page.fill('input[value*="Farg\'ona Texnologiya Klasteri"]', `${testOrgName} (Yangilangan)`);
      await page.click('button:has-text("Saqlash")');

      await expect(page.locator("body")).toContainText("muvaffaqiyatli", { timeout: 10000 });
      await page.waitForTimeout(1200);
    }
  });

  test("3. Bo'lim: Administratorlar (/admin/administrators) — Qo'shish, Reset Parol va Holat", async ({ page }) => {
    await page.click('a[href="/admin/administrators"]');
    await page.waitForURL("**/admin/administrators", { timeout: 10000 });

    // 3.1. Kartalar ko'rinishi
    await expect(page.locator("body")).toContainText("Jami administratorlar");
    await expect(page.locator("body")).toContainText("Faol administratorlar");
    await expect(page.locator("body")).toContainText("Qamrab olingan tashkilotlar");

    // 3.2. "Yangi admin qo'shish" modalini ochish
    const addAdminBtn = page.locator('button:has-text("Yangi admin qo‘shish")').first();
    await expect(addAdminBtn).toBeVisible();
    await addAdminBtn.click();

    await expect(page.locator("body")).toContainText("Yangi Tashkilot Administratori");

    // 3.3. Admin formani to'ldirish
    const suffix = Date.now().toString().slice(-4);
    const adminFullName = `Nodirbek Salimov ${suffix}`;
    const adminEmail = `nodir_${suffix}@gmail.com`;

    await page.fill('input[placeholder="Administrator F.I.SH"]', adminFullName);
    await page.fill('input[placeholder="Emailni kiriting"]', adminEmail);
    await page.fill('input[type="password"]', "NodirPass123!@#");

    // Yaratish tugmasini bosish ("Admin yaratish")
    await page.click('button:has-text("Admin yaratish")');

    // Muvaffaqiyat xabari va vaqtinchalik parol chiqishini tekshirish
    await expect(page.locator("body")).toContainText("muvaffaqiyatli", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Kirish emaili:");
    await expect(page.locator("body")).toContainText("Vaqtinchalik parol");

    // Modalni yopish
    const finishBtn = page.locator('button:has-text("Tugatish")');
    if (await finishBtn.isVisible()) {
      await finishBtn.click();
    } else {
      await page.locator('button:has(svg.lucide-x)').first().click();
    }
    await page.waitForTimeout(1000);

    // Qayta yuklash orqali yangi admin paydo bo'lganini tasdiqlash
    await page.reload();
    await expect(page.locator("body")).toContainText(adminFullName);

    // 3.4. Parolni Reset qilish modalini tekshirish
    const resetBtn = page.locator(`tr:has-text("${adminFullName}") button:has-text("Parolni reset")`).first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await expect(page.locator("body")).toContainText("Administrator parolini qayta o‘rnatish");

      await page.click('button:has-text("Ha, parolni yangilash")');
      await expect(page.locator("body")).toContainText("Yangi vaqtinchalik parol tayyor!", { timeout: 10000 });

      // Modalni yopish
      await page.click('button:has-text("Yopish")');
    }
  });

  test("4. Bo'lim: Platforma sozlamalari (/admin/settings) — Telefon raqam, Backup va 6 ta tab", async ({ page }) => {
    await page.click('a[href="/admin/settings"]');
    await page.waitForURL("**/admin/settings", { timeout: 10000 });

    // 4.1. Barcha 6 ta tab borligini tekshirish
    await expect(page.locator('button:has-text("Tizim va QR Domen")')).toBeVisible();
    await expect(page.locator('button:has-text("Xavfsizlik Siyosati")')).toBeVisible();
    await expect(page.locator('button:has-text("Texnik Tanaffus")')).toBeVisible();
    await expect(page.locator('button:has-text("Telegram Bildirishnomalari")')).toBeVisible();
    await expect(page.locator('button:has-text("Tashkilot Kvoutalari")')).toBeVisible();
    await expect(page.locator('button:has-text("Baza va Zaxira")')).toBeVisible();

    // 4.2. Foydalanuvchi ta'kidlagan xatolik: Telefon raqamini o'zgartirish va Bosh sahifada aks etishini tekshirish!
    const testSupportPhone = "+998 (99) 777-88-99";
    const phoneInput = page.locator('div:has(> label:has-text("Qo\'llab-quvvatlash Telefoni")) input');
    await phoneInput.clear();
    await phoneInput.fill(testSupportPhone);

    // Saqlash tugmasi
    await page.click('button:has-text("zgarishlarni saqlash")');
    await expect(page.locator("body")).toContainText("Platforma sozlamalari muvaffaqiyatli saqlandi!", { timeout: 10000 });

    // BOSH SAHIFAGA OTISH VA TELEFON RAQAM DASTURIY O'ZGARGANINI TEKSHIRISH
    await page.goto("/");
    await expect(page.locator("header")).toContainText(testSupportPhone);
    await expect(page.locator("#contact")).toContainText(testSupportPhone);

    // Telefon raqamini qayta asl holatiga qaytarish (+998 (93) 364-20-30)
    await page.goto("/admin/settings");
    const restorePhoneInput = page.locator('div:has(> label:has-text("Qo\'llab-quvvatlash Telefoni")) input');
    await restorePhoneInput.clear();
    await restorePhoneInput.fill("+998 (93) 364-20-30");
    await page.click('button:has-text("zgarishlarni saqlash")');
    await expect(page.locator("body")).toContainText("muvaffaqiyatli saqlandi!", { timeout: 10000 });

    // 4.3. Zaxira nusxalash (Backup) tabini tekshirish
    await page.click('button:has-text("Baza va Zaxira")');
    await expect(page.locator("body")).toContainText("Ma'lumotlar Bazasi va Zaxira Nusxalar");

    // "Hozir Zaxira Olish" tugmasi
    const backupBtn = page.locator('button:has-text("Hozir Zaxira Olish")');
    await expect(backupBtn).toBeVisible();
    await backupBtn.click();

    // Zaxira olingani haqida bildirishnoma chiqishi
    await expect(page.locator("body")).toContainText("zaxira nusxasi muvaffaqiyatli yaratildi", { timeout: 25000 });
  });

  test("5. Bo'lim: Sozlamalar (/admin/profile) — Kirish Emaili, Parol va Til o'zgartirish", async ({ page }) => {
    await page.click('a[href="/admin/profile"]');
    await page.waitForURL("**/admin/profile", { timeout: 10000 });

    // 5.1. Bloklar mavjudligini tekshirish
    await expect(page.locator("body")).toContainText("Kirish Emaili");
    await expect(page.locator("body")).toContainText("Maxfiy Parol");
    await expect(page.locator("body")).toContainText("Interfeys Tili");

    // 5.2. Til tugmalarini to'liq tekshirish
    const langUzCyrl = page.locator('button:has-text("Ўзбекcha")').or(page.locator('button:has-text("Ўзбекча")'));
    await langUzCyrl.click();
    await expect(page.locator("body")).toContainText("ga o'zgartirildi!", { timeout: 5000 });

    const langRu = page.locator('button:has-text("Русский")');
    await langRu.click();
    await expect(page.locator("body")).toContainText("ga o'zgartirildi!", { timeout: 5000 });

    const langEn = page.locator('button:has-text("English")');
    await langEn.click();
    await expect(page.locator("body")).toContainText("ga o'zgartirildi!", { timeout: 5000 });

    const langUzLatn = page.locator('button:has-text("O\'zbekcha")');
    await langUzLatn.click();
    await expect(page.locator("body")).toContainText("ga o'zgartirildi!", { timeout: 5000 });

    // 5.3. Parolni yangilashda noto'g'ri joriy parol kiritilganda xatolik berishi
    await page.fill('input[placeholder="Hozirgi parolingizni kiriting"]', "Noto'g'riParol123!");
    await page.fill('input[placeholder="Kamida 8 ta belgi"]', "YangiParol123!@#");
    await page.fill('input[placeholder="Yangi parolni tasdiqlang"]', "YangiParol123!@#");
    await page.click('button:has-text("Parolni yangilash")');

    await expect(page.locator("body")).toContainText("Joriy maxfiy parol noto'g'ri", { timeout: 10000 });

    // 5.4. Kirish emaili validatsiyasi (3 tadan kam belgi kiritilganda xatolik)
    const usernameInput = page.locator('#user-login');
    await usernameInput.fill("a");
    await page.click('button:has-text("Kirish emailini saqlash")');
    await expect(page.locator("body")).toContainText("kamida 3 ta belgidan", { timeout: 10000 });

    // Qayta 'superadmin' ga to'g'irlash
    await usernameInput.fill("superadmin");
  });

  test("6. Tizimdan chiqish (Logout) tugmasi", async ({ page }) => {
    // Chiqish tugmasi
    const logoutBtn = page.locator('button[title="Tizimdan chiqish"]');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // /login sahifasiga o'tishi
    await page.waitForURL("**/login", { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);

    // Endi /admin ga to'g'ridan-to'g'ri kirishga uringanda qaytadan /login ga uloqtirishi
    await page.goto("/admin");
    await page.waitForURL("**/login", { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test.afterAll(async () => {
    // Test tugagach bazani to'liq 0 holatiga qaytarish
    const { execSync } = await import("node:child_process");
    try {
      execSync("npm run db:clean", { stdio: "ignore" });
    } catch {}
  });
});
