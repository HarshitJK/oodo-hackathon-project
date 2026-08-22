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
  accentColor?: "violet" | "emerald" | "amber" | "rose" | "sky";
  className?: string;
  children?: ReactNode;
}

const colorMap = {
  violet: {
    bg: "bg-violet-600/10",
    border: "border-violet-600/20",
    icon: "text-violet-400",
    glow: "shadow-violet-900/20",
  },
  emerald: {
    bg: "bg-emerald-600/10",
    border: "border-emerald-600/20",
    icon: "text-emerald-400",
    glow: "shadow-emerald-900/20",
  },
  amber: {
    bg: "bg-amber-600/10",
    border: "border-amber-600/20",
    icon: "text-amber-400",
    glow: "shadow-amber-900/20",
  },
  rose: {
    bg: "bg-rose-600/10",
    border: "border-rose-600/20",
    icon: "text-rose-400",
    glow: "shadow-rose-900/20",
  },
  sky: {
    bg: "bg-sky-600/10",
    border: "border-sky-600/20",
    icon: "text-sky-400",
    glow: "shadow-sky-900/20",
  },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "violet",
  className,
}) => {
  const colors = colorMap[accentColor];

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-slate-900 p-5 shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden",
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
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
          {subtitle && (
            <p className="text-slate-500 text-xs mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.direction === "up" && "text-emerald-400",
                  trend.direction === "down" && "text-rose-400",
                  trend.direction === "neutral" && "text-slate-400"
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
