import crypto from "node:crypto";
import QRCode from "qrcode";

/**
 * 1. Kriptografik xavfsiz, taxmin qilib bo'lmaydigan QR Token generatsiyasi
 * Qat'iy qoida: Vaqtinchalik raqam yoki xona ID emas, 48 belgili barqaror token
 */
export function generateSecureQrToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * 2. Rasmiy ommaviy QR URL manzilini shakllantirish
 */
export function getPublicQrUrl(token: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3001";

  return `${baseUrl.replace(/\/$/, "")}/qr/${token}`;
}

/**
 * 3. QR-kod Data URL (PNG) generatsiyasi
 * Yorliq va ekranda ko'rsatish uchun yuqori aniqlikdagi tasvir
 */
export async function generateQrDataUrl(tokenOrUrl: string): Promise<string> {
  const url = tokenOrUrl.startsWith("http") ? tokenOrUrl : getPublicQrUrl(tokenOrUrl);

  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
    color: {
      dark: "#0f172a", // slate-900
      light: "#ffffff",
    },
  });
}

/**
 * 4. QR-kod SVG formati (PDF va vektor chop etish uchun)
 */
export async function generateQrSvg(tokenOrUrl: string): Promise<string> {
  const url = tokenOrUrl.startsWith("http") ? tokenOrUrl : getPublicQrUrl(tokenOrUrl);

  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}
