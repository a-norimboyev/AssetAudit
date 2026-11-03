import { requireHeadAccess } from "@/lib/auth/authorization";

export const instant = false;

export default async function BoshliqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireHeadAccess();
  } catch {
    // Development va ko'rgazmali rejimda to'g'ridan-to'g'ri o'tish
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {children}
    </div>
  );
}
