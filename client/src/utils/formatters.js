import { format, differenceInDays } from "date-fns";

/**
 * Formats a number to Indian Rupee currency standard
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formats a number with commas
 */
export function formatNumber(val, decimals = 0) {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals
  }).format(val);
}

/**
 * Formats standard date strings
 */
export function formatDate(dateString, pattern = "dd MMM yyyy") {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), pattern);
  } catch {
    return "Invalid date";
  }
}

/**
 * Determines expiry status and remaining days
 */
export function getExpiryStatus(expiryDate) {
  if (!expiryDate) return { status: "safe", daysLeft: 999 };
  const daysLeft = differenceInDays(new Date(expiryDate), new Date());
  
  if (daysLeft < 0) return { status: "expired", daysLeft, label: "Expired", color: "text-slate-400 bg-slate-100 dark:bg-slate-800" };
  if (daysLeft <= 3) return { status: "critical", daysLeft, label: `${daysLeft}d left (Critical)`, color: "text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-200" };
  if (daysLeft <= 7) return { status: "expiring_soon", daysLeft, label: `${daysLeft}d left (Soon)`, color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200" };
  return { status: "safe", daysLeft, label: `${daysLeft}d left (Safe)`, color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200" };
}
