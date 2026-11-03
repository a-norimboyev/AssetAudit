"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MOCK_BUILDINGS,
  MOCK_FLOORS,
  MOCK_ROOMS,
  MOCK_ITEMS,
  type MockBuilding,
  type MockFloor,
  type MockRoom,
  type MockItem,
} from "@/lib/mock/boshliq-mock-data";
import { exportRoomPassportToExcel } from "@/lib/utils/boshliq-excel-export";
import { LogoIcon } from "@/components/ui/logo";
import { OrgLogoutButton } from "@/app/org/org-logout-button";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import {
  Search,
  Building2,
  Layers,
  DoorClosed,
  Package,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Menu,
  ArrowRight,
  MapPin,
  ArrowLeft,
  Settings,
  User,
  Shield,
  KeyRound,
  LogOut,
  Check,
  Camera,
} from "lucide-react";

interface BoshliqViewClientProps {
  organizationName?: string;
  organizationCode?: string;
  profileName?: string;
  roleTitle?: string;
  isOrgAdmin?: boolean;
}

type NavTab = "buildings" | "search" | "items" | "passport" | "settings";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export function BoshliqViewClient({
  organizationName = "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
  organizationCode = "TATU",
  profileName = "Prof. O. Sh. Karimov",
  roleTitle = "Rektorat / Boshliq",
  isOrgAdmin = false,
}: BoshliqViewClientProps) {
  // Aktiv navigatsiya bo'limi (Superadmin bilan 1:1)
  const [activeTab, setActiveTab] = useState<NavTab>("buildings");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useBodyScrollLock(isSidebarOpen);

  // Tanlangan bino, qavat va xona (Infratuzilma)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Qidiruv holatlari
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<string>("all");
  const [reestrSearch, setReestrSearch] = useState("");
  const [reestrStatusFilter, setReestrStatusFilter] = useState<string>("all");

  // Foydalanuvchi profil holatlari (Ism va Rasm)
  const [displayName, setDisplayName] = useState(profileName);
  const [nameInput, setNameInput] = useState(profileName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parol yangilash formasi holatlari (Sozlamalar bo'limi)
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Saqlangan ma'lumotlarni yuklash
  useEffect(() => {
    try {
      const savedName = localStorage.getItem("boshliq_display_name");
      if (savedName) {
        setDisplayName(savedName);
        setNameInput(savedName);
      }
      const savedAvatar = localStorage.getItem("boshliq_avatar_url");
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      }
    } catch {
      // ignore localStorage error
    }
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setDisplayName(trimmed);
    try {
      localStorage.setItem("boshliq_display_name", trimmed);
    } catch {
      // ignore
    }
    showToast("Ism-familiya muvaffaqiyatli saqlandi");
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Rasm hajmi 5MB dan oshmasligi kerak");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      try {
        localStorage.setItem("boshliq_avatar_url", result);
      } catch {
        // ignore
      }
      showToast("Surat muvaffaqiyatli yuklandi");
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatarUrl(null);
    try {
      localStorage.removeItem("boshliq_avatar_url");
    } catch {
      // ignore
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showToast("Surat olib tashlandi");
  }

  // Jihoz tafsiloti modali
  const [inspectingItem, setInspectingItem] = useState<MockItem | null>(null);
  useBodyScrollLock(Boolean(inspectingItem));

  // Quick Room Passport Tanlagich holati (Tab 4)
  const [passportBuildingId, setPassportBuildingId] = useState<string>(MOCK_BUILDINGS[0]?.id || "");
  const passportRoomsForBuilding = useMemo(
    () => MOCK_ROOMS.filter((r) => r.buildingId === passportBuildingId),
    [passportBuildingId]
  );
  const [passportRoomId, setPassportRoomId] = useState<string>(
    passportRoomsForBuilding[0]?.id || ""
  );

  const selectedPassportRoom = useMemo(
    () => MOCK_ROOMS.find((r) => r.id === passportRoomId) || passportRoomsForBuilding[0] || null,
    [passportRoomId, passportRoomsForBuilding]
  );

  const passportRoomItems = useMemo(
    () => (selectedPassportRoom ? MOCK_ITEMS.filter((i) => i.roomId === selectedPassportRoom.id) : []),
    [selectedPassportRoom]
  );

  // Tanlangan bino
  const currentBuilding = useMemo(
    () => MOCK_BUILDINGS.find((b) => b.id === selectedBuildingId) || null,
    [selectedBuildingId]
  );

  // Tanlangan binoga tegishli qavatlar
  const currentFloors = useMemo(
    () => (selectedBuildingId ? MOCK_FLOORS.filter((f) => f.buildingId === selectedBuildingId) : []),
    [selectedBuildingId]
  );

  // Tanlangan binoga tegishli xonalar
  const currentRooms = useMemo(
    () => (selectedBuildingId ? MOCK_ROOMS.filter((r) => r.buildingId === selectedBuildingId) : []),
    [selectedBuildingId]
  );

  // Tanlangan qavat bo'yicha filtrlangan xonalar
  const filteredRooms = useMemo(() => {
    if (!selectedFloorId) return currentRooms;
    return currentRooms.filter((r) => r.floorId === selectedFloorId);
  }, [currentRooms, selectedFloorId]);

  // Tanlangan xona
  const currentRoom = useMemo(
    () => MOCK_ROOMS.find((r) => r.id === selectedRoomId) || null,
    [selectedRoomId]
  );

  // Tanlangan xonadagi jihozlar
  const roomItems = useMemo(() => {
    if (!selectedRoomId) return [];
    return MOCK_ITEMS.filter((item) => item.roomId === selectedRoomId);
  }, [selectedRoomId]);

  // Jami statistik hisob-kitoblar (KPI kartalari uchun)
  const stats = useMemo(() => {
    const totalBuildings = MOCK_BUILDINGS.length;
    const totalFloors = MOCK_BUILDINGS.reduce((acc, b) => acc + b.floorsCount, 0);
    const totalRooms = MOCK_BUILDINGS.reduce((acc, b) => acc + b.roomsCount, 0);
    const totalItems = MOCK_BUILDINGS.reduce((acc, b) => acc + b.itemsCount, 0);
    return { totalBuildings, totalFloors, totalRooms, totalItems };
  }, []);

  // Bino tanlash
  function handleSelectBuilding(buildingId: string) {
    setSelectedBuildingId(buildingId);
    setSelectedFloorId(null);
    setSelectedRoomId(null);
  }

  // Tezkor qidiruv natijalari
  const searchResults = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return [];

    return MOCK_ITEMS.filter((item) => {
      const matchesTerm =
        item.name.toLowerCase().includes(term) ||
        item.inventoryNumber.toLowerCase().includes(term) ||
        item.categoryName.toLowerCase().includes(term) ||
        item.roomNumber.toLowerCase().includes(term) ||
        item.buildingName.toLowerCase().includes(term);

      const matchesCat =
        searchCategoryFilter === "all" ||
        item.categoryName.toLowerCase().includes(searchCategoryFilter.toLowerCase());

      return matchesTerm && matchesCat;
    });
  }, [searchQuery, searchCategoryFilter]);

  // Jihozlar Reestri natijalari
  const reestrResults = useMemo(() => {
    return MOCK_ITEMS.filter((item) => {
      const q = reestrSearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.inventoryNumber.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q) ||
        item.roomNumber.toLowerCase().includes(q);

      const matchesStatus =
        reestrStatusFilter === "all" || item.status === reestrStatusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [reestrSearch, reestrStatusFilter]);

  // Qidiruvdan xonaga o'tish
  function handleGoToRoomFromSearch(item: MockItem) {
    setSelectedBuildingId(item.buildingId);
    setSelectedFloorId(item.floorId);
    setSelectedRoomId(item.roomId);
    setActiveTab("buildings");
    setIsSidebarOpen(false);
  }

  // Excel yuklab olish
  async function handleExcelDownload(targetRoom: MockRoom, targetItems: MockItem[]) {
    await exportRoomPassportToExcel(organizationName, targetRoom, targetItems);
  }

  function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPwd || newPwd !== confirmPwd) {
      showToast("Yangi parollar mos kelmadi");
      return;
    }
    if (newPwd.length < 8) {
      showToast("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }
    showToast("Parol muvaffaqiyatli yangilandi");
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  }

  // Holat nishoni
  function renderStatusBadge(status: string) {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Soz (Faol)</span>
          </span>
        );
      case "repair":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Ta&apos;mirda</span>
          </span>
        );
      case "written_off":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Hisobdan chiqarilgan</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span>{status}</span>
          </span>
        );
    }
  }

  function renderConditionBadge(condition: string) {
    switch (condition) {
      case "new":
        return (
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
            Yangi
          </span>
        );
      case "good":
        return (
          <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
            Yaxshi
          </span>
        );
      case "fair":
        return (
          <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
            O'rtacha
          </span>
        );
      case "poor":
        return (
          <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
            Ta&apos;mirtalab
          </span>
        );
      default:
        return <span className="text-xs text-slate-600 font-semibold">{condition}</span>;
    }
  }

  // Sidebar menyu elementlari (Superadmin bilan to'liq bir xil strukturada)
  const navItems = [
    {
      id: "buildings" as NavTab,
      name: "Binolar va Xonalar",
      icon: Building2,
    },
    {
      id: "search" as NavTab,
      name: "Tezkor Qidirish",
      icon: Search,
    },
    {
      id: "items" as NavTab,
      name: "Jihozlar Reestri",
      icon: Package,
    },
    {
      id: "passport" as NavTab,
      name: "Xona Pasporti",
      icon: DoorClosed,
    },
    {
      id: "settings" as NavTab,
      name: "Sozlamalar",
      icon: Settings,
    },
  ];

  const activeTitle =
    navItems.find((item) => item.id === activeTab)?.name || "Boshliq Paneli";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Toast bildirishnoma */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobil fon qoplami */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity overscroll-contain"
          aria-hidden="true"
        />
      )}

      {/* 1. ASOSIY CHAP SIDEBAR (SUPERADMIN BILAN 1:1 DIZAYN) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 overscroll-contain ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Yuqori logotip qismi */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setActiveTab("buildings");
              setSelectedBuildingId(null);
              setSelectedRoomId(null);
            }}
            className="flex items-center gap-3 text-left cursor-pointer"
          >
            <div className="text-slate-900">
              <LogoIcon size={34} />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-slate-950 flex items-center gap-1.5">
                Asset<span className="text-blue-600">Audit</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Boshliq Paneli
              </div>
            </div>
          </button>

          {/* Mobilda yopish tugmasi */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Menyuni yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Superadmin uslubidagi Toza Navigatsiya ro'yxati */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto" aria-label="Boshliq menyusi">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 sm:py-3 rounded-2xl text-sm transition-all cursor-pointer text-left group ${
                  isActive
                    ? "border-2 border-slate-950 bg-blue-50/80 text-blue-600 font-semibold shadow-2xs"
                    : "border-2 border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 font-medium"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-800"
                  }`}
                />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 2. ASOSIY KONTENT MAYDONI */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Yuqori Navbar (Superadmin bilan 1:1, ortiqcha chiqish yoki nishonlarsiz) */}
        <header className="h-16 bg-white border-b border-slate-200/90 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Chap qism: Menyu tugmasi va Bo'lim sarlavhasi */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer"
              aria-label="Menyuni ochish"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {activeTitle}
            </span>
          </div>

          {/* O'ng qism: Faqat Profil avatar (Superadmin kabi chiqish tugmasi Sozlamalar ichida) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer"
              title="Sozlamalar va profil"
            >
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                {displayName}
              </span>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg bg-blue-600 group-hover:bg-blue-700 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 transition-colors"
                >
                  {getInitials(displayName)}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Asosiy Ishchi Sahifa */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
          {/* TAB 1: BINOLAR VA XONALAR IYERARXIYASI */}
          {activeTab === "buildings" && (
            <div className="space-y-6">
              {/* 4 ta Asosiy KPI Kartasi (Superadmin kabi toza 1 so'zli sarlavha va raqamlar) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Binolar */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBuildingId(null);
                    setSelectedRoomId(null);
                  }}
                  className={`p-4 rounded-xl bg-white border text-left transition-all cursor-pointer ${
                    !selectedBuildingId
                      ? "border-blue-500 ring-2 ring-blue-500/10 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Binolar</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                    {stats.totalBuildings} ta
                  </div>
                </button>

                {/* Qavatlar */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Qavatlar</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                    {stats.totalFloors} ta
                  </div>
                </div>

                {/* Xonalar */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Xonalar</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <DoorClosed className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                    {stats.totalRooms} ta
                  </div>
                </div>

                {/* Jihozlar */}
                <button
                  type="button"
                  onClick={() => setActiveTab("items")}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Jihozlar</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                    {stats.totalItems} ta
                  </div>
                </button>
              </div>

              {/* Breadcrumb navigatsiya (Faqat bino yoki xona ichiga kirilganda chiqadi) */}
              {selectedBuildingId && (
                <nav className="flex items-center gap-2 text-xs font-semibold text-slate-600 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBuildingId(null);
                      setSelectedFloorId(null);
                      setSelectedRoomId(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Binolar</span>
                  </button>

                  {currentBuilding && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setSelectedRoomId(null)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                          selectedBuildingId && !selectedRoomId
                            ? "border-2 border-slate-950 bg-blue-50/80 text-blue-600 font-semibold shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>{currentBuilding.name}</span>
                      </button>
                    </>
                  )}

                  {currentRoom && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-950 bg-blue-50/80 text-blue-600 font-semibold shadow-2xs">
                        <DoorClosed className="w-3.5 h-3.5 text-blue-600" />
                        <span>{currentRoom.roomNumber}-xona</span>
                      </span>
                    </>
                  )}
                </nav>
              )}

              {/* 1-Bosqich: Binolar Ro'yxati (Ortiqcha sarlavha va tugmalarsiz to'g'ridan-to'g'ri kartalar) */}
              {!selectedBuildingId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MOCK_BUILDINGS.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => handleSelectBuilding(b.id)}
                      className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <span className="px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {b.code}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                          {b.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{b.address}</span>
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{b.floorsCount} qavat</span>
                          <span>•</span>
                          <span className="font-medium">{b.roomsCount} xona</span>
                          <span>•</span>
                          <span className="font-semibold text-blue-600">{b.itemsCount} jihoz</span>
                        </div>
                        <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
                          Ochish →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2-Bosqich: Bino ichidagi Qavatlar va Xonalar */}
              {selectedBuildingId && !selectedRoomId && currentBuilding && (
                <div className="space-y-4">
                  {/* Bino boshqaruv paneli */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">{currentBuilding.name}</h2>
                          <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {currentBuilding.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{currentBuilding.address}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedBuildingId(null)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Binolar</span>
                    </button>
                  </div>

                  {/* Qavatlar tablari */}
                  {currentFloors.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => setSelectedFloorId(null)}
                        className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${
                          selectedFloorId === null
                            ? "border-[1.5px] border-slate-950 bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                            : "border-[1.5px] border-transparent bg-white text-slate-600 hover:bg-slate-50 font-medium"
                        }`}
                      >
                        Barchasi ({currentRooms.length})
                      </button>

                      {currentFloors.map((fl) => (
                        <button
                          key={fl.id}
                          type="button"
                          onClick={() => setSelectedFloorId(fl.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${
                            selectedFloorId === fl.id
                              ? "border-[1.5px] border-slate-950 bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                              : "border-[1.5px] border-transparent bg-white text-slate-600 hover:bg-slate-50 font-medium"
                          }`}
                        >
                          {fl.name} ({fl.roomsCount})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Xonalar ro'yxati */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredRooms.map((rm) => (
                      <div
                        key={rm.id}
                        onClick={() => setSelectedRoomId(rm.id)}
                        className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                              {rm.roomNumber}-xona
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">{rm.floorName}</span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {rm.name}
                          </h4>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            Sig'imi: {rm.capacity} o'rin
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">
                            {rm.itemsCount} ta jihoz
                          </span>
                          <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
                            Jihozlar →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3-Bosqich: Tanlangan Xonadagi Jihozlar (Xona Pasporti) */}
              {selectedRoomId && currentRoom && (
                <div className="space-y-4">
                  {/* Xona kartasi va Eksport */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-extrabold text-slate-900">
                          {currentRoom.roomNumber}-xona: {currentRoom.name}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {roomItems.length} ta jihoz
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {currentRoom.buildingName} • {currentRoom.floorName} • Sig'imi: {currentRoom.capacity} kishi
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleExcelDownload(currentRoom, roomItems)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        title="Excel formatida yuklab olish"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Excel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        title="PDF / Chop etish"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRoomId(null)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Orqaga</span>
                      </button>
                    </div>
                  </div>

                  {/* Jihozlar jadvali */}
                  <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                            <th className="px-5 py-3.5 w-12">№</th>
                            <th className="px-4 py-3.5 w-14">Rasm</th>
                            <th className="px-5 py-3.5">Jihoz Nomi</th>
                            <th className="px-4 py-3.5">Inventar Kodi</th>
                            <th className="px-4 py-3.5">Toifasi</th>
                            <th className="px-4 py-3.5">Holati</th>
                            <th className="px-4 py-3.5">Texnik Holati</th>
                            <th className="px-5 py-3.5 text-right">Amal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {roomItems.map((item, idx) => (
                            <tr
                              key={item.id}
                              onClick={() => setInspectingItem(item)}
                              className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                            >
                              <td className="px-5 py-3.5 text-slate-400 font-mono">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-3.5">
                                <img
                                  src={item.photoUrl}
                                  alt={item.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 shadow-2xs"
                                />
                              </td>
                              <td className="px-5 py-3.5 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {item.name}
                              </td>
                              <td className="px-4 py-3.5 font-mono font-semibold text-blue-600">
                                {item.inventoryNumber}
                              </td>
                              <td className="px-4 py-3.5 text-slate-600">
                                {item.categoryName}
                              </td>
                              <td className="px-4 py-3.5">
                                {renderStatusBadge(item.status)}
                              </td>
                              <td className="px-4 py-3.5">
                                {renderConditionBadge(item.condition)}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectingItem(item);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Ko'rish</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEZKOR QIDIRUV (UNIVERSAL SEARCH) */}
          {activeTab === "search" && (
            <div className="space-y-4">
              {/* Qidiruv paneli */}
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Qidirish..."
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Tozalash"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                  {[
                    { id: "all", label: "Barchasi" },
                    { id: "kompyuter", label: "Kompyuter" },
                    { id: "mebel", label: "Mebel" },
                    { id: "proyektor", label: "Proyektor" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSearchCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${
                        searchCategoryFilter === cat.id
                          ? "border-[1.5px] border-slate-950 bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                          : "border-[1.5px] border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200/80 font-medium"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Natijalar ro'yxati */}
              {searchQuery.trim() === "" ? (
                <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center shadow-2xs">
                  <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Buyum nomini yozing
                  </h3>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center shadow-2xs">
                  <XCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-800">Mos jihoz topilmadi</h3>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Topilgan jihozlar: {searchResults.length} ta
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <img
                              src={item.photoUrl}
                              alt={item.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">
                                {item.name}
                              </h4>
                              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 inline-block mt-1">
                                {item.inventoryNumber}
                              </span>
                            </div>
                          </div>
                          {renderStatusBadge(item.status)}
                        </div>

                        {/* Joylashuvi va Xonaga o'tish */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600 truncate">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-bold text-slate-900">{item.buildingName}</span>
                            <span>/</span>
                            <span>{item.floorName}</span>
                            <span>/</span>
                            <span className="font-bold text-blue-600">{item.roomNumber}-xona</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleGoToRoomFromSearch(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer shrink-0"
                          >
                            <span>Xonaga o'tish</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: JİHOZLAR REESTRİ */}
          {activeTab === "items" && (
            <div className="space-y-4">
              {/* Qidiruv va Filter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reestrSearch}
                    onChange={(e) => setReestrSearch(e.target.value)}
                    placeholder="Qidirish..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                  {[
                    { id: "all", label: "Barchasi" },
                    { id: "active", label: "Soz (Faol)" },
                    { id: "repair", label: "Ta'mirda" },
                    { id: "written_off", label: "Hisobdan chiqarilgan" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setReestrStatusFilter(st.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${
                        reestrStatusFilter === st.id
                          ? "border-[1.5px] border-slate-950 bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                          : "border-[1.5px] border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200/80 font-medium"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barcha jihozlar jadvali */}
              <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="px-5 py-3.5">Jihoz Nomi</th>
                        <th className="px-4 py-3.5">Kodi</th>
                        <th className="px-4 py-3.5">Bino / Xona</th>
                        <th className="px-4 py-3.5">Holati</th>
                        <th className="px-4 py-3.5">Texnik Holati</th>
                        <th className="px-5 py-3.5 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {reestrResults.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            Mos jihoz topilmadi
                          </td>
                        </tr>
                      ) : (
                        reestrResults.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => setInspectingItem(item)}
                            className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.photoUrl}
                                  alt={item.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                              {item.inventoryNumber}
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                              <span className="font-semibold text-slate-800">{item.buildingName}</span>{" "}
                              • {item.roomNumber}-xona
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {renderStatusBadge(item.status)}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {renderConditionBadge(item.condition)}
                            </td>
                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectingItem(item);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Ko'rish</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: XONA PASPORTI (TEZKOR TANLOV VA EKSPORT) */}
          {activeTab === "passport" && (
            <div className="space-y-4">
              {/* Xona tanlash filtri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Bino:
                  </label>
                  <select
                    value={passportBuildingId}
                    onChange={(e) => {
                      setPassportBuildingId(e.target.value);
                      const rooms = MOCK_ROOMS.filter((r) => r.buildingId === e.target.value);
                      if (rooms.length > 0) setPassportRoomId(rooms[0].id);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-slate-50/50"
                  >
                    {MOCK_BUILDINGS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Xona:
                  </label>
                  <select
                    value={passportRoomId}
                    onChange={(e) => setPassportRoomId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-slate-50/50"
                  >
                    {passportRoomsForBuilding.map((rm) => (
                      <option key={rm.id} value={rm.id}>
                        {rm.roomNumber}-xona: {rm.name} ({rm.floorName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pasport tafsiloti */}
              {selectedPassportRoom && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {selectedPassportRoom.roomNumber}-xona: {selectedPassportRoom.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {passportRoomItems.length} ta jihoz
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedPassportRoom.buildingName} • {selectedPassportRoom.floorName} • Sig'imi: {selectedPassportRoom.capacity} kishi
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleExcelDownload(selectedPassportRoom, passportRoomItems)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Excel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Jihozlar ro'yxati */}
                  <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                          <th className="px-5 py-3.5 w-12">№</th>
                          <th className="px-4 py-3.5 w-14">Rasm</th>
                          <th className="px-5 py-3.5">Jihoz Nomi</th>
                          <th className="px-4 py-3.5">Inventar Kodi</th>
                          <th className="px-4 py-3.5">Holati</th>
                          <th className="px-4 py-3.5">Texnik Holati</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {passportRoomItems.map((item, i) => (
                          <tr
                            key={item.id}
                            onClick={() => setInspectingItem(item)}
                            className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                          >
                            <td className="px-5 py-3.5 text-slate-400 font-mono">{i + 1}</td>
                            <td className="px-4 py-3.5">
                              <img
                                src={item.photoUrl}
                                alt={item.name}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs"
                              />
                            </td>
                            <td className="px-5 py-3.5 font-bold text-slate-900">
                              {item.name}
                            </td>
                            <td className="px-4 py-3.5 font-mono font-bold text-blue-600">
                              {item.inventoryNumber}
                            </td>
                            <td className="px-4 py-3.5">{renderStatusBadge(item.status)}</td>
                            <td className="px-4 py-3.5">{renderConditionBadge(item.condition)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SOZLAMALAR (SUPERADMIN KABI PROFIL VA CHIQISH TUGMASI SHU YERDA) */}
          {activeTab === "settings" && (
            <div className="space-y-5 max-w-2xl">
              {/* Profil Kartasi: Surat yuklash va Ism-familiyani o'zgartirish */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Foydalanuvchi Profili</h3>
                    <p className="text-xs text-slate-500">Shaxsiy ma&apos;lumotlar va suratni yangilash</p>
                  </div>
                </div>

                {/* Surat yuklash */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                  <div className="relative group shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-2xs"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-2xl shadow-2xs">
                        {getInitials(displayName)}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-colors cursor-pointer"
                      title="Suratni yangilash"
                      aria-label="Suratni yangilash"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        Surat yuklash
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Suratni o'chirish
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">PNG, JPG formatida, maksimal 5MB</p>
                  </div>
                </div>

                {/* Ism-familiyani o'zgartirish */}
                <form onSubmit={handleSaveName} className="space-y-3 pt-3 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Ism va familiya
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Ism va familiyangizni kiriting"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
                      >
                        Saqlash
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Parolni Yangilash Formasi */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Xavfsizlik va Parol</h3>
                    <p className="text-xs text-slate-500">Tizimga kirish parolini yangilash</p>
                  </div>
                </div>

                <form onSubmit={handleSavePassword} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Joriy parol
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Yangi parol
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Tasdiqlash
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      Parolni saqlash
                    </button>
                  </div>
                </form>
              </div>

              {/* Tizimdan Chiqish Kartasi (Superadmin kabi faqat shu yerda) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Tizimdan Chiqish</h4>
                    <p className="text-xs text-slate-500">Joriy seansni xavfsiz yakunlash</p>
                  </div>
                </div>

                <OrgLogoutButton />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. JİHOZ TAFSILOTLARINI KO'RISH MODALI */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {inspectingItem.name}
                </h3>
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 inline-block mt-1">
                  {inspectingItem.inventoryNumber}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rasm */}
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80">
              <img
                src={inspectingItem.photoUrl}
                alt={inspectingItem.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Tafsilotlar */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 block text-[11px]">Bino va Qavat</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {inspectingItem.buildingName} ({inspectingItem.floorName})
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 block text-[11px]">Xona</span>
                <span className="font-bold text-blue-600 mt-0.5 block">
                  {inspectingItem.roomNumber}-xona
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 block text-[11px]">Holati</span>
                <div className="mt-1">{renderStatusBadge(inspectingItem.status)}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-slate-400 block text-[11px]">Texnik holati</span>
                <div className="mt-1">{renderConditionBadge(inspectingItem.condition)}</div>
              </div>
            </div>

            {inspectingItem.responsiblePerson && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                <span className="text-slate-400 block text-[11px]">Moddiy javobgar shaxs</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {inspectingItem.responsiblePerson}
                </span>
              </div>
            )}

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
