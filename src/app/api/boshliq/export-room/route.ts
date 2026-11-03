import { NextRequest, NextResponse } from "next/server";
import { requireHeadAccess } from "@/lib/auth/authorization";
import { getBoshliqRoomPassport } from "@/lib/data/boshliq";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json(
      { error: "Xona identifikatori (roomId) ko'rsatilmadi." },
      { status: 400 }
    );
  }

  try {
    const context = await requireHeadAccess();
    const passport = await getBoshliqRoomPassport(context.organization!.id, roomId);
    if (!passport) {
      return NextResponse.json(
        { error: "Xona topilmadi yoki unga kirish huquqi mavjud emas." },
        { status: 404 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AssetAudit (MulkNazorat)";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Xona Pasporti", {
      pageSetup: { paperSize: 9, orientation: "portrait" },
    });

    // Sarlavha blok
    sheet.mergeCells("A1:E1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = `${passport.organizationName.toUpperCase()} — XONA INVENTAR PASPORTI`;
    titleCell.font = { bold: true, size: 14, color: { argb: "FF1E293B" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 28;

    // Lokatsiya ma'lumotlari
    sheet.getCell("A3").value = "Bino:";
    sheet.getCell("B3").value = passport.buildingName;
    sheet.getCell("A3").font = { bold: true };

    sheet.getCell("D3").value = "Qavat:";
    sheet.getCell("E3").value = passport.floorName;
    sheet.getCell("D3").font = { bold: true };

    sheet.getCell("A4").value = "Xona raqami va nomi:";
    sheet.getCell("B4").value = `${passport.roomNumber} - ${passport.roomName} (${passport.roomType})`;
    sheet.getCell("A4").font = { bold: true };

    sheet.getCell("D4").value = "Sana:";
    sheet.getCell("E4").value = new Date().toLocaleDateString("uz-UZ");
    sheet.getCell("D4").font = { bold: true };

    sheet.getCell("A5").value = "Jami jihozlar:";
    sheet.getCell("B5").value = `${passport.items.length} ta`;
    sheet.getCell("A5").font = { bold: true };

    // Jadval ustunlari sarlavhasi
    const headerRow = sheet.getRow(7);
    headerRow.values = [
      "№",
      "Inventar Kodi",
      "Jihoz Nomi",
      "Toifasi",
      "Holati",
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
      transferred: "Ko'chirilgan",
      lost: "Yo'qolgan",
    };

    // Ma'lumot qatorlari
    passport.items.forEach((item, index) => {
      const row = sheet.addRow([
        index + 1,
        item.inventoryNumber,
        item.name,
        item.categoryName,
        statusTranslations[item.status] || item.status,
        item.description || "—",
      ]);

      row.height = 20;
      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 1 || colNumber === 2 || colNumber === 5 ? "center" : "left",
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
      { width: 32 }, // Jihoz nomi
      { width: 24 }, // Toifasi
      { width: 18 }, // Holati
      { width: 30 }, // Izoh
    ];

    // Imzolar bloki
    const startSignRow = 7 + passport.items.length + 3;
    sheet.getCell(`A${startSignRow}`).value = "Xona uchun moddiy javobgar shaxs: ____________________";
    sheet.getCell(`D${startSignRow}`).value = "Tasdiqladi (Boshliq): ____________________";
    sheet.getCell(`A${startSignRow}`).font = { italic: true };
    sheet.getCell(`D${startSignRow}`).font = { italic: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const sanitizedRoomName = passport.roomNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `Inventar_Pasporti_${sanitizedRoomName}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "digest" in error && error.digest === "HANGING_PROMISE_REJECTION") {
      throw error;
    }
    console.error("Export room error:", error);
    return NextResponse.json(
      { error: "Faylni yuklab olishda server xatoligi yuz berdi." },
      { status: 500 }
    );
  }
}
