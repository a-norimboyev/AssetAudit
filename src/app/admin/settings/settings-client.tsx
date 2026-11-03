"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  Download,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Plus,
  Check,
  X,
  History,
  Database,
  ChevronLeft,
  ChevronRight,
  Layers,
  Building2,
  Radio,
} from "lucide-react";
import {
  MOCK_AUDIT_TRAIL_LOGS,
  type MockAuditTrailLog,
} from "@/lib/mock/superadmin-mock-data";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";

const ENRICHED_LOGS: MockAuditTrailLog[] = [
  ...MOCK_AUDIT_TRAIL_LOGS,
  {
    id: "log-7",
    event: "ADMIN_ACCESS_FROZEN",
    title: "OTM administratori hisobi vaqtincha muzlatildi",
    actor: "Superadmin - Nazorat Departamenti",
    targetOrg: "Termiz Davlat Universiteti TerDU",
    timestamp: "24-Oktabr, 14:20",
    level: "danger",
  },
  {
    id: "log-8",
    event: "SECURITY_BACKUP_COMPLETED",
    title: "Yalpi ma‘lumotlar bazasi zaxira nusxasi olindi",
    actor: "Avtomatik Xavfsizlik Xizmati",
    targetOrg: "Tizim Bosh Serveri",
    timestamp: "Bugun, 04:00",
    level: "success",
  },
  {
    id: "log-9",
    event: "SYSTEM_CACHE_CLEARED",
    title: "Kesh xotirasi va OTMlar sessiyalari yangilandi",
    actor: "Superadmin",
    targetOrg: "Barcha 250 ta OTM",
    timestamp: "23-Oktabr, 09:30",
    level: "info",
  },
  {
    id: "log-10",
    event: "SECURITY_AUDIT_PASSED",
    title: "TLS 1.3 shifrlash va kirish sertifikatlari tekshirildi",
    actor: "Xavfsizlik Tizimi",
    targetOrg: "Markaziy Gateway",
    timestamp: "22-Oktabr, 18:00",
    level: "success",
  },
];

export function SettingsClient() {
  const [logs, setLogs] = useState<MockAuditTrailLog[]>(ENRICHED_LOGS);
  const [searchLog, setSearchLog] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Yangi audit mavsumi holati
  const [isNewSeasonModalOpen, setIsNewSeasonModalOpen] = useState(false);
  useBodyScrollLock(isNewSeasonModalOpen);

  const [activeSeason, setActiveSeason] = useState({
    title: "2026-yilgi Respublika OTMlari Yalpi Bahorgi Xatlovi",
    orderNumber: "№ 184-sonli Oliy Ta‘lim Vazirligi Buyrug‘i",
    startDate: "2026-03-01",
    endDate: "2026-06-01",
    scope: "Barcha 250 ta OTM",
    status: "in_progress",
    progress: 78.4,
    scannedAssets: 1444520,
    totalAssets: 1842500,
  });

  // Yangi mavsum formasi
  const [newSeasonTitle, setNewSeasonTitle] = useState("");
  const [newSeasonOrder, setNewSeasonOrder] = useState("");
  const [newSeasonStart, setNewSeasonStart] = useState("");
  const [newSeasonEnd, setNewSeasonEnd] = useState("");
  const [requireQrCheck, setRequireQrCheck] = useState(true);
  const [requirePhotoProof, setRequirePhotoProof] = useState(true);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateSeason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonTitle || !newSeasonStart || !newSeasonEnd) return;

    setActiveSeason({
      title: newSeasonTitle,
      orderNumber: newSeasonOrder || "Vazirlik Farmoyishi",
      startDate: newSeasonStart,
      endDate: newSeasonEnd,
      scope: "Barcha 250 ta OTM",
      status: "in_progress",
      progress: 0,
      scannedAssets: 0,
      totalAssets: 1842500,
    });

    const newLogEntry: MockAuditTrailLog = {
      id: `log-${Date.now()}`,
      event: "NATIONAL_AUDIT_SEASON_UPDATED",
      title: `Yangi xatlov mavsumi e‘lon qilindi: "${newSeasonTitle}"`,
      actor: "Superadmin - Oliy Ta‘lim Vazirligi",
      targetOrg: "Barcha 250 ta OTM",
      timestamp: "Hozirgina",
      level: "success",
    };

    setLogs([newLogEntry, ...logs]);
    setIsNewSeasonModalOpen(false);
    showNotification("Yangi audit mavsumi e‘lon qilindi");
    setNewSeasonTitle("");
    setNewSeasonOrder("");
  };

  // Loglarni filtrlash
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchLog.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        log.title.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.targetOrg.toLowerCase().includes(q) ||
        log.event.toLowerCase().includes(q);

      const matchesLevel =
        selectedLevel === "all" || log.level === selectedLevel;

      return matchesSearch && matchesLevel;
    });
  }, [logs, searchLog, selectedLevel]);

  // Sahifalash
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const currentLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleExportLogs = (format: "csv" | "json") => {
    showNotification(`Xavfsizlik jurnali ${format.toUpperCase()} shaklida yuklab olindi`);
  };

  const handleSecurityAudit = () => {
    showNotification("Barcha 250 ta OTM bilan aloqa xavfsiz TLS 1.3 protokoli orqali tekshirildi");
  };

  const handleBackupSnapshot = () => {
    showNotification("Platforma ma‘lumotlar bazasi zaxira nusxasi muvaffaqiyatli yaratildi");
  };

  const handleClearCache = () => {
    showNotification("Tizim kesh xotirasi muvaffaqiyatli yangilandi");
  };

  return (
    <div className="space-y-6">
      {/* Toast bildirishnoma */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tezkor Amallar Tugmalari */}
      <div className="flex flex-wrap items-center justify-end gap-2 pb-3 border-b border-slate-200/80">
          <button
            type="button"
            onClick={handleSecurityAudit}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tekshiruv</span>
          </button>

          <button
            type="button"
            onClick={handleBackupSnapshot}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4 text-blue-600" />
            <span>Zaxira</span>
          </button>

          <button
            type="button"
            onClick={handleClearCache}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Kesh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewSeasonModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi mavsum</span>
          </button>
      </div>

      {/* 4 ta Asosiy Ko'rsatkich Kartalari */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Xavfsizlik
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1.5 tracking-tight">
            Himoyalangan
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Xatlov Ijrosi
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1.5 tracking-tight">
            {activeSeason.progress}%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Audit Jurnali
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
            {logs.length} ta qayd
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Oxirgi Zaxira
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
            Bugun, 04:00
          </div>
        </div>
      </div>

      {/* 1. Amaldagi Xatlov Mavsumi Kartasi */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {activeSeason.title}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Faol
            </span>
          </div>
          <div className="text-xs text-slate-600 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {activeSeason.startDate} &mdash; {activeSeason.endDate}
            </span>
          </div>
        </div>

        {/* Xatlov ma'lumotlari */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              Hujjat
            </span>
            <span className="text-xs font-bold text-slate-800 mt-1 block">
              {activeSeason.orderNumber}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              Qamrov
            </span>
            <span className="text-xs font-bold text-slate-800 mt-1 block">
              {activeSeason.scope}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">
              Skanerlandi
            </span>
            <span className="text-xs font-bold text-blue-600 mt-1 block">
              {activeSeason.scannedAssets.toLocaleString("uz-UZ")} / {activeSeason.totalAssets.toLocaleString("uz-UZ")} ta
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Umumiy ijro
            </span>
            <span className="font-extrabold text-blue-600">
              {activeSeason.progress}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${activeSeason.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Audit Jurnali */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Audit Jurnali
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExportLogs("csv")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportLogs("json")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Filtrlash va Qidiruv */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Qidiruv */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchLog}
              onChange={(e) => {
                setSearchLog(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Qidiruv..."
              className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
            {searchLog && (
              <button
                type="button"
                onClick={() => {
                  setSearchLog("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Interaktiv Filtr Pillslari */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => {
                setSelectedLevel("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedLevel === "all"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Barchasi
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedLevel("success");
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedLevel === "success"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Muvaffaqiyatli</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedLevel("warning");
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedLevel === "warning"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Ogohlantirish</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedLevel("danger");
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedLevel === "danger"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Xavfli</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedLevel("info");
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedLevel === "info"
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Tizim</span>
            </button>
          </div>
        </div>

        {/* Loglar ro'yxati */}
        <div className="divide-y divide-slate-100">
          {currentLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600 text-xs sm:text-sm">
                Jurnal bo‘yicha mos yozuv topilmadi
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Qidiruv so‘zini o‘zgartiring yoki filtrlarni tozalang
              </p>
            </div>
          ) : (
            currentLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      log.level === "success"
                        ? "bg-emerald-500 ring-4 ring-emerald-50"
                        : log.level === "warning"
                        ? "bg-amber-500 ring-4 ring-amber-50"
                        : log.level === "danger"
                        ? "bg-rose-500 ring-4 ring-rose-50"
                        : "bg-blue-500 ring-4 ring-blue-50"
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm flex flex-wrap items-center gap-2">
                      <span>{log.title}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200/60">
                        {log.event}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        Mas‘ul: <strong className="text-slate-700 font-medium">{log.actor}</strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Nishon: <span className="text-slate-700 font-medium">{log.targetOrg}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1 sm:self-center pl-5 sm:pl-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sahifalash */}
        <div className="border-t border-slate-200/80 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Jami <strong>{filteredLogs.length}</strong> tadan{" "}
            <strong>
              {(currentPage - 1) * itemsPerPage + 1}
            </strong>{" "}
            -{" "}
            <strong>
              {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
            </strong>{" "}
            ko‘rsatilmoqda
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`p-1.5 rounded-lg border border-slate-200 transition-colors ${
                currentPage > 1
                  ? "bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
              title="Oldingi sahifa"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-slate-700 px-2">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`p-1.5 rounded-lg border border-slate-200 transition-colors ${
                currentPage < totalPages
                  ? "bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
              title="Keyingi sahifa"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. YANGI AUDIT MAVSUMINI E'LON QILISH MODALI */}
      {isNewSeasonModalOpen && (
        <div
          onClick={() => setIsNewSeasonModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95"
          >
            <div className="px-6 sm:px-7 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Yangi xatlov mavsumi
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSeasonModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                title="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSeason} className="px-6 sm:px-7 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Mavsum nomi
                </label>
                <input
                  type="text"
                  required
                  value={newSeasonTitle}
                  onChange={(e) => setNewSeasonTitle(e.target.value)}
                  placeholder="2026-yilgi OTMlar Kuzgi Xatlovi"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Hujjat raqami
                </label>
                <input
                  type="text"
                  value={newSeasonOrder}
                  onChange={(e) => setNewSeasonOrder(e.target.value)}
                  placeholder="№ 412-sonli Farmoyish"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Boshlanish sanasi
                  </label>
                  <input
                    type="date"
                    required
                    value={newSeasonStart}
                    onChange={(e) => setNewSeasonStart(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Tugash sanasi
                  </label>
                  <input
                    type="date"
                    required
                    value={newSeasonEnd}
                    onChange={(e) => setNewSeasonEnd(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-slate-900 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Majburiy Xavfsizlik Talablari
                </span>
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={requireQrCheck}
                    onChange={(e) => setRequireQrCheck(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>QR-kod bilan joyida skanerlash majburiy</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={requirePhotoProof}
                    onChange={(e) => setRequirePhotoProof(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Kamchiliklar uchun fotodalil biriktirish majburiy</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewSeasonModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Mavsum e‘lon qilish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
