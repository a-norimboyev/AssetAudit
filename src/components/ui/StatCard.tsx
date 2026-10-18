import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeText?: string;
  badgeVariant?: "success" | "warning" | "error" | "neutral";
  colorVariant?: "blue" | "green" | "amber" | "slate" | "rose";
}

const colorVariants = {
  blue: {
    bgIcon: "bg-blue-50 text-blue-600 border-blue-100",
  },
  green: {
    bgIcon: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  amber: {
    bgIcon: "bg-amber-50 text-amber-600 border-amber-100",
  },
  slate: {
    bgIcon: "bg-slate-100 text-slate-600 border-slate-200",
  },
  rose: {
    bgIcon: "bg-rose-50 text-rose-600 border-rose-100",
  },
};

const badgeVariants = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-rose-50 text-rose-700 border-rose-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = "neutral",
  colorVariant = "blue",
}) => {
  const color = colorVariants[colorVariant];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs transition-all hover:shadow-xs hover:border-slate-300">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color.bgIcon}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
          {value}
        </span>
        {badgeText && (
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeVariants[badgeVariant]}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 leading-normal font-medium">{subtitle}</p>
      )}
    </div>
  );
};
