import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { ProfileSettingsManager } from "./profile-settings-manager";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema/auth";
import { profiles as profilesTable } from "@/lib/db/schema/profiles";
import { eq } from "drizzle-orm";

export const metadata = {
  title: "Sozlamalar — AssetAudit Super Admin",
  description: "Foydalanuvchi sozlamalari, rasmi va parolini boshqarish",
};

export const instant = false;

export default async function AdminProfileSettingsPage() {
  let user: { id?: string; email?: string | null; username?: string | null; image?: string | null } = {
    id: "usr-mock-superadmin",
    email: "superadmin@auth.assetaudit.uz",
    username: "superadmin",
    image: null,
  };
  let profile: { role: string; fullName: string | null } = { role: "super_admin", fullName: "Azizjon Norimboyev" };

  try {
    const auth = await requirePlatformAdmin();
    user = auth.user;
    profile = auth.profile;
  } catch (e) {
    if (process.env.NODE_ENV === "production") {
      throw e;
    }
  }

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

  const effectiveUsername = currentUsername || user.username || "superadmin";

  return (
    <div className="space-y-6 w-full">
      {/* Interaktiv Sozlamalar Boshqaruvchisi */}
      <ProfileSettingsManager
        currentUsername={effectiveUsername}
        fullName={currentFullName}
        currentAvatar={userImage}
      />
    </div>
  );
}
