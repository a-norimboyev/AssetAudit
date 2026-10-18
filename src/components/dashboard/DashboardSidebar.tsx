"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  ClipboardCheck,
  FileBarChart,
  Users,
  Settings,
  X,
  ShieldCheck,
} from "lucide-react";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "blue" | "amber";
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/org",
    icon: LayoutDashboard,
  },
  {
    name: "Binolar va xonalar",
    href: "/org/buildings",
    icon: Building2,
  },
  {
    name: "Inventarlar",
    href: "/org/inventory",
    icon: Package,
  },
  {
    name: "Tekshiruvlar",
    href: "/org/audits",
    icon: ClipboardCheck,
  },
  {
    name: "Hisobotlar",
    href: "/org/reports",
    icon: FileBarChart,
  },
  {
    name: "Mas'ul xodimlar",
    href: "/org/staff",
    icon: Users,
  },
  {
    name: "Sozlamalar",
    href: "/org/settings",
    icon: Settings,
  },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobil fon qoplami (Backdrop) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Asosiy Sidebar paneli */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Yuqori logotip qismi */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <Link
            href="/preview/dashboard"
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              A
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-slate-950 flex items-center gap-1.5">
                Asset<span className="text-blue-600">Audit</span>
              </div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                TATU Boshqaruvi
              </div>
            </div>
          </Link>

          {/* Mobilda yopish tugmasi */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Menyuni yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigatsiya ro'yxati */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {(() => {
            const activeItem = navItems
              .filter((item) => {
                if (item.name === "Dashboard") {
                  return pathname === "/org" || pathname.startsWith("/preview/dashboard");
                }
                return pathname === item.href || pathname.startsWith(item.href + "/");
              })
              .sort((a, b) => b.href.length - a.href.length)[0];

            return navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem?.name === item.name;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onClose()}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        item.badgeVariant === "amber"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : item.badgeVariant === "blue"
                          ? "bg-blue-100/70 text-blue-700 border-blue-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            });
          })()}
        </nav>

        {/* Pastki xavfsizlik va rol bloki */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs border border-blue-200 shrink-0">
              UA
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                Admin (TATU)
              </p>
              <div className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>Universitet Admini</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
