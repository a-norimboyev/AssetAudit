/**
 * AssetAudit — Xavfsiz CSV Serializatsiya va Formula Injection (CWE-1236) Himoyasi
 *
 * RFC 4180 qoidalariga muvofiq:
 * 1. Barcha kataklardagi qo'shtirnoqlar ("") tarzida dublyaj qilinadi.
 * 2. Vergul, newline (\n, \r) va maxsus belgilar double quotes ("...") ichiga olinadi.
 * 3. OWASP Formula Injection himoyasi: =, +, -, @, \t, \r, %, | bilan boshlangan
 *    potensial xavfli formulalar oldiga (') bittalik qo'shtirnoq qo'shiladi.
 */

export function sanitizeCsvValue(val: string): string {
  if (!val) return "";
  const trimmed = val.trimStart();
  if (trimmed.length === 0) return val;

  const firstChar = trimmed[0];
  const DANGEROUS_PREFIXES = ["=", "+", "-", "@", "\t", "\r", "%", "|"];

  if (DANGEROUS_PREFIXES.includes(firstChar)) {
    // Agar qiymat sof raqam bo'lsa (masalan, -500 yoki +25), formula deb hisoblanmaydi
    const isPureNumber = /^[+-]?\d+(\.\d+)?$/.test(trimmed);
    if (!isPureNumber) {
      return `'${val}`;
    }
  }

  return val;
}

export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }

  if (typeof val === "number" || typeof val === "boolean") {
    return `"${val}"`;
  }

  let str = String(val);
  str = sanitizeCsvValue(str);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Qatorlar massivini RFC 4180 bo'yicha CSV qatoriga aylantirish
 */
export function buildCsvRow(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(",");
}

