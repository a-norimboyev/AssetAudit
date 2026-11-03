import { NextRequest, NextResponse } from "next/server";
import { requireHeadAccess } from "@/lib/auth/authorization";
import { searchBoshliqItems } from "@/lib/data/boshliq";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ items: [] });
  }

  try {
    const context = await requireHeadAccess();
    const items = await searchBoshliqItems(context.organization!.id, query);
    return NextResponse.json({ items });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "digest" in error && error.digest === "HANGING_PROMISE_REJECTION") {
      throw error;
    }
    console.error("Search boshliq items error:", error);
    return NextResponse.json(
      { error: "Qidiruvda xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
