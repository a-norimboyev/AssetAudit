"use client";

import React, { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export const DashboardLayoutClient: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Chap Sidebar (Desktop doimiy, Mobil drawer) */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Asosiy kontent maydoni */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Yuqori Navbar */}
        <DashboardHeader onMenuToggle={() => setIsSidebarOpen(true)} />

        {/* Sahifa ichki kontenti */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};
