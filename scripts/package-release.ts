import * as fs from "node:fs";
import * as path from "node:path";

/**
 * AssetAudit — Next.js Standalone Release Packager
 * Next.js rasmiy hujjatlariga ko'ra standalone/server.js o'z-o'zidan .next/static va public
 * fayllarini to'liq o'z ichiga olmaydi. Ushbu skript barcha statik va runtime resurslarni
 * to'liq birlashtirib, ishlab chiqarishga tayyor mustaqil paket hosil qiladi.
 */
function packageRelease() {
  const rootDir = process.cwd();
  const standaloneDir = path.resolve(rootDir, ".next", "standalone");
  const nextStaticSource = path.resolve(rootDir, ".next", "static");
  const nextStaticTarget = path.resolve(standaloneDir, ".next", "static");
  const publicSource = path.resolve(rootDir, "public");
  const publicTarget = path.resolve(standaloneDir, "public");

  console.log("=== AssetAudit: Standalone Release Paketini Yig'ish Boshlandi ===");

  if (!fs.existsSync(standaloneDir)) {
    throw new Error(
      "XATO: .next/standalone jildi topilmadi! Avval 'npm run build' buyrug'ini bajaring."
    );
  }

  // 1. .next/static jildini standalone/.next/static ga nusxalash
  if (fs.existsSync(nextStaticSource)) {
    console.log(`[1/3] Statik CSS/JS resurslari nusxalanmoqda: ${nextStaticSource} -> ${nextStaticTarget}`);
    fs.mkdirSync(path.dirname(nextStaticTarget), { recursive: true });
    fs.cpSync(nextStaticSource, nextStaticTarget, { recursive: true, force: true });
    console.log("  -> .next/static muvaffaqiyatli joylashtirildi.");
  } else {
    throw new Error("XATO: .next/static manba jildi topilmadi!");
  }

  // 2. public jildini standalone/public ga nusxalash
  if (fs.existsSync(publicSource)) {
    console.log(`[2/3] Public resurslari nusxalanmoqda: ${publicSource} -> ${publicTarget}`);
    fs.cpSync(publicSource, publicTarget, { recursive: true, force: true });
    console.log("  -> public jildi muvaffaqiyatli joylashtirildi.");
  }

  // 3. To'liqlik va butunlik tekshiruvi (Integrity Audit)
  console.log("[3/3] Standalone paket butunligi tekshirilmoqda...");
  const criticalFiles = [
    path.join(standaloneDir, "server.js"),
    path.join(standaloneDir, "package.json"),
    nextStaticTarget,
    publicTarget,
  ];

  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`XATO: Muhim paket komponenti yetishmaydi: ${file}`);
    }
  }

  console.log("======================================================================");
  console.log("NATIJA: Standalone Release paketi 100% to'liq va ishlab chiqarishga tayyor!");
  console.log(`Paket joylashuvi: ${standaloneDir}`);
  console.log("Ishga tushirish buyrug'i: node .next/standalone/server.js");
  console.log("======================================================================");
}

try {
  packageRelease();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
