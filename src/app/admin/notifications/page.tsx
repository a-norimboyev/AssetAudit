import { NotificationsClient } from "./notifications-client";

export const metadata = {
  title: "Xabarnomalar va E‘lonlar — AssetAudit Superadmin",
  description: "250 ta OTM administratorlariga yagona xabarnomalar va ko‘rsatmalar tarqatish",
};

export const instant = false;

export default function AdminNotificationsPage() {
  return <NotificationsClient />;
}
