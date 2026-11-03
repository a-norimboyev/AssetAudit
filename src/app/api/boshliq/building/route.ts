import { NextRequest, NextResponse } from "next/server";
import { requireHeadAccess } from "@/lib/auth/authorization";
import { getBoshliqFloorsAndRooms } from "@/lib/data/boshliq";

export async function GET(request: NextRequest) {
  const buildingId = request.nextUrl.searchParams.get("buildingId");

  if (!buildingId) {
    return NextResponse.json(
      { error: "Bino identifikatori (buildingId) ko'rsatilmadi." },
      { status: 400 }
    );
  }

  try {
    const context = await requireHeadAccess();
    const data = await getBoshliqFloorsAndRooms(context.organization!.id, buildingId);
    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "digest" in error && error.digest === "HANGING_PROMISE_REJECTION") {
      throw error;
    }
    console.error("Get boshliq building data error:", error);
    return NextResponse.json(
      { error: "Bino ma'lumotlarini yuklashda xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
