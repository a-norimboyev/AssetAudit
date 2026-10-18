import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { SettingsManager } from "./settings-manager";

export const metadata = {
  title: "Platforma Sozlamalari — AssetAudit Super Admin",
  description: "Global tizim parametrlari, xavfsizlik siyosati, texnik profilaktika va integratsiyalar",
};

export const instant = false;

export default async function AdminSettingsPage() {
  await requirePlatformAdmin();
  const settings = getPlatformSettings();

  return (
    <div className="space-y-6">
      <SettingsManager initialSettings={settings} />
    </div>
  );
}
