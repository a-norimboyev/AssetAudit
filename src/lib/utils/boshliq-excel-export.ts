import ExcelJS from "exceljs";
import type { MockItem, MockRoom } from "@/lib/mock/boshliq-mock-data";

export async function exportRoomPassportToExcel(
  organizationName: string,
  room: MockRoom,
  items: MockItem[]
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AssetAudit (MulkNazorat)";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Xona Pasporti", {
    pageSetup: { paperSize: 9, orientation: "portrait" },
  });

  // 1. Sarlavha blok
  sheet.mergeCells("A1:E1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `${organizationName.toUpperCase()} — XONA INVENTAR PASPORTI`;
  titleCell.font = { bold: true, size: 14, color: { argb: "FF1E293B" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  sheet.getRow(1).height = 28;

  // 2. Lokatsiya ma'lumotlari
  sheet.getCell("A3").value = "Bino:";
  sheet.getCell("B3").value = room.buildingName;
  sheet.getCell("A3").font = { bold: true };

  sheet.getCell("D3").value = "Qavat:";
  sheet.getCell("E3").value = room.floorName;
  sheet.getCell("D3").font = { bold: true };

  sheet.getCell("A4").value = "Xona raqami va nomi:";
  sheet.getCell("B4").value = `${room.roomNumber} - ${room.name} (${room.type})`;
  sheet.getCell("A4").font = { bold: true };

  sheet.getCell("D4").value = "Sana:";
  sheet.getCell("E4").value = new Date().toLocaleDateString("uz-UZ");
  sheet.getCell("D4").font = { bold: true };

  sheet.getCell("A5").value = "Jami jihozlar soni:";
  sheet.getCell("B5").value = `${items.length} ta`;
  sheet.getCell("A5").font = { bold: true };

  // 3. Jadval sarlavhasi
  const headerRow = sheet.getRow(7);
  headerRow.values = [
    "№",
    "Inventar Kodi",
    "Jihoz Nomi",
    "Toifasi",
    "Holati",
    "Texnik Holati",
    "Qo'shimcha Izoh",
  ];
  headerRow.height = 24;

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" }, // To'q ko'k
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  const statusTranslations: Record<string, string> = {
    active: "Soz (Faol)",
    repair: "Ta'mirda",
    written_off: "Hisobdan chiqarilgan",
  };

  const conditionTranslations: Record<string, string> = {
    new: "Yangi",
    good: "Yaxshi",
    fair: "O'rtacha",
    poor: "Ta'mirtalab",
  };

  // 4. Qatorlar
  items.forEach((item, index) => {
    const row = sheet.addRow([
      index + 1,
      item.inventoryNumber,
      item.name,
      item.categoryName,
      statusTranslations[item.status] || item.status,
      conditionTranslations[item.condition] || item.condition,
      item.description || "—",
    ]);

    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber === 1 || colNumber === 2 || colNumber === 5 || colNumber === 6 ? "center" : "left",
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  // Ustun kengliklari
  sheet.columns = [
    { width: 6 },  // №
    { width: 18 }, // Inventar kodi
    { width: 34 }, // Jihoz nomi
    { width: 24 }, // Toifasi
    { width: 18 }, // Holati
    { width: 16 }, // Texnik holati
    { width: 30 }, // Izoh
  ];

  // 5. Imzolar bloki
  const startSignRow = 7 + items.length + 3;
  sheet.getCell(`A${startSignRow}`).value = "Xona uchun mas'ul shaxs: ____________________";
  sheet.getCell(`E${startSignRow}`).value = "Tasdiqladi (Boshliq): ____________________";
  sheet.getCell(`A${startSignRow}`).font = { italic: true };
  sheet.getCell(`E${startSignRow}`).font = { italic: true };

  // Brauzerda avtomatik yuklab olish
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const sanitized = room.roomNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
  anchor.href = url;
  anchor.download = `Inventar_Pasporti_${sanitized}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
