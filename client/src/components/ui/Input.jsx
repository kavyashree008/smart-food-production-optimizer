import React, { forwardRef } from "react";

export const Input = forwardRef(function Input(
  { label, error, helperText, icon: Icon, className = "", ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border bg-white dark:bg-surface-dark px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            Icon ? "pl-10" : ""
          } ${
            error
              ? "border-danger focus:ring-danger"
              : "border-slate-200 dark:border-slate-700/60"
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-danger font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
});
