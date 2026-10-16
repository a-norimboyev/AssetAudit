import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema/inventory";
import { profiles } from "@/lib/db/schema/profiles";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { verifyTenantAccess, verifyProfileStatus } from "@/lib/auth/authorization-rules";

interface RouteParams {
  params: Promise<{ id: string }>;
}


/**
 * GET /api/media/items/[id]/photo
 * Maxfiy inventar suratlariga xavfsiz, autentifikatsiyadan o'tgan kirish (Server-Side Authenticated Media).
 * 
 * Xavfsizlik choralari:
 * 1. Anonim/ruxsatsiz so'rovlar -> 401 Unauthorized.
 * 2. Boshqa tashkilot xodimi ko'rmoqchi bo'lsa (Cross-Tenant) -> 403 Forbidden.
 * 3. Surat topilmasa -> 404 Not Found.
 * 4. Nginx X-Accel-Redirect qo'llab-quvvatlaydi (Production unumdorligi uchun).
 * 5. Standalone / local muhitda binar oqim (Buffer stream) orqali xavfsiz uzatiladi.
 * 6. X-Content-Type-Options: nosniff va Content-Security-Policy: sandbox bilan himoyalangan.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: itemId } = await params;

    if (!itemId) {
      return NextResponse.json({ error: "Inventar ID ko'rsatilmadi" }, { status: 400 });
    }

    // 1. Foydalanuvchi autentifikatsiyasini tekshirish
    const authSession = await auth.api.getSession({
      headers: request.headers,
    });

    if (!authSession || !authSession.user) {
      return NextResponse.json(
        { error: "Autentifikatsiya talab etiladi (Kirish taqiqlangan)", code: "AUTHENTICATION_REQUIRED" },
        { status: 401 }
      );
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, authSession.user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: "Foydalanuvchi profili topilmadi", code: "PROFILE_NOT_FOUND" },
        { status: 401 }
      );
    }

    const profileCheck = verifyProfileStatus(profile);
    if (!profileCheck.allowed) {
      return NextResponse.json(
        { error: profileCheck.errorMessage, code: profileCheck.errorCode },
        { status: 401 }
      );
    }

    // 2. Inventarni bazadan qidirish
    const [item] = await db
      .select({
        id: items.id,
        organizationId: items.organizationId,
        photoUrl: items.photoUrl,
      })
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);

    if (!item || !item.photoUrl) {
      return NextResponse.json({ error: "Inventar yoki uning surati topilmadi" }, { status: 404 });
    }

    // 3. Multi-Tenant Izolyatsiyasi va RBAC tekshiruvi (Org A vs Org B)
    const accessCheck = verifyTenantAccess(profile, item.organizationId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: "Kirish taqiqlangan: Begona tashkilot inventar suratlarini ko'rish huquqi mavjud emas",
          code: accessCheck.errorCode || "TENANT_ACCESS_DENIED",
        },
        { status: 403 }
      );
    }

    // 4. Diskdagi faylni xavfsiz topish (Path Traversal himoyasi: faqat basename olinadi)
    const rawFileName = path.basename(item.photoUrl);
    const uploadDir =
      process.env.UPLOAD_STORAGE_DIR ||
      path.resolve(process.cwd(), "public", "uploads", "inventory");

    const filePath = path.join(/*turbopackIgnore: true*/ uploadDir, rawFileName);

    // 5. Nginx X-Accel-Redirect qo'llab-quvvatlash
    if (process.env.USE_X_ACCEL === "true") {
      const response = new NextResponse(null, { status: 200 });
      response.headers.set("X-Accel-Redirect", `/internal-uploads/${rawFileName}`);
      response.headers.set("Content-Type", getMimeType(rawFileName));
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("Content-Security-Policy", "default-src 'none'; sandbox;");
      response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
      return response;
    }

    // 6. Node.js orqali faylni bevosita xavfsiz o'qish (Lokal, Test va Standalone muhit uchun)
    try {
      const fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ filePath);
      const mimeType = getMimeType(rawFileName);

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${rawFileName}"`,
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; sandbox;",
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    } catch {
      return NextResponse.json({ error: "Fayl tizimida rasm topilmadi" }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server xatoligi" },
      { status: 500 }
    );
  }
}

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
    default:
      return "image/jpeg";
  }
}
