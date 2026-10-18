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
  scanEvents,
  cycleConflicts,
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

  // Barcha jadvallardan xavfsiz snapshot olish
  const [
    orgTypesData,
    orgsData,
    buildingsData,
    floorsData,
    roomsData,
    categoriesData,
    itemsData,
    cyclesData,
    scansData,
    conflictsData,
    profilesData,
  ] = await Promise.all([
    db.select().from(organizationTypes),
    db.select().from(organizations),
    db.select().from(buildings),
    db.select().from(floors),
    db.select().from(rooms),
    db.select().from(itemCategories),
    db.select().from(items),
    db.select().from(inventoryCycles),
    db.select().from(scanEvents),
    db.select().from(cycleConflicts),
    db.select({
      userId: profiles.userId,
      organizationId: profiles.organizationId,
      role: profiles.role,
      fullName: profiles.fullName,
      isActive: profiles.isActive,
      createdAt: profiles.createdAt,
    }).from(profiles),
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
    scansData.length +
    conflictsData.length +
    profilesData.length;

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
        scanEvents: scansData.length,
        cycleConflicts: conflictsData.length,
        profiles: profilesData.length,
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
      scanEvents: scansData,
      cycleConflicts: conflictsData,
      profiles: profilesData,
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
