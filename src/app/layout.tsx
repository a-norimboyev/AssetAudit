import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerCleanup } from "@/components/common/ServiceWorkerCleanup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AssetAudit — Inventarlarni raqamli hisobga olish va nazorat qilish platformasi",
  description:
    "Universitetlar va tashkilotlar uchun QR kod orqali inventarlarni hisobga olish, xonalar bo‘yicha tekshirish va joylashuv nomuvofiqliklarini aniqlash platformasi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerCleanup />
        {children}
      </body>
    </html>
  );
}
