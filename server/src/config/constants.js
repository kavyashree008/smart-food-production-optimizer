/**
 * System-wide constants and configuration defaults
 */
export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff"
};

export const ALL_ROLES = Object.values(USER_ROLES);

export const ORDER_PRIORITY = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent"
};

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  IN_PRODUCTION: "in_production",
  READY: "ready",
  DELIVERED: "delivered",
  DELAYED: "delayed"
};

export const PLAN_STATUS = {
  RECOMMENDED: "recommended",
  ACCEPTED: "accepted",
  MODIFIED: "modified",
  REJECTED: "rejected",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  DELAYED: "delayed"
};

export const BATCH_STATUS = {
  ACTIVE: "active",
  DAMAGED: "damaged",
  EXPIRED: "expired",
  CONSUMED: "consumed"
};

export const RISK_WEIGHTS = {
  SHORTAGE: 0.4,
  DELIVERY: 0.3,
  CAPACITY: 0.2,
  EXPIRY: 0.1
};

export const RISK_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
};

export const RISK_THRESHOLDS = {
  LOW_MAX: 0.33,
  MEDIUM_MAX: 0.66
};

export const PLANNING_DEFAULTS = {
  EXPONENTIAL_SMOOTHING_ALPHA: 0.3,
  HISTORICAL_DAYS_ANALYSIS: 14,
  FORECAST_HORIZON_DAYS: 7,
  SAFETY_STOCK_COVERAGE_DAYS: 3,
  EXPIRING_SOON_THRESHOLD_DAYS: 7,
  CRITICAL_EXPIRY_THRESHOLD_DAYS: 3
};
