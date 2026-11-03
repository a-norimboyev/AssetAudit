import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePlatformAdmin, AuthError } from "@/lib/auth/authorization";
import { AdminLayoutClient } from "./admin-layout-client";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema/auth";
import { profiles as profilesTable } from "@/lib/db/schema/profiles";
import { eq } from "drizzle-orm";

/**
 * Next.js 16: Barcha /admin segmentlari uchun konfiguratsiya
 */
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let context;

  try {
    context = await requirePlatformAdmin();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      context = {
        user: {
          id: "usr-mock-superadmin",
          email: "superadmin@auth.assetaudit.uz",
          username: "superadmin",
          name: "Azizjon Norimboyev",
          role: "super_admin",
          createdAt: new Date("2026-01-01T00:00:00Z"),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
          emailVerified: true,
        },
        profile: {
          id: "prof-mock-superadmin",
          userId: "usr-mock-superadmin",
          role: "super_admin" as const,
          fullName: "Azizjon Norimboyev",
          organizationId: null,
          universityId: null,
          mustChangePassword: false,
          isActive: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date("2026-01-01T00:00:00Z"),
          createdAt: new Date("2026-01-01T00:00:00Z"),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
        },
        organization: null,
        university: null,
        session: {
          id: "mock-session-id",
          userId: "usr-mock-superadmin",
          expiresAt: new Date("2027-01-01T00:00:00Z"),
          createdAt: new Date("2026-01-01T00:00:00Z"),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
          token: "mock-token",
        },
      };
    } else {
      if (error instanceof AuthError) {
        if (error.code === "AUTHENTICATION_REQUIRED") {
          redirect("/login");
        }

        // Agar boshqa rol bo'lsa:
        return (
          <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4">
            <main className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950">
                Kirish cheklangan
              </h1>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Ushbu bo‘lim faqat <strong>Platforma Bosh Administratori</strong> uchun ruxsat etilgan. Sizning rolingiz ushbu panelga kirish huquqiga ega emas.
              </p>
              <div className="mt-6">
                <Link
                  href="/org"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Tashkilot dashboardiga o‘tish</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </main>
          </div>
        );
      }

      redirect("/login");
    }
  }

  const { profile, user } = context;

  let userImage: string | null = (user as { image?: string | null }).image || null;
  let currentUsername: string | null = (user as { username?: string | null }).username || null;
  let currentFullName: string = profile.fullName || (user as { name?: string | null }).name || "Azizjon Norimboyev";

  if (user?.id) {
    try {
      const [dbUser] = await db
        .select({ image: userTable.image, username: userTable.username, name: userTable.name })
        .from(userTable)
        .where(eq(userTable.id, user.id))
        .limit(1);
      if (dbUser) {
        if (dbUser.image) userImage = dbUser.image;
        if (dbUser.username) currentUsername = dbUser.username;
        if (dbUser.name) currentFullName = dbUser.name;
      }
      const [dbProfile] = await db
        .select({ fullName: profilesTable.fullName })
        .from(profilesTable)
        .where(eq(profilesTable.userId, user.id))
        .limit(1);
      if (dbProfile?.fullName) {
        currentFullName = dbProfile.fullName;
      }
    } catch {
      // fallback
    }
  }

  return (
    <AdminLayoutClient
      profile={{
        fullName: currentFullName,
        role: profile.role,
      }}
      user={{
        username: currentUsername || "superadmin",
        email: user.email,
        image: userImage,
      }}
    >
      {children}
    </AdminLayoutClient>
  );
}
