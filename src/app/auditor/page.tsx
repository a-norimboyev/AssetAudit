"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Scan,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Building2,
  DoorClosed,
  Clock,
  Printer,
  Search,
  CheckCheck,
  ShieldCheck,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  FileText,
  BadgeCheck,
  PenTool,
  Volume2,
  VolumeX,
  User,
  LogOut,
  ChevronRight,
  Filter,
} from "lucide-react";

// --- TİPLAR (TYPES) ---
interface RoomItem {
  id: string;
  name: string;
  inventoryNumber: string;
  category: "kompyuter" | "mebel" | "multimedia" | "laboratoriya";
  price: number;
  expectedRoom: string;
  expectedBuilding: string;
  responsiblePerson: string;
  status: "matched" | "missing" | "conflict";
  scannedAt?: string;
  actualRoom?: string;
}

interface RoomData {
  id: string;
  roomNumber: string;
  name: string;
  building: string;
  floor: number;
  responsiblePerson: string;
  totalItems: number;
  scannedItems: number;
  status: "completed" | "in_progress" | "pending";
}

// --- MA'LUMOTLAR BAZASİ (MOCK DATA) ---
const INITIAL_ROOMS: RoomData[] = [
  {
    id: "r-210",
    roomNumber: "210",
    name: "Katta Ma‘ruza Auditoriyasi",
    building: "Boş Bino",
    floor: 2,
    responsiblePerson: "dots. Rahimov A. T.",
    totalItems: 32,
    scannedItems: 28,
    status: "in_progress",
  },
  {
    id: "r-212",
    roomNumber: "212",
    name: "Dasturiy İnjiniring Kompyuter Zali",
    building: "Boş Bino",
    floor: 2,
    responsiblePerson: "kat.öq. Yusupov M. S.",
    totalItems: 25,
    scannedItems: 25,
    status: "completed",
  },
  {
    id: "r-214",
    roomNumber: "214",
    name: "Kiberxavfsizlik Laboratoriyasi",
    building: "Boş Bino",
    floor: 2,
    responsiblePerson: "prof. Alimov B. R.",
    totalItems: 18,
    scannedItems: 0,
    status: "pending",
  },
  {
    id: "r-305",
    roomNumber: "305",
    name: "Dasturiy İnjiniring Fakulteti Dekanati",
    building: "Boş Bino",
    floor: 3,
    responsiblePerson: "dekan Qodirov D. E.",
    totalItems: 14,
    scannedItems: 14,
    status: "completed",
  },
  {
    id: "r-101",
    roomNumber: "101",
    name: "Sun‘iy İntellekt Markazi",
    building: "Texnopark",
    floor: 1,
    responsiblePerson: "PhD Jörayev N. K.",
    totalItems: 40,
    scannedItems: 38,
    status: "in_progress",
  },
  {
    id: "r-102",
    roomNumber: "102",
    name: "Universitet Boş Server Xonasi",
    building: "Texnopark",
    floor: 1,
    responsiblePerson: "muhandis Mahmudov S.",
    totalItems: 22,
    scannedItems: 22,
    status: "completed",
  },
  {
    id: "r-401",
    roomNumber: "401",
    name: "Elektronika va Sxematotexnika Zali",
    building: "Boş Bino",
    floor: 4,
    responsiblePerson: "dots. Xalilov U. H.",
    totalItems: 16,
    scannedItems: 0,
    status: "pending",
  },
  {
    id: "r-arm",
    roomNumber: "105",
    name: "Axborot-Resurs Markazi (ARM)",
    building: "Kutubxona",
    floor: 1,
    responsiblePerson: "mudir Karimov Z. Q.",
    totalItems: 45,
    scannedItems: 45,
    status: "completed",
  },
];

// 210-auditoriya jihozlari
const INITIAL_ITEMS: RoomItem[] = [
  {
    id: "it-001",
    name: "İnteraktiv Elektron Doska Samsung Flip 75\"",
    inventoryNumber: "TATU-B1-210-0001",
    category: "multimedia",
    price: 32500000,
    expectedRoom: "210",
    expectedBuilding: "Boş Bino",
    responsiblePerson: "dots. Rahimov A. T.",
    status: "matched",
    scannedAt: "11:15:20",
    actualRoom: "210",
  },
  {
    id: "it-002",
    name: "Öqituvçi Minbari va Kafedrasi (Yoğoç)",
    inventoryNumber: "TATU-B1-210-0002",
    category: "mebel",
    price: 3800000,
    expectedRoom: "210",
    expectedBuilding: "Boş Bino",
    responsiblePerson: "dots. Rahimov A. T.",
    status: "matched",
    scannedAt: "11:15:45",
    actualRoom: "210",
  },
  {
    id: "it-003",
    name: "Öquvçi Partasi 2 örinli (Metal)",
    inventoryNumber: "TATU-B1-210-0003",
    category: "mebel",
    price: 1200000,
    expectedRoom: "210",
    expectedBuilding: "Boş Bino",
    responsiblePerson: "dots. Rahimov A. T.",
    status: "matched",
    scannedAt: "11:16:10",
    actualRoom: "210",
  },
  {
    id: "it-004",
    name: "Öquvçi Partasi 2 örinli (Metal)",
    inventoryNumber: "TATU-B1-210-0004",
    category: "mebel",
    price: 1200000,
    expectedRoom: "210",
    expectedBuilding: "Boş Bino",
    responsiblePerson: "dots. Rahimov A. T.",
    status: "matched",
    scannedAt: "11:16:22",
    actualRoom: "210",
  },
  {
    id: "it-005",
    name: "Öquvçi Partasi 2 örinli (Metal)",
    inventoryNumber: "TATU-B1-210-0005",
    category: "mebel",
    price: 1200000,
    expectedRoom: "210",
    expectedBuilding: "Boş Bino",
    responsiblePerson: "dots. Rahimov A. T.",
    status: "matched",
    scannedAt: "11:16:35",
    actualRoom: "210",
  },
  {
    id: "it-006",
    name: "Konditsioner Artel Inverter 24HD",
    inventoryNumber: "TATU-B1-210-0006",
    category: "multimedia",
    price: 8400000,
    expectedRoom: "210",
    expectedBuilding: "Boş Bino",
    responsiblePerson: "dots. Rahimov A. T.",
    status: "matched",
    scannedAt: "11:17:02",
    actualRoom: "210",
  },
  // Kamomad (Topilmaganlar)
  {
    id: "it-007",
    name: "HP ProBook 450 G9 Noutbuki",
    inventoryNumber: "TATU-B1-210-0007",
    category: "kompyuter",
    price: 9200000,
    expectedRoom: "210",
    expectedBuilding: "Boş Bino",
    responsiblePerson: "dots. Rahimov A. T.",
    status: "missing",
  },
  {
    id: "it-008",
    name: "Epson EB-X51 Proyektor Pulti",
    inventoryNumber: "TATU-B1-210-0008",
    category: "multimedia",
    price: 1400000,
    expectedRoom: "210",
    expectedBuilding: "Boş Bino",
    responsiblePerson: "dots. Rahimov A. T.",
    status: "missing",
  },
  {
    id: "it-009",
    name: "Ofis Kreslosi Ergonomik (Qora)",
    inventoryNumber: "TATU-B1-210-0009",
    category: "mebel",
    price: 4200000,
    expectedRoom: "210",
    expectedBuilding: "Boş Bino",
    responsiblePerson: "dots. Rahimov A. T.",
    status: "missing",
  },
  // Konflikt (Adaşgan buyumlar)
  {
    id: "it-010",
    name: "Monoblok HP 24 All-in-One",
    inventoryNumber: "TATU-B1-305-0014",
    category: "kompyuter",
    price: 11500000,
    expectedRoom: "305",
    expectedBuilding: "Boş Bino",
    responsiblePerson: "dekan Qodirov D. E.",
    status: "conflict",
    scannedAt: "11:18:40",
    actualRoom: "210",
  },
  {
    id: "it-011",
    name: "Mikrofon Radiotizimi Shure SLX-D",
    inventoryNumber: "TATU-B1-214-0004",
    category: "multimedia",
    price: 6700000,
    expectedRoom: "214",
    expectedBuilding: "Boş Bino",
    responsiblePerson: "prof. Alimov B. R.",
    status: "conflict",
    scannedAt: "11:19:15",
    actualRoom: "210",
  },
];

export default function AuditorInteractivePortal() {
  const [activeTab, setActiveTab] = useState<"monitoring" | "scanner" | "discrepancy" | "act">("monitoring");

  // Xonalar va mulklar holati
  const [rooms, setRooms] = useState<RoomData[]>(INITIAL_ROOMS);
  const [items, setItems] = useState<RoomItem[]>(INITIAL_ITEMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("r-210");

  // Filtrlash va qidiruv holati
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterBuilding, setFilterBuilding] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [scannerFilter, setScannerFilter] = useState<"all" | "matched" | "missing" | "conflict">("all");

  // Skaner holatlari
  const [scannedCodeInput, setScannedCodeInput] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [flashColor, setFlashColor] = useState<"green" | "yellow" | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "conflict" | "warning";
    title: string;
    description: string;
  } | null>(null);

  // Dalolatnoma imzolash
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const [signedDate, setSignedDate] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Ovozli signal (Web Audio API)
  const playSound = useCallback(
    (type: "success" | "conflict") => {
      if (!soundEnabled || typeof window === "undefined") return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "conflict") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(320, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } else {
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.22, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.16);
          osc.start();
          osc.stop(ctx.currentTime + 0.16);
        }

        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(type === "conflict" ? [100, 50, 100] : [60]);
        }
      } catch {
        // ovoz xatosi e'tiborga olinmaydi
      }
    },
    [soundEnabled]
  );

  // Kamerani yoqish/yopish
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setAlertMessage({
          type: "warning",
          title: "Kamera aniqlanmadi",
          description: "Qurilmangizda kamera topilmadi. Quyidagi tezkor tugmalar orqali tekşiring.",
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setAlertMessage({
        type: "warning",
        title: "Kameraga ruxsat berilmadi",
        description: "Kamera ruxsati berilmadi. Tezkor sinov tugmalaridan foydalaning.",
      });
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // QR yoki inventar raqamini skanerlash
  const handleProcessScan = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    const currentRoom = rooms.find((r) => r.id === selectedRoomId);
    const roomNum = currentRoom?.roomNumber || "210";

    // 1. Joriy xonaga tegishli buyum
    const existingInRoom = items.find(
      (it) => it.inventoryNumber.toUpperCase() === cleanCode && it.expectedRoom === roomNum
    );

    if (existingInRoom) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === existingInRoom.id
            ? {
                ...it,
                status: "matched",
                actualRoom: roomNum,
                scannedAt: new Date().toLocaleTimeString("uz-UZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }),
              }
            : it
        )
      );

      playSound("success");
      setFlashColor("green");
      setTimeout(() => setFlashColor(null), 600);

      setAlertMessage({
        type: "success",
        title: `Joyida topildi: ${existingInRoom.name}`,
        description: `№ ${existingInRoom.inventoryNumber} • ${existingInRoom.expectedRoom}-xona. Tasdiqlandi.`,
      });
      setScannedCodeInput("");
      return;
    }

    // 2. Boshqa xonaga tegishli buyum (Konflikt)
    const belongingElsewhere = items.find(
      (it) => it.inventoryNumber.toUpperCase() === cleanCode && it.expectedRoom !== roomNum
    );

    if (belongingElsewhere) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === belongingElsewhere.id
            ? {
                ...it,
                status: "conflict",
                actualRoom: roomNum,
                scannedAt: new Date().toLocaleTimeString("uz-UZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }),
              }
            : it
        )
      );

      playSound("conflict");
      setFlashColor("yellow");
      setTimeout(() => setFlashColor(null), 800);

      setAlertMessage({
        type: "conflict",
        title: `Diqqat! Adaşgan buyum: ${belongingElsewhere.name}`,
        description: `Bu buyum rasman ${belongingElsewhere.expectedRoom}-xonaga tegişli, lekin hozir ${roomNum}-xonada topildi.`,
      });
      setScannedCodeInput("");
      return;
    }

    // 3. Ro'yxatdan tashqari yangi buyum
    const newItem: RoomItem = {
      id: `it-${Date.now()}`,
      name: `Röyxatdan taşqari jihoz (${cleanCode})`,
      inventoryNumber: cleanCode,
      category: "kompyuter",
      price: 2500000,
      expectedRoom: "Noma'lum",
      expectedBuilding: currentRoom?.building || "Boş Bino",
      responsiblePerson: "Aniqlanmagan",
      status: "conflict",
      actualRoom: roomNum,
      scannedAt: new Date().toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };

    setItems((prev) => [newItem, ...prev]);
    playSound("conflict");
    setAlertMessage({
      type: "conflict",
      title: `Röyxatdan taşqari buyum topildi`,
      description: `Kod: ${cleanCode}. Ushbu buyum xona hisobida yöq edi. Tafovut jurnaliga qöşildi.`,
    });
    setScannedCodeInput("");
  };

  // Joriy xona tekshiruvini yakunlash
  const handleCompleteCurrentRoom = () => {
    const currentRoom = rooms.find((r) => r.id === selectedRoomId);
    if (!currentRoom) return;

    setRooms((prev) =>
      prev.map((r) =>
        r.id === selectedRoomId
          ? { ...r, status: "completed", scannedItems: r.totalItems }
          : r
      )
    );

    playSound("success");
    setAlertMessage({
      type: "success",
      title: `${currentRoom.roomNumber}-xona tekşiruvi yakunlandi`,
      description: "Xona dalolatnomasi saqlandi va umumiy hisobotga kiritildi.",
    });
  };

  // Dalolatnomani imzolash
  const handleSignAct = () => {
    setIsSigned(true);
    setSignedDate(
      new Date().toLocaleDateString("uz-UZ", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    playSound("success");
  };

  // Narxlarni formatlash
  const formatUZS = (val: number) => {
    return new Intl.NumberFormat("uz-UZ").format(val) + " söm";
  };

  // Hisob-kitoblar
  const missingItems = items.filter((it) => it.status === "missing");
  const conflictItems = items.filter((it) => it.status === "conflict");
  const matchedItems = items.filter((it) => it.status === "matched");

  const totalMissingSum = missingItems.reduce((acc, it) => acc + it.price, 0);
  const totalConflictSum = conflictItems.reduce((acc, it) => acc + it.price, 0);
  const totalMatchedSum = matchedItems.reduce((acc, it) => acc + it.price, 0);

  const completedRoomsCount = rooms.filter((r) => r.status === "completed").length;
  const inProgressRoomsCount = rooms.filter((r) => r.status === "in_progress").length;
  const currentSelectedRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  // Filtrlangan xonalar
  const filteredRooms = rooms.filter((r) => {
    const matchBuilding = filterBuilding === "all" || r.building.toLowerCase().includes(filterBuilding.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchSearch =
      r.roomNumber.includes(searchQuery) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.responsiblePerson.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBuilding && matchStatus && matchSearch;
  });

  // Filtrlangan buyumlar
  const filteredItems = items.filter((it) => {
    if (scannerFilter === "matched") return it.status === "matched";
    if (scannerFilter === "missing") return it.status === "missing";
    if (scannerFilter === "conflict") return it.status === "conflict";
    return true;
  });

  // Breadcrumb matni
  const getTabBreadcrumb = () => {
    switch (activeTab) {
      case "monitoring":
        return "Xonalar Monitoringi";
      case "scanner":
        return "Tezkor Skanerlaş";
      case "discrepancy":
        return "Tafovut Jurnali";
      case "act":
        return "Soliştirma Dalolatnoma";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. YUQORİ ASOSİY HEADER (Super Admin uslubida toza va yengil dizayn) */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40">
        <div className="w-full px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Chap tomon: Logo va Breadcrumb */}
          <div className="flex items-center gap-6">
            <Link href="/auditor" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-2xs group-hover:bg-blue-700 transition-colors">
                A
              </div>
              <div className="leading-tight">
                <div className="font-extrabold text-[15px] tracking-tight text-slate-950">
                  Asset<span className="text-blue-600">Audit</span>
                </div>
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  TEKŞİRUVÇİ
                </div>
              </div>
            </Link>

            {/* Breadcrumb navigatsiyasi */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400 pl-4 border-l border-slate-200">
              <span className="text-slate-500">Tekşiruvçi</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-900 font-semibold">{getTabBreadcrumb()}</span>
            </div>
          </div>

          {/* O'ng tomon: Ovoz, Auditor Foydalanuvchi va Chiqish */}
          <div className="flex items-center gap-3">
            {/* Ovoz tugmasi */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                soundEnabled
                  ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
              }`}
              title={soundEnabled ? "Ovozli signal yoqilgan" : "Ovozsiz"}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden md:inline">{soundEnabled ? "Ovoz: Faol" : "Ovozsiz"}</span>
            </button>

            {/* Auditor Foydalanuvchi */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                AK
              </div>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-xs font-bold text-slate-900">Alisher Karimov</div>
                <div className="text-[10px] text-slate-400 font-medium">Bölim Auditori</div>
              </div>
            </div>

            {/* Chiqish */}
            <Link
              href="/"
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors flex items-center gap-1"
              title="Tizimdan çiqiş"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çiqiş</span>
            </Link>
          </div>
        </div>

        {/* 2. MODUL NAVİGATSİYA TUGMALARİ (Super Admin screenshotidagi 'Barqasi', 'Şoşilinç' kabi toza tabletkalar) */}
        <div className="px-4 sm:px-8 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2 py-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("monitoring")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
              activeTab === "monitoring"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Xonalar Monitoringi</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "monitoring" ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {rooms.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("scanner")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
              activeTab === "scanner"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Tezkor Skanerlaş</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab("discrepancy")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
              activeTab === "discrepancy"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Tafovut Jurnali</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "discrepancy" ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-700"
              }`}
            >
              {missingItems.length} kamomad
            </span>
          </button>

          <button
            onClick={() => setActiveTab("act")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
              activeTab === "act"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Soliştirma Dalolatnoma</span>
            {isSigned && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                İmzolandi
              </span>
            )}
          </button>
        </div>
      </header>

      {/* BILDIRISHNOMA (ALERT) */}
      {alertMessage && (
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 mt-4">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-2xs transition-all ${
              alertMessage.type === "success"
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                : alertMessage.type === "conflict"
                ? "bg-amber-50/80 border-amber-200 text-amber-950"
                : "bg-rose-50/80 border-rose-200 text-rose-950"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {alertMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : alertMessage.type === "conflict" ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <div>
                <span className="font-bold">{alertMessage.title}</span>
                <span className="text-slate-600 ml-2">{alertMessage.description}</span>
              </div>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-xs font-semibold px-2 py-0.5 rounded text-slate-500 hover:text-slate-900 hover:bg-black/5 cursor-pointer"
            >
              Yopiş
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. XONALAR MONİTORİNGİ                                                    */}
      {/* ========================================================================= */}
      {activeTab === "monitoring" && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Sahifa sarlavhasi va Tezkor Harakat */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Xonalar Monitoringi
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Universitet auditoriyalari böyiça haqiqiy xatlov jarayoni va reja ijrosi
              </p>
            </div>

            <button
              onClick={() => setActiveTab("scanner")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <Scan className="w-4 h-4" />
              <span>Skanerlaşni boşlaş</span>
            </button>
          </div>

          {/* Yuqori Statistik Kartalar (Super Admin uslubidagi oq kartalar) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Jami Xonalar</span>
                <DoorClosed className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1.5">
                {rooms.length} <span className="text-xs font-normal text-slate-500">xona</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                <span className="text-blue-600 font-bold">{completedRoomsCount} ta</span> yakunlandi
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Tekşirilgan Mulklar</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-1.5">
                {matchedItems.length}{" "}
                <span className="text-xs font-normal text-slate-500">/ {items.length} ta</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">
                {Math.round((matchedItems.length / items.length) * 100)}% joyida mavjud
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Aniqlangan Kamomad</span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-rose-600 mt-1.5">
                {missingItems.length} <span className="text-xs font-normal text-slate-500">ta</span>
              </div>
              <div className="text-[11px] text-rose-700 font-medium mt-1">
                Zarar: {formatUZS(totalMissingSum)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Adaşgan Jihozlar</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-1.5">
                {conflictItems.length} <span className="text-xs font-normal text-slate-500">ta</span>
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-1">
                Boşqa xonada topilgan
              </div>
            </div>
          </div>

          {/* Qidiruv va Filtr Paneli (Super Admin screenshotidagi kabi) */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Qidiruv */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qidiriş..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-2xs"
              />
            </div>

            {/* Filtr Tabletka Tugmalari */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterBuilding("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterBuilding === "all"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                Barçasi
              </button>
              <button
                onClick={() => setFilterBuilding("Boş Bino")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterBuilding === "Boş Bino"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                Boş Bino
              </button>
              <button
                onClick={() => setFilterBuilding("Texnopark")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterBuilding === "Texnopark"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                Texnopark
              </button>
              <button
                onClick={() => setFilterBuilding("Kutubxona")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterBuilding === "Kutubxona"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                Kutubxona
              </button>
            </div>
          </div>

          {/* Xonalar Ro'yxati (Toza oq kartalar) */}
          <div className="space-y-2.5">
            {filteredRooms.map((r) => {
              const progress = Math.round((r.scannedItems / r.totalItems) * 100);
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-xs text-slate-800 shrink-0">
                      {r.roomNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{r.name}</h3>
                        {r.status === "completed" ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Yakunlandi
                          </span>
                        ) : r.status === "in_progress" ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Jarayonda
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                            Kutilmoqda
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span>{r.building}</span>
                        <span>•</span>
                        <span>{r.floor}-qavat</span>
                        <span>•</span>
                        <span>Mas&apos;ul: {r.responsiblePerson}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress va Amal */}
                  <div className="flex items-center justify-between md:justify-end gap-5">
                    <div className="w-36 hidden sm:block">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Tekşirildi:</span>
                        <span className="font-bold text-slate-800">
                          {r.scannedItems}/{r.totalItems} ({progress}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            progress === 100 ? "bg-emerald-500" : progress > 0 ? "bg-blue-600" : "bg-slate-300"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedRoomId(r.id);
                        setActiveTab("scanner");
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200 hover:border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      <span>Skanerlaş</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 2. TEZKOR SKANERLASH (Scan & Go)                                         */}
      {/* ========================================================================= */}
      {activeTab === "scanner" && (
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-4">
          {/* Xona Tanlash va Jonli Hisoblagich */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Tezkor Skanerlaş (Scan & Go)
                </h2>
                <p className="text-xs text-slate-500">
                  {currentSelectedRoom.building} • {currentSelectedRoom.roomNumber}-xona ({currentSelectedRoom.name})
                </p>
              </div>

              {/* Jonli Holat Ko'rsatkichlari */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  🟢 {items.filter((it) => it.status === "matched").length} Topildi
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  🔴 {items.filter((it) => it.status === "missing").length} Kamomad
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  ⚠️ {items.filter((it) => it.status === "conflict").length} Adaşgan
                </span>
              </div>
            </div>

            {/* Xonani tanlash */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600 shrink-0">
                Xonani almashtiщ:
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.building} • {r.roomNumber}-xona ({r.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Skaner Bloki */}
          <div
            className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-2xs space-y-4 transition-all duration-300 ${
              flashColor === "green"
                ? "border-emerald-500 ring-4 ring-emerald-100"
                : flashColor === "yellow"
                ? "border-amber-500 ring-4 ring-amber-100"
                : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                QR Kod yoki İnventar Raqamini Kiritiş
              </span>

              <button
                type="button"
                onClick={toggleCamera}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isCameraActive
                    ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                    : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                }`}
              >
                {isCameraActive ? (
                  <>
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Kamerani yopiş</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Kamerani yoqiş</span>
                  </>
                )}
              </button>
            </div>

            {/* Jonli Kamera Oynasi */}
            {isCameraActive && (
              <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video max-w-sm mx-auto flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-blue-500/30 flex items-center justify-center pointer-events-none">
                  <div className="w-36 h-36 border-2 border-emerald-400 rounded-xl animate-pulse flex items-center justify-center">
                    <span className="text-[10px] text-white bg-slate-900/80 px-2 py-0.5 rounded-full">
                      Stikerni nişonga oling
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Qidiruv/Skan maydoni */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessScan(scannedCodeInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={scannedCodeInput}
                onChange={(e) => setScannedCodeInput(e.target.value)}
                placeholder="TATU-B1-210-0001 yoki QR token..."
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!scannedCodeInput.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Scan className="w-4 h-4" />
                <span>Skaner</span>
              </button>
            </form>

            {/* Tezkor Sinov Tugmalari */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 block mb-2">
                Tezkor sinov tugmalari (bitta bosişda tekşiring):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleProcessScan("TATU-B1-210-0001")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200 transition-colors cursor-pointer"
                >
                  🟢 Samsung Flip Doska (Joyida)
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessScan("TATU-B1-210-0003")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200 transition-colors cursor-pointer"
                >
                  🟢 Öquvçi Partasi (Joyida)
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessScan("TATU-B1-305-0014")}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200 transition-colors cursor-pointer"
                >
                  ⚠️ 305-xona Monobloki (Adaşgan!)
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessScan("TATU-B1-214-0004")}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200 transition-colors cursor-pointer"
                >
                  ⚠️ 214-xona Mikrofoni (Adaşgan!)
                </button>
              </div>
            </div>

            {/* Xonani yakunlash tugmasi */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Xonadagi barça jihozlar tekşirildi-mi?
              </span>
              <button
                type="button"
                onClick={handleCompleteCurrentRoom}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Xona Tekşiruvini Yakunlaş</span>
              </button>
            </div>
          </div>

          {/* Ushbu Xonadagi Buyumlar Ro'yxati */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold text-slate-900">
                {currentSelectedRoom.roomNumber}-xona jihozlari ({items.length} ta)
              </span>

              {/* Ichki filtrlar */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setScannerFilter("all")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    scannerFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Barçasi
                </button>
                <button
                  onClick={() => setScannerFilter("matched")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    scannerFilter === "matched" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Topildi ({matchedItems.length})
                </button>
                <button
                  onClick={() => setScannerFilter("missing")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    scannerFilter === "missing" ? "bg-rose-600 text-white" : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Kamomad ({missingItems.length})
                </button>
                <button
                  onClick={() => setScannerFilter("conflict")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    scannerFilter === "conflict" ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Adaşgan ({conflictItems.length})
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {filteredItems.map((it) => (
                <div
                  key={it.id}
                  className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{it.name}</div>
                    <div className="font-mono text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                      <span>{it.inventoryNumber}</span>
                      <span>•</span>
                      <span>{formatUZS(it.price)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {it.status === "matched" ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Joyida bor
                      </span>
                    ) : it.status === "conflict" ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Adaşgan ({it.expectedRoom})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Topilmadi
                      </span>
                    )}

                    {it.scannedAt && (
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        {it.scannedAt}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 3. TAFOVUT JURNALİ                                                        */}
      {/* ========================================================================= */}
      {activeTab === "discrepancy" && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tafovut Jurnali
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Xatlov jarayonida aniqlangan kamomadlar hamda boshqa xonadan chiqqan buyumlar
            </p>
          </div>

          {/* Tafovut Yig'ma Kartalari */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-2xs">
              <span className="text-xs font-bold text-rose-700">🔴 Aniqlangan Kamomad</span>
              <div className="text-2xl font-bold text-rose-900 mt-1">
                {missingItems.length} ta jihoz
              </div>
              <div className="text-xs text-rose-700 font-semibold mt-1">
                Zarar: {formatUZS(totalMissingSum)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs">
              <span className="text-xs font-bold text-amber-700">🟡 Adaşgan Buyumlar</span>
              <div className="text-2xl font-bold text-amber-900 mt-1">
                {conflictItems.length} ta jihoz
              </div>
              <div className="text-xs text-amber-700 font-semibold mt-1">
                Qiymati: {formatUZS(totalConflictSum)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-2xs">
              <span className="text-xs font-bold text-emerald-700">🟢 Joyida Tasdiqlangan</span>
              <div className="text-2xl font-bold text-emerald-900 mt-1">
                {matchedItems.length} ta jihoz
              </div>
              <div className="text-xs text-emerald-700 font-semibold mt-1">
                Qiymati: {formatUZS(totalMatchedSum)}
              </div>
            </div>
          </div>

          {/* 1. Kamomad Jadvali */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Topilmagan Mulklar (Kamomad)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {missingItems.length} ta qayd
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">№</th>
                    <th className="p-3">İnventar Raqami</th>
                    <th className="p-3">Mulk Nomi</th>
                    <th className="p-3">Biriktirilgan Xona</th>
                    <th className="p-3">Moddiy Javobgar</th>
                    <th className="p-3 text-right">Balans Qiymati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {missingItems.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-blue-600">{it.inventoryNumber}</td>
                      <td className="p-3 font-semibold text-slate-900">{it.name}</td>
                      <td className="p-3 text-slate-600">
                        {it.expectedBuilding} • {it.expectedRoom}-xona
                      </td>
                      <td className="p-3 text-slate-600">{it.responsiblePerson}</td>
                      <td className="p-3 font-mono font-bold text-rose-600 text-right">
                        {formatUZS(it.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Adashgan Buyumlar Jadvali */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Joylaşuv Nomuvofiqligi (Adaşgan Jihozlar)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {conflictItems.length} ta qayd
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">№</th>
                    <th className="p-3">İnventar Raqami</th>
                    <th className="p-3">Mulk Nomi</th>
                    <th className="p-3">Asl Xonasi</th>
                    <th className="p-3">Topilgan Joyi</th>
                    <th className="p-3 text-right">Balans Qiymati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {conflictItems.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-blue-600">{it.inventoryNumber}</td>
                      <td className="p-3 font-semibold text-slate-900">{it.name}</td>
                      <td className="p-3 text-slate-600">
                        {it.expectedBuilding} • {it.expectedRoom}-xona
                      </td>
                      <td className="p-3 font-bold text-amber-700">
                        {it.actualRoom || "210"}-xona
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800 text-right">
                        {formatUZS(it.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 4. SOLISHTIRMA DALOLATNOMA                                               */}
      {/* ========================================================================= */}
      {activeTab === "act" && (
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Soliştirma Dalolatnoma (Akt № TATU-2026/09)
              </h2>
              <p className="text-xs text-slate-500">
                Rasmiy audit xulosasi va dalolatnoma hujjati
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Çop etiş</span>
              </button>

              <button
                type="button"
                onClick={handleSignAct}
                disabled={isSigned}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSigned
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>{isSigned ? "İmzolandi" : "İmzolaş"}</span>
              </button>
            </div>
          </div>

          {/* Dalolatnoma Blankasi */}
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-2xs space-y-6 text-slate-900">
            <div className="text-center space-y-1.5 border-b border-slate-200 pb-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Özbekiston Respublikasi Oliy Ta&apos;lim, Fan va İnnovatsiyalar Vazirligi
              </div>
              <div className="text-base font-extrabold uppercase text-slate-950">
                Toşkent Axborot Texnologiyalari Universiteti (TATU)
              </div>
              <div className="text-lg font-black uppercase text-blue-900 mt-2">
                ASOSİY VOSİTALAR VA TOVAR-MODDİY BOYLİKLARNİ XATLOVDAN ÖTKAZİŞ SOLİŞTİRMA DALOLATNOMASİ
              </div>
              <div className="text-xs font-mono text-slate-500">
                № TATU-2026/09 • 30-oktabr 2026-yil
              </div>
            </div>

            <div className="text-xs leading-relaxed space-y-2 text-slate-700">
              <p>
                <strong>Asos:</strong> TATU Rektorining 2026-yil 15-sentabrdagi № 412-sonli &quot;2026-yilgi yillik kuzgi xatlovni ötkaziş töğrisida&quot;gi buyruği.
              </p>
              <p>
                <strong>Komissiya tarkibi:</strong>
              </p>
              <ul className="list-disc list-inside pl-2 space-y-0.5 text-slate-600">
                <li><strong>Tekşiruvçi:</strong> Alisher Karimov (İçki audit xizmati)</li>
                <li><strong>Moddiy javobgar:</strong> dots. Rahimov A. T. (210-auditoriya mudiri)</li>
                <li><strong>Boş hisobçi vakili:</strong> Yusupova D. K.</li>
              </ul>
            </div>

            {/* Solishtirma jadval */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                1. Reja va Haqiqatda Mavjudlik Soliştirmasi
              </h4>

              <table className="w-full text-xs border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-slate-800 font-bold text-center">
                    <th className="border border-slate-200 p-2 text-left">Körsatkiç nomi</th>
                    <th className="border border-slate-200 p-2">Hisobda (Reja)</th>
                    <th className="border border-slate-200 p-2 text-emerald-700">Topildi (Fakt)</th>
                    <th className="border border-slate-200 p-2 text-rose-700">Kamomad</th>
                    <th className="border border-slate-200 p-2 text-amber-700">Adaşgan</th>
                  </tr>
                </thead>
                <tbody className="text-center divide-y divide-slate-200 font-medium">
                  <tr>
                    <td className="border border-slate-200 p-2 text-left font-bold">Jihozlar soni</td>
                    <td className="border border-slate-200 p-2 font-bold">32 dona</td>
                    <td className="border border-slate-200 p-2 font-bold text-emerald-700">28 dona</td>
                    <td className="border border-slate-200 p-2 font-bold text-rose-600">3 dona</td>
                    <td className="border border-slate-200 p-2 font-bold text-amber-600">2 dona</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2 text-left font-bold">Balans Qiymati</td>
                    <td className="border border-slate-200 p-2 font-mono">1 260 000 000 söm</td>
                    <td className="border border-slate-200 p-2 font-mono text-emerald-700">1 245 200 000 söm</td>
                    <td className="border border-slate-200 p-2 font-mono text-rose-600 font-bold">14 800 000 söm</td>
                    <td className="border border-slate-200 p-2 font-mono text-amber-600 font-bold">18 200 000 söm</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Imzolar */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2">
                <div className="font-bold text-slate-800">Komissiya Raisi (Tekşiruvçi):</div>
                <div className="h-8 border-b border-slate-300 flex items-center">
                  {isSigned ? (
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" /> A. Karimov (E-İmzo)
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">(imzo)</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800">Moddiy Javobgar:</div>
                <div className="h-8 border-b border-slate-300 flex items-center">
                  <span className="text-slate-400 italic text-[11px]">(imzo)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800">Boş Hisobçi:</div>
                <div className="h-8 border-b border-slate-300 flex items-center">
                  <span className="text-slate-400 italic text-[11px]">(imzo)</span>
                </div>
              </div>
            </div>

            {isSigned && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    Hujjat E-İmzo bilan tasdiqlandi • Vaqt: {signedDate}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                  MUHR BOSİLGAN
                </span>
              </div>
            )}
          </div>
        </main>
      )}

      {/* 5. FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white py-3 px-4 text-center text-xs text-slate-400">
        &copy; 2026 AssetAudit • Tekşiruvçi Portali
      </footer>
    </div>
  );
}
