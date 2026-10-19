"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Sliders,
  QrCode,
  Lock,
  Wrench,
  Send,
  Database,
  Layers,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Info,
  Download,
  Smartphone,
} from "lucide-react";
import {
  updatePlatformSettingsAction,
  triggerManualBackupAction,
  sendTelegramTestNotificationAction,
  getLiveDatabaseAndBackupsAction,
} from "./actions";
import type { PlatformSettings } from "@/lib/data/platform-settings";
import type { BackupInfo } from "@/lib/data/backup-service";

interface SettingsManagerProps {
  initialSettings: PlatformSettings;
}

type TabType =
  | "system"
  | "security"
  | "maintenance"
  | "integrations"
  | "quotas"
  | "backup";

export function SettingsManager({ initialSettings }: SettingsManagerProps) {
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<TabType>("system");
  const [isPending, startTransition] = useTransition();
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [backupsList, setBackupsList] = useState<BackupInfo[]>([]);
  const [dbLiveStats, setDbLiveStats] = useState<{
    sizeBytes: number;
    version: string;
    isHealthy: boolean;
  } | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Backup ro'yxati va baza statistikasini yuklash
  useEffect(() => {
    if (activeTab === "backup") {
      getLiveDatabaseAndBackupsAction().then((res) => {
        setDbLiveStats(res.stats);
        setBackupsList(res.backups);
      });
    }
  }, [activeTab]);

  // Formani saqlash (Barcha 6 ta tab uchun umumiy)
  const handleSave = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updatePlatformSettingsAction(settings);
      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || "Platforma sozlamalari muvaffaqiyatli saqlandi!",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Sozlamalarni saqlashda xatolik yuz berdi",
        });
      }
    });
  };

  // Haqiqiy zaxira nusxasini olish
  const handleBackupNow = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await triggerManualBackupAction();
      if (res.success) {
        const backupData = res.data as BackupInfo | undefined;
        setSettings((prev) => ({
          ...prev,
          backup: {
            ...prev.backup,
            lastBackupTime: backupData?.createdAt || new Date().toISOString(),
            backupSizeBytes: backupData?.sizeBytes || prev.backup.backupSizeBytes,
            backupStatus: "success",
          },
        }));

        // Ro'yxatni yangilash
        const updated = await getLiveDatabaseAndBackupsAction();
        setBackupsList(updated.backups);
        if (updated.stats) setDbLiveStats(updated.stats);

        setFeedback({
          type: "success",
          message: res.message || "PostgreSQL ma'lumotlar bazasining zaxira nusxasi olindi!",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Zaxira olishda xatolik yuz berdi",
        });
      }
    });
  };

  // Telegram test xabarini jo'natish
  const handleTestTelegram = async () => {
    setFeedback(null);
    setIsTestingTelegram(true);
    try {
      const res = await sendTelegramTestNotificationAction(
        settings.integrations.telegramAlertChatId
      );
      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || "Test xabarnomasi muvaffaqiyatli yuborildi!",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Telegram xabarini yuborib bo'lmadi",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Telegram test xabarini yuborishda kutilmagan xatolik yuz berdi",
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const tabs: { id: TabType; name: string; icon: typeof Sliders; badge?: string }[] = [
    { id: "system", name: "Tizim va QR Domen", icon: QrCode },
    { id: "security", name: "Xavfsizlik Siyosati", icon: Lock },
    {
      id: "maintenance",
      name: "Texnik Tanaffus",
      icon: Wrench,
      badge: settings.maintenance.enabled ? "Faol" : undefined,
    },
    { id: "integrations", name: "Telegram Bildirishnomalari", icon: Send },
    { id: "quotas", name: "Tashkilot Kvoutalari", icon: Layers },
    { id: "backup", name: "Baza va Zaxira", icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Profilaktika rejimi ogohlantirish banneri */}
      {settings.maintenance.enabled && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">
              Diqqat: Texnik xizmat ko&apos;rsatish (Maintenance Mode) hozirda yoqilgan!
            </span>
            <p className="mt-0.5 text-amber-800">
              Oddiy tashkilot foydalanuvchilari uchun tizim profilaktika rejimida. Super Admin konsoli esa to&apos;liq ochiq.
            </p>
          </div>
        </div>
      )}

      {/* Xabar/Aloqa bildirishnomasi */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Asosiy Boshqaruv Konteyneri */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col md:flex-row min-h-[580px]">
        {/* Chap Navigatsiya Tablari */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200/80 bg-slate-50/50 p-3 space-y-1 shrink-0">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Sozlamalar Bo&apos;limi
          </div>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-2xs shadow-blue-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <tab.icon
                    className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`}
                  />
                  <span>{tab.name}</span>
                </div>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* O'ng Forma Kontenti */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
          <div>
            {/* 1. TIZIM VA QR DOMEN */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Global Tizim va QR Domeni
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Platforma nomi, qo&apos;llab-quvvatlash kontaktlari va QR kodlar uchun bazaviy havola
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Platforma Rasmiy Nomi
                    </label>
                    <input
                      type="text"
                      value={settings.system.platformName}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          system: { ...settings.system, platformName: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      QR-kod Bazaviy Havolasi (Base URL)
                    </label>
                    <input
                      type="url"
                      value={settings.system.baseUrl}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          system: { ...settings.system, baseUrl: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      placeholder="http://localhost:3000 yoki https://assetaudit.uz"
                    />
                    <span className="text-[10px] text-slate-400">
                      Chop etilgan QR etiketkalar shu manzilga yo&apos;naltiriladi:{" "}
                      <code>{settings.system.baseUrl}/qr/[token]</code>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Qo&apos;llab-quvvatlash Telefoni
                    </label>
                    <input
                      type="text"
                      value={settings.system.supportPhone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          system: { ...settings.system, supportPhone: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Qo&apos;llab-quvvatlash Emaili
                    </label>
                    <input
                      type="email"
                      value={settings.system.supportEmail}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          system: { ...settings.system, supportEmail: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Standart QR Yorliq O&apos;lchami
                    </label>
                    <select
                      value={settings.system.defaultQrSize}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          system: { ...settings.system, defaultQrSize: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="50x30">50 x 30 mm — Standart Termo Etiketka</option>
                      <option value="40x25">40 x 25 mm — Ixcham Etiketka</option>
                      <option value="60x40">60 x 40 mm — Katta Jihozlar Uchun</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      QR Xatolikni Tiklash Darajasi
                    </label>
                    <select
                      value={settings.system.qrErrorCorrection}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          system: {
                            ...settings.system,
                            qrErrorCorrection: e.target.value as "L" | "M" | "Q" | "H",
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="M">M — Standart</option>
                      <option value="Q">Q — Yuqori</option>
                      <option value="H">H — Maksimal</option>
                      <option value="L">L — Past</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={settings.system.hideRoomAddressOnPublicScan}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          system: {
                            ...settings.system,
                            hideRoomAddressOnPublicScan: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Ommaviy skan qilinganda xona manzilini yashirish (Restricted Mode)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Loginsiz oddiy foydalanuvchi QR kodni skan qilganda aniq bino va xona raqami maxfiy saqlanadi.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* 2. XAVFSIZLIK SIYOSATI */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Xavfsizlik va Autentifikatsiya Siyosati
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Parol murakkabligi, sessiya muddatlari va brute-force hujumlaridan himoya
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Minimal Parol Uzunligi
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="32"
                      value={settings.security.minPasswordLength}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            minPasswordLength: parseInt(e.target.value) || 8,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">
                      Tavsiya etiladi: kamida 8 ta belgi (sukut bo&apos;yicha xodimlar uchun 12)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Sessiya Amal Qilish Muddati (Kun)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={settings.security.sessionDurationDays}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            sessionDurationDays: parseInt(e.target.value) || 30,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">
                      Foydalanuvchi tizimda qayta kirmasdan faol bo&apos;lish muddati
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Maksimal Muvaffaqiyatsiz Urinishlar (Brute-force Limiti)
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={settings.security.maxFailedAttempts}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            maxFailedAttempts: parseInt(e.target.value) || 5,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">
                      Ushbu sondan so&apos;ng hisob yoki IP vaqtincha bloklanadi
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Vaqtinchalik Bloklash Muddati (Daqiqa)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={settings.security.lockoutDurationMinutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            lockoutDurationMinutes: parseInt(e.target.value) || 15,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">
                      Ketma-ket xato paroldan so&apos;ng kutish vaqti
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Parol Yangilash Davriyligi (Kun)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={settings.security.requirePasswordChangeDays || 90}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            requirePasswordChangeDays: parseInt(e.target.value) || 90,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-[10px] text-slate-400">
                      0 — talab etilmaydi, odatda 90 kun
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={settings.security.enforceStrongPassword}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            enforceStrongPassword: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Murakkab parollarni majburiy qilish
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Katta harf, kichik harf, raqam va maxsus belgi qatnashishini talab etish.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* 3. TEXNIK TANAFFUS (MAINTENANCE MODE) */}
            {activeTab === "maintenance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Texnik Xizmat Ko&apos;rsatish Rejimi (Maintenance Mode)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Platformani yangilash va baza profilaktikasi paytida foydalanuvchilar kirishini vaqtincha cheklash
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        Profilaktika Rejimi Holati
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {settings.maintenance.enabled
                          ? "Hozirda tizim barcha oddiy foydalanuvchilar uchun yopiq"
                          : "Tizim to'liq faol, barcha tashkilotlar kirishi mumkin"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          maintenance: {
                            ...settings.maintenance,
                            enabled: !settings.maintenance.enabled,
                          },
                        })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        settings.maintenance.enabled ? "bg-amber-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          settings.maintenance.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Foydalanuvchilarga Ko&apos;rsatiladigan Xabar Matni
                    </label>
                    <textarea
                      rows={3}
                      value={settings.maintenance.message}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          maintenance: {
                            ...settings.maintenance,
                            message: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      placeholder="Profilaktika paytida saytda chiqadigan xabarni yozing..."
                    />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Ruxsat Berilgan IP Manzillar (Whitelisted IPs)
                    </label>
                    <input
                      type="text"
                      value={settings.maintenance.allowedIps.join(", ")}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          maintenance: {
                            ...settings.maintenance,
                            allowedIps: e.target.value
                              .split(",")
                              .map((ip) => ip.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      placeholder="127.0.0.1, ::1"
                    />
                    <span className="text-[10px] text-slate-400">
                      Vergul bilan ajrating. Ushbu IP egalari texnik tanaffus vaqtida ham tizimga kirishlari mumkin.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. INTEGRATSIYALAR (TELEGRAM VA SMS) */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Tashqi Integratsiyalar va Bildirishnomalar
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Telegram rasmiy boti va SMS xabarnoma xizmatlari sozlamalari
                  </p>
                </div>

                {/* Telegram Bot */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Telegram Monitoring Boti
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Muhim audit nomuvofiqliklari va xatoliklar bo&apos;yicha bildirishnomalar
                        </div>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.integrations.telegramBotEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            integrations: {
                              ...settings.integrations,
                              telegramBotEnabled: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">
                        Telegram Bot Username
                      </label>
                      <input
                        type="text"
                        value={settings.integrations.telegramBotUsername}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            integrations: {
                              ...settings.integrations,
                              telegramBotUsername: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                        placeholder="@AssetAuditBot"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">
                        Bildirishnoma Guruhi / Kanal Chat ID
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settings.integrations.telegramAlertChatId}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              integrations: {
                                ...settings.integrations,
                                telegramAlertChatId: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium"
                          placeholder="-100234567890"
                        />
                        <button
                          type="button"
                          disabled={isTestingTelegram}
                          onClick={handleTestTelegram}
                          className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isTestingTelegram ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Test Xabar</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Telegram Bildirishnoma Trigerlari */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700">
                      Qaysi hodisalarda Telegramga xabar yuborilsin?
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={settings.integrations.notifyOnCriticalConflict}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              integrations: {
                                ...settings.integrations,
                                notifyOnCriticalConflict: e.target.checked,
                              },
                            })
                          }
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                        />
                        <span className="text-xs text-slate-700">
                          Kritik audit ziddiyatlari (Yo&apos;qolgan aktivlar)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={settings.integrations.notifyOnNewTenant}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              integrations: {
                                ...settings.integrations,
                                notifyOnNewTenant: e.target.checked,
                              },
                            })
                          }
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                        />
                        <span className="text-xs text-slate-700">
                          Yangi tashkilot ro&apos;yxatdan o&apos;tkazilganda
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* SMS Gateway */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          SMS Xabarnomalar Shlyuzi
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Xodimlar uchun 2FA kodlari va tezkor SMS xabarnomalar
                        </div>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.integrations.smsGatewayEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            integrations: {
                              ...settings.integrations,
                              smsGatewayEnabled: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[11px] font-semibold text-slate-600">
                      SMS Provayderi
                    </label>
                    <select
                      value={settings.integrations.smsProvider}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            smsProvider: e.target.value as "eskiz" | "playmobile",
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      <option value="eskiz">Eskiz.uz SMS Gateway (O&apos;zbekiston)</option>
                      <option value="playmobile">PlayMobile SMS Gateway (O&apos;zbekiston)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 5. TASHKILOT KVOUTALARI */}
            {activeTab === "quotas" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Yangi Tashkilotlar uchun Standart Kvoutalar
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Yangi ochilgan har bir tashkilotga beriladigan dastlabki limitlar
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-3 text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong>Avtomatik biriktirish:</strong> Yangi ochilgan har bir tashkilot yaratilganda ushbu ko&apos;rsatkichlar uning profiliga avtomatik kiritiladi.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Maksimal Inventarlar Soni
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={settings.quotas.defaultMaxItems}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          quotas: {
                            ...settings.quotas,
                            defaultMaxItems: parseInt(e.target.value) || 10000,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Sukut bo&apos;yicha: 10,000 dona aktiv
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Disk Xotirasi (MB)
                    </label>
                    <input
                      type="number"
                      step="512"
                      value={settings.quotas.defaultMaxStorageMb}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          quotas: {
                            ...settings.quotas,
                            defaultMaxStorageMb: parseInt(e.target.value) || 2048,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Rasmlar va hujjatlar uchun: 2048 MB (2 GB)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Bir Vaqtdagi Faol Auditlar
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.quotas.defaultMaxConcurrentAudits}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          quotas: {
                            ...settings.quotas,
                            defaultMaxConcurrentAudits: parseInt(e.target.value) || 3,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Bir vaqtda faol o&apos;tkaziladigan davrlar
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. BAZA VA ZAXIRA NUSXALASH */}
            {activeTab === "backup" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Ma&apos;lumotlar Bazasi va Zaxira Nusxalar (Backup)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    PostgreSQL 16 ma&apos;lumotlar bazasi holati va avtomatik zaxira nusxalari
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-900">
                          PostgreSQL {dbLiveStats?.version || "16"} Klasteri (Faol & Sog&apos;lom)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Baza hajmi:{" "}
                        <span className="font-semibold text-slate-700">
                          {formatBytes(dbLiveStats?.sizeBytes || settings.backup.backupSizeBytes)}
                        </span>{" "}
                        | Oxirgi zaxira:{" "}
                        <span className="font-semibold text-slate-700">
                          {new Date(settings.backup.lastBackupTime).toLocaleString("uz-UZ")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href="/api/admin/backup/download"
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-2xs transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Yuklab Olish</span>
                      </a>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleBackupNow}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isPending ? "animate-spin" : ""}`} />
                        <span>Hozir Zaxira Olish</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={settings.backup.autoBackupEnabled}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            backup: {
                              ...settings.backup,
                              autoBackupEnabled: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Avtomatik Zaxira
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Har kuni rejaviy to&apos;liq snapshot zaxirasi olinadi
                        </div>
                      </div>
                    </label>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Zaxira Chastotasi
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Doimiy saqlash davriyligi
                        </div>
                      </div>
                      <select
                        value={settings.backup.frequency}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            backup: {
                              ...settings.backup,
                              frequency: e.target.value as "daily" | "weekly",
                            },
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="daily">Kunlik</option>
                        <option value="weekly">Haftalik</option>
                      </select>
                    </div>
                  </div>

                  {/* So'nggi zaxira nusxalari ro'yxati */}
                  {backupsList.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs font-bold text-slate-800 mb-2">
                        Mavjud Zaxira Fayllari
                      </div>
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                            <tr>
                              <th className="py-2 px-3">Fayl nomi</th>
                              <th className="py-2 px-3">Yaratilgan vaqti</th>
                              <th className="py-2 px-3">Hajmi</th>
                              <th className="py-2 px-3 text-right">Amal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {backupsList.slice(0, 5).map((b) => (
                              <tr key={b.filename} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-mono text-[11px] text-slate-700">
                                  {b.filename}
                                </td>
                                <td className="py-2 px-3 text-slate-500 text-[11px]">
                                  {new Date(b.createdAt).toLocaleString("uz-UZ")}
                                </td>
                                <td className="py-2 px-3 font-medium text-slate-600 text-[11px]">
                                  {formatBytes(b.sizeBytes)}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <a
                                    href={`/api/admin/backup/download?filename=${encodeURIComponent(b.filename)}`}
                                    download
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Yuklab olish</span>
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pastki Saqlash Tugmalari Paneli */}
          <div className="pt-6 mt-8 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>O&apos;zgarishlarni saqlash</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
