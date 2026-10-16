import React from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  badge,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 ${className}`}
    >
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
            {title}
          </h2>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">{description}</p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
