"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";
import type { OrganizationAdminListItem } from "@/lib/data/administrators";
import { AdminDetailsModal } from "./admin-details-modal";

interface AdminsTableProps {
  initialItems: OrganizationAdminListItem[];
}

function getInitials(name?: string | null): string {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0] || "AD").slice(0, 2).toUpperCase();
}

export function AdminsTable({ initialItems }: AdminsTableProps) {
  const [items, setItems] = useState<OrganizationAdminListItem[]>(initialItems);
  const [selectedAdmin, setSelectedAdmin] = useState<OrganizationAdminListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRowClick = (admin: OrganizationAdminListItem) => {
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const handleAdminUpdated = (updated: {
    userId: string;
    fullName: string;
    username: string;
    phone?: string;
    isActive: boolean;
  }) => {
    setItems((prev) =>
      prev.map((item) =>
        item.userId === updated.userId
          ? {
              ...item,
              fullName: updated.fullName,
              username: updated.username,
              phone: updated.phone,
              isActive: updated.isActive,
            }
          : item
      )
    );
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Administrator
              </th>
              <th scope="col" className="px-5 py-3.5">
                OTM
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Holati
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {items.map((admin) => (
              <tr
                key={admin.userId}
                onClick={() => handleRowClick(admin)}
                className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                title="Tahrirlash va ma'lumotlarni ko'rish uchun bosing"
              >
                {/* Administrator Ismi */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded overflow-hidden shrink-0 shadow-2xs border border-slate-200/80 bg-blue-600 group-hover:bg-blue-700 transition-colors flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {getInitials(admin.fullName)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate block">
                        {admin.fullName}
                      </span>
                    </div>
                  </div>
                </td>

                {/* OTM */}
                <td className="px-5 py-3.5">
                  {admin.organizationName ? (
                    <span className="font-medium text-slate-900">
                      {admin.organizationName}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Bog&apos;lanmagan</span>
                  )}
                </td>

                {/* Holati: faol bo'lmasa qizil 'Nofaol' ko'rsatiladi */}
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end min-h-[28px]">
                    {!admin.isActive && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Nofaol</span>
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Administrator Ma'lumotlarini Tahrirlash Modali */}
      <AdminDetailsModal
        admin={selectedAdmin}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAdminUpdated}
      />
    </>
  );
}
