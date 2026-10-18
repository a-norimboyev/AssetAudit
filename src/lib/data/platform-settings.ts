import * as fs from "node:fs";
import * as path from "node:path";

export interface PlatformSettings {
  system: {
    platformName: string;
    supportPhone: string;
    supportEmail: string;
    baseUrl: string;
    defaultQrSize: string; // "50x30", "40x25", "60x40"
    qrErrorCorrection: "L" | "M" | "Q" | "H";
    hideRoomAddressOnPublicScan: boolean;
  };
  security: {
    minPasswordLength: number;
    sessionDurationDays: number;
    maxFailedAttempts: number;
    lockoutDurationMinutes: number;
    enforceStrongPassword: boolean;
    requirePasswordChangeDays: number;
  };
  maintenance: {
    enabled: boolean;
    message: string;
    allowedIps: string[];
  };
  integrations: {
    telegramBotEnabled: boolean;
    telegramBotUsername: string;
    telegramAlertChatId: string;
    notifyOnCriticalConflict: boolean;
    notifyOnNewTenant: boolean;
    smsGatewayEnabled: boolean;
    smsProvider: "eskiz" | "playmobile";
  };
  quotas: {
    defaultMaxItems: number;
    defaultMaxStorageMb: number;
    defaultMaxConcurrentAudits: number;
  };
  backup: {
    lastBackupTime: string;
    backupStatus: "success" | "pending" | "failed";
    backupSizeBytes: number;
    autoBackupEnabled: boolean;
    frequency: "daily" | "weekly";
  };
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  system: {
    platformName: "AssetAudit — Mulk Nazorati",
    supportPhone: "+998 (71) 200-00-00",
    supportEmail: "support@assetaudit.uz",
    baseUrl: "http://localhost:3000",
    defaultQrSize: "50x30",
    qrErrorCorrection: "M",
    hideRoomAddressOnPublicScan: true,
  },
  security: {
    minPasswordLength: 8,
    sessionDurationDays: 30,
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
    enforceStrongPassword: true,
    requirePasswordChangeDays: 90,
  },
  maintenance: {
    enabled: false,
    message:
      "Hozirda AssetAudit platformasida rejaviy profilaktika ishlari olib borilmoqda. Tizim tez orada to'liq qayta ishga tushiriladi.",
    allowedIps: ["127.0.0.1", "::1"],
  },
  integrations: {
    telegramBotEnabled: true,
    telegramBotUsername: "@AssetAuditBot",
    telegramAlertChatId: "-100234567890",
    notifyOnCriticalConflict: true,
    notifyOnNewTenant: true,
    smsGatewayEnabled: false,
    smsProvider: "eskiz",
  },
  quotas: {
    defaultMaxItems: 10000,
    defaultMaxStorageMb: 2048,
    defaultMaxConcurrentAudits: 3,
  },
  backup: {
    lastBackupTime: new Date().toISOString(),
    backupStatus: "success",
    backupSizeBytes: 4404019, // ~4.2 MB
    autoBackupEnabled: true,
    frequency: "daily",
  },
};

const SETTINGS_FILE_PATH = path.join(process.cwd(), "data", "platform-settings.json");

/**
 * Platforma global sozlamalarini o'qish (fayl mavjud bo'lmasa sukutiy sozlamalar bilan yaratadi)
 */
export function getPlatformSettings(): PlatformSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE_PATH)) {
      const dataDir = path.dirname(SETTINGS_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(DEFAULT_PLATFORM_SETTINGS, null, 2), "utf8");
      return DEFAULT_PLATFORM_SETTINGS;
    }

    const content = fs.readFileSync(SETTINGS_FILE_PATH, "utf8");
    const parsed = JSON.parse(content) as Partial<PlatformSettings>;
    return {
      system: { ...DEFAULT_PLATFORM_SETTINGS.system, ...(parsed.system || {}) },
      security: { ...DEFAULT_PLATFORM_SETTINGS.security, ...(parsed.security || {}) },
      maintenance: { ...DEFAULT_PLATFORM_SETTINGS.maintenance, ...(parsed.maintenance || {}) },
      integrations: { ...DEFAULT_PLATFORM_SETTINGS.integrations, ...(parsed.integrations || {}) },
      quotas: { ...DEFAULT_PLATFORM_SETTINGS.quotas, ...(parsed.quotas || {}) },
      backup: { ...DEFAULT_PLATFORM_SETTINGS.backup, ...(parsed.backup || {}) },
    };
  } catch (error) {
    console.error("[getPlatformSettings] Error reading settings file:", error);
    return DEFAULT_PLATFORM_SETTINGS;
  }
}

/**
 * Platforma global sozlamalarini xavfsiz saqlash
 */
export function savePlatformSettings(newSettings: PlatformSettings): PlatformSettings {
  try {
    const dataDir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(newSettings, null, 2), "utf8");
    return newSettings;
  } catch (error) {
    console.error("[savePlatformSettings] Error writing settings file:", error);
    throw new Error("Platforma sozlamalarini saqlashda xatolik yuz berdi");
  }
}
