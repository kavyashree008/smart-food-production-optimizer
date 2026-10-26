import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileText, FileSpreadsheet } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { analyticsApi } from "../../services/analyticsApi.js";
import { api } from "../../services/api.js";
import { formatCurrency } from "../../utils/formatters.js";
import { format } from "date-fns";

const WASTE_REASON_COLORS = ["#E5484D", "#F5A524", "#1F6F5B", "#6366f1", "#94a3b8"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tabular-nums">{p.name}: <strong>{p.value?.toLocaleString()}</strong></p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-bold" style={{ color: p.payload.fill }}>{p.name}</p>
      <p className="tabular-nums">{formatCurrency(p.value)}</p>
      <p className="text-slate-400">{p.payload.percent?.toFixed(1)}% of total</p>
    </div>
  );
};

function ChartCard({ title, children, loading }) {
  return (
    <Card className="p-6">
      <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white mb-5">{title}</h3>
      {loading ? <Skeleton className="h-64 w-full rounded-xl" /> : children}
    </Card>
  );
}

export function AnalyticsPage() {
  const waste = useQuery({
    queryKey: ["analytics", "waste"],
    queryFn: () => analyticsApi.getWaste().then((r) => r.data),
    staleTime: 60000
  });

  const summary = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => analyticsApi.getSummary().then((r) => r.data),
    staleTime: 30000
  });

  const wasteByDay = waste.data?.wasteByDay || [];
  const wasteByReason = waste.data?.wasteByReason || [];
  const totalWasteCost = waste.data?.totalCost || 0;

  const forecastAccuracy = summary.data?.forecastAccuracy || [];
  const capacityData = summary.data?.capacityTrend || [];

  const wasteReasonData = wasteByReason.map((r, i) => ({
    name: r.reason || "Unknown",
    value: r.totalCost || 0,
    fill: WASTE_REASON_COLORS[i % WASTE_REASON_COLORS.length],
    percent: totalWasteCost > 0 ? ((r.totalCost / totalWasteCost) * 100) : 0
  }));

  const exportPDF = () => window.open("/api/export/plan.pdf", "_blank");
  const exportExcel = () => window.open("/api/export/plan.xlsx", "_blank");

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Waste trends, forecast accuracy, and capacity utilisation.">
        <Button size="sm" variant="outline" icon={FileText} onClick={exportPDF}>Export PDF</Button>
        <Button size="sm" variant="outline" icon={FileSpreadsheet} onClick={exportExcel}>Export Excel</Button>
      </PageHeader>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Waste Cost", value: formatCurrency(totalWasteCost), color: "text-rose-600 dark:text-rose-400" },
          { label: "Waste Items Logged", value: waste.data?.totalItems ?? "—", color: "text-amber-600 dark:text-amber-400" },
          { label: "Avg Forecast Accuracy", value: `${summary.data?.kpis?.forecastAccuracyPercent?.toFixed(1) ?? "—"}%`, color: "text-primary-600 dark:text-primary-400" },
          { label: "Capacity Utilisation", value: `${summary.data?.kpis?.capacityUsedPercent ?? "—"}%`, color: "text-blue-600 dark:text-blue-400" }
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
            <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Waste Trend */}
        <div className="xl:col-span-2">
          <ChartCard title="Waste Cost Trend (Last 30 Days)" loading={waste.isLoading}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={wasteByDay} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E5484D" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#E5484D" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false}
                  tickFormatter={(v) => { try { return format(new Date(v), "dd MMM"); } catch { return v; } }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cost" stroke="#E5484D" strokeWidth={2.5} fill="url(#wasteGrad)" name="Waste Cost (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Waste by Reason */}
        <ChartCard title="Waste by Reason" loading={waste.isLoading}>
          {wasteReasonData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-xs text-slate-400">No waste data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={wasteReasonData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {wasteReasonData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Forecast Accuracy per Product */}
        <ChartCard title="Forecast Accuracy by Product (MAPE)" loading={summary.isLoading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={forecastAccuracy} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="productName" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="accuracy" fill="#1F6F5B" radius={[0, 6, 6, 0]} name="Accuracy %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Capacity Utilisation */}
        <ChartCard title="Daily Capacity Utilisation" loading={summary.isLoading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={capacityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1F6F5B" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#1F6F5B" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} tickFormatter={(v) => { try { return format(new Date(v), "dd"); } catch { return v; } }} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="utilisation" fill="url(#capGrad)" radius={[4, 4, 0, 0]} name="Utilisation %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}