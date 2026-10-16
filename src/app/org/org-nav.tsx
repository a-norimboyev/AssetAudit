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
          <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {organizationCode}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-[3px] border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label={mobileMenuOpen ? "Menyuni yopish" : "Menyuni ochish"}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Asosiy Desktop Sidebar va Mobil menyu */}
      <aside
        className={`
          ${mobileMenuOpen ? "block" : "hidden"} 
          lg:block w-full lg:w-64 shrink-0 bg-white border-r border-slate-200/80 p-4 lg:min-h-[calc(100vh-4rem)]
        `}
      >
        <div className="mb-6 px-3 py-2.5 rounded-[4px] bg-blue-50/60 border border-blue-100 flex items-center gap-2 text-blue-900 text-xs">
          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-blue-950">Tenant Nazorati</div>
            <div className="text-[11px] text-blue-600 font-mono truncate">{organizationCode}</div>
          </div>
        </div>

        <nav className="space-y-1.5" aria-label="Tashkilot bo'limlari">
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
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-[4px] text-xs font-medium text-slate-400 bg-slate-50/50 cursor-not-allowed select-none"
                  title="Ushbu modul keyingi bosqichda faollashtiriladi"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-slate-300" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold bg-slate-200/70 text-slate-500">
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
                  flex items-center justify-between px-3.5 py-2.5 rounded-[4px] text-xs font-semibold transition-all
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs shadow-blue-500/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
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

        <div className="mt-8 pt-6 border-t border-slate-100 px-3">
          <div className="text-[11px] font-medium text-slate-500 leading-relaxed">
            AssetAudit v1.0 <br />
            Tenant: <strong className="text-slate-600">{organizationCode}</strong>
          </div>
        </div>
      </aside>
    </>
  );
}
