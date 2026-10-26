import React from "react";
import { Loader2 } from "lucide-react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  icon: Icon,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5"
  }[size];

  const variantClasses = {
    primary:
      "bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow focus:ring-primary-400",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 focus:ring-slate-400",
    accent:
      "bg-accent hover:bg-accent-hover text-slate-900 font-semibold shadow-sm hover:shadow focus:ring-accent",
    outline:
      "border border-primary-500/30 text-primary-600 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/30 focus:ring-primary-400",
    danger:
      "bg-danger hover:bg-danger-hover text-white shadow-sm hover:shadow focus:ring-danger",
    ghost:
      "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60 focus:ring-slate-400"
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
