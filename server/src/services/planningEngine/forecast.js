import { PLANNING_DEFAULTS } from "../../config/constants.js";

/**
 * Calculates Simple Exponential Smoothing (SES) series
 */
export function calculateSES(history, alpha = PLANNING_DEFAULTS.EXPONENTIAL_SMOOTHING_ALPHA) {
  if (!history || history.length === 0) return [];
  const smoothed = [history[0]];
  for (let i = 1; i < history.length; i++) {
    const nextVal = alpha * history[i] + (1 - alpha) * smoothed[i - 1];
    smoothed.push(nextVal);
  }
  return smoothed;
}

/**
 * Calculates N-day Moving Average series
 */
export function calculateMovingAverage(history, windowSize = 7) {
  if (!history || history.length === 0) return [];
  const ma = [];
  for (let i = 0; i < history.length; i++) {
    if (i < windowSize - 1) {
      // For initial values, average what we have so far
      const slice = history.slice(0, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      ma.push(avg);
    } else {
      const slice = history.slice(i - windowSize + 1, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / windowSize;
      ma.push(avg);
    }
  }
  return ma;
}

/**
 * Computes Mean Absolute Percentage Error (MAPE)
 */
export function calculateMAPE(actuals, forecasts) {
  if (!actuals || !forecasts || actuals.length === 0 || actuals.length !== forecasts.length) {
    return 100;
  }
  let sumPercentageError = 0;
  let validCount = 0;

  for (let i = 0; i < actuals.length; i++) {
    if (actuals[i] > 0) {
      const error = Math.abs((actuals[i] - forecasts[i]) / actuals[i]);
      sumPercentageError += error;
      validCount++;
    }
  }

  return validCount > 0 ? (sumPercentageError / validCount) * 100 : 0;
}

/**
 * Backtests SES vs. 7-Day MA on the last 14 days of history,
 * selects the lower-error method, and generates a 7-day forecast with festival multipliers.
 */
export function generateDemandForecast({
  salesHistory = [],
  horizonDays = PLANNING_DEFAULTS.FORECAST_HORIZON_DAYS,
  alpha = PLANNING_DEFAULTS.EXPONENTIAL_SMOOTHING_ALPHA,
  festivals = [],
  productCategory = ""
}) {
  // Sort sales history chronologically
  const sorted = [...salesHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  const series = sorted.map((s) => Number(s.quantitySold || 0));

  if (series.length < 7) {
    // Insufficient history: fallback to basic average
    const fallbackAvg = series.length > 0 ? series.reduce((a, b) => a + b, 0) / series.length : 50;
    const dailyForecast = Array.from({ length: horizonDays }, () => Math.round(fallbackAvg));
    return {
      chosenMethod: "Default Average",
      mape: 15.0,
      accuracyPercent: 85.0,
      dailyForecast,
      totalForecastQuantity: dailyForecast.reduce((a, b) => a + b, 0)
    };
  }

  // Backtest window: last 14 days (or half of history if less than 28 days)
  const backtestLen = Math.min(14, Math.floor(series.length / 2));
  const trainSeries = series.slice(0, series.length - backtestLen);
  const testActuals = series.slice(series.length - backtestLen);

  // 1. SES predictions over test window
  const sesSmoothed = calculateSES(series, alpha);
  const sesTestForecasts = sesSmoothed.slice(series.length - backtestLen - 1, series.length - 1);
  const sesMape = calculateMAPE(testActuals, sesTestForecasts);

  // 2. 7-Day MA predictions over test window
  const maSeries = calculateMovingAverage(series, 7);
  const maTestForecasts = maSeries.slice(series.length - backtestLen - 1, series.length - 1);
  const maMape = calculateMAPE(testActuals, maTestForecasts);

  // Select method with lower MAPE
  const useSES = sesMape <= maMape;
  const chosenMethod = useSES ? "Exponential Smoothing (SES)" : "7-Day Moving Average";
  const chosenMape = Number((useSES ? sesMape : maMape).toFixed(2));
  const accuracyPercent = Number(Math.max(0, 100 - chosenMape).toFixed(2));

  // Base next-day forecast value
  const baseForecastVal = useSES
    ? sesSmoothed[sesSmoothed.length - 1]
    : maSeries[maSeries.length - 1];

  // Project over horizon with festival multipliers
  const dailyForecast = [];
  const today = new Date();

  for (let i = 1; i <= horizonDays; i++) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + i);

    let multiplier = 1.0;
    // Check if target date falls inside any active festival for this product category
    for (const fest of festivals) {
      const fStart = new Date(fest.startDate);
      const fEnd = new Date(fest.endDate);
      if (targetDate >= fStart && targetDate <= fEnd) {
        if (!fest.productCategories || fest.productCategories.includes(productCategory)) {
          multiplier = Math.max(multiplier, fest.demandMultiplier || 1.0);
        }
      }
    }

    const projectedQty = Math.max(1, Math.round(baseForecastVal * multiplier));
    dailyForecast.push(projectedQty);
  }

  const totalForecastQuantity = dailyForecast.reduce((a, b) => a + b, 0);

  return {
    chosenMethod,
    mape: chosenMape,
    accuracyPercent,
    dailyForecast,
    totalForecastQuantity
  };
}