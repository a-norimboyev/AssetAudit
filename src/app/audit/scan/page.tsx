import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser, AuthError } from "@/lib/auth/authorization";
import { canPerformAudit } from "@/lib/auth/authorization-rules";
import { getRoomsList } from "@/lib/data/locations";
import { getActiveCycle } from "@/lib/data/audit";
import { ScanInterface } from "./scan-interface";
import { OrgLogoutButton } from "@/app/org/org-logout-button";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "QR Skanerlash — AssetAudit",
  description: "Inventarizatsiya tekshiruvchisining tezkor skanerlash oynasi",
};

export const instant = false;

interface PageProps {
  searchParams: Promise<{
    roomId?: string;
  }>;
}

export default async function AuditScanPage({ searchParams }: PageProps) {
  let context;
  try {
    context = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.code === "AUTHENTICATION_REQUIRED") {
        redirect("/login");
      }
    }
    redirect("/login");
  }

  const { profile, organization } = context;

  if (!organization || !canPerformAudit(profile.role)) {
    redirect("/login");
  }

  const params = await searchParams;
  const initialRoomId = params.roomId;

  const [roomsRes, activeCycle] = await Promise.all([
    getRoomsList({ organizationId: organization.id, pageSize: 300 }),
    getActiveCycle(organization.id),
  ]);

  const roomOptions = roomsRes.items.map((r) => ({
    id: r.id,
    roomNumber: r.roomNumber,
    name: r.name,
    buildingName: r.buildingName,
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Yuqori Header */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-30">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <Link
            href="/audit"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Portalga qaytish</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{organization.code} Auditi</span>
            </span>
            <OrgLogoutButton />
          </div>
        </div>
      </header>

      {/* Asosiy Skaner */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Inventarlarni Skanerlash
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {activeCycle ? activeCycle.title : "Mustaqil tekshiruv rejimi"}
          </p>
        </div>

        {roomOptions.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs text-center text-xs text-slate-500">
            Hali xonalar kiritilmagan. Avval bino va xonalarni yarating.
          </div>
        ) : (
          <ScanInterface
            rooms={roomOptions}
            initialRoomId={initialRoomId}
            cycleId={activeCycle?.id}
          />
        )}
      </main>

      <footer className="border-t border-slate-200/80 bg-white py-3 text-center text-[11px] text-slate-500">
        &copy; 2026 AssetAudit. Tezkor Skanerlash.
      </footer>
    </div>
  );
}
