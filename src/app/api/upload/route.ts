import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const ALLOWED_FOLDERS = ["logos", "avatars"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const requestedFolder = formData.get("folder") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Fayl yuklanmadi" },
        { status: 400 }
      );
    }

    const folder: AllowedFolder = ALLOWED_FOLDERS.includes(
      requestedFolder as AllowedFolder
    )
      ? (requestedFolder as AllowedFolder)
      : "logos";

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Fayl hajmi 5MB dan oshmasligi kerak" },
        { status: 400 }
      );
    }

    const uploadDir = path.resolve(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${folder}_${timestamp}_${randomSuffix}.webp`;
    const targetFilePath = path.join(uploadDir, fileName);

    await fs.writeFile(targetFilePath, buffer);

    const publicUrl = `/uploads/${folder}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: buffer.length,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Faylni saqlashda server xatoligi yuz berdi";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
