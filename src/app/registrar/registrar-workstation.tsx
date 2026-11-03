"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  INITIAL_BUILDINGS,
  INITIAL_ROOMS,
  INITIAL_ITEMS,
  type MockBuilding,
  type MockRoom,
  type MockItem,
} from "./mock-data";
import {
  Building2,
  DoorClosed,
  Plus,
  QrCode,
  Printer,
  Camera,
  CameraOff,
  Scan,
  Layers,
  Box,
  Edit2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  X,
  Upload,
  Check,
  Search,
  Menu,
  Trash2,
} from "lucide-react";
import { LogoIcon } from "@/components/ui/logo";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";

type ActiveTab = "rooms" | "create" | "scan" | "print";
type PrintFormat = "50x30" | "40x25" | "a4";

export function RegistrarWorkstation() {
  // 1. Asosiy holatlar (Local storage bilan sinxron)
  const [buildings, setBuildings] = useState<MockBuilding[]>(INITIAL_BUILDINGS);
  const [rooms, setRooms] = useState<MockRoom[]>(INITIAL_ROOMS);
  const [items, setItems] = useState<MockItem[]>(INITIAL_ITEMS);

  const [activeTab, setActiveTab] = useState<ActiveTab>("rooms");
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("bld-1");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("room-210");

  // Chap menyu (Sidebar) mobil holati
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Qidiruv va filtrlar
  const [roomSearch, setRoomSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modallar
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MockItem | null>(null);

  useBodyScrollLock(isSidebarOpen || isAddBuildingOpen || isAddRoomOpen || !!editingItem);

  // Yangi jihoz kiritiş holatlari
  const [createMode, setCreateMode] = useState<"single" | "bulk">("bulk");
  const [itemName, setItemName] = useState("Öquvçi partasi (ikki örinli)");
  const [itemModel, setItemModel] = useState("Maktab-Mebel Ergonomik 2026");
  const [itemPrice, setItemPrice] = useState("450000");
  const [bulkQuantity, setBulkQuantity] = useState(20);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualCodeOverride, setManualCodeOverride] = useState("");
  const [isCustomCode, setIsCustomCode] = useState(false);

  // QR Skaner holatlari
  const [scannedResult, setScannedResult] = useState<MockItem | null>(null);
  const [scannerSimulationCode, setScannerSimulationCode] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Chop etiş (Minimalist Print) holatlari
  const [printFormat, setPrintFormat] = useState<PrintFormat>("50x30");
  const [selectedPrintIds, setSelectedPrintIds] = useState<Set<string>>(new Set());

  // Bildirişnoma
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Local Storage yuklaş
  useEffect(() => {
    try {
      const savedBld = localStorage.getItem("asset_audit_mock_buildings");
      const savedRooms = localStorage.getItem("asset_audit_mock_rooms");
      const savedItems = localStorage.getItem("asset_audit_mock_items");

      if (savedBld) setBuildings(JSON.parse(savedBld));
      if (savedRooms) setRooms(JSON.parse(savedRooms));
      if (savedItems) setItems(JSON.parse(savedItems));
    } catch {
      // ignore
    }
  }, []);

  // Local Storage saqlaş
  useEffect(() => {
    try {
      localStorage.setItem("asset_audit_mock_buildings", JSON.stringify(buildings));
      localStorage.setItem("asset_audit_mock_rooms", JSON.stringify(rooms));
      localStorage.setItem("asset_audit_mock_items", JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [buildings, rooms, items]);

  // Joriy bino va xona ob'ektlari
  const currentBuilding = useMemo(
    () =>
      selectedBuildingId === "all"
        ? buildings[0]
        : buildings.find((b) => b.id === selectedBuildingId) || buildings[0],
    [buildings, selectedBuildingId]
  );

  const currentBuildingRooms = useMemo(() => {
    let list =
      selectedBuildingId === "all"
        ? rooms
        : rooms.filter((r) => r.buildingId === selectedBuildingId);

    if (roomSearch.trim()) {
      const q = roomSearch.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.roomNumber.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rooms, selectedBuildingId, roomSearch]);

  const currentRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) || currentBuildingRooms[0] || null,
    [rooms, selectedRoomId, currentBuildingRooms]
  );

  // Tanlangan xonadagi jihozlar
  const roomItems = useMemo(() => {
    if (!currentRoom) return [];
    let list = items.filter((i) => i.roomId === currentRoom.id);
    if (itemSearch.trim()) {
      const q = itemSearch.toLowerCase().trim();
      list = list.filter(
        (it) =>
          it.inventoryNumber.toLowerCase().includes(q) ||
          it.name.toLowerCase().includes(q) ||
          it.model.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, currentRoom, itemSearch]);

  // Statistik hisoblar
  const totalCapacityTarget = useMemo(
    () => rooms.reduce((acc, r) => acc + (r.capacityTarget || 0), 0),
    [rooms]
  );
  const overallCapacityPercent = useMemo(
    () =>
      totalCapacityTarget > 0
        ? Math.min(100, Math.round((items.length / totalCapacityTarget) * 100))
        : 0,
    [items.length, totalCapacityTarget]
  );

  const roomTarget = currentRoom?.capacityTarget || 20;
  const progressPercent = Math.min(
    100,
    Math.round((roomItems.length / (roomTarget || 1)) * 100)
  );

  // Tovuşli signal
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  };

  // Kamera boshqaruvi
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch {
      setIsCameraActive(false);
      showToast("Kamera ulanmagan");
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Aqlli kod hisoblaş
  const calculateNextCodes = useCallback(
    (count: number): string[] => {
      if (!currentBuilding || !currentRoom) return [];
      const prefix = `${currentBuilding.code}-${currentRoom.roomNumber}-`;
      const existing = items
        .filter((i) => i.inventoryNumber.startsWith(prefix))
        .map((i) => {
          const numPart = parseInt(i.inventoryNumber.replace(prefix, ""), 10);
          return isNaN(numPart) ? 0 : numPart;
        });

      const maxNum = existing.length > 0 ? Math.max(...existing) : 0;
      const codes: string[] = [];
      for (let i = 1; i <= count; i++) {
        const nextNum = maxNum + i;
        const padded = nextNum.toString().padStart(4, "0");
        codes.push(`${prefix}${padded}`);
      }
      return codes;
    },
    [currentBuilding, currentRoom, items]
  );

  const autoSuggestedCodes = useMemo(
    () => calculateNextCodes(bulkQuantity),
    [calculateNextCodes, bulkQuantity]
  );

  const currentSmartCode = isCustomCode
    ? manualCodeOverride
    : autoSuggestedCodes[0] || "B1-210-0001";

  // Yangi bino yaratish
  const handleCreateBuilding = (
    name: string,
    code: string,
    type: MockBuilding["type"],
    floorsCount: number
  ) => {
    const newBld: MockBuilding = {
      id: `bld-${Date.now()}`,
      name,
      code: code.toUpperCase(),
      type,
      floorsCount,
    };
    setBuildings((prev) => [...prev, newBld]);
    setSelectedBuildingId(newBld.id);
    setIsAddBuildingOpen(false);
    showToast(`"${name}" binosi yaratildi`);
  };

  // Yangi xona yaratish
  const handleCreateRoom = (
    roomNumber: string,
    name: string,
    floorNumber: number,
    capacityTarget: number
  ) => {
    const newRoom: MockRoom = {
      id: `room-${Date.now()}`,
      buildingId: selectedBuildingId === "all" ? buildings[0]?.id || "bld-1" : selectedBuildingId,
      floorNumber,
      roomNumber,
      name,
      type: "Auditoriya",
      capacityTarget,
    };
    setRooms((prev) => [...prev, newRoom]);
    setSelectedRoomId(newRoom.id);
    setIsAddRoomOpen(false);
    showToast(`"${roomNumber} — ${name}" xonasi yaratildi`);
  };

  // Jihozlarni saqlash (Yakka yoki Ommaviy)
  const handleSaveItems = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !currentBuilding) return;

    const count = createMode === "bulk" ? bulkQuantity : 1;
    const codesToUse =
      isCustomCode && manualCodeOverride ? [manualCodeOverride] : calculateNextCodes(count);

    const newItems: MockItem[] = codesToUse.map((code) => ({
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      buildingId: currentBuilding.id,
      roomId: currentRoom.id,
      inventoryNumber: code,
      name: itemName.trim() || "Jihoz",
      model: itemModel.trim(),
      price: parseFloat(itemPrice) || 0,
      condition: "new",
      status: "active",
      photoUrl: capturedPhoto || undefined,
      qrToken: `tok_${code.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      createdAt: new Date().toISOString(),
    }));

    setItems((prev) => [...newItems, ...prev]);
    playBeep();

    const newIds = newItems.map((i) => i.id);
    setSelectedPrintIds(new Set(newIds));
    showToast(`${newItems.length} ta jihoz kiritildi`);
    setActiveTab("print");
  };

  // Jihozni tahrirlash
  const handleUpdateItem = (updated: MockItem) => {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setEditingItem(null);
    showToast(`"${updated.inventoryNumber}" yangilandi`);
  };

  // Jihozni o'chirish
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast("Öçirildi");
  };

  // QR Skaner qidiruvi
  const handleSimulateScan = (codeToScan: string) => {
    const found = items.find(
      (it) =>
        it.inventoryNumber.toLowerCase() === codeToScan.trim().toLowerCase() ||
        it.qrToken.toLowerCase() === codeToScan.trim().toLowerCase()
    );
    if (found) {
      playBeep();
      setScannedResult(found);
      showToast(`Jihoz topildi: ${found.inventoryNumber}`);
    } else {
      showToast(`"${codeToScan}" topilmadi`);
    }
  };

  // Minimalist QR kod SVG URL (Faqat QR)
  const getCleanQrSvgUrl = (code: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      `https://assetaudit.uz/qr/${code}`
    )}&margin=1`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Toast bildirishnoma */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
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

      {/* ========================================================================= */}
      {/* 1. CHAP MENYU (SIDEBAR) — SUPER ADMIN DIZAYNI BILAN 100% BIR XIL              */}
      {/* ========================================================================= */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 overscroll-contain no-print ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Yuqori logotip qismi */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <Link href="/registrar" className="flex items-center gap-3 group">
            <div className="text-slate-900 transition-transform duration-150 group-hover:scale-105">
              <LogoIcon size={34} />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-slate-950 flex items-center gap-1.5">
                Asset<span className="text-blue-600">Audit</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                RO&apos;YXATGA OLUVÇI
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Menyuni yopiş"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigatsiya Menyusi (Super Admin navigatsiyasi bilan 100% bir xil) */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto" aria-label="Röyxatga oluvçi menyusi">
          {/* 1. Xonalar va Jihozlar */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("rooms");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer group ${
              activeTab === "rooms"
                ? "border-2 border-slate-950 bg-blue-50/80 text-blue-600 shadow-2xs"
                : "border-2 border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 font-medium"
            }`}
          >
            <DoorClosed
              className={`w-5 h-5 shrink-0 transition-colors ${
                activeTab === "rooms" ? "text-blue-600" : "text-slate-500 group-hover:text-slate-800"
              }`}
            />
            <span>Xonalar va Jihozlar</span>
          </button>

          {/* 2. Jihoz Kiritiş */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("create");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer group ${
              activeTab === "create"
                ? "border-2 border-slate-950 bg-blue-50/80 text-blue-600 shadow-2xs"
                : "border-2 border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 font-medium"
            }`}
          >
            <Box
              className={`w-5 h-5 shrink-0 transition-colors ${
                activeTab === "create" ? "text-blue-600" : "text-slate-500 group-hover:text-slate-800"
              }`}
            />
            <span>Jihoz Kiritiş</span>
          </button>

          {/* 3. QR Skaner */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("scan");
              startCamera();
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer group ${
              activeTab === "scan"
                ? "border-2 border-slate-950 bg-blue-50/80 text-blue-600 shadow-2xs"
                : "border-2 border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 font-medium"
            }`}
          >
            <Scan
              className={`w-5 h-5 shrink-0 transition-colors ${
                activeTab === "scan" ? "text-blue-600" : "text-slate-500 group-hover:text-slate-800"
              }`}
            />
            <span>QR Skaner</span>
          </button>

          {/* 4. Çop Etiş */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("print");
              if (selectedPrintIds.size === 0) {
                setSelectedPrintIds(new Set(items.map((i) => i.id)));
              }
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer group ${
              activeTab === "print"
                ? "border-2 border-slate-950 bg-blue-50/80 text-blue-600 shadow-2xs"
                : "border-2 border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 font-medium"
            }`}
          >
            <Printer
              className={`w-5 h-5 shrink-0 transition-colors ${
                activeTab === "print" ? "text-blue-600" : "text-slate-500 group-hover:text-slate-800"
              }`}
            />
            <span>Çop Etiş</span>
          </button>
        </nav>

        {/* Pastki qism: Universitetga o'tish */}
        <div className="p-3 border-t border-slate-100">
          <Link
            href="/org"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <span>Universitet paneli</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. ASOSIY KONTENT MAYDONI (lg:pl-72 orqali chap sidebar bilan mos)         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Yuqori Navbar (Super Admin bilan 100% bir xil — faqat breadcrumb va profil) */}
        <header className="h-16 bg-white border-b border-slate-200/90 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer"
              aria-label="Menyuni oçiş"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb (Super Admin skrinshoti bilan bir xil) */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">TATU</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200/60">
                {activeTab === "rooms"
                  ? "Xonalar va Jihozlar"
                  : activeTab === "create"
                  ? "Jihoz Kiritiş"
                  : activeTab === "scan"
                  ? "QR Skaner"
                  : "Çop Etiş"}
              </span>
            </div>
          </div>

          {/* O'ng tomon: Foydalanuvchi profili (Super Admin skrinshoti kabi) */}
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-800">
              Aliyev Jamşid
            </span>
            <div
              className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0"
              title="Aliyev Jamşid — Moddiy hisobçi"
            >
              AJ
            </div>
          </div>
        </header>

        {/* Asosiy Ish Maydoni */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: XONALAR VA JIHOZLAR                                                */}
          {/* ========================================================================= */}
          {activeTab === "rooms" && (
            <div className="space-y-6">
              {/* Sahifa Sarlavhasi va O'ngdagi Asosiy Tugma (Super Admin bilan bir xil) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Xonalar va Jihozlar
                </h1>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddBuildingOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>Yangi bino</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddRoomOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <DoorClosed className="w-4 h-4 text-slate-500" />
                    <span>Yangi xona</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("create");
                      setCreateMode("bulk");
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yangi jihoz</span>
                  </button>
                </div>
              </div>

              {/* Birlashgan Qidiruv va Bino Filtr Paneli (Super Admin Screenshot bilan 100% bir xil) */}
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    placeholder="Qidiruv..."
                    className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-2xs transition-all"
                  />
                  {roomSearch && (
                    <button
                      type="button"
                      onClick={() => setRoomSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Tozalaş"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedBuildingId("all")}
                    className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedBuildingId === "all"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Barçasi
                  </button>
                  {buildings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBuildingId(b.id);
                        const firstRoom = rooms.find((r) => r.buildingId === b.id);
                        if (firstRoom) setSelectedRoomId(firstRoom.id);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                        selectedBuildingId === b.id
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auditoriyalar Kartalari */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {currentBuildingRooms.length === 0 ? (
                  <div className="col-span-full py-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    Xonalar topilmadi
                  </div>
                ) : (
                  currentBuildingRooms.map((room) => {
                    const count = items.filter((i) => i.roomId === room.id).length;
                    const percent = Math.min(
                      100,
                      Math.round((count / (room.capacityTarget || 1)) * 100)
                    );
                    const isSelected = selectedRoomId === room.id;

                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-2 border-slate-950 bg-blue-50/80 shadow-2xs ring-2 ring-blue-100"
                            : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {room.roomNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              percent >= 100
                                ? "bg-emerald-100 text-emerald-800"
                                : percent >= 50
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {count}/{room.capacityTarget} ta
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-700 truncate mt-1">
                          {room.name}
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              percent >= 100
                                ? "bg-emerald-500"
                                : percent >= 50
                                ? "bg-blue-600"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Tanlangan Xona va Jihozlar */}
              {currentRoom && (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                        {currentBuilding?.name} &bull; {currentRoom.floorNumber}-qavat
                      </span>
                      <h3 className="text-lg font-bold text-slate-950 mt-1.5">
                        {currentRoom.roomNumber} — {currentRoom.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveTab("create");
                          setCreateMode("bulk");
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Jihoz kiritiş</span>
                      </button>
                      {roomItems.length > 0 && (
                        <button
                          onClick={() => {
                            const ids = roomItems.map((i) => i.id);
                            setSelectedPrintIds(new Set(ids));
                            setActiveTab("print");
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Stikerlar ({roomItems.length})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ixcham Progress Chizig'i */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Jihozlanganlik</span>
                      <span className="text-slate-900 font-semibold font-mono">
                        {roomItems.length} / {roomTarget} ta (
                        <span className="text-blue-600 font-bold">{progressPercent}%</span>)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progressPercent >= 100
                            ? "bg-emerald-500"
                            : progressPercent >= 50
                            ? "bg-blue-600"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Jihozlar Ro'yxati / Jadvali */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Xonadagi jihozlar ({roomItems.length} ta)
                      </h4>

                      {roomItems.length > 0 && (
                        <div className="relative w-full sm:w-56">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={itemSearch}
                            onChange={(e) => setItemSearch(e.target.value)}
                            placeholder="Qidiruv..."
                            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                          {itemSearch && (
                            <button
                              onClick={() => setItemSearch("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {roomItems.length === 0 ? (
                      <div className="p-8 sm:p-12 rounded-2xl bg-white border border-slate-200/80 text-center shadow-2xs">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3.5 border border-blue-100">
                          <Box className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                          Jihozlar topilmadi
                        </h3>
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("create");
                              setCreateMode("bulk");
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Yangi jihoz</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200/80 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                                <th className="px-4 py-3">Inventar Kodi</th>
                                <th className="px-4 py-3">Jihoz Nomi</th>
                                <th className="px-4 py-3">Modeli</th>
                                <th className="px-4 py-3 text-right">Narxi</th>
                                <th className="px-4 py-3 text-center">Holati</th>
                                <th className="px-4 py-3 text-right">Amallar</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {roomItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="px-4 py-3">
                                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md">
                                      {item.inventoryNumber}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-900">
                                    {item.name}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500">
                                    {item.model || "—"}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                                    {item.price ? `${item.price.toLocaleString()} söm` : "—"}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Yangi
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => setEditingItem(item)}
                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                                        title="Tahrirlaş"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedPrintIds(new Set([item.id]));
                                          setActiveTab("print");
                                        }}
                                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                                        title="Çop etiş"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                                        title="Öçiriş"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: JIHOZ KIRITIŞ                                                      */}
          {/* ========================================================================= */}
          {activeTab === "create" && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Sarlavha */}
              <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Jihoz Kiritiş
                </h1>

                <button
                  type="button"
                  onClick={() => setActiveTab("rooms")}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 p-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Xonalar röyxatiga qaytiş
                </button>
              </div>

              {/* Rejimni tanlash (Yakka vs Ommaviy) */}
              <div className="flex items-center p-1 bg-slate-200/70 rounded-xl border border-slate-300/70">
                <button
                  type="button"
                  onClick={() => setCreateMode("single")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    createMode === "single"
                      ? "bg-white text-slate-950 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Box className="w-4 h-4" />
                  <span>Yakka</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreateMode("bulk")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    createMode === "bulk"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Ommaviy</span>
                </button>
              </div>

              <form onSubmit={handleSaveItems} className="space-y-5">
                {/* 1. Joylashuv */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <DoorClosed className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Joylaşuv</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Bino
                      </label>
                      <select
                        value={selectedBuildingId}
                        onChange={(e) => {
                          setSelectedBuildingId(e.target.value);
                          setIsCustomCode(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-medium"
                      >
                        {buildings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Auditoriya
                      </label>
                      <select
                        value={selectedRoomId}
                        onChange={(e) => {
                          setSelectedRoomId(e.target.value);
                          setIsCustomCode(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-medium"
                      >
                        {rooms
                          .filter((r) => r.buildingId === selectedBuildingId)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.roomNumber} — {r.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Jihoz parametrlari */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Box className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Jihoz ma’lumotlari</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Jihoz nomi <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="Öquvçi partasi"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Modeli
                        </label>
                        <input
                          type="text"
                          value={itemModel}
                          onChange={(e) => setItemModel(e.target.value)}
                          placeholder="Maktab-Mebel Ergonomik 2026"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Narxi (söm)
                        </label>
                        <input
                          type="number"
                          value={itemPrice}
                          onChange={(e) => setItemPrice(e.target.value)}
                          placeholder="450000"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    {/* Miqdor (Ommaviy rejim) */}
                    {createMode === "bulk" && (
                      <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
                        <label className="block text-xs font-bold text-blue-900">
                          Miqdor (dona):
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={bulkQuantity}
                            onChange={(e) =>
                              setBulkQuantity(
                                Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1))
                              )
                            }
                            className="w-24 px-3 py-2 text-center text-base font-bold bg-white border border-blue-300 rounded-xl font-mono text-blue-700"
                          />
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[10, 20, 25, 30].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setBulkQuantity(num)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                  bulkQuantity === num
                                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {num} ta
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fotosurat */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Jihoz fotosurati
                      </label>

                      <div className="flex items-center gap-3">
                        {capturedPhoto ? (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-300">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={capturedPhoto}
                              alt="Rasm"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setCapturedPhoto(null)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                            <Camera className="w-4 h-4 mb-0.5" />
                            <span className="text-[9px]">Rasm yöq</span>
                          </div>
                        )}

                        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Rasm yuklaş</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                setCapturedPhoto(url);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Aqlli Kodlash */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Inventar kodi</h3>
                    </div>

                    {isCustomCode && (
                      <button
                        type="button"
                        onClick={() => setIsCustomCode(false)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                      >
                        Avtomatik kod
                      </button>
                    )}
                  </div>

                  {createMode === "single" ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Inventar kodi:
                      </label>
                      <input
                        type="text"
                        value={currentSmartCode}
                        onChange={(e) => {
                          setManualCodeOverride(e.target.value.toUpperCase());
                          setIsCustomCode(true);
                        }}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
                        <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
                          <span>Kodi diapazoni:</span>
                          <span className="font-mono font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-md border border-indigo-200">
                            {autoSuggestedCodes[0]} ➔{" "}
                            {autoSuggestedCodes[autoSuggestedCodes.length - 1]}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-3">
                          {autoSuggestedCodes.slice(0, 10).map((code) => (
                            <span
                              key={code}
                              className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white text-slate-700 border border-slate-200"
                            >
                              {code}
                            </span>
                          ))}
                          {autoSuggestedCodes.length > 10 && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-indigo-100 text-indigo-800">
                              +{autoSuggestedCodes.length - 10} ta
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Saqlash tugmasi */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Saqlaş va çop etiş</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: QR SKANER                                                         */}
          {/* ========================================================================= */}
          {activeTab === "scan" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  QR Skaner
                </h1>

                <button
                  onClick={() => {
                    if (isCameraActive) stopCamera();
                    else startCamera();
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {isCameraActive ? "Kamerani yopiş" : "Kamerani yoqiş"}
                </button>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                {/* Video oyna */}
                <div className="relative aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                  {isCameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400 space-y-2">
                      <CameraOff className="w-10 h-10 mx-auto opacity-50" />
                      <p className="text-xs">Kamera ulanmagan</p>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Kamerani yoqiş
                      </button>
                    </div>
                  )}

                  {/* Skaner Nuri */}
                  {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-56 h-56 border-2 border-emerald-400 rounded-2xl relative shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400 animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Qo'lda kod kiritish */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Kodni kiriting (masalan: B1-210-0001)..."
                    value={scannerSimulationCode}
                    onChange={(e) => setScannerSimulationCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => handleSimulateScan(scannerSimulationCode || "B1-210-0001")}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                  >
                    Qidiriş
                  </button>
                </div>
              </div>

              {/* Skanerlangan Jihoz */}
              {scannedResult && (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-emerald-200 shadow-2xs space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="font-bold text-sm text-slate-900">Jihoz ma’lumotlari</span>
                    </div>
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-0.5 rounded-md">
                      {scannedResult.inventoryNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {scannedResult.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={scannedResult.photoUrl}
                        alt={scannedResult.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Box className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <h4 className="font-bold text-sm text-slate-950 truncate">
                        {scannedResult.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Model: {scannedResult.model || "—"}
                      </p>
                      <p className="text-xs font-semibold text-slate-900">
                        Narxi: {scannedResult.price ? `${scannedResult.price.toLocaleString()} söm` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setEditingItem(scannedResult)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Tahrirlaş</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPrintIds(new Set([scannedResult.id]));
                        setActiveTab("print");
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Qayta çop etiş</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: MINIMALIST QR-STIKERLARNI CHOP ETISH                              */}
          {/* ========================================================================= */}
          {activeTab === "print" && (
            <div className="space-y-6">
              {/* Dynamic CSS Print Styles */}
              <style jsx global>{`
                @media print {
                  body {
                    background: #ffffff !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  aside {
                    display: none !important;
                  }
                  header {
                    display: none !important;
                  }

                  ${printFormat === "50x30"
                    ? `
                    @page {
                      size: 50mm 30mm;
                      margin: 0mm;
                    }
                    .print-sheet {
                      display: block !important;
                    }
                    .sticker-box {
                      width: 50mm !important;
                      height: 30mm !important;
                      page-break-after: always !important;
                      break-after: page !important;
                      display: flex !important;
                      flex-direction: column !important;
                      align-items: center !important;
                      justify-content: center !important;
                      padding: 1.5mm !important;
                      box-sizing: border-box !important;
                      border: none !important;
                    }
                    .sticker-qr-img {
                      width: 21mm !important;
                      height: 21mm !important;
                    }
                    .sticker-code-text {
                      font-family: monospace !important;
                      font-size: 11pt !important;
                      font-weight: 800 !important;
                      letter-spacing: 0.05em !important;
                      color: #000000 !important;
                      margin-top: 1mm !important;
                    }
                  `
                    : printFormat === "40x25"
                    ? `
                    @page {
                      size: 40mm 25mm;
                      margin: 0mm;
                    }
                    .print-sheet {
                      display: block !important;
                    }
                    .sticker-box {
                      width: 40mm !important;
                      height: 25mm !important;
                      page-break-after: always !important;
                      break-after: page !important;
                      display: flex !important;
                      flex-direction: column !important;
                      align-items: center !important;
                      justify-content: center !important;
                      padding: 1mm !important;
                      box-sizing: border-box !important;
                      border: none !important;
                    }
                    .sticker-qr-img {
                      width: 17mm !important;
                      height: 17mm !important;
                    }
                    .sticker-code-text {
                      font-family: monospace !important;
                      font-size: 9pt !important;
                      font-weight: 800 !important;
                      letter-spacing: 0.05em !important;
                      color: #000000 !important;
                      margin-top: 0.8mm !important;
                    }
                  `
                    : `
                    @page {
                      size: A4 portrait;
                      margin: 8mm;
                    }
                    .print-sheet {
                      display: grid !important;
                      grid-template-columns: repeat(3, 1fr) !important;
                      gap: 3mm !important;
                    }
                    .sticker-box {
                      height: 33mm !important;
                      border: 1px dashed #94a3b8 !important;
                      break-inside: avoid !important;
                      page-break-inside: avoid !important;
                      display: flex !important;
                      flex-direction: column !important;
                      align-items: center !important;
                      justify-content: center !important;
                      padding: 2mm !important;
                      box-sizing: border-box !important;
                    }
                    .sticker-qr-img {
                      width: 22mm !important;
                      height: 22mm !important;
                    }
                    .sticker-code-text {
                      font-family: monospace !important;
                      font-size: 11pt !important;
                      font-weight: 800 !important;
                      letter-spacing: 0.05em !important;
                      color: #000000 !important;
                      margin-top: 1mm !important;
                    }
                  `}
                }
              `}</style>

              {/* Ekrandagi Boshqaruv Qismi */}
              <div className="no-print p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Printer className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Çop Etiş</h3>
                  </div>

                  <button
                    onClick={() => window.print()}
                    disabled={selectedPrintIds.size === 0}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Çop etiş ({selectedPrintIds.size})</span>
                  </button>
                </div>

                {/* Format Tanlovi */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Format:</span>
                    <button
                      onClick={() => setPrintFormat("50x30")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        printFormat === "50x30"
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200"
                      }`}
                    >
                      50×30 mm
                    </button>

                    <button
                      onClick={() => setPrintFormat("40x25")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        printFormat === "40x25"
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200"
                      }`}
                    >
                      40×25 mm
                    </button>

                    <button
                      onClick={() => setPrintFormat("a4")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        printFormat === "a4"
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200"
                      }`}
                    >
                      A4 varaq
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => {
                        if (selectedPrintIds.size === items.length) {
                          setSelectedPrintIds(new Set());
                        } else {
                          setSelectedPrintIds(new Set(items.map((i) => i.id)));
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700 font-semibold underline cursor-pointer"
                    >
                      {selectedPrintIds.size === items.length ? "Bekor qiliş" : "Barçasi"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Minimalist Stikerlar Paneli (FAQAT QR + QISQA KOD) */}
              <div
                className={`print-sheet ${
                  printFormat === "a4"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 print:grid-cols-3"
                    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
                }`}
              >
                {items
                  .filter((it) => selectedPrintIds.has(it.id))
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`sticker-box relative rounded-xl border bg-white p-3 text-center transition-all ${
                        printFormat === "50x30"
                          ? "aspect-[50/30] flex flex-col items-center justify-center border-slate-300 shadow-2xs"
                          : printFormat === "40x25"
                          ? "aspect-[40/25] flex flex-col items-center justify-center border-slate-300 shadow-2xs"
                          : "aspect-[70/36] flex flex-col items-center justify-center border-dashed border-slate-300"
                      }`}
                    >
                      {/* 1. Tepada: Toza QR-kod */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getCleanQrSvgUrl(item.inventoryNumber)}
                        alt={item.inventoryNumber}
                        className="sticker-qr-img w-20 h-20 object-contain mx-auto"
                      />

                      {/* 2. Pastida: Aniq qisqa kod */}
                      <div className="sticker-code-text font-mono font-bold text-slate-950 text-xs sm:text-sm mt-1 tracking-wider">
                        {item.inventoryNumber}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: YANGI BINO (Super Admin Modal Uslubida)                          */}
      {/* ========================================================================= */}
      {isAddBuildingOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Yangi bino</h3>
              </div>
              <button
                onClick={() => setIsAddBuildingOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { name: "1-Öquv binosi", code: "B1", type: "academic" as const, floors: 4 },
                  { name: "Talabalar turar joyi", code: "YOT1", type: "dormitory" as const, floors: 5 },
                  { name: "Sport majmuasi", code: "SPORT1", type: "sports" as const, floors: 2 },
                  { name: "Kutubxona (ARM)", code: "KUTUB1", type: "library" as const, floors: 3 },
                ].map((tpl) => (
                  <button
                    key={tpl.code}
                    type="button"
                    onClick={() => handleCreateBuilding(tpl.name, tpl.code, tpl.type, tpl.floors)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all cursor-pointer"
                  >
                    <div className="font-bold text-xs text-slate-900">{tpl.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {tpl.code} &bull; {tpl.floors} qavat
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddBuildingOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Yopiş
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: YANGI XONA (Super Admin Modal Uslubida)                          */}
      {/* ========================================================================= */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <DoorClosed className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Yangi xona</h3>
              </div>
              <button
                onClick={() => setIsAddRoomOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const rNum = (form.elements.namedItem("roomNumber") as HTMLInputElement).value;
                const rName = (form.elements.namedItem("name") as HTMLInputElement).value;
                const flNum = parseInt(
                  (form.elements.namedItem("floorNumber") as HTMLInputElement).value,
                  10
                );
                const target = parseInt(
                  (form.elements.namedItem("capacityTarget") as HTMLInputElement).value,
                  10
                );
                handleCreateRoom(rNum, rName, flNum, target);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Xona raqami <span className="text-rose-500">*</span>
                </label>
                <input
                  name="roomNumber"
                  required
                  placeholder="210"
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Xona nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  required
                  placeholder="210-Auditoriya"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Qavat
                  </label>
                  <input
                    name="floorNumber"
                    type="number"
                    defaultValue={2}
                    min={1}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Möljal (jihozlar)
                  </label>
                  <input
                    name="capacityTarget"
                    type="number"
                    defaultValue={25}
                    min={1}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Bekor qiliş
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Saqlaş
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: JIHOZNI TAHRIRLASH (Super Admin Modal Uslubida)                  */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Jihozni tahrirlaş</h3>
                  <p className="text-[11px] font-mono font-bold text-slate-500">
                    {editingItem.inventoryNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const updated: MockItem = {
                  ...editingItem,
                  name: (form.elements.namedItem("name") as HTMLInputElement).value,
                  model: (form.elements.namedItem("model") as HTMLInputElement).value,
                  price:
                    parseFloat((form.elements.namedItem("price") as HTMLInputElement).value) || 0,
                  inventoryNumber: (
                    form.elements.namedItem("inventoryNumber") as HTMLInputElement
                  ).value.toUpperCase(),
                  roomId: (form.elements.namedItem("roomId") as HTMLSelectElement).value,
                };
                handleUpdateItem(updated);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Inventar kodi
                </label>
                <input
                  name="inventoryNumber"
                  defaultValue={editingItem.inventoryNumber}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jihoz nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  defaultValue={editingItem.name}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Modeli
                  </label>
                  <input
                    name="model"
                    defaultValue={editingItem.model}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Narxi (söm)
                  </label>
                  <input
                    name="price"
                    type="number"
                    defaultValue={editingItem.price}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Joylaşgan xonasi
                </label>
                <select
                  name="roomId"
                  defaultValue={editingItem.roomId}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} — {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Bekor qiliş
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Saqlaş
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
