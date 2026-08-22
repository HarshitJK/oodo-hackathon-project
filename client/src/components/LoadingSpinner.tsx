import React from "react";
import { cn } from "../lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className,
  label = "Loading...",
}) => {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)} role="status" aria-label={label}>
      <div
        className={cn(
          "animate-spin rounded-full border-slate-700 border-t-violet-500",
          sizeMap[size]
        )}
      />
      {size === "lg" && (
        <p className="text-sm text-slate-400 animate-pulse">{label}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
