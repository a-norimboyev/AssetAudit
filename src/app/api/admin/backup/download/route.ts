import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import {
  getSafeBackupPath,
  listBackups,
  createRealDatabaseBackup,
} from "@/lib/data/backup-service";


export async function GET(request: NextRequest) {
  try {
    // 1. Faqat Super Admin yuklab olishi mumkin
    await requirePlatformAdmin();

    const searchParams = request.nextUrl.searchParams;
    let filename = searchParams.get("filename");

    // Agar filename ko'rsatilmagan bo'lsa, eng so'nggi zaxirani topish
    if (!filename) {
      const allBackups = listBackups();
      if (allBackups.length > 0) {
        filename = allBackups[0].filename;
      } else {
        // Hali zaxira yo'q bo'lsa, avtomatik yaratish
        const newBackup = await createRealDatabaseBackup();
        filename = newBackup.filename;
      }
    }

    const filePath = getSafeBackupPath(filename);
    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Zaxira fayli topilmadi" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[Backup Download Error]:", error);
    return NextResponse.json(
      { error: "Ruxsat berilmadi yoki xatolik yuz berdi" },
      { status: 403 }
    );
  }
}
