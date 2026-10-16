import type { Metadata } from "next";
import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";

export const metadata: Metadata = {
  title: "Dashboard Demo — AssetAudit",
  description: "Universitet Admini boshqaruv paneli demo ko‘rinishi",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
