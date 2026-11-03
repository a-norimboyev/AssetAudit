import { db } from "@/lib/db";
import { items } from "@/lib/db/schema/inventory";
import { buildings, rooms } from "@/lib/db/schema/locations";
import { and, eq, like } from "drizzle-orm";

/**
 * Bino kodi yoki nomidan qisqa va aniq prefiks hosil qilish (Masalan: B1, YOT1, SPORT1)
 */
export function formatBuildingShortCode(code: string, name?: string): string {
  const cleanCode = (code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleanCode && cleanCode.length <= 6) {
    return cleanCode;
  }

  // Agar kod mavjud bo'lmasa yoki juda uzun bo'lsa, nomidan hosil qilish
  const target = (cleanCode || name || "").toUpperCase();
  const digitMatch = target.match(/\d+/);
  const digit = digitMatch ? digitMatch[0] : "1";

  if (target.includes("YOTOQ") || target.includes("DORM")) return `YOT${digit}`;
  if (target.includes("SPORT") || target.includes("GYM")) return `SPORT${digit}`;
  if (target.includes("KUTUB") || target.includes("LIB")) return `KUTUB${digit}`;
  if (target.includes("LAB")) return `LAB${digit}`;

  return `B${digit}`;
}

/**
 * Xona raqamini standart formatga keltirish (Masalan: 210, 101A)
 */
export function formatRoomNumber(roomNumber: string): string {
  return (roomNumber || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export interface GeneratedCodeRange {
  prefix: string;
  startSequence: number;
  endSequence: number;
  sampleStart: string;
  sampleEnd: string;
  codes: string[];
}

/**
 * Xona va bino bo'yicha keyingi bo'sh inventar raqamlarini hisoblash
 * Format: B1-210-0001 dan B1-210-0020 gacha
 */
export async function getNextInventoryCodes({
  organizationId,
  buildingId,
  roomId,
  quantity = 1,
}: {
  organizationId: string;
  buildingId: string;
  roomId: string;
  quantity?: number;
}): Promise<GeneratedCodeRange> {
  const safeQuantity = Math.max(1, Math.min(100, Math.floor(quantity)));

  // 1. Bino va xona ma'lumotlarini bazadan olish
  const [roomInfo] = await db
    .select({
      roomNumber: rooms.roomNumber,
      buildingCode: buildings.code,
      buildingName: buildings.name,
    })
    .from(rooms)
    .innerJoin(buildings, eq(rooms.buildingId, buildings.id))
    .where(
      and(
        eq(rooms.id, roomId),
        eq(rooms.organizationId, organizationId),
        eq(buildings.id, buildingId)
      )
    )
    .limit(1);

  const bPrefix = roomInfo
    ? formatBuildingShortCode(roomInfo.buildingCode, roomInfo.buildingName)
    : "B1";
  const rNumber = roomInfo ? formatRoomNumber(roomInfo.roomNumber) : "101";

  const prefix = `${bPrefix}-${rNumber}`;

  // 2. Ushbu prefiks bilan boshlanadigan mavjud barcha inventar raqamlarini olish
  const existingItems = await db
    .select({ inventoryNumber: items.inventoryNumber })
    .from(items)
    .where(
      and(
        eq(items.organizationId, organizationId),
        like(items.inventoryNumber, `${prefix}-%`)
      )
    );

  // 3. Mavjud ketma-ketlik raqamlarini tahlil qilish
  const sequenceRegex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`, "i");
  let maxSeq = 0;

  for (const item of existingItems) {
    const match = item.inventoryNumber.match(sequenceRegex);
    if (match && match[1]) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const startSequence = maxSeq + 1;
  const endSequence = maxSeq + safeQuantity;

  const codes: string[] = [];
  for (let i = startSequence; i <= endSequence; i++) {
    codes.push(`${prefix}-${String(i).padStart(4, "0")}`);
  }

  return {
    prefix,
    startSequence,
    endSequence,
    sampleStart: codes[0],
    sampleEnd: codes[codes.length - 1],
    codes,
  };
}
