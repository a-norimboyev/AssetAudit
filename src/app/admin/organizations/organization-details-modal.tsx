"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  UserCheck,
  Phone,
  Check,
  Copy,
  X,
  Hourglass,
  Loader2,
  Snowflake,
  CheckCircle2,
  TrendingUp,
  Save,
  Building2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  KeyRound,
  Shield,
  Lock,
  RefreshCw,
  UserPlus,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import type { OrganizationListItem, OrganizationTypeOption } from "@/lib/data/organizations";
import {
  toggleOrganizationStatusAction,
  updateOrganizationAction,
  resetOrganizationAdminPasswordAction,
  createOrAssignOrganizationAdminAction,
  deleteOrganizationAction,
} from "./actions";
import { useAdminToast } from "../admin-toast-context";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"
];

function formatUzbekDate(date?: Date | string | null, includeTime = false): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const day = d.getDate();
  const month = UZ_MONTHS[d.getMonth()] || "";
  const year = d.getFullYear();
  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}-${month}, ${year} ${hours}:${minutes}`;
  }
  return `${day}-${month}, ${year}`;
}

const EXTEND_PRESETS = [
  { id: "1_month", label: "+1 oy", months: 1 },
  { id: "3_months", label: "+3 oy", months: 3 },
  { id: "6_months", label: "+6 oy", months: 6 },
  { id: "1_year", label: "+1 yil", years: 1 },
  { id: "2_years", label: "+2 yil", years: 2 },
  { id: "3_years", label: "+3 yil", years: 3 },
];

const LIMIT_PRESETS = [100, 250, 500, 1000, 2000, 5000];

export type TabKey = "overview" | "admin" | "license" | "limit";

interface OrganizationDetailsModalProps {
  organization: OrganizationListItem;
  types?: OrganizationTypeOption[];
  trigger?: React.ReactNode;
  initialTab?: TabKey;
}

function generateRandomSecurePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let pwd = "";
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export function OrganizationDetailsModal({
  organization,
  trigger,
  initialTab = "overview",
}: OrganizationDetailsModalProps) {
  const router = useRouter();
  const { showSuccessToast } = useAdminToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  useBodyScrollLock(isOpen);

  // Har safar modal ochilganda initialTab bilan sinxronlash
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Status boshqaruvi (Faol / Muzlatilgan)
  const [isActive, setIsActive] = useState(organization.isActive);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Administrator ma'lumotlari
  const [adminName, setAdminName] = useState(organization.admin?.name || "");
  const [adminPhone, setAdminPhone] = useState(organization.admin?.phone || organization.settings?.adminPhone || "");
  const [adminLogin, setAdminLogin] = useState(
    organization.admin?.username || organization.admin?.email || ""
  );
  const [adminUserId, setAdminUserId] = useState(organization.admin?.userId || "");
  const [hasAdmin, setHasAdmin] = useState(Boolean(organization.admin || organization.settings?.adminName));

  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);

  // Parolni tiklash (Reset password) holatlari
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isSavingPasswordReset, setIsSavingPasswordReset] = useState(false);
  const [resetSuccessData, setResetSuccessData] = useState<{
    temporaryPassword: string;
    username: string;
  } | null>(null);
  const [copiedResetPassword, setCopiedResetPassword] = useState(false);
  const [copiedAllCredentials, setCopiedAllCredentials] = useState(false);

  // Yangi administrator biriktirish holati (agar admin mavjud bo'lmasa)
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [newAdminFullName, setNewAdminFullName] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isSavingNewAdmin, setIsSavingNewAdmin] = useState(false);

  // Litsenziya muddati boshqaruvi
  const [currentExpiresAt, setCurrentExpiresAt] = useState<Date>(
    new Date(organization.subscription.expiresAt)
  );
  const [selectedExtendPlan, setSelectedExtendPlan] = useState<string>("1_year");
  const [customDate, setCustomDate] = useState<string>("");
  const [isSavingLicense, setIsSavingLicense] = useState(false);

  // Aktivlar balansi limiti boshqaruvi
  const [currentLimitMlrd, setCurrentLimitMlrd] = useState<number>(
    organization.assetUsage?.limitMlrd || organization.settings?.assetLimitMlrd || 500
  );
  const [limitInput, setLimitInput] = useState<number>(
    organization.assetUsage?.limitMlrd || organization.settings?.assetLimitMlrd || 500
  );
  const [isSavingLimit, setIsSavingLimit] = useState(false);

  // GitHub-style OTMni butunlay o'chirish holatlari
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copiedName, setCopiedName] = useState(false);

  async function handleDeleteOrganization() {
    if (deleteConfirmationText.trim().toLowerCase() !== organization.name.trim().toLowerCase()) {
      setDeleteError("OTM nomi to‘g‘ri ko‘chirilmagan. Iltimos, OTM nomini aynan yozing.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteOrganizationAction(organization.id, deleteConfirmationText.trim());
      if (res.success) {
        showSuccessToast("OTM va unga bog‘liq barcha ma'lumotlar muvaffaqiyatli o‘chirildi");
        setShowDeleteModal(false);
        setIsOpen(false);
        router.refresh();
      } else {
        setDeleteError(res.error || "O‘chirishda xatolik yuz berdi.");
      }
    } catch {
      setDeleteError("Server bilan bog‘lanishda xatolik yuz berdi.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Hisoblangan muddat va kunlar
  const today = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((currentExpiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  function getCalculatedTargetDate(): Date {
    const base = currentExpiresAt.getTime() < today.getTime() ? today : currentExpiresAt;
    const target = new Date(base);
    if (selectedExtendPlan === "custom" && customDate) {
      return new Date(customDate);
    }
    const preset = EXTEND_PRESETS.find((p) => p.id === selectedExtendPlan);
    if (preset?.years) {
      target.setFullYear(target.getFullYear() + preset.years);
    } else if (preset?.months) {
      target.setMonth(target.getMonth() + preset.months);
    } else {
      target.setFullYear(target.getFullYear() + 1);
    }
    return target;
  }

  // 1. Muzlatish / Faollashtirish
  async function handleToggleStatus() {
    if (isTogglingStatus) return;
    const nextState = !isActive;
    const confirmMsg = nextState
      ? `"${organization.name}" OTMini faollashtirmoqchimisiz?`
      : `"${organization.name}" OTMini muzlatilgan holatga o'tkazmoqchimisiz?`;

    if (!confirm(confirmMsg)) return;

    setIsTogglingStatus(true);
    try {
      const res = await toggleOrganizationStatusAction(organization.id, nextState);
      if (res.success) {
        setIsActive(nextState);
        showSuccessToast("Muvaffaqiyatli o'zgartirildi");
        router.refresh();
      } else {
        alert(res.error || "Holatni o'zgartirishda xatolik yuz berdi.");
      }
    } catch {
      alert("Server bilan aloqa uzildi.");
    } finally {
      setIsTogglingStatus(false);
    }
  }

  // 2. Litsenziyani uzaytirish
  async function handleSaveLicenseExtension() {
    if (isSavingLicense) return;
    setIsSavingLicense(true);
    const target = getCalculatedTargetDate();
    const preset = EXTEND_PRESETS.find((p) => p.id === selectedExtendPlan);
    const note = preset ? `${preset.label.replace("+", "")} dostup` : "Uzaytirilgan dostup";

    try {
      const res = await updateOrganizationAction({
        id: organization.id,
        name: organization.name,
        subscriptionPlan: selectedExtendPlan,
        subscriptionExpiresAt: target.toISOString(),
        subscriptionNotes: note,
      });

      if (res.success) {
        setCurrentExpiresAt(target);
        showSuccessToast("Muvaffaqiyatli o'zgartirildi");
        router.refresh();
      } else {
        alert(res.error || "Litsenziyani uzaytirishda xatolik yuz berdi.");
      }
    } catch {
      alert("Server bilan aloqa uzildi.");
    } finally {
      setIsSavingLicense(false);
    }
  }

  // 3. Aktiv limitini uzaytirish / oshirish
  async function handleSaveLimit(newLimitValue: number) {
    if (isSavingLimit || newLimitValue <= 0) return;
    setIsSavingLimit(true);
    try {
      const res = await updateOrganizationAction({
        id: organization.id,
        name: organization.name,
        assetLimitMlrd: newLimitValue,
      });

      if (res.success) {
        setCurrentLimitMlrd(newLimitValue);
        setLimitInput(newLimitValue);
        showSuccessToast("Muvaffaqiyatli o'zgartirildi");
        router.refresh();
      } else {
        alert(res.error || "Limitni yangilashda xatolik yuz berdi.");
      }
    } catch {
      alert("Server bilan aloqa uzildi.");
    } finally {
      setIsSavingLimit(false);
    }
  }

  // 4. Administrator ma'lumotlarini tahrirlash (F.I.Sh. va telefon)
  async function handleSaveAdmin() {
    if (isSavingAdmin) return;
    setIsSavingAdmin(true);
    try {
      const res = await updateOrganizationAction({
        id: organization.id,
        name: organization.name,
        adminName: adminName.trim(),
        adminPhone: adminPhone.trim(),
      });

      if (res.success) {
        showSuccessToast("Muvaffaqiyatli o'zgartirildi");
        router.refresh();
      } else {
        alert(res.error || "Administratorni yangilashda xatolik yuz berdi.");
      }
    } catch {
      alert("Server bilan aloqa uzildi.");
    } finally {
      setIsSavingAdmin(false);
    }
  }

  // 5. Administrator parolini qayta tiklash
  async function handleExecuteResetPassword() {
    if (isSavingPasswordReset) return;
    setIsSavingPasswordReset(true);
    try {
      const res = await resetOrganizationAdminPasswordAction({
        organizationId: organization.id,
        userId: adminUserId || undefined,
        customPassword: newPasswordInput.trim() || undefined,
      });

      if (res.success && res.temporaryPassword) {
        setResetSuccessData({
          temporaryPassword: res.temporaryPassword,
          username: res.username || adminLogin,
        });
        showSuccessToast("Muvaffaqiyatli o'zgartirildi");
        router.refresh();
      } else {
        alert(res.error || "Parolni tiklashda xatolik yuz berdi.");
      }
    } catch {
      alert("Server bilan aloqa uzildi.");
    } finally {
      setIsSavingPasswordReset(false);
    }
  }

  // 6. Yangi administrator biriktirish
  async function handleCreateNewAdmin() {
    if (isSavingNewAdmin) return;
    if (!newAdminFullName.trim() || !newAdminUsername.trim()) {
      alert("Administrator F.I.Sh. va loginini kiritish majburiydir.");
      return;
    }
    setIsSavingNewAdmin(true);
    try {
      const res = await createOrAssignOrganizationAdminAction({
        organizationId: organization.id,
        fullName: newAdminFullName.trim(),
        username: newAdminUsername.trim(),
        phone: newAdminPhone.trim(),
        password: newAdminPassword.trim() || undefined,
      });

      if (res.success && res.credentials) {
        setAdminName(res.credentials.fullName);
        setAdminPhone(newAdminPhone.trim());
        setAdminLogin(res.credentials.username);
        setHasAdmin(true);
        setResetSuccessData({
          temporaryPassword: res.credentials.temporaryPassword,
          username: res.credentials.username,
        });
        setIsCreateAdminOpen(false);
        showSuccessToast("Muvaffaqiyatli o'zgartirildi");
        router.refresh();
      } else {
        alert(res.error || "Administrator yaratishda xatolik yuz berdi.");
      }
    } catch {
      alert("Server bilan aloqa uzildi.");
    } finally {
      setIsSavingNewAdmin(false);
    }
  }

  function handleCopyPhone() {
    if (!adminPhone) return;
    navigator.clipboard.writeText(adminPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  }

  function handleCopyLogin() {
    if (!adminLogin) return;
    navigator.clipboard.writeText(adminLogin);
    setCopiedLogin(true);
    setTimeout(() => setCopiedLogin(false), 2000);
  }

  function handleCopyAllCredentials(pwd: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = `AssetAudit — OTM Administratori Kirish Ma'lumotlari:\nOTM: ${organization.name}\nAdmin logini: ${adminLogin || "admin"}\nYangi parol: ${pwd}\nKirish manzili: ${origin}/login`;
    navigator.clipboard.writeText(text);
    setCopiedAllCredentials(true);
    setTimeout(() => setCopiedAllCredentials(false), 2000);
  }

  const targetDatePreview = getCalculatedTargetDate();

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-left font-semibold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer group"
        >
          {organization.name}
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overscroll-contain">
          <div
            className="w-full max-w-5xl lg:max-w-6xl bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-white border-b border-slate-200 px-6 pt-6 pb-0 sm:px-7">
              {/* Yuqori qator: OTM nomi, logotipi, holati va tezkor amallar */}
              <div className="flex items-center justify-between gap-4 pb-5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-13 h-13 rounded-2xl bg-slate-100 text-blue-700 flex items-center justify-center text-base font-bold shadow-xs shrink-0 overflow-hidden border border-slate-200">
                    {organization.settings?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={organization.settings.logoUrl}
                        alt={organization.name}
                        className="w-full h-full object-contain p-1.5 bg-white"
                      />
                    ) : (
                      organization.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                        {organization.name}
                      </h2>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Faol</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>Muzlatilgan</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Muzlatish / O‘chirish va Yopish tugmalari */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={isTogglingStatus}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                      isActive
                        ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 shadow-2xs"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs"
                    }`}
                    title={isActive ? "OTMni muzlatish" : "OTMni qayta faollashtirish"}
                  >
                    {isTogglingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isActive ? (
                      <Snowflake className="w-4 h-4 text-amber-700" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                    <span>{isActive ? "Muzlatish" : "Faollashtirish"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmationText("");
                      setDeleteError(null);
                      setShowDeleteModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer shadow-2xs"
                    title="OTMni butunlay o‘chirish"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>O‘chirish</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Yopish"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* PASTKI UZUN CHIZIQLI TAB NAVIGATSIYA */}
              <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto scrollbar-none -mb-px">
                {/* 1. OTM ma'lumotlari */}
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`group relative inline-flex items-center gap-2 pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "overview"
                      ? "text-blue-600 border-blue-600"
                      : "text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300"
                  }`}
                >
                  <Building2
                    className={`w-4 h-4 transition-colors ${
                      activeTab === "overview"
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>OTM ma&apos;lumotlari</span>
                </button>

                {/* 2. Administrator (Tepada ustuvor qilib joylashtirildi) */}
                <button
                  type="button"
                  onClick={() => setActiveTab("admin")}
                  className={`group relative inline-flex items-center gap-2 pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "admin"
                      ? "text-blue-600 border-blue-600"
                      : "text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300"
                  }`}
                >
                  <User
                    className={`w-4 h-4 transition-colors ${
                      activeTab === "admin"
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>Administrator</span>
                </button>

                {/* 3. Litsenziyani uzaytirish */}
                <button
                  type="button"
                  onClick={() => setActiveTab("license")}
                  className={`group relative inline-flex items-center gap-2 pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "license"
                      ? "text-blue-600 border-blue-600"
                      : "text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300"
                  }`}
                >
                  <Hourglass
                    className={`w-4 h-4 transition-colors ${
                      activeTab === "license"
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>Litsenziyani uzaytirish</span>
                </button>

                {/* 4. Limitni oshirish */}
                <button
                  type="button"
                  onClick={() => setActiveTab("limit")}
                  className={`group relative inline-flex items-center gap-2 pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "limit"
                      ? "text-blue-600 border-blue-600"
                      : "text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300"
                  }`}
                >
                  <TrendingUp
                    className={`w-4 h-4 transition-colors ${
                      activeTab === "limit"
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>Limitni oshirish</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Bosilgan tugmaga mos ma'lumotlar chiqishi */}
            <div className="p-6 sm:p-7 overflow-y-auto flex-1 overscroll-contain">
              {/* ======================================================== */}
              {/* TAB 1: UMUMIY OTM MA'LUMOTLARI                           */}
              {/* ======================================================== */}
              {activeTab === "overview" && (
                <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
                  {/* 1. OTM MAS'UL ADMINISTRATORI KARTASI (Birinchi o'ringa ko'chirildi) */}
                  <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                      <div className="flex items-center gap-2.5">
                        <UserCheck className="w-4.5 h-4.5 text-blue-600" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                          OTM Mas&apos;ul Administratori
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        {hasAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsResetPasswordOpen(!isResetPasswordOpen);
                              setResetSuccessData(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            <span>Parolni tiklash</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveTab("admin")}
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          <span>Boshqarish</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {hasAdmin ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs sm:text-sm">
                        {/* Ism va familiyasi */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-slate-400 block">
                              Ism va familiyasi
                            </span>
                            <span className="font-bold text-slate-900 truncate block mt-0.5 text-sm sm:text-base">
                              {adminName || "Kiritilmagan"}
                            </span>
                          </div>
                        </div>

                        {/* Kirish logini */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                              <Shield className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-slate-400 block">
                                Kirish logini
                              </span>
                              <span className="font-mono font-bold text-slate-900 truncate block mt-0.5 text-sm sm:text-base">
                                {adminLogin || "admin"}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleCopyLogin}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                            title="Loginni nusxalash"
                          >
                            {copiedLogin ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Telefon raqami */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                              <Phone className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-slate-400 block">
                                Telefon raqami
                              </span>
                              {adminPhone ? (
                                <a
                                  href={`tel:${adminPhone.replace(/[^+\d]/g, "")}`}
                                  className="font-mono font-bold text-slate-900 hover:text-blue-600 transition-colors block mt-0.5 text-sm sm:text-base"
                                >
                                  {adminPhone}
                                </a>
                              ) : (
                                <span className="text-slate-400 font-medium block mt-0.5 text-sm">
                                  Kiritilmagan
                                </span>
                              )}
                            </div>
                          </div>

                          {adminPhone && (
                            <button
                              type="button"
                              onClick={handleCopyPhone}
                              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                              title="Telefon raqamidan nusxa olish"
                            >
                              {copiedPhone ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                        <div className="text-xs text-amber-800">
                          Ushbu OTM uchun hali mas&apos;ul administrator biriktirilmagan.
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("admin")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Yangi administrator yaratish</span>
                        </button>
                      </div>
                    )}

                    {/* Tezkor Parol Tiklash Paneli (Overview ichida) */}
                    {isResetPasswordOpen && (
                      <div className="p-4 sm:p-5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-amber-600" />
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              Administrator parolini qayta tiklash
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsResetPasswordOpen(false);
                              setResetSuccessData(null);
                            }}
                            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Yopish
                          </button>
                        </div>

                        {!resetSuccessData ? (
                          <div className="space-y-3">
                            <p className="text-xs text-slate-600">
                              Yangi vaqtinchalik parol tizim tomonidan xavfsiz generatsiya qilinadi yoki o&apos;zingiz kiritishingiz mumkin:
                            </p>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                              <div className="relative flex-1">
                                <input
                                  type={showPasswordText ? "text" : "password"}
                                  value={newPasswordInput}
                                  onChange={(e) => setNewPasswordInput(e.target.value)}
                                  placeholder="Yangi parol (bo'sh qolsa, avtomatik yaratiladi)"
                                  className="w-full pl-3.5 pr-20 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setNewPasswordInput(generateRandomSecurePassword())}
                                    className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                                    title="Tasodifiy parol generatsiya qilish"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswordText(!showPasswordText)}
                                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                  >
                                    {showPasswordText ? (
                                      <EyeOff className="w-3.5 h-3.5" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleExecuteResetPassword}
                                disabled={isSavingPasswordReset}
                                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isSavingPasswordReset ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <KeyRound className="w-4 h-4" />
                                )}
                                <span>Parolni yangilash</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 space-y-3">
                            <div className="flex items-center gap-2 font-bold text-emerald-800">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              <span>Parol muvaffaqiyatli yangilandi!</span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg bg-white border border-emerald-200">
                              <div>
                                <span className="text-[11px] font-semibold text-slate-400 block">
                                  Admin logini: <strong>{resetSuccessData.username}</strong>
                                </span>
                                <span className="text-xs text-slate-600">Yangi parol:</span>
                                <span className="font-mono font-bold text-base text-slate-900 ml-2">
                                  {resetSuccessData.temporaryPassword}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(resetSuccessData.temporaryPassword);
                                    setCopiedResetPassword(true);
                                    setTimeout(() => setCopiedResetPassword(false), 2000);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                                >
                                  {copiedResetPassword ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                  <span>Parolni nusxalash</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyAllCredentials(resetSuccessData.temporaryPassword)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
                                >
                                  {copiedAllCredentials ? (
                                    <Check className="w-3.5 h-3.5" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                  <span>Barchasini nusxalash</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Litsenziya holati kartasi */}
                  <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Hourglass className="w-4.5 h-4.5 text-blue-600" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                          Litsenziya muddati
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                          daysRemaining > 30
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : daysRemaining > 0
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {daysRemaining > 0 ? `${daysRemaining} kun qoldi` : "Muddati tugagan"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs sm:text-sm">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-xs">Reja / Tarif:</span>
                        <span className="font-bold text-slate-900 mt-1 block text-sm sm:text-base">
                          {organization.subscription.planLabel || "1 yillik dostup"}
                        </span>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-xs">Amal qilish sanasi:</span>
                        <span className="font-bold text-slate-900 mt-1 block text-sm sm:text-base">
                          {formatUzbekDate(currentExpiresAt)} gacha
                        </span>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                        <div>
                          <span className="text-blue-600 block text-xs font-semibold">
                            Qolgan vaqt:
                          </span>
                          <span className="font-mono font-bold text-blue-900 mt-0.5 block text-base sm:text-lg">
                            {daysRemaining} kun
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("license")}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          <span>Uzaytirish</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Aktivlar balansi limiti kartasi */}
                  <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                          Aktivlar balansi limiti
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("limit")}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                      >
                        <span>Limitni oshirish</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-xs font-medium text-slate-400 block">
                          Joriy belgilangan limit:
                        </span>
                        <span className="font-mono text-lg sm:text-xl font-bold text-slate-900 mt-1 block">
                          {currentLimitMlrd >= 1000
                            ? `${currentLimitMlrd / 1000} trln so‘m`
                            : `${currentLimitMlrd} mlrd so‘m`}
                        </span>
                      </div>

                      <div className="flex-1 max-w-sm">
                        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                          <span>Ishlatilish holati</span>
                          <span className="text-blue-600 font-bold">
                            {organization.assetUsage?.usedPercent ?? 0}% to‘ldi
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{
                              width: `${Math.min(100, organization.assetUsage?.usedPercent ?? 0)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: ADMINISTRATOR BOSHQARUVI                            */}
              {/* ======================================================== */}
              {activeTab === "admin" && (
                <div className="p-6 sm:p-7 rounded-2xl border border-blue-200/80 bg-blue-50/30 space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-4 border-b border-blue-200/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          OTM Mas&apos;ul Administratori Boshqaruvi
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500">
                          Universitet boshqaruvchisi akkaunti, kirish logini va parolni tiklash
                        </p>
                      </div>
                    </div>

                    {hasAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetPasswordOpen(!isResetPasswordOpen);
                          setResetSuccessData(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Parolni tiklash</span>
                      </button>
                    )}
                  </div>

                  {hasAdmin ? (
                    <div className="space-y-5">
                      {/* 1. Asosiy ma'lumotlar formasi */}
                      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-blue-200/70 shadow-2xs space-y-5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                          Aloqa va profil ma&apos;lumotlari
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
                              Ism va familiyasi
                            </label>
                            <input
                              type="text"
                              value={adminName}
                              onChange={(e) => setAdminName(e.target.value)}
                              placeholder="Azizjon Norimboyev"
                              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
                              Kirish logini (Tizimga kirish uchun)
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                readOnly
                                value={adminLogin || "admin"}
                                className="w-full pl-4 pr-11 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono font-bold select-all"
                              />
                              <button
                                type="button"
                                onClick={handleCopyLogin}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Loginni nusxalash"
                              >
                                {copiedLogin ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
                              Telefon raqami
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={adminPhone}
                                onChange={(e) => setAdminPhone(e.target.value)}
                                placeholder="+998 90 123 45 67"
                                className="w-full pl-4 pr-11 py-3 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono font-medium"
                              />
                              {adminPhone && (
                                <button
                                  type="button"
                                  onClick={handleCopyPhone}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Telefonni nusxalash"
                                >
                                  {copiedPhone ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={handleSaveAdmin}
                            disabled={isSavingAdmin}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isSavingAdmin ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            <span>Ma&apos;lumotlarni saqlash</span>
                          </button>
                        </div>
                      </div>

                      {/* 2. Parolni tiklash (Reset Password) Paneli */}
                      <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-4.5 h-4.5 text-amber-600" />
                            <h4 className="text-sm font-bold text-slate-900">
                              Parolni qayta tiklash (Parol esdan chiqqanda)
                            </h4>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            Admin logini: <strong className="font-mono text-slate-800">{adminLogin || "admin"}</strong>
                          </span>
                        </div>

                        {!resetSuccessData ? (
                          <div className="space-y-4">
                            <p className="text-xs sm:text-sm text-slate-600">
                              Agar universitet administratori parolini esdan chiqargan bo&apos;lsa, bu yerda yangi vaqtinchalik parol o&apos;rnatib berishingiz mumkin. Avvalgi barcha faol sessiyalar xavfsizlik uchun darhol bekor qilinadi.
                            </p>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              <div className="relative flex-1">
                                <input
                                  type={showPasswordText ? "text" : "password"}
                                  value={newPasswordInput}
                                  onChange={(e) => setNewPasswordInput(e.target.value)}
                                  placeholder="Yangi parol (ixtiyoriy, bo'sh qolsa xavfsiz parol yaratiladi)"
                                  className="w-full pl-4 pr-24 py-3 text-sm font-mono font-bold rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                                />
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setNewPasswordInput(generateRandomSecurePassword())}
                                    className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"
                                    title="Tasodifiy kuchli parol generatsiya qilish"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswordText(!showPasswordText)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                  >
                                    {showPasswordText ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleExecuteResetPassword}
                                disabled={isSavingPasswordReset}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isSavingPasswordReset ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <KeyRound className="w-4 h-4" />
                                )}
                                <span>Parolni tiklash va saqlash</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-4">
                            <div className="flex items-center gap-2.5 font-bold text-sm sm:text-base text-emerald-800">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              <span>Administrator paroli muvaffaqiyatli yangilandi!</span>
                            </div>

                            <div className="p-4 rounded-xl bg-white border border-emerald-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                              <div>
                                <span className="text-xs text-slate-400 block font-medium">
                                  Admin logini: <strong className="text-slate-800 font-mono">{resetSuccessData.username}</strong>
                                </span>
                                <span className="text-xs text-slate-400 block font-medium mt-1">
                                  Yangi o&apos;rnatilgan parol:
                                </span>
                                <span className="font-mono font-bold text-lg text-slate-900 block mt-0.5">
                                  {resetSuccessData.temporaryPassword}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(resetSuccessData.temporaryPassword);
                                    setCopiedResetPassword(true);
                                    setTimeout(() => setCopiedResetPassword(false), 2000);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 transition-colors cursor-pointer"
                                >
                                  {copiedResetPassword ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                  <span>Parolni nusxalash</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyAllCredentials(resetSuccessData.temporaryPassword)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                                >
                                  {copiedAllCredentials ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                  <span>Barcha ma&apos;lumotlarni nusxalash</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Administrator mavjud bo'lmaganda yaratish paneli */
                    <div className="p-6 rounded-2xl bg-white border border-blue-200/80 shadow-2xs space-y-5">
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Yangi Mas&apos;ul Administrator Biriktirish
                          </h4>
                          <p className="text-xs text-slate-500">
                            Universitet uchun boshqaruvchi hisobini shakllantiring
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Ism va familiyasi *
                          </label>
                          <input
                            type="text"
                            value={newAdminFullName}
                            onChange={(e) => setNewAdminFullName(e.target.value)}
                            placeholder="Azizjon Norimboyev"
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Admin logini (Tizimga kirish uchun) *
                          </label>
                          <input
                            type="text"
                            value={newAdminUsername}
                            onChange={(e) => setNewAdminUsername(e.target.value)}
                            placeholder="masalan: tatu_admin"
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Telefon raqami (ixtiyoriy)
                          </label>
                          <input
                            type="text"
                            value={newAdminPhone}
                            onChange={(e) => setNewAdminPhone(e.target.value)}
                            placeholder="+998 90 123 45 67"
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Boshlang&apos;ich parol
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswordText ? "text" : "password"}
                              value={newAdminPassword}
                              onChange={(e) => setNewAdminPassword(e.target.value)}
                              placeholder="Bo'sh qolsa avtomatik generatsiya qilinadi"
                              className="w-full pl-4 pr-16 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => setNewAdminPassword(generateRandomSecurePassword())}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Parol yaratish"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={handleCreateNewAdmin}
                          disabled={isSavingNewAdmin}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isSavingNewAdmin ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                          <span>Administratorni yaratish va biriktirish</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: LITSENZIYANI UZAYTIRISH                            */}
              {/* ======================================================== */}
              {activeTab === "license" && (
                <div className="p-6 sm:p-7 rounded-2xl border border-blue-200/80 bg-blue-50/30 space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-4 border-b border-blue-200/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Hourglass className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Litsenziya muddatini uzaytirish
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500">
                          OTM tizimdan foydalanish muddatini uzaytirish va yangilash
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full border ${
                        daysRemaining > 30
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {daysRemaining > 0 ? `${daysRemaining} kun qoldi` : "Muddati tugagan"}
                    </span>
                  </div>

                  {/* Hozirgi holat ko'rsatkichi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-400 block text-xs">Hozirgi amal qilish sanasi:</span>
                      <span className="font-bold text-slate-900 mt-1 block text-base">
                        {formatUzbekDate(currentExpiresAt)} gacha
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-400 block text-xs">Joriy ta&apos;rif:</span>
                      <span className="font-bold text-slate-900 mt-1 block text-base">
                        {organization.subscription.planLabel || "1 yillik dostup"}
                      </span>
                    </div>
                  </div>

                  {/* Uzaytirish muddati tanlovi */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-blue-200/70 shadow-2xs space-y-4">
                    <label className="block text-sm font-bold text-slate-800">
                      Litsenziyani qancha muddatga uzaytirmoqchisiz?
                    </label>

                    <div className="flex flex-wrap gap-2.5">
                      {EXTEND_PRESETS.map((preset) => {
                        const isSel = selectedExtendPlan === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSelectedExtendPlan(preset.id)}
                            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                              isSel
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setSelectedExtendPlan("custom")}
                        className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                          selectedExtendPlan === "custom"
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Aniq sana tanlash
                      </button>
                    </div>

                    {selectedExtendPlan === "custom" && (
                      <div className="pt-2 animate-in fade-in">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Yangi litsenziya tugash sanasini tanlang:
                        </label>
                        <input
                          type="date"
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Yangi tugash sanasi prevyusi */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <div className="text-sm text-slate-700">
                        <span className="text-slate-400 block text-xs">Yangi tugash sanasi bo‘ladi:</span>
                        <strong className="text-blue-700 text-base sm:text-lg font-mono">
                          {formatUzbekDate(targetDatePreview)}
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveLicenseExtension}
                        disabled={isSavingLicense}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSavingLicense ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>Litsenziyani uzaytirishni saqlash</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 4: LIMITNI OSHIRISH                                   */}
              {/* ======================================================== */}
              {activeTab === "limit" && (
                <div className="p-6 sm:p-7 rounded-2xl border border-blue-200/80 bg-blue-50/30 space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-4 border-b border-blue-200/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Aktivlar balansi limitini oshirish
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500">
                          Universitet kiritishi mumkin bo‘lgan aktivlar maksimal summasi
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full bg-slate-200 text-slate-800">
                      Hozir: {currentLimitMlrd >= 1000 ? `${currentLimitMlrd / 1000} trln` : `${currentLimitMlrd} mlrd`}
                    </span>
                  </div>

                  {/* Joriy ishlatilish holati */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700">
                      <span>Mavjud balans ishlatilish holati</span>
                      <span className="text-blue-600 font-bold">
                        {organization.assetUsage?.usedPercent ?? 0}% to‘ldi
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${Math.min(100, organization.assetUsage?.usedPercent ?? 0)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Limitni kiritish va tezkor qiymatlar */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-blue-200/70 shadow-2xs space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">
                        Yangi aktivlar limiti summasini kiriting yoki tanlang:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={50000}
                          value={limitInput}
                          onChange={(e) =>
                            setLimitInput(Math.max(1, parseInt(e.target.value, 10) || 1))
                          }
                          className="w-full pl-4 pr-28 py-3 text-base sm:text-lg font-mono font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-500 pointer-events-none">
                          mlrd so‘m
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 block mb-2.5">
                        Tezkor tanlov tugmalari:
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {LIMIT_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setLimitInput(preset)}
                            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border transition-all cursor-pointer ${
                              limitInput === preset
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {preset >= 1000 ? `${preset / 1000} trln` : `${preset} mlrd`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveLimit(limitInput)}
                        disabled={isSavingLimit}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSavingLimit ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>Limitni saqlash</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between sm:px-7">
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm text-slate-400">
                  AssetAudit &bull; OTM Boshqaruvi
                </span>
                <span className="text-slate-300">&bull;</span>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmationText("");
                    setDeleteError(null);
                    setShowDeleteModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>OTMni o‘chirish</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GITHUB-STYLE OTMNI O'CHIRISHNI TASDIQLASH MODALI */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-rose-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0 border border-rose-200">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    OTMni butunlay o‘chirish
                  </h3>
                  <p className="text-xs text-rose-700 font-medium">Qaytarib bo‘lmas xavfli amal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) setShowDeleteModal(false);
                }}
                disabled={isDeleting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-900 text-xs sm:text-sm space-y-1.5 leading-relaxed">
                <p className="font-bold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  Diqqat: Ushbu amalni ortga qaytarib bo‘lmaydi!
                </p>
                <p className="text-xs text-rose-700">
                  Ushbu universitetga tegishli barcha aktivlar, binolar, xonalar, tekshiruvlar hamda administrator hisoblari bazadan butunlay o‘chiriladi.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm text-slate-700 font-medium">
                  Tasdiqlash uchun quyidagi maydonga universitet nomini aynan ko‘chirib yozing:
                </label>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs sm:text-sm font-bold text-slate-900 select-all">
                  <span className="truncate">{organization.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(organization.name);
                      setCopiedName(true);
                      setTimeout(() => setCopiedName(false), 2000);
                    }}
                    className="ml-2 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-sans font-semibold flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                  >
                    {copiedName ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Nusxalandi</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Nusxa olish</span>
                      </>
                    )}
                  </button>
                </div>

                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => {
                    setDeleteConfirmationText(e.target.value);
                    if (deleteError) setDeleteError(null);
                  }}
                  placeholder={organization.name}
                  autoFocus
                  disabled={isDeleting}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-200 focus:border-rose-500 font-medium transition-all"
                />
              </div>

              {deleteError && (
                <p className="text-xs font-semibold text-rose-600 animate-in fade-in">
                  {deleteError}
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDeleteOrganization}
                disabled={
                  deleteConfirmationText.trim().toLowerCase() !== organization.name.trim().toLowerCase() ||
                  isDeleting
                }
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                  deleteConfirmationText.trim().toLowerCase() === organization.name.trim().toLowerCase() && !isDeleting
                    ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95 shadow-rose-200"
                    : "bg-rose-200 text-rose-400 cursor-not-allowed opacity-60"
                }`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>O‘chirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>OTMni butunlay o‘chirish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
