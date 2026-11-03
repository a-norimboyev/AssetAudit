import React from "react";

export const metadata = {
  title: "Röyxatga Oluvçi (Registrar) — AssetAudit",
  description: "Universitet infratuzilmasini oçiş, yangi jihozlarni kiritiş va minimalist QR-stikerlarni çop etiş",
};

export const instant = false;

export default function RegistrarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
}
