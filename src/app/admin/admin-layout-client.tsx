"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Users,
  Megaphone,
  Settings,
  X,
  Menu,
} from "lucide-react";
import { LogoIcon } from "@/components/ui/logo";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { AdminToastProvider } from "./admin-toast-context";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  profile: {
    fullName: string | null;
    role: string;
  };
  user: {
    username?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  disabled?: boolean;
  badge?: string;
  badgeVariant?: "blue" | "slate" | "emerald";
}

function getInitials(name?: string | null, username?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return "SA";
}

export function AdminLayoutClient({
  children,
  profile,
  user,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useBodyScrollLock(isSidebarOpen);

  const initials = getInitials(profile.fullName, user.username || user.email);

  const navItems: NavItem[] = [
    {
      name: "Universitetlar",
      href: "/admin",
      icon: Building2,
      exact: true,
    },
    {
      name: "Administratorlar",
      href: "/admin/administrators",
      icon: Users,
    },
    {
      name: "Xabarnomalar",
      href: "/admin/notifications",
      icon: Megaphone,
    },
    {
      name: "Sozlamalar",
      href: "/admin/profile",
      icon: Settings,
    },
  ];

  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex">
        {/* Mobil fon qoplami (Backdrop) */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity overscroll-contain"
            aria-hidden="true"
          />
        )}

      {/* Asosiy Chap Sidebar paneli */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 overscroll-contain ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Yuqori logotip qismi */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="text-slate-800 transition-transform duration-150 group-hover:scale-105">
              <LogoIcon size={34} />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-slate-950 flex items-center gap-1.5">
                Asset<span className="text-blue-600">Audit</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Super Admin
              </div>
            </div>
          </Link>

          {/* Mobilda yopish tugmasi */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Menyuni yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigatsiya ro'yxati */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto" aria-label="Admin menyusi">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              !item.disabled &&
              (item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href));

            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-medium text-slate-400 bg-slate-50/50 cursor-not-allowed select-none"
                  title="Ushbu bo'lim tez kunda ishga tushadi"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-300" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
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
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded text-xs sm:text-sm font-medium transition-colors ${
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
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Asosiy kontent maydoni */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Yuqori Navbar (Header) */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Chap qism: Menyu tugmasi va Bo'lim sarlavhasi */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Menyuni ochish"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Super Admin</span>
              <span>/</span>
              <span className="text-slate-900 font-medium">
                {pathname === "/admin" || pathname.startsWith("/admin/organizations")
                  ? "Universitetlar"
                  : pathname.startsWith("/admin/administrators")
                  ? "Administratorlar"
                  : pathname.startsWith("/admin/notifications")
                  ? "Xabarnomalar"
                  : pathname.startsWith("/admin/profile")
                  ? "Sozlamalar"
                  : "Boshqaruv"}
              </span>
            </div>
          </div>

          {/* O'ng qism: Profil */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/profile"
              className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity p-1 rounded hover:bg-slate-50"
              title="Sozlamalar"
            >
              <span className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors hidden sm:block">
                {profile.fullName || "Super Admin"}
              </span>
              {user.image ? (
                <img
                  src={user.image}
                  alt={profile.fullName || "Super Admin"}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs shrink-0 group-hover:ring-2 group-hover:ring-blue-400 group-hover:ring-offset-1 transition-all"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 group-hover:ring-2 group-hover:ring-blue-400 group-hover:ring-offset-1 transition-all">
                  {initials}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Sahifa ichki kontenti */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
    </AdminToastProvider>
  );
}
