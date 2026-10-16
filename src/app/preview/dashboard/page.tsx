import { notFound } from "next/navigation";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default function PreviewDashboardPage() {
  // Production muhitida ushbu demo sahifa 404 qaytaradi
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DashboardView />;
}
