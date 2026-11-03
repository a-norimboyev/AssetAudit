import { NextRequest, NextResponse } from "next/server";
import { requireHeadAccess } from "@/lib/auth/authorization";
import { getBoshliqRoomItems } from "@/lib/data/boshliq";

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
    const data = await getBoshliqRoomItems(context.organization!.id, roomId);
    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "digest" in error && error.digest === "HANGING_PROMISE_REJECTION") {
      throw error;
    }
    console.error("Get boshliq room items error:", error);
    return NextResponse.json(
      { error: "Xona jihozlarini yuklashda xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
