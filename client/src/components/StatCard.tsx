import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  accentColor?: "brand" | "emerald" | "amber" | "rose" | "sky" | "violet";
  className?: string;
  children?: ReactNode;
}

const colorMap = {
  brand: {
    bg: "bg-brand-50",
    border: "border-brand-100",
    icon: "text-brand-600",
    glow: "shadow-brand-500/5",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    icon: "text-emerald-600",
    glow: "shadow-emerald-500/5",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    icon: "text-amber-600",
    glow: "shadow-amber-500/5",
  },
  rose: {
    bg: "bg-rose-50",
    border: "border-rose-100",
    icon: "text-rose-600",
    glow: "shadow-rose-500/5",
  },
  sky: {
    bg: "bg-sky-50",
    border: "border-sky-100",
    icon: "text-sky-600",
    glow: "shadow-sky-500/5",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    icon: "text-violet-400",
    glow: "shadow-violet-900/10",
  },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "brand",
  className,
}) => {
  const colors = colorMap[accentColor];

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden",
        colors.border,
        colors.glow,
        className
      )}
    >
      {/* Background glow */}
      <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30", colors.bg)} />

      <div className="relative flex items-start justify-between">
        {/* Left: text */}
        <div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
          {subtitle && (
            <p className="text-slate-500 text-xs mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.direction === "up" && "text-emerald-600",
                  trend.direction === "down" && "text-rose-600",
                  trend.direction === "neutral" && "text-slate-500"
                )}
              >
                {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}{" "}
                {trend.value}%
              </span>
              <span className="text-slate-500 text-xs">{trend.label}</span>
            </div>
          )}
        </div>

        {/* Right: icon */}
        <div className={cn("p-3 rounded-lg", colors.bg)}>
          <Icon className={cn("w-5 h-5", colors.icon)} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
