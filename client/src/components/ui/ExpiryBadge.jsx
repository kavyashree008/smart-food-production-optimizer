import React from "react";
import { differenceInDays } from "date-fns";

export function ExpiryBadge({ expiryDate }) {
  if (!expiryDate) return null;
  const days = differenceInDays(new Date(expiryDate), new Date());

  let classes, label;
  if (days < 0) {
    classes = "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
    label = "Expired";
  } else if (days <= 3) {
    classes = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 animate-pulse";
    label = `${days}d — CRITICAL`;
  } else if (days <= 7) {
    classes = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300";
    label = `${days}d — Expiring Soon`;
  } else {
    classes = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300";
    label = `${days}d — Safe`;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border tabular-nums ${classes}`}>
      {label}
    </span>
  );
}