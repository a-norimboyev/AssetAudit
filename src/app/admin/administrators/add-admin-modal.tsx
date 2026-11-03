"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  X,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { createOrganizationAdminAction, type StaffActionResponse } from "@/lib/actions/staff";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";

export interface OrganizationItem {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
  logoUrl?: string;
  settings?: {
    logoUrl?: string;
    [key: string]: unknown;
  };
}

interface AddAdminModalProps {
  organizations: OrganizationItem[];
}

function getOrgLogo(org?: OrganizationItem | null): string | null {
  if (!org) return null;
  return org.logoUrl || (org.settings?.logoUrl as string) || null;
}

export function AddAdminModal({ organizations }: AddAdminModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  useBodyScrollLock(isOpen);
  const [isPending, setIsPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedGeneratedPass, setCopiedGeneratedPass] = useState(false);
  const [result, setResult] = useState<StaffActionResponse | null>(null);

  // OTM qidiruv va tanlash holatlari
  const [selectedOrg, setSelectedOrg] = useState<OrganizationItem | null>(null);
  const [orgSearch, setOrgSearch] = useState("");
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [showOrgError, setShowOrgError] = useState(false);
  const orgDropdownRef = useRef<HTMLDivElement>(null);

  // Form maydonlari
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 250 ta OTMni A dan Z gacha alifbo tartibida saralash
  const activeOrgs = organizations.filter((o) => o.isActive);
  const sortedOrgs = [...activeOrgs].sort((a, b) => a.name.localeCompare(b.name, "uz"));

  // Qidiruv bo'yicha mos OTMlar (Alifbo tartibi saqlangan holda)
  const filteredOrgs = sortedOrgs.filter((org) => {
    if (!orgSearch.trim()) return true;
    const term = orgSearch.toLowerCase().trim();
    return org.name.toLowerCase().includes(term);
  });

  // Tashqariga bosilganda OTM ro'yxatini yopish
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node)) {
        setIsOrgDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Modal ochilganda tozalash
  const handleOpenModal = () => {
    setIsOpen(true);
    setResult(null);
    setFullName("");
    setUsername("");
    setPhone("");
    setPassword("");
    setShowPassword(false);
    setCopied(false);
    setCopiedGeneratedPass(false);
    setSelectedOrg(null);
    setOrgSearch("");
    setIsOrgDropdownOpen(false);
    setShowOrgError(false);
  };

  // OTM tanlanganda
  const handleSelectOrg = (org: OrganizationItem) => {
    setSelectedOrg(org);
    setOrgSearch(org.name);
    setIsOrgDropdownOpen(false);
    setShowOrgError(false);

    // Agar login bo'sh bo'lsa, OTM asosida chiroyli login tavsiya qilish
    if (!username.trim() && org.code) {
      const cleanCode = org.code.toLowerCase().replace(/[^a-z0-9]/g, "_");
      setUsername(`${cleanCode}_admin`);
    }
  };

  // Login generatsiya qilish (avtomatik yaratish)
  const generateRandomLogin = () => {
    if (selectedOrg && selectedOrg.code) {
      const cleanCode = selectedOrg.code.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const rand = Math.floor(10 + Math.random() * 90);
      setUsername(`${cleanCode}_admin${rand}`);
    } else if (fullName.trim()) {
      const parts = fullName.trim().toLowerCase().split(/\s+/);
      const cleanName = parts[0].replace(/[^a-z0-9]/g, "");
      const rand = Math.floor(10 + Math.random() * 90);
      setUsername(`${cleanName}_admin${rand}`);
    } else {
      const rand = Math.floor(100 + Math.random() * 900);
      setUsername(`admin_${rand}`);
    }
  };

  // Parol generatsiya qilish (avtomatik yaratish)
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let pass = "Admin";
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += "!" + Math.floor(100 + Math.random() * 900);
    setPassword(pass);
    setShowPassword(true);
  };

  // Generatsiya qilingan paroldan nusxa olish
  const copyGeneratedPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedGeneratedPass(true);
    setTimeout(() => setCopiedGeneratedPass(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) {
      setShowOrgError(true);
      setIsOrgDropdownOpen(true);
      return;
    }

    setIsPending(true);
    setResult(null);

    const formData = new FormData();
    formData.append("organizationId", selectedOrg.id);
    formData.append("fullName", fullName.trim());
    formData.append("username", username.trim());
    if (phone.trim()) {
      formData.append("phone", phone.trim());
    }
    if (password.trim()) {
      formData.append("password", password.trim());
    }

    try {
      const res = await createOrganizationAdminAction(null, formData);
      setResult(res);
      if (res.success) {
        setFullName("");
        setUsername("");
        setPhone("");
        setPassword("");
        setSelectedOrg(null);
        setOrgSearch("");
        setShowOrgError(false);
      }
    } catch {
      setResult({
        success: false,
        message: "Xatolik yuz berdi.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const copyCredentials = () => {
    if (!result?.credentials) return;
    const text = `Login: ${result.credentials.username}\nParol: ${result.credentials.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedLogo = getOrgLogo(selectedOrg);

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Administrator qo‘shish</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Administrator qo‘shish</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              {result?.success && result.credentials ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{result.message}</span>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4 font-mono shadow-inner">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-slate-400 font-sans font-semibold text-xs uppercase tracking-wider">
                        Yaratilgan hisob ma&apos;lumotlari:
                      </span>
                      <button
                        onClick={copyCredentials}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-medium transition-colors cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Nusxalandi</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Nusxa olish</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-lg">
                      <span className="text-slate-400 text-sm font-sans">Login: </span>
                      <strong className="text-blue-400 font-bold">{result.credentials.username}</strong>
                    </div>
                    <div className="text-lg">
                      <span className="text-slate-400 text-sm font-sans">Parol: </span>
                      <strong className="text-amber-400 font-bold">{result.credentials.temporaryPassword}</strong>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setResult(null);
                      }}
                      className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Tayyor
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  autoComplete="off"
                  className="space-y-5"
                >
                  {/* Brauzer avtomatik saqlangan ma'lumotlarni to'ldirib qo'ymasligi uchun yashirin dummy inputlar */}
                  <input
                    type="text"
                    name="prevent_autofill_user"
                    style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                  <input
                    type="password"
                    name="prevent_autofill_pwd"
                    style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
                    tabIndex={-1}
                    aria-hidden="true"
                  />

                  {result?.message && !result.success && (
                    <div className="p-4 rounded-xl text-sm flex items-center gap-3 bg-rose-50 text-rose-800 border border-rose-200">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>{result.message}</span>
                    </div>
                  )}

                  {/* 1. OTM (Universitet) — Alifbo tartibida 250 ta OTM, logosi bilan yoki faqat nomi */}
                  <div className="relative" ref={orgDropdownRef}>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                      Universitet (OTM) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      {selectedLogo && (
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                          <img
                            src={selectedLogo}
                            alt=""
                            className="w-5 h-5 object-contain rounded"
                          />
                        </div>
                      )}
                      <input
                        type="text"
                        value={orgSearch}
                        onChange={(e) => {
                          setOrgSearch(e.target.value);
                          setIsOrgDropdownOpen(true);
                          setShowOrgError(false);
                          if (selectedOrg && e.target.value !== selectedOrg.name) {
                            setSelectedOrg(null);
                          }
                        }}
                        onFocus={() => setIsOrgDropdownOpen(true)}
                        placeholder="Universitet nomini yozing..."
                        className={`w-full ${
                          selectedLogo ? "pl-11" : "px-4"
                        } pr-10 py-3.5 text-sm sm:text-base rounded-xl border ${
                          showOrgError ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"
                        } bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-medium text-slate-900 transition-all placeholder:text-slate-400`}
                        autoComplete="off"
                      />
                      {orgSearch ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOrgSearch("");
                            setSelectedOrg(null);
                            setIsOrgDropdownOpen(true);
                          }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Qidiruv natijalari ro'yxati (Dropdown) — A dan Z gacha alifbo tartibida */}
                    {isOrgDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl z-50 divide-y divide-slate-100 animate-in fade-in-50 duration-100">
                        {filteredOrgs.length > 0 ? (
                          filteredOrgs.map((org) => {
                            const isSelected = selectedOrg?.id === org.id;
                            const logo = getOrgLogo(org);
                            return (
                              <button
                                key={org.id}
                                type="button"
                                onClick={() => handleSelectOrg(org)}
                                className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-blue-50 text-blue-700 font-semibold"
                                    : "hover:bg-slate-50 text-slate-800"
                                }`}
                              >
                                {logo && (
                                  <img
                                    src={logo}
                                    alt=""
                                    className="w-6 h-6 object-contain rounded shrink-0"
                                  />
                                )}
                                <span className="truncate">{org.name}</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 font-medium">
                            &ldquo;{orgSearch}&rdquo; bo‘yicha OTM topilmadi
                          </div>
                        )}
                      </div>
                    )}

                    {showOrgError && !selectedOrg && (
                      <p className="mt-1 text-xs text-rose-600 font-medium">
                        Iltimos, ro‘yxatdan universitetni tanlang.
                      </p>
                    )}
                  </div>

                  {/* 2. Administrator F.I.SH */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                      Administrator F.I.SH <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ism va familiya"
                      required
                      className="w-full px-4 py-3.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-medium text-slate-900 transition-all placeholder:text-slate-400"
                      autoComplete="off"
                    />
                  </div>

                  {/* 3. Login va Telefon raqami (2 ustunda) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Admin Logini */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-semibold text-slate-800">
                          Admin logini <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={generateRandomLogin}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Login yaratish</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        name="admin_new_account_login"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Login"
                        required
                        className="w-full px-4 py-3.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono font-medium text-slate-900 transition-all placeholder:text-slate-400"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                      />
                    </div>

                    {/* Telefon raqami */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                        Telefon raqami
                      </label>
                      <input
                        type="text"
                        name="admin_contact_phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="w-full px-4 py-3.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono text-slate-900 transition-all placeholder:text-slate-400"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* 4. Parol */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span>Parol</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Parol yaratish</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="admin_new_account_password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Parol kiriting yoki 'Parol yaratish'ni bosing"
                        className="w-full px-4 py-3.5 pr-24 text-sm sm:text-base rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-mono text-slate-900 transition-all placeholder:text-slate-400"
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {password && (
                          <button
                            type="button"
                            onClick={copyGeneratedPassword}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Nusxa olish"
                          >
                            {copiedGeneratedPass ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title={showPassword ? "Yashirish" : "Ko'rsatish"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer tugmalari */}
                  <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-3.5">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Qo‘shilmoqda...</span>
                        </>
                      ) : (
                        <span>Administrator qo‘shish</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
