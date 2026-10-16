import { NextResponse } from "next/server";
import { requireAuthenticatedUser, AuthError } from "@/lib/auth/authorization";

/**
 * GET /api/auth/me
 * Server-side sessiya va profilni tekshirish hamda rolga mos redirect yo'nalishini hisoblash.
 * Qat'iy qoida: Frontend yuborgan rolga ishonilmaydi — ma'lumot faqat PostgreSQL'dan olinadi.
 */
export async function GET() {
  try {
    const context = await requireAuthenticatedUser({ allowMustChangePassword: true });

    // 4 ta rasmiy biznes rol bo'yicha yo'naltirish
    let redirectUrl = "/dashboard";
    switch (context.profile.role) {
      case "super_admin":
        redirectUrl = "/admin";
        break;
      case "organization_admin":
        redirectUrl = "/org";
        break;
      case "inspector":
        redirectUrl = "/audit";
        break;
      case "registrar":
        redirectUrl = "/org/inventory/new";
        break;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: context.user.id,
        name: context.user.name,
        email: context.user.email,
      },
      profile: {
        role: context.profile.role,
        fullName: context.profile.fullName,
        organizationId: context.profile.organizationId,
        isActive: context.profile.isActive,
      },
      redirectUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.code === "AUTHENTICATION_REQUIRED" ? 401 : 403;
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          message: error.message,
        },
        { status }
      );
    }
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "Serverda kutilmagan xatolik yuz berdi.",
      },
      { status: 500 }
    );
  }
}
