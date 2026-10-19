import * as fs from "node:fs";
import * as path from "node:path";
import { getPool, db } from "@/lib/db";
import {
  organizations,
  organizationTypes,
  profiles,
  buildings,
  floors,
  rooms,
  itemCategories,
  items,
  inventoryCycles,
  roomAudits,
  cycleItems,
  scanEvents,
  cycleConflicts,
  user,
  account,
} from "@/lib/db/schema";

export interface BackupInfo {
  filename: string;
  createdAt: string;
  sizeBytes: number;
  itemCount: number;
}

const BACKUP_DIR = path.join(process.cwd(), "data", "backups");

function ensureBackupDir(): string {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  return BACKUP_DIR;
}

/**
 * PostgreSQL ma'lumotlar bazasi real parametrlarini olish
 */
export async function getLiveDatabaseStats(): Promise<{
  sizeBytes: number;
  version: string;
  isHealthy: boolean;
}> {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const res = await client.query(`
        SELECT 
          pg_database_size(current_database()) AS size_bytes,
          version() AS db_version
      `);
      const row = res.rows[0];
      return {
        sizeBytes: parseInt(row?.size_bytes || "4404019", 10),
        version: row?.db_version ? row.db_version.split(" ")[1] || "16.x" : "16.x",
        isHealthy: true,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[getLiveDatabaseStats] Error:", error);
    return {
      sizeBytes: 4404019,
      version: "16.x",
      isHealthy: false,
    };
  }
}

/**
 * PostgreSQL jadvallarining haqiqiy to'liq JSON zaxirasini (Backup) yaratish
 */
export async function createRealDatabaseBackup(): Promise<BackupInfo> {
  ensureBackupDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `assetaudit_backup_${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, filename);

  // Barcha jadvallardan xavfsiz to'liq snapshot olish
  const [
    orgTypesData,
    orgsData,
    buildingsData,
    floorsData,
    roomsData,
    categoriesData,
    itemsData,
    cyclesData,
    roomAuditsData,
    cycleItemsData,
    scansData,
    conflictsData,
    profilesData,
    userData,
    accountData,
  ] = await Promise.all([
    db.select().from(organizationTypes),
    db.select().from(organizations),
    db.select().from(buildings),
    db.select().from(floors),
    db.select().from(rooms),
    db.select().from(itemCategories),
    db.select().from(items),
    db.select().from(inventoryCycles),
    db.select().from(roomAudits),
    db.select().from(cycleItems),
    db.select().from(scanEvents),
    db.select().from(cycleConflicts),
    db.select().from(profiles),
    db.select().from(user),
    db.select().from(account),
  ]);

  const totalRecords =
    orgTypesData.length +
    orgsData.length +
    buildingsData.length +
    floorsData.length +
    roomsData.length +
    categoriesData.length +
    itemsData.length +
    cyclesData.length +
    roomAuditsData.length +
    cycleItemsData.length +
    scansData.length +
    conflictsData.length +
    profilesData.length +
    userData.length +
    accountData.length;

  const payload = {
    metadata: {
      platform: "AssetAudit — Mulk Nazorati",
      createdAt: new Date().toISOString(),
      format: "JSON-Full-Snapshot",
      totalRecords,
      tableCounts: {
        organizationTypes: orgTypesData.length,
        organizations: orgsData.length,
        buildings: buildingsData.length,
        floors: floorsData.length,
        rooms: roomsData.length,
        categories: categoriesData.length,
        items: itemsData.length,
        inventoryCycles: cyclesData.length,
        roomAudits: roomAuditsData.length,
        cycleItems: cycleItemsData.length,
        scanEvents: scansData.length,
        cycleConflicts: conflictsData.length,
        profiles: profilesData.length,
        user: userData.length,
        account: accountData.length,
      },
    },
    tables: {
      organizationTypes: orgTypesData,
      organizations: orgsData,
      buildings: buildingsData,
      floors: floorsData,
      rooms: roomsData,
      categories: categoriesData,
      items: itemsData,
      inventoryCycles: cyclesData,
      roomAudits: roomAuditsData,
      cycleItems: cycleItemsData,
      scanEvents: scansData,
      cycleConflicts: conflictsData,
      profiles: profilesData,
      user: userData,
      account: accountData,
    },
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
  const stat = fs.statSync(filePath);

  return {
    filename,
    createdAt: new Date().toISOString(),
    sizeBytes: stat.size,
    itemCount: totalRecords,
  };
}

/**
 * Mavjud zaxira nusxalarini ro'yxatini olish
 */
export function listBackups(): BackupInfo[] {
  ensureBackupDir();
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json"));
    const backups: BackupInfo[] = files.map((file) => {
      const fullPath = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(fullPath);
      return {
        filename: file,
        createdAt: stat.mtime.toISOString(),
        sizeBytes: stat.size,
        itemCount: 0,
      };
    });

    return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error("[listBackups] Error reading backups:", err);
    return [];
  }
}

/**
 * Xavfsiz fayl yuklab olish yo'li (Path traversal xavfsizligi)
 */
export function getSafeBackupPath(filename: string): string | null {
  ensureBackupDir();
  const safeFilename = path.basename(filename);
  if (!safeFilename.endsWith(".json")) return null;

  const fullPath = path.join(BACKUP_DIR, safeFilename);
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }
  return null;
}

/**
 * JSON zaxira faylidan ma'lumotlarni bazaga xavfsiz tiklash (Restore)
 * Qat'iy talab: Xatolik yuz berganda uni yashirmasdan (fail-closed) xatolik beradi
 * va tranzaksiya orqali o'zgarishlarni bekor qiladi.
 */
function hydrateDates<T extends Record<string, unknown>>(row: T): T {
  const result: Record<string, unknown> = { ...row };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      result[key] = new Date(value);
    }
  }
  return result as T;
}

export async function restoreDatabaseFromJsonBackup(filename: string): Promise<{
  success: boolean;
  message: string;
  restoredCounts: Record<string, number>;
}> {
  const filePath = getSafeBackupPath(filename);
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Zaxira fayli topilmadi: ${filename}`);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(content);

  if (!parsed.metadata || !parsed.tables) {
    throw new Error("Zaxira fayli formati noto'g'ri yoki buzilgan (metadata/tables topilmadi).");
  }

  const tables = parsed.tables;
  const restoredCounts: Record<string, number> = {};

  await db.transaction(async (tx) => {
    if (Array.isArray(tables.organizationTypes) && tables.organizationTypes.length > 0) {
      for (const row of tables.organizationTypes) {
        await tx.insert(organizationTypes).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.organizationTypes = tables.organizationTypes.length;
    }

    if (Array.isArray(tables.organizations) && tables.organizations.length > 0) {
      for (const row of tables.organizations) {
        await tx.insert(organizations).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.organizations = tables.organizations.length;
    }

    if (Array.isArray(tables.buildings) && tables.buildings.length > 0) {
      for (const row of tables.buildings) {
        await tx.insert(buildings).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.buildings = tables.buildings.length;
    }

    if (Array.isArray(tables.floors) && tables.floors.length > 0) {
      for (const row of tables.floors) {
        await tx.insert(floors).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.floors = tables.floors.length;
    }

    if (Array.isArray(tables.rooms) && tables.rooms.length > 0) {
      for (const row of tables.rooms) {
        await tx.insert(rooms).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.rooms = tables.rooms.length;
    }

    if (Array.isArray(tables.categories) && tables.categories.length > 0) {
      for (const row of tables.categories) {
        await tx.insert(itemCategories).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.categories = tables.categories.length;
    }

    if (Array.isArray(tables.user) && tables.user.length > 0) {
      for (const row of tables.user) {
        await tx.insert(user).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.user = tables.user.length;
    }

    if (Array.isArray(tables.account) && tables.account.length > 0) {
      for (const row of tables.account) {
        await tx.insert(account).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.account = tables.account.length;
    }

    if (Array.isArray(tables.profiles) && tables.profiles.length > 0) {
      for (const row of tables.profiles) {
        await tx.insert(profiles).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.profiles = tables.profiles.length;
    }

    if (Array.isArray(tables.items) && tables.items.length > 0) {
      for (const row of tables.items) {
        await tx.insert(items).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.items = tables.items.length;
    }

    if (Array.isArray(tables.inventoryCycles) && tables.inventoryCycles.length > 0) {
      for (const row of tables.inventoryCycles) {
        await tx.insert(inventoryCycles).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.inventoryCycles = tables.inventoryCycles.length;
    }

    if (Array.isArray(tables.roomAudits) && tables.roomAudits.length > 0) {
      for (const row of tables.roomAudits) {
        await tx.insert(roomAudits).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.roomAudits = tables.roomAudits.length;
    }

    if (Array.isArray(tables.cycleItems) && tables.cycleItems.length > 0) {
      for (const row of tables.cycleItems) {
        await tx.insert(cycleItems).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.cycleItems = tables.cycleItems.length;
    }

    if (Array.isArray(tables.scanEvents) && tables.scanEvents.length > 0) {
      for (const row of tables.scanEvents) {
        await tx.insert(scanEvents).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.scanEvents = tables.scanEvents.length;
    }

    if (Array.isArray(tables.cycleConflicts) && tables.cycleConflicts.length > 0) {
      for (const row of tables.cycleConflicts) {
        await tx.insert(cycleConflicts).values(hydrateDates(row)).onConflictDoNothing();
      }
      restoredCounts.cycleConflicts = tables.cycleConflicts.length;
    }
  });

  return {
    success: true,
    message: `Zaxira muvaffaqiyatli tiklandi: ${filename}`,
    restoredCounts,
  };
}
