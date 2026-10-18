"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Sliders,
  Settings,
  Menu,
  X,
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
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Tashkilotlar",
    href: "/admin/organizations",
    icon: Building2,
    exact: false,
  },
  {
    name: "Administratorlar",
    href: "/admin/administrators",
    icon: Users,
    exact: false,
  },
  {
    name: "Platforma sozlamalari",
    href: "/admin/settings",
    icon: Sliders,
    exact: false,
  },
  {
    name: "Sozlamalar",
    href: "/admin/profile",
    icon: Settings,
    exact: false,
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobil menyu ochish tugmasi (kichik ekranlar uchun) */}
      <div className="lg:hidden flex items-center justify-between p-3.5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Platforma Boshqaruvi
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

      {/* Asosiy Desktop Sidebar va Mobil ochiluvchi menyu */}
      <aside
        className={`
          ${mobileMenuOpen ? "block" : "hidden"} 
          lg:block w-full lg:w-64 shrink-0 bg-white border-b lg:border-b-0 border-r-0 lg:border-r border-slate-200/80 p-4
          h-full overflow-y-auto flex flex-col justify-between z-20
        `}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <nav className="space-y-1 flex-1" aria-label="Admin bo'limlari">
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
                    title="Ushbu bo'lim keyingi bosqichda ishga tushadi"
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
            <div className="text-[11px] font-medium text-slate-400 leading-relaxed">
              AssetAudit v1.0 <br />
              Multi-Tenant Boshqaruv
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
