export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff"
};

export const RISK_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
};

export const RISK_COLORS = {
  low: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500"
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500"
  },
  high: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500"
  }
};

export const EXPIRY_STATUS = {
  SAFE: "safe",
  EXPIRING_SOON: "expiring_soon",
  CRITICAL: "critical",
  EXPIRED: "expired"
};
