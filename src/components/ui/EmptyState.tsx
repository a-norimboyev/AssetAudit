import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-[4px] border border-dashed border-slate-200 bg-slate-50/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-[4px] bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight mb-1">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>

      {actionText && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-[3px] bg-white border border-slate-200 text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
