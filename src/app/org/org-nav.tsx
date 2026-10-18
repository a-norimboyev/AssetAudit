"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building,
  Layers,
  DoorClosed,
  QrCode,
  Users,
  ClipboardCheck,
  Menu,
  X,
  Shield,
  FileSpreadsheet,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  disabled?: boolean;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Bosh sahifa",
    href: "/org",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Binolar",
    href: "/org/buildings",
    icon: Building,
    exact: false,
  },
  {
    name: "Qavatlar",
    href: "/org/floors",
    icon: Layers,
    exact: false,
  },
  {
    name: "Xonalar",
    href: "/org/rooms",
    icon: DoorClosed,
    exact: false,
  },
  {
    name: "Inventarlar",
    href: "/org/inventory",
    icon: QrCode,
    exact: false,
  },
  {
    name: "Mas'ul xodimlar",
    href: "/org/staff",
    icon: Users,
    exact: false,
  },
  {
    name: "Audit jarayoni",
    href: "/org/audits",
    icon: ClipboardCheck,
    exact: false,
  },
  {
    name: "Hisobotlar",
    href: "/org/reports",
    icon: FileSpreadsheet,
    exact: false,
  },
];

export function OrgNav({ organizationCode }: { organizationCode: string }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobil menyu ochish tugmasi */}
      <div className="lg:hidden flex items-center justify-between p-3.5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tashkilot Menyu
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
            {organizationCode}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          aria-label={mobileMenuOpen ? "Menyuni yopish" : "Menyuni ochish"}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Asosiy Desktop Sidebar va Mobil menyu */}
      <aside
        className={`
          ${mobileMenuOpen ? "block" : "hidden"} 
          lg:block w-full lg:w-64 shrink-0 bg-white border-b lg:border-b-0 border-r-0 lg:border-r border-slate-200/80 p-4
          lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:self-start lg:z-20
          flex flex-col justify-between
        `}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="mb-6 p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-2.5 text-blue-900 text-xs shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-blue-950">Tenant Nazorati</div>
              <div className="text-[11px] text-blue-600 font-mono font-semibold truncate">{organizationCode}</div>
            </div>
          </div>

          <nav className="space-y-1 flex-1" aria-label="Tashkilot bo'limlari">
            {NAV_ITEMS.map((item) => {
              const isActive =
                !item.disabled &&
                (item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href));

              if (item.disabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 bg-slate-50/50 cursor-not-allowed select-none"
                    title="Ushbu modul keyingi bosqichda faollashtiriladi"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-slate-300" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 text-slate-500">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-2xs shadow-blue-500/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`}
                    />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 px-3 shrink-0">
            <div className="text-[11px] font-medium text-slate-500 leading-relaxed">
              AssetAudit v1.0 <br />
              Tenant: <strong className="text-slate-700 font-semibold">{organizationCode}</strong>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
