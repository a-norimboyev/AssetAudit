import type { Metadata } from "next";
import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";

export const metadata: Metadata = {
  title: "Boshqaruv Paneli — AssetAudit",
  description: "Universitet Admini boshqaruv paneli",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
