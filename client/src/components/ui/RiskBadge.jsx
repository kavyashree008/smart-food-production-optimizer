import React from "react";

const riskConfig = {
  low: { bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500", label: "Low Risk" },
  medium: { bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500", label: "Medium Risk" },
  high: { bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800", text: "text-rose-700 dark:text-rose-300", dot: "bg-rose-500", label: "High Risk" }
};

export function RiskBadge({ level = "low", score, showScore = false }) {
  const cfg = riskConfig[level] || riskConfig.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
      {showScore && score !== undefined && <span className="opacity-60 tabular-nums">({score})</span>}
    </span>
  );
}