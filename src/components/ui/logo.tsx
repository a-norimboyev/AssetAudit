import React from "react";
import Link from "next/link";

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Option 02 — QR Scan Reticle + 'A' Icon
 * Aniq burchakli QR skanerlash fokus qavslari va markazda zamonaviy 'A' harfi
 */
export function LogoIcon({ size = 32, className = "", ...props }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="AssetAudit logotipi"
      {...props}
    >
      {/* 4 ta Burchak QR Scan Reticle qavslari */}
      {/* Yuqori chap */}
      <path
        d="M 5 15.5 V 10.5 C 5 7.46 7.46 5 10.5 5 H 15.5"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Yuqori o'ng */}
      <path
        d="M 28.5 5 H 33.5 C 36.54 5 39 7.46 39 10.5 V 15.5"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pastki chap */}
      <path
        d="M 5 28.5 V 33.5 C 5 36.54 7.46 39 10.5 39 H 15.5"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pastki o'ng */}
      <path
        d="M 28.5 39 H 33.5 C 36.54 39 39 36.54 39 33.5 V 28.5"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Markazdagi 'A' harfi */}
      <path
        d="M 13.5 33 L 21 12.2 C 21.4 11.2 22.6 11.2 23 12.2 L 30.5 33"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 16.5 25.5 H 27.5"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface LogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({
  href = "/",
  size = "md",
  showText = true,
  className = "",
}: LogoProps) {
  const iconSizes = {
    sm: 26,
    md: 32,
    lg: 38,
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg sm:text-xl",
    lg: "text-xl sm:text-2xl",
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      <div className="text-slate-800 transition-transform duration-150 group-hover:scale-105">
        <LogoIcon size={iconSizes[size]} />
      </div>
      {showText && (
        <span className={`font-bold tracking-tight text-slate-900 ${textSizes[size]}`}>
          Asset<span className="text-blue-600">Audit</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-hidden">
        {content}
      </Link>
    );
  }

  return content;
}
