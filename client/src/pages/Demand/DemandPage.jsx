import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Info } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { useProducts } from "../../hooks/useProducts.js";
import { analyticsApi } from "../../services/analyticsApi.js";
import { format } from "date-fns";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tabular-nums">{p.name}: <strong>{p.value?.toFixed(1)}</strong></p>
      ))}
    </div>
  );
};

export function DemandPage() {
  const products = useProducts();
  const [selectedId, setSelectedId] = useState(null);

  const selected = products.data?.products?.[0];
  const productId = selectedId || selected?._id;

  const demand = useQuery({
    queryKey: ["demand", productId],
    queryFn: async () => {
      if (!productId) return null;
      const res = await analyticsApi.getDemand(productId);
      return res.data;
    },
    enabled: !!productId,
    staleTime: 60000
  });

  const historicalData = (demand.data?.history || []).map((h) => ({
    date: format(new Date(h.date), "dd MMM"),
    actual: Number(h.quantitySold ?? h.quantity)
  }));

  const forecastRaw = demand.data?.forecast || demand.data?.forecastSeries || [];
  const forecastData = forecastRaw.map((f) => {
    const fc = Number(f.forecast ?? f.predictedQuantity);
    const up = Number(f.upper ?? f.confidenceUpper ?? Math.round(fc * 1.12));
    const lo = Number(f.lower ?? f.confidenceLower ?? Math.max(1, Math.round(fc * 0.88)));
    return {
      date: format(new Date(f.date), "dd MMM"),
      forecast: fc,
      upper: up,
      lower: lo
    };
  });

  // Connect last actual point to first forecast point so the forecast line is continuous
  const lastActual = historicalData.length > 0 ? historicalData[historicalData.length - 1] : null;
  const connectedForecast = forecastData.length > 0 && lastActual ? [
    { date: lastActual.date, forecast: lastActual.actual, upper: lastActual.actual, lower: lastActual.actual },
    ...forecastData
  ] : forecastData;

  const combined = [
    ...historicalData.slice(-21).map((h) => ({ ...h, forecast: undefined, upper: undefined, lower: undefined })),
    ...forecastData
  ];

  const accuracy = demand.data?.forecastAccuracy || (demand.data?.mape != null ? {
    mape: demand.data.mape,
    accuracyPct: demand.data.accuracyPercent
  } : null);
  const method = demand.data?.method || demand.data?.forecastMethod;
  const festivalMultiplier = demand.data?.festivalMultiplier;

  return (
    <div className="space-y-6">
      <PageHeader title="Demand Forecasting" description="7-day rolling forecast with SES/MA selection, MAPE comparison, and festival multipliers." />

      {/* Product Selector */}
      <div className="flex flex-wrap gap-2">
        {products.isLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-xl" />) :
          products.data?.products?.map((p) => (
            <button key={p._id} onClick={() => setSelectedId(p._id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                productId === p._id
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-300"
              }`}>
              {p.name}
            </button>
          ))}
      </div>

      {/* Accuracy Banner */}
      {accuracy && (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-primary-100 dark:border-primary-800/40 bg-primary-50/50 dark:bg-primary-950/20 flex-wrap">
          <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-primary-700 dark:text-primary-300 font-semibold">
              Using <strong>{method === "ses" ? "Exponential Smoothing (α=0.3)" : "7-Day Moving Average"}</strong> — lower MAPE auto-selected
            </p>
            {festivalMultiplier && festivalMultiplier > 1 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">🎉 Festival multiplier applied: {festivalMultiplier}×</p>
            )}
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <p className="text-lg font-black tabular-nums text-primary-700 dark:text-primary-300">{accuracy?.mape?.toFixed(1)}%</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">MAPE</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black tabular-nums text-emerald-600 dark:text-emerald-400">{accuracy?.accuracyPct?.toFixed(1)}%</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Accuracy</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              Sales History + 7-Day Forecast
              {demand.isLoading && <span className="ml-2 text-xs text-slate-400 font-normal">Loading...</span>}
            </h3>
            <p className="text-xs text-slate-500">Solid green represents actual recorded sales; dashed amber displays the forward forecast model with confidence band.</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Actual Sales
            </span>
            <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
              <span className="w-3 h-1 bg-amber-500 border-dashed border-t-2 border-amber-600 inline-block" /> 7-Day Forecast
            </span>
            <span className="flex items-center gap-1.5 font-medium text-amber-500/80">
              <span className="w-3 h-3 rounded bg-amber-200/60 dark:bg-amber-900/40 border border-amber-400/50 inline-block" /> Confidence Band
            </span>
          </div>
        </div>

        {demand.isLoading ? <Skeleton className="h-72 w-full rounded-xl" /> : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={combined} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.7} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {historicalData.length > 0 && (
                <ReferenceLine
                  x={historicalData[historicalData.length - 1]?.date}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  label={{ value: "Forecast Start", fill: "#475569", fontSize: 10, position: "top" }}
                />
              )}
              {/* Shaded Upper and Lower Confidence Interval Band */}
              <Area type="monotone" dataKey="upper" stroke="#F59E0B" strokeWidth={1} strokeDasharray="2 2" fill="url(#colorBand)" dot={false} name="Upper Bound" />
              <Area type="monotone" dataKey="lower" stroke="#F59E0B" strokeWidth={1} strokeDasharray="2 2" fill="transparent" dot={false} name="Lower Bound" />
              {/* Actual Sales Line (Solid Emerald) */}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#059669"
                strokeWidth={3}
                fill="url(#colorActual)"
                dot={{ r: 2.5, fill: "#059669", stroke: "#ffffff", strokeWidth: 1 }}
                activeDot={{ r: 5, fill: "#047857" }}
                name="Actual Sales"
              />
              {/* Forecast Line (Dashed Amber) */}
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#D97706"
                strokeWidth={3}
                strokeDasharray="6 3"
                fill="url(#colorForecast)"
                dot={{ r: 3.5, fill: "#D97706", stroke: "#ffffff", strokeWidth: 1 }}
                activeDot={{ r: 6, fill: "#B45309" }}
                name="7-Day Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Forecast Table */}
      {forecastData.length > 0 && (
        <Card className="p-6">
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white mb-4">7-Day Forecast Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="pb-2 text-right font-semibold text-slate-500 uppercase tracking-wider">Forecast</th>
                  <th className="pb-2 text-right font-semibold text-slate-500 uppercase tracking-wider">Lower</th>
                  <th className="pb-2 text-right font-semibold text-slate-500 uppercase tracking-wider">Upper</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {forecastData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-surface-darkElevated transition-colors">
                    <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{row.date}</td>
                    <td className="py-2 text-right tabular-nums font-bold text-primary-600 dark:text-primary-400">{row.forecast?.toFixed(0)}</td>
                    <td className="py-2 text-right tabular-nums text-amber-600 dark:text-amber-400">{row.lower?.toFixed(0)}</td>
                    <td className="py-2 text-right tabular-nums text-amber-600 dark:text-amber-400">{row.upper?.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}