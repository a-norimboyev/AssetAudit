import React from "react";
import { CheckCircle2, AlertTriangle, Clock, XCircle, PlayCircle } from "lucide-react";

export type StatusType =
  | "matched"
  | "displaced"
  | "pending"
  | "conflict"
  | "in_progress"
  | "completed";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  {
    bg: string;
    text: string;
    border: string;
    defaultLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  matched: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    defaultLabel: "O‘z joyida topildi",
    icon: CheckCircle2,
  },
  displaced: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    defaultLabel: "Boshqa xonada topilgan",
    icon: AlertTriangle,
  },
  pending: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    defaultLabel: "Kutilmoqda",
    icon: Clock,
  },
  conflict: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    defaultLabel: "Ziddiyatli skan",
    icon: XCircle,
  },
  in_progress: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    defaultLabel: "Jarayonda",
    icon: PlayCircle,
  },
  completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    defaultLabel: "Yakunlandi",
    icon: CheckCircle2,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = "",
}) => {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  const text = label || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{text}</span>
    </span>
  );
};
