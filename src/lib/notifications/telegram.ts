import { getPlatformSettings } from "@/lib/data/platform-settings";

export interface TelegramSendResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Telegram Bot orqali xabar yuborish
 */
export async function sendTelegramMessage(
  text: string,
  targetChatId?: string
): Promise<TelegramSendResult> {
  try {
    const settings = getPlatformSettings();

    // Maxsus chat ID berilgan bo'lsa yoki global sozlamalardagi chat ID
    const chatId = (targetChatId || settings.integrations.telegramAlertChatId || "").trim();

    if (!chatId) {
      return {
        success: false,
        error: "Telegram Chat ID kiritilmagan. Iltimos, sozlamalarda Chat ID kiriting.",
      };
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // Haqiqiy bot token kiritilgan bo'lsa, rasmiy Telegram Bot API ga so'rov yuboramiz
    if (botToken && botToken.trim().length > 10) {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken.trim()}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
          }),
        }
      );

      const result = await response.json();
      if (!result.ok) {
        return {
          success: false,
          error: `Telegram API: ${result.description || "Xabar yetkazilmadi"}`,
        };
      }

      return {
        success: true,
        message: "Xabar Telegram orqali muvaffaqiyatli yuborildi!",
      };
    }

    // Token hali kiritilmagan bo'lsa (Dev/Staging rejimida simulyatsiya)
    console.log(
      `[Telegram Notification Simulated]\nTo Chat: ${chatId}\nMessage: ${text}`
    );

    return {
      success: true,
      message: `Test xabarnomasi muvaffaqiyatli yuborildi (Simulyatsiya qilingan Chat ID: ${chatId})`,
    };
  } catch (err) {
    console.error("[sendTelegramMessage] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Tarmoq ulanishida xatolik yuz berdi",
    };
  }
}

/**
 * Yangi tashkilot ochilganda Telegram xabarnomasi
 */
export async function notifyTelegramNewTenant(
  orgName: string,
  orgCode: string
): Promise<void> {
  const settings = getPlatformSettings();
  if (
    !settings.integrations.telegramBotEnabled ||
    !settings.integrations.notifyOnNewTenant
  ) {
    return;
  }

  const message = `🏢 <b>Yangi Tashkilot Ro'yxatdan O'tkazildi</b>\n\nNomi: <b>${orgName}</b>\nKodi: <code>${orgCode}</code>\nVaqt: <code>${new Date().toLocaleString("uz-UZ")}</code>\n\nAssetAudit platformasi nazorati ostida.`;

  await sendTelegramMessage(message);
}

/**
 * Kritik audit nomuvofiqligi aniqlanganda Telegram xabarnomasi
 */
export async function notifyTelegramCriticalConflict(
  orgName: string,
  itemCode: string,
  conflictType: string
): Promise<void> {
  const settings = getPlatformSettings();
  if (
    !settings.integrations.telegramBotEnabled ||
    !settings.integrations.notifyOnCriticalConflict
  ) {
    return;
  }

  const message = `⚠️ <b>Kritik Audit Nomuvofiqligi!</b>\n\nTashkilot: <b>${orgName}</b>\nInventar: <code>${itemCode}</code>\nMuammo turi: <b>${conflictType}</b>\nVaqt: <code>${new Date().toLocaleString("uz-UZ")}</code>`;

  await sendTelegramMessage(message);
}
