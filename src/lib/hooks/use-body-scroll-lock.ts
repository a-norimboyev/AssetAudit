"use client";

import { useEffect } from "react";

let activeLockCount = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";
let originalPaddingRight = "";

/**
 * Modal yoki dialog ochiq bo'lganda orqa sahifa (body/html) sichqoncha bilan
 * skroll qilinganda qimirlamasligi uchun skrollni to'liq qotirib qo'yuvchi hook.
 * Sahifa gorizontal sakrab ketmasligi uchun scrollbar enini to'ldiradi.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    if (activeLockCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    activeLockCount++;

    return () => {
      activeLockCount = Math.max(0, activeLockCount - 1);
      if (activeLockCount === 0) {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      }
    };
  }, [isLocked]);
}
