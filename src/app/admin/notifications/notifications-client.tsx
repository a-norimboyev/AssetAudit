"use client";

import React, { useState, useMemo } from "react";
import {
  Megaphone,
  Plus,
  Send,
  X,
  Check,
  Trash2,
  Search,
  Building2,
} from "lucide-react";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { MOCK_UNIVERSITIES } from "@/lib/mock/superadmin-mock-data";
import { useAdminToast } from "../admin-toast-context";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  targetAudience: "all" | "single";
  sentAt: string;
  deliveredCount: number;
  targetLabel?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "1-chorak audit yakunlash muddati",
    message: "Hisobotlarni 25-martga qadar to‘liq yakunlash talab etiladi.",
    targetAudience: "all",
    targetLabel: "Barcha 250 ta OTM",
    sentAt: "Bugun, 10:30",
    deliveredCount: 250,
  },
  {
    id: "notif-2",
    title: "Yangi QR kodli yorliqlar",
    message: "Jihozlar uchun yangi namunadagi QR kodlar joriy etildi.",
    targetAudience: "all",
    targetLabel: "Barcha 250 ta OTM",
    sentAt: "25-oktyabr",
    deliveredCount: 250,
  },
  {
    id: "notif-3",
    title: "TATU moddiy balansi qayta tekshiruvi",
    message: "Kompyuter sinflari bo‘yicha inventar raqamlarini solishtirish ko‘rsatmasi.",
    targetAudience: "single",
    targetLabel: "Toshkent Axborot Texnologiyalari Universiteti",
    sentAt: "20-oktyabr",
    deliveredCount: 1,
  },
  {
    id: "notif-4",
    title: "Rejaviy profilaktika",
    message: "Shanba kuni soat 23:00 dan 04:00 gacha profilaktika ishlari olib boriladi.",
    targetAudience: "all",
    targetLabel: "Barcha 250 ta OTM",
    sentAt: "18-oktyabr",
    deliveredCount: 250,
  },
];

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showSuccessToast } = useAdminToast();

  const [searchQuery, setSearchQuery] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newTarget, setNewTarget] = useState<"all" | "single">("all");
  const [selectedUnivIds, setSelectedUnivIds] = useState<string[]>([MOCK_UNIVERSITIES[0]?.id || ""]);
  const [univSearch, setUnivSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useBodyScrollLock(isModalOpen);

  const filteredUniversities = useMemo(() => {
    const q = univSearch.toLowerCase().trim();
    if (!q) return MOCK_UNIVERSITIES;
    return MOCK_UNIVERSITIES.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        Boolean(u.shortName && u.shortName.toLowerCase().includes(q)) ||
        u.code.toLowerCase().includes(q) ||
        u.region.toLowerCase().includes(q) ||
        Boolean(u.adminName && u.adminName.toLowerCase().includes(q)) ||
        Boolean(u.type && u.type.toLowerCase().includes(q))
    );
  }, [univSearch]);

  const selectedUnivs = useMemo(
    () => MOCK_UNIVERSITIES.filter((u) => selectedUnivIds.includes(u.id)),
    [selectedUnivIds]
  );

  const toggleUnivSelection = (id: string) => {
    setSelectedUnivIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const removeUnivSelection = (id: string) => {
    setSelectedUnivIds((prev) => prev.filter((item) => item !== id));
  };

  const clearAllUnivSelection = () => {
    setSelectedUnivIds([]);
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    if (newTarget === "single" && selectedUnivIds.length === 0) {
      alert("Kamida bitta OTMni tanlang");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      let targetLabel: string | undefined = undefined;
      if (newTarget === "single") {
        if (selectedUnivs.length === 1) {
          targetLabel = selectedUnivs[0]?.name || "1 ta universitet";
        } else {
          targetLabel = `${selectedUnivs.length} ta universitetga yuborildi`;
        }
      } else {
        targetLabel = "Barcha 250 ta OTM";
      }

      const created: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: newTitle.trim(),
        message: newMessage.trim(),
        targetAudience: newTarget,
        sentAt: "Hozir",
        deliveredCount: newTarget === "all" ? 250 : selectedUnivIds.length,
        targetLabel,
      };

      setNotifications([created, ...notifications]);
      setIsSubmitting(false);
      setIsModalOpen(false);
      setNewTitle("");
      setNewMessage("");
      showSuccessToast("Muvaffaqiyatli o'zgartirildi");
    }, 250);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showSuccessToast("Muvaffaqiyatli o'zgartirildi");
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        Boolean(item.targetLabel && item.targetLabel.toLowerCase().includes(q))
      );
    });
  }, [notifications, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Qidiruv va Yangi xabar tugmasi (bitta qatorda) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Xabarnomalar bo'yicha qidirish..."
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-2xs transition-all"
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

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi xabar</span>
        </button>
      </div>

      {/* Xabarnomalar ro'yxati */}
      {filteredNotifications.length === 0 ? (
        <div className="p-8 sm:p-12 rounded bg-white border border-slate-200/80 text-center shadow-2xs">
          <div className="w-12 h-12 rounded bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3.5 border border-blue-100">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Xabarnomalar topilmadi
          </h3>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi xabar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs transition-all flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 bg-blue-50 text-blue-600">
                  <Megaphone className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {item.title}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      {item.sentAt}
                    </span>

                    <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {item.targetLabel ? item.targetLabel : `${item.deliveredCount} ta OTM`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteNotification(item.id)}
                className="p-1 rounded text-slate-300 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                title="O'chirish"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Yangi xabar modali — Ixcham, qulay va toza oyna */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded max-w-4xl xl:max-w-5xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 my-auto">
            {/* Oyna sarlavhasi */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Yangi Xabar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                title="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Chap tomon: Xabar sarlavhasi va Xabar matni */}
                <div className="lg:col-span-6 space-y-3 flex flex-col h-full">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
                      Xabar sarlavhasi
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Xabar sarlavhasi..."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1 flex-1 flex flex-col">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
                      Xabar matni
                    </label>
                    <textarea
                      required
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Xabar matnini kiriting..."
                      className="w-full flex-1 px-3.5 py-2.5 rounded border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none transition-all leading-relaxed font-medium min-h-[260px] lg:min-h-[290px]"
                    />
                  </div>
                </div>

                {/* O'ng tomon: Qabul qiluvchilar tanlovi */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
                      Qabul qiluvchilar
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setNewTarget("all")}
                        className={`p-3 rounded border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          newTarget === "all"
                            ? "border-blue-600 bg-blue-50/70 shadow-xs"
                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                            newTarget === "all" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            Barcha 250 ta OTM
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 ${
                          newTarget === "all" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {newTarget === "all" && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewTarget("single")}
                        className={`p-3 rounded border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          newTarget === "single"
                            ? "border-blue-600 bg-blue-50/70 shadow-xs"
                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                            newTarget === "single" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            Tanlangan OTMlar
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 ${
                          newTarget === "single" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {newTarget === "single" && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {newTarget === "all" ? (
                    <div className="p-6 rounded bg-blue-50/60 border border-blue-100 flex flex-col justify-center items-center text-center space-y-2.5 min-h-[260px] lg:min-h-[290px]">
                      <div className="w-12 h-12 rounded bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Barcha 250 ta OTM
                      </h4>
                    </div>
                  ) : (
                    <div className="space-y-2.5 p-3.5 sm:p-4 rounded bg-slate-50/80 border border-slate-200 flex flex-col min-h-[260px] lg:min-h-[290px]">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-800">
                            Kerakli OTMlarni tanlang
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            {selectedUnivIds.length} ta tanlandi
                          </span>
                        </div>

                        {selectedUnivIds.length > 0 && (
                          <button
                            type="button"
                            onClick={clearAllUnivSelection}
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                          >
                            Tozalash
                          </button>
                        )}
                      </div>

                      {/* Tanlangan OTMlar teglari */}
                      {selectedUnivs.length > 0 && (
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1.5 bg-white rounded border border-slate-200/80 shadow-2xs">
                          {selectedUnivs.map((u) => (
                            <span
                              key={u.id}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold"
                            >
                              <span className="truncate max-w-[140px]">{u.shortName || u.name}</span>
                              <button
                                type="button"
                                onClick={() => removeUnivSelection(u.id)}
                                className="text-blue-400 hover:text-blue-700 p-0.5 cursor-pointer shrink-0"
                                title="O'chirish"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Qidirish */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={univSearch}
                          onChange={(e) => setUnivSearch(e.target.value)}
                          placeholder="OTM nomi bo'yicha qidirish..."
                          className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-2xs transition-all font-medium"
                        />
                        {univSearch && (
                          <button
                            type="button"
                            onClick={() => setUnivSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Skrollanuvchi ro'yxat */}
                      <div className="flex-1 max-h-[190px] overflow-y-auto space-y-1 bg-white rounded border border-slate-200 p-1.5 shadow-2xs">
                        {filteredUniversities.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-500 font-medium">
                            Bunday OTM topilmadi
                          </div>
                        ) : (
                          filteredUniversities.slice(0, 60).map((u) => {
                            const isSelected = selectedUnivIds.includes(u.id);
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => toggleUnivSelection(u.id)}
                                className={`w-full px-3 py-2 rounded text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 border ${
                                  isSelected
                                    ? "bg-blue-50/90 text-blue-900 border-blue-300 shadow-2xs"
                                    : "hover:bg-slate-50/80 text-slate-800 border-slate-100"
                                }`}
                              >
                                <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                  {u.name}
                                </span>

                                <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pastki tugmalar */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Yuborilmoqda..." : "Yuborish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
