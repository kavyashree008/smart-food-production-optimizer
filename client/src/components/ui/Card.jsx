import React from "react";

export function Card({
  children,
  className = "",
  hover = false,
  glass = false,
  ...props
}) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        glass
          ? "glass-panel border-white/60 dark:border-white/10 shadow-card dark:shadow-cardDark"
          : "bg-surface-light dark:bg-surface-dark border-slate-100 dark:border-slate-800 shadow-soft"
      } ${hover ? "hover:shadow-card hover:-translate-y-0.5" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
