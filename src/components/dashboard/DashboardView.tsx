"use client";

import React, { useState } from "react";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PlayCircle,
  Building2,
  ArrowRight,
  Info,
  Layers,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge, StatusType } from "@/components/ui/StatusBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";

interface DiscrepancyItem {
  id: string;
  name: string;
  invNumber: string;
  originalRoom: string;
  scannedRoom: string;
  building: string;
  inspectorName: string;
  date: string;
}

interface AuditSessionItem {
  id: string;
  building: string;
  room: string;
  inspector: string;
  status: StatusType;
  matchedCount: number;
  displacedCount: number;
  pendingCount: number;
  updatedAt: string;
}

interface BuildingStat {
  name: string;
  code: string;
  totalRooms: number;
  auditedRooms: number;
  percentage: number;
  itemsCount: number;
}

export const DashboardView: React.FC = () => {
  // Empty state ko'rinishini sinash uchun interaktiv tab holati
  const [activeTab, setActiveTab] = useState<"active" | "empty_preview">("active");

  // TATU boshlang'ich 5 ta binosi bo'yicha demo ma'lumotlar
  const buildingsData: BuildingStat[] = [
    {
      name: "Bosh bino",
      code: "BOSH-B",
      totalRooms: 48,
      auditedRooms: 36,
      percentage: 75,
      itemsCount: 420,
    },
    {
      name: "A-bino",
      code: "A-BINO",
      totalRooms: 32,
      auditedRooms: 24,
      percentage: 75,
      itemsCount: 310,
    },
    {
      name: "B-bino",
      code: "B-BINO",
      totalRooms: 40,
      auditedRooms: 16,
      percentage: 40,
      itemsCount: 290,
    },
    {
      name: "C-bino",
      code: "C-LAB",
      totalRooms: 26,
      auditedRooms: 8,
      percentage: 30,
      itemsCount: 240,
    },
    {
      name: "E-bino",
      code: "E-BINO",
      totalRooms: 20,
      auditedRooms: 4,
      percentage: 20,
      itemsCount: 160,
    },
  ];

  // Joylashuv nomuvofiqliklari
  const discrepancies: DiscrepancyItem[] = [
    {
      id: "disc-1",
      name: "Ofis ish stoli",
      invNumber: "TATU-2024-001314",
      originalRoom: "131-xona — Kafedra",
      scannedRoom: "130-xona — O‘quv zali",
      building: "Bosh bino",
      inspectorName: "Sardor Rahimov",
      date: "Bugun, 14:20",
    },
    {
      id: "disc-2",
      name: "HP ProDesk 400 Kompyuter to‘plami",
      invNumber: "TATU-2023-009821",
      originalRoom: "204-xona",
      scannedRoom: "208-xona",
      building: "A-bino",
      inspectorName: "Jasur Qodirov",
      date: "Bugun, 11:45",
    },
    {
      id: "disc-3",
      name: "Proyektor Epson EB-X51",
      invNumber: "TATU-2022-004512",
      originalRoom: "312-xona",
      scannedRoom: "315-xona",
      building: "B-bino",
      inspectorName: "Sardor Rahimov",
      date: "Kecha, 16:10",
    },
  ];

  // So'nggi tekshiruvlar jadvali demo ma'lumotlari
  const recentAudits: AuditSessionItem[] = [
    {
      id: "aud-1",
      building: "Bosh bino",
      room: "130-xona",
      inspector: "Sardor Rahimov",
      status: "in_progress",
      matchedCount: 18,
      displacedCount: 2,
      pendingCount: 4,
      updatedAt: "10 daqiqa oldin",
    },
    {
      id: "aud-2",
      building: "Bosh bino",
      room: "131-xona",
      inspector: "Sardor Rahimov",
      status: "completed",
      matchedCount: 22,
      displacedCount: 0,
      pendingCount: 0,
      updatedAt: "Bugun, 13:00",
    },
    {
      id: "aud-3",
      building: "A-bino",
      room: "208-xona",
      inspector: "Jasur Qodirov",
      status: "in_progress",
      matchedCount: 14,
      displacedCount: 1,
      pendingCount: 8,
      updatedAt: "35 daqiqa oldin",
    },
    {
      id: "aud-4",
      building: "C-bino",
      room: "104-laboratoriya",
      inspector: "Akmal Saidov",
      status: "completed",
      matchedCount: 30,
      displacedCount: 0,
      pendingCount: 0,
      updatedAt: "Bugun, 11:30",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Yuqori salomlashish va Demo ogohlantirishi */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Universitet Boshqaruv Paneli
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              TATU
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            2026-yil 1-davr inventarizatsiyasi: binolar, xonalar va joylashuv nazorati
          </p>
        </div>
      </div>

      {/* Demo ma'lumotlar bo'yicha aniq ogohlantirish banneri */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-blue-900 leading-relaxed">
          <span className="font-semibold text-blue-950">Eslatma (UI/UX Demo):</span> Ushbu interfeys dizayn va ergonomikani tekshirish uchun tayyorlangan. Ko‘rsatilgan sonlar qat’iy limit emas, balki namunaviy ko‘rinishdir. Tizimda 50 000 ta kabi cheklov yo‘q — keyingi bosqichda barcha statistika to‘g‘ridan-to‘g‘ri ma’lumotlar bazasidan hisoblanadi.
        </div>
      </div>

      {/* 2. Asosiy 5 ta Statistik Kartalar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Jami inventarlar"
          value="1,420"
          subtitle="Bazada ro‘yxatga olingan jami buyumlar"
          icon={Package}
          colorVariant="blue"
          badgeText="100%"
          badgeVariant="neutral"
        />

        <StatCard
          title="O‘z joyida topilgan"
          value="1,120"
          subtitle="O‘z biriktirilgan xonasida skanerlandi"
          icon={CheckCircle2}
          colorVariant="green"
          badgeText="78.8%"
          badgeVariant="success"
        />

        <StatCard
          title="Boshqa xonada topilgan"
          value="52"
          subtitle="Nomuvofiq — asl xonasi boshqa"
          icon={AlertTriangle}
          colorVariant="amber"
          badgeText="3.7%"
          badgeVariant="warning"
        />

        <StatCard
          title="Hali aniqlanmagan"
          value="248"
          subtitle="Skanerlanmagan"
          icon={Clock}
          colorVariant="slate"
          badgeText="17.5%"
          badgeVariant="neutral"
        />

        <StatCard
          title="Jarayondagi xonalar"
          value="4"
          subtitle="Ayni paytda tekshirilmoqda"
          icon={PlayCircle}
          colorVariant="blue"
          badgeText="Faol"
          badgeVariant="success"
        />
      </div>

      {/* 3. Ikki ustunli asosiy blok */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chapdagi keng ustun: Binolar statistikasi & So'nggi tekshiruvlar */}
        <div className="lg:col-span-2 space-y-8">
          {/* A. TATU 5 ta binosi bo'yicha natijalar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
            <SectionHeader
              title="Binolar bo‘yicha tekshiruv holati"
              description="TATU bo‘yicha boshlang‘ich 5 ta bino kesimida o‘tkazilgan inventarizatsiya natijalari"
              badge="5 ta bino"
            />

            <div className="mt-5 space-y-4">
              {buildingsData.map((bldg) => (
                <div
                  key={bldg.code}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900">
                          {bldg.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {bldg.itemsCount} ta inventar &bull; {bldg.auditedRooms} / {bldg.totalRooms} xona tekshirildi
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        {bldg.percentage}%
                      </span>
                      <span className="text-xs text-slate-500 ml-1">yakunlandi</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${bldg.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. So'nggi xona tekshiruvlari jadvali */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
                  So‘nggi xona tekshiruvlari
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Tekshiruvchilar tomonidan amalga oshirilayotgan xona sessiyalari
                </p>
              </div>

              {/* Tab: Faol ro'yxat va Bo'sh holatni ko'rish imkoniyati */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("active")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === "active"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Faol ro‘yxat (4)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("empty_preview")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === "empty_preview"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Bo‘sh holat (Demo)
                </button>
              </div>
            </div>

            {activeTab === "active" ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3">Xona va Bino</th>
                      <th className="py-3 px-3">Tekshiruvchi</th>
                      <th className="py-3 px-3">Holati</th>
                      <th className="py-3 px-3 text-center">Topildi / Nomuvofiq</th>
                      <th className="py-3 px-3 text-right">Vaqt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentAudits.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-900">
                            {item.room}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.building}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">
                          {item.inspector}
                        </td>
                        <td className="py-3.5 px-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3.5 px-3 text-center tabular-nums">
                          <span className="font-semibold text-emerald-700">
                            {item.matchedCount}
                          </span>
                          <span className="text-slate-300 mx-1.5">/</span>
                          <span
                            className={
                              item.displacedCount > 0
                                ? "font-semibold text-amber-700"
                                : "text-slate-400"
                            }
                          >
                            {item.displacedCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right text-xs text-slate-400 whitespace-nowrap">
                          {item.updatedAt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title="Hozircha tekshiruvlar boshlanmagan"
                  description="Ushbu davr uchun hali xonalar bo‘yicha tekshiruv sessiyalari ochilmagan. Tekshiruvchi xonaga kirib skanerlashni boshlagach bu yerda ko‘rinadi."
                  actionText="Filtrni tiklash"
                  onAction={() => setActiveTab("active")}
                />
              </div>
            )}
          </div>
        </div>

        {/* O'ngdagi ustun: Joylashuv nomuvofiqliklari markazi */}
        <div className="space-y-8">
          {/* Nomuvofiqliklar kartasi */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                    Joylashuv nomuvofiqliklari
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    {discrepancies.length} ta
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Boshqa xonada topilgan inventarlar
                </p>
              </div>
            </div>

            {/* Nomuvofiq buyumlar ro'yxati */}
            <div className="mt-4 space-y-3">
              {discrepancies.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-900">
                      {item.name}
                    </span>
                    <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                      {item.invNumber}
                    </span>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Asl biriktirilgan joyi
                      </span>
                      <span className="font-medium text-slate-800">
                        {item.originalRoom}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
                      <span className="text-[10px] uppercase font-semibold text-amber-600 block">
                        Hozir topilgan joyi
                      </span>
                      <span className="font-semibold text-amber-900">
                        {item.scannedRoom}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{item.inspectorName}</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-4 w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <span>Barcha nomuvofiqliklarni ko‘rish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tezkor ma'lumot qutisi */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <h3 className="font-semibold text-sm text-slate-900 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Matematik balans nazorati</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Jami hisobda har bir inventar bir martadan hisoblanadi. Boshqa xonada topilgan buyumlar ikki marta sanalmaydi:
            </p>
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 space-y-1 shadow-2xs">
              <div>Jami = Joyida + Nomuvofiq + Kutilmoqda</div>
              <div className="text-blue-700 font-semibold">1,420 = 1,120 + 52 + 248</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
