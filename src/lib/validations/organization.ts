/**
 * AssetAudit — Tashkilot Ma'lumotlarini Validatsiya Qilish Moduli
 *
 * Ushbu modul mijoz va server qatlamida tashkilot kiritish ma'lumotlarini
 * qat'iy tekshiradi va normalizatsiya qiladi.
 */

export interface OrganizationInput {
  name: string;
  code: string;
  typeId: string;
  isActive?: boolean;
}

export interface OrganizationValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    code?: string;
    typeId?: string;
  };
  normalized: {
    name: string;
    code: string;
    typeId: string;
    isActive: boolean;
  };
}

/**
 * Tashkilot nomidan avtomatik qisqa kod yasash
 */
export function generateCodeFromName(name: string): string {
  if (!name || !name.trim()) return "ORG";
  const clean = name
    .trim()
    .replace(/[‘'`"ʻ’]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const acronym = words.map((w) => w[0]).join("").toUpperCase();
    if (acronym.length >= 2) return acronym.slice(0, 10);
  }
  if (words.length === 1) {
    const w = words[0].toUpperCase();
    if (w.length >= 2) return w.slice(0, 10);
  }
  return `ORG-${Math.floor(100 + Math.random() * 900)}`;
}

const CODE_REGEX = /^[A-Za-z0-9_-]{2,50}$/;

export function validateOrganizationInput(input: Partial<OrganizationInput>): OrganizationValidationResult {
  const errors: { name?: string; code?: string; typeId?: string } = {};

  // 1. Tashkilot rasmiy nomi tekshiruvi
  const rawName = typeof input.name === "string" ? input.name : "";
  const trimmedName = rawName.trim();

  if (!trimmedName) {
    errors.name = "Tashkilotning rasmiy nomi kiritilishi shart.";
  } else if (trimmedName.length < 3) {
    errors.name = "Tashkilot nomi kamida 3 ta belgidan iborat bo'lishi kerak.";
  } else if (trimmedName.length > 255) {
    errors.name = "Tashkilot nomi 255 belgidan oshmasligi kerak.";
  }

  // 2. Tashkilot kodi tekshiruvi (UPPER/TRIM normalizatsiyasi)
  const rawCode = typeof input.code === "string" ? input.code : "";
  const trimmedCode = rawCode.trim();
  const normalizedCode = trimmedCode.toUpperCase();

  if (!trimmedCode) {
    errors.code = "Tashkilot kodi kiritilishi shart.";
  } else if (trimmedCode.length < 2) {
    errors.code = "Tashkilot kodi kamida 2 ta belgidan iborat bo'lishi kerak.";
  } else if (trimmedCode.length > 50) {
    errors.code = "Tashkilot kodi 50 belgidan oshmasligi kerak.";
  } else if (!CODE_REGEX.test(trimmedCode)) {
    errors.code = "Tashkilot kodi faqat lotin harflari, raqamlar va defisdan iborat bo'lishi kerak.";
  }

  // 3. Tashkilot turi tekshiruvi
  const rawTypeId = typeof input.typeId === "string" ? input.typeId : "";
  const trimmedTypeId = rawTypeId.trim().toLowerCase();

  if (!trimmedTypeId || trimmedTypeId === "all") {
    errors.typeId = "Tashkilot turini tanlash majburiy.";
  } else if (trimmedTypeId.length > 50) {
    errors.typeId = "Tashkilot turi identifikatori noto'g'ri.";
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    valid: isValid,
    errors,
    normalized: {
      name: trimmedName,
      code: normalizedCode,
      typeId: trimmedTypeId,
      isActive: input.isActive ?? true,
    },
  };
}
