"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { CheckCircle2, X } from "lucide-react";

interface AdminToastContextType {
  showSuccessToast: (message?: string) => void;
}

const AdminToastContext = createContext<AdminToastContextType | null>(null);

/**
 * Superadmin qismida toast bildirishnomani kontekstsiz ham chiqarish imkoniyati
 */
export function triggerAdminSuccessToast(message = "Muvaffaqiyatli o'zgartirildi") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("superadmin-success-toast", { detail: { message } })
    );
  }
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showSuccessToast = useCallback((message = "Muvaffaqiyatli o'zgartirildi") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    setToast({ id: Date.now(), message });
    setIsVisible(true);

    // O'ng burchakda uzog'i 2 sekund turadi va keyin o'chib ketadi
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
      hideTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 300);
    }, 2000);
  }, []);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      showSuccessToast(customEvent.detail?.message || "Muvaffaqiyatli o'zgartirildi");
    };

    window.addEventListener("superadmin-success-toast", handleEvent);
    return () => {
      window.removeEventListener("superadmin-success-toast", handleEvent);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [showSuccessToast]);

  return (
    <AdminToastContext.Provider value={{ showSuccessToast }}>
      {children}

      {/* Faqat superadmin qismida o'ng taraf burchakda chiqadigan bildirishnoma */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-[100] transition-all duration-300 ease-out pointer-events-auto ${
            isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl shadow-emerald-950/20 text-xs sm:text-sm font-semibold border border-emerald-500">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
            <span className="leading-tight tracking-tight">{toast.message}</span>
            <button
              type="button"
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                setIsVisible(false);
                setTimeout(() => setToast(null), 300);
              }}
              className="ml-2 -mr-1 p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700/60 transition-colors cursor-pointer"
              aria-label="Yopish"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const context = useContext(AdminToastContext);
  if (!context) {
    return {
      showSuccessToast: triggerAdminSuccessToast,
    };
  }
  return context;
}
