import { BoshliqViewClient } from "./boshliq-view";
import { requireHeadAccess } from "@/lib/auth/authorization";

export const metadata = {
  title: "Boshliq Paneli — AssetAudit",
  description: "Universitet rahbariyati uchun infratuzilma va aktivlar monitoringi",
};

export const instant = false;

export default async function BoshliqPage() {
  let orgName = "Toshkent Axborot Texnologiyalari Universiteti (TATU)";
  let orgCode = "TATU";
  let profileName = "Prof. O. Sh. Karimov";
  let roleTitle = "Universitet Boshlig'i (Rektorat)";
  let isOrgAdmin = false;

  try {
    const context = await requireHeadAccess();
    if (context && context.organization) {
      orgName = context.organization.name;
      orgCode = context.organization.code || "TATU";
      profileName = context.profile.fullName || "Rahbariyat";
      isOrgAdmin = context.profile.role === "organization_admin";
      roleTitle = isOrgAdmin ? "Universitet Administratori" : "Rektorat / Boshliq";
    }
  } catch {
    // Development va ko'rgazmali rejimda toza mock ma'lumotlar
  }

  return (
    <BoshliqViewClient
      organizationName={orgName}
      organizationCode={orgCode}
      profileName={profileName}
      roleTitle={roleTitle}
      isOrgAdmin={isOrgAdmin}
    />
  );
}
