"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  ClipboardCheck,
  FileBarChart,
  Users,
  Settings,
  X,
  Menu,
  Search,
  Bell,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { OrgLogoutButton } from "./org-logout-button";
import { LogoIcon } from "@/components/ui/logo";

interface OrgLayoutClientProps {
  children: React.ReactNode;
  organization: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    settings?: Record<string, unknown>;
  };
  profile: {
    fullName: string | null;
    role: string;
  };
  user: {
    email: string;
    username?: string | null;
  };
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
  badgeVariant?: "blue" | "amber" | "slate";
}

function getInitials(name?: string | null, emailOrUsername?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (emailOrUsername) {
    return emailOrUsername.slice(0, 2).toUpperCase();
  }
  return "UA";
}

export function OrgLayoutClient({
  children,
  organization,
  profile,
  user,
}: OrgLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const initials = getInitials(profile.fullName, user.username || user.email);
  const roleTitle =
    profile.role === "organization_admin"
      ? "Universitet Admini"
      : profile.role === "registrar"
      ? "Moddiy Javobgar"
      : "Mas'ul Xodim";

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/org",
      icon: LayoutDashboard,
      exact: true,
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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/org/inventory?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobil fon qoplami (Backdrop) */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Asosiy Chap Sidebar paneli (100% Preview dizayni bilan bir xil) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Yuqori logotip qismi */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/org" className="flex items-center gap-3 group">
            <div className="text-slate-800 transition-transform duration-150 group-hover:scale-105">
              <LogoIcon size={34} />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-slate-950 flex items-center gap-1.5">
                Asset<span className="text-blue-600">Audit</span>
              </div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                {organization.code} Boshqaruvi
              </div>
            </div>
          </Link>

          {/* Mobilda yopish tugmasi */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Menyuni yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigatsiya ro'yxati */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto" aria-label="Tashkilot menyusi">
          {(() => {
            const activeItem = navItems
              .filter((item) => {
                if (item.exact || item.href === "/org") {
                  return pathname === item.href;
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
                  onClick={() => setIsSidebarOpen(false)}
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
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs border border-blue-200 shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate" title={profile.fullName || user.username || "Xodim"}>
                {profile.fullName || user.username || "Xodim"}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>{roleTitle}</span>
              </div>
            </div>
          </div>
          <OrgLogoutButton />
        </div>
      </aside>

      {/* Asosiy kontent maydoni */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Yuqori Navbar (Header) */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Chap qism: Menyu tugmasi va Qidiruv */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Menyuni ochish"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Qidiruv */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Inventar raqami, buyum yoki xonani qidirish..."
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </form>
          </div>

          {/* O'ng qism: SaaS statusi, Bildirishnomalar va Profil */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* SaaS Status belgisi */}
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{organization.code} (Faol)</span>
            </span>

            {/* Bildirishnomalar */}
            <button
              type="button"
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Bildirishnomalar"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Sahifa ichki kontenti */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}
