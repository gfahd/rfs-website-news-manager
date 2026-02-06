"use client";

import { Sparkles, Loader2 } from "lucide-react";

interface AIButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "purple" | "slate" | "red";
  size?: "sm" | "md";
  className?: string;
  title?: string;
}

const variantStyles = {
  purple:
    "border border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 disabled:opacity-50",
  slate:
    "border border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-50",
  red: "border border-red-500/50 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-50",
};

const sizeStyles = {
  sm: "gap-1.5 px-3 py-2 rounded-lg text-sm",
  md: "gap-2 px-4 py-2.5 rounded-lg",
};

export function AIButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = "purple",
  size = "sm",
  className = "",
  title,
}: AIButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      className={`inline-flex items-center transition-all duration-200 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 shrink-0" />
      )}
      {children}
    </button>
  );
}
