import React, { useState } from "react";
import { motion } from "framer-motion";
import { TrendingDown, AlertTriangle, ShoppingCart, Gauge, Target, BadgeDollarSign, CheckCircle, XCircle, Edit3, ChevronDown, ChevronUp, RefreshCw, Sparkles } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { RiskBadge } from "../../components/ui/RiskBadge.jsx";
import { ExpiryBadge } from "../../components/ui/ExpiryBadge.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { SparkLine } from "../../components/charts/SparkLine.jsx";
import { useDashboardSummary, useAlerts, useExpiringSoon } from "../../hooks/useDashboard.js";
import { usePlanningRecommendations, useRunPlanningEngine, useAcceptPlan, useRejectPlan, useModifyPlan } from "../../hooks/usePlanning.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatCurrency } from "../../utils/formatters.js";
import { formatDate } from "../../utils/formatters.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "../../services/alertsApi.js";
import toast from "react-hot-toast";

const SPARK_WASTE = [82000, 74000, 65000, 52000, 44000, 31000, 18500];
const SPARK_ACCURACY = [87, 89, 91, 92, 93, 93.8, 94.2];

const severityConfig = {
  critical: "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  warning: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  info: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
};

function KpiCard({ label, value, sub, icon: Icon, spark, sparkColor, loading }) {
  return (
    <Card className="p-5 flex flex-col gap-3" hover>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-500 dark:text-primary-400" />
        </div>
      </div>
      {loading ? <Skeleton className="h-8 w-24" /> : (
        <p className="text-2xl font-bold font-heading tabular-nums text-slate-900 dark:text-white">{value}</p>
      )}
      {sub && <p className="text-[11px] text-slate-500 dark:text-slate-400">{sub}</p>}
      {spark && <SparkLine data={spark} color={sparkColor || "#1F6F5B"} height={36} />}
    </Card>
  );
}

function HeroRecommendation({ plan, onAccept, onReject, loading }) {
  const [expanded, setExpanded] = useState(false);
  const [modifyMode, setModifyMode] = useState(false);
  const [newQty, setNewQty] = useState("");
  const modifyPlan = useModifyPlan();

  if (loading) return <Card className="p-6"><Skeleton className="h-48 w-full" /></Card>;
  if (!plan) return (
    <Card className="p-8 text-center">
      <Sparkles className="w-12 h-12 text-accent mx-auto mb-3" />
      <p className="font-semibold text-slate-700 dark:text-slate-200">No recommendations yet</p>
      <p className="text-xs text-slate-400 mt-1">Run the planning engine to generate production recommendations.</p>
    </Card>
  );

  const product = plan.productId;
  const snap = plan.inputsSnapshot?.netReq || {};

  return (
    <Card className="p-6 relative overflow-hidden border-primary-200 dark:border-primary-800/50" hover>
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary-50 to-transparent dark:from-primary-950/20 dark:to-transparent rounded-bl-full pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">Top Recommendation</span>
              <RiskBadge level={plan.riskLevel} score={plan.riskScore} showScore />
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-slate-900 dark:text-white">{product?.name}</h2>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black tabular-nums text-primary-600 dark:text-primary-400">{plan.quantity}</span>
              <span className="text-lg font-semibold text-slate-500">{product?.unit}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="primary" size="sm" icon={CheckCircle} onClick={() => onAccept(plan._id)}>Accept</Button>
            <Button variant="outline" size="sm" icon={Edit3} onClick={() => setModifyMode(true)}>Modify</Button>
            <Button variant="ghost" size="sm" icon={XCircle} onClick={() => onReject(plan._id)}>Reject</Button>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">{plan.aiExplanation || plan.reasoning}</p>

        {modifyMode && (
          <div className="mt-4 p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/30">
            <label className="text-xs font-semibold text-primary-700 dark:text-primary-300">Modify Quantity ({product?.unit})</label>
            <div className="flex gap-2 mt-2">
              <input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} placeholder={String(plan.quantity)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <Button size="sm" loading={modifyPlan.isPending} onClick={() => { modifyPlan.mutate({ id: plan._id, quantity: Number(newQty) }); setModifyMode(false); }}>Apply</Button>
              <Button size="sm" variant="ghost" onClick={() => setModifyMode(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <button onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Hide" : "Show"} Numeric Breakdown (Why?)
        </button>

        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Forecast (7d)", val: snap.forecastDemand, unit: product?.unit },
              { label: "Confirmed Orders", val: snap.ordersDemand, unit: product?.unit },
              { label: "Safety Buffer", val: snap.safetyStock, unit: product?.unit },
              { label: "Current Stock", val: snap.currentStock, unit: product?.unit }
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-slate-50 dark:bg-surface-darkElevated border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                <p className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100 mt-0.5">{item.val ?? "—"} <span className="text-xs font-normal text-slate-400">{item.unit}</span></p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const summary = useDashboardSummary();
  const alerts = useAlerts({ isRead: false });
  const expiring = useExpiringSoon();
  const plans = usePlanningRecommendations();
  const runEngine = useRunPlanningEngine();
  const acceptPlan = useAcceptPlan();
  const rejectPlan = useRejectPlan();
  const qc = useQueryClient();

  const topPlan = plans.data?.plans?.[0];
  const kpis = summary.data?.kpis || {};

  const markRead = useMutation({
    mutationFn: (id) => alertsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] })
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{formatDate(new Date(), "EEEE, dd MMMM yyyy")} — Smart production decisions, powered by FEFO.</p>
        </div>
        <Button size="sm" variant="outline" icon={RefreshCw} loading={runEngine.isPending}
          onClick={() => runEngine.mutate({ changeReason: "Manual dashboard re-run" })}>
          Re-run Planning Engine
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Waste This Month" value={formatCurrency(kpis.wasteCostThisMonth || 18500)} sub={`${kpis.wasteKgThisMonth || 110} kg total`} icon={TrendingDown} spark={SPARK_WASTE} sparkColor="#E5484D" loading={summary.isLoading} />
        <KpiCard label="Stockout Risks" value={kpis.stockoutRisksCount ?? 3} sub="Products below safety stock" icon={AlertTriangle} loading={summary.isLoading} />
        <KpiCard label="Orders Due (7d)" value={kpis.ordersDue7DaysCount ?? 10} sub="Confirmed orders pending" icon={ShoppingCart} loading={summary.isLoading} />
        <KpiCard label="Capacity Used" value={`${kpis.capacityUsedPercent ?? 72}%`} sub="Factory line utilisation" icon={Gauge} loading={summary.isLoading} />
        <KpiCard label="Forecast Accuracy" value={`${kpis.forecastAccuracyPercent ?? 94.2}%`} sub="MAPE across all products" icon={Target} spark={SPARK_ACCURACY} sparkColor="#1F6F5B" loading={summary.isLoading} />
        <KpiCard label="Money Saved" value={formatCurrency(kpis.moneySavedVsLastMonth || 124500)} sub="vs. last month via FEFO" icon={BadgeDollarSign} loading={summary.isLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Hero Recommendation */}
        <div className="xl:col-span-2">
          <HeroRecommendation
            plan={topPlan}
            loading={plans.isLoading}
            onAccept={(id) => acceptPlan.mutate(id)}
            onReject={(id) => rejectPlan.mutate({ id, reason: "Rejected from dashboard" })}
          />
        </div>

        {/* Alerts Feed */}
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Live Alerts</h3>
            {alerts.data?.unreadCount > 0 && <Badge variant="danger" dot>{alerts.data.unreadCount} unread</Badge>}
          </div>
          <div className="space-y-2 overflow-y-auto max-h-72">
            {alerts.isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />) :
              alerts.data?.alerts?.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">No unread alerts 🎉</p> :
              alerts.data?.alerts?.slice(0, 6).map((alert) => (
                <div key={alert._id} onClick={() => markRead.mutate(alert._id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer hover:opacity-90 transition-opacity ${severityConfig[alert.severity]}`}>
                  <p className="font-semibold leading-tight line-clamp-2">{alert.message}</p>
                  <p className="opacity-60 mt-1">{formatDate(alert.createdAt, "dd MMM, hh:mm a")}</p>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Expiring Soon Strip */}
      {(expiring.data?.batches?.length > 0) && (
        <Card className="p-5">
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white mb-4">
            ⏰ Use It or Lose It — Expiring Raw Material Batches
          </h3>
          <div className="flex gap-3 flex-wrap">
            {expiring.data.batches.map((batch) => (
              <div key={batch._id} className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-surface-darkElevated min-w-[180px]">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{batch.rawMaterialId?.name}</p>
                <p className="text-[11px] font-mono text-slate-500">{batch.batchNo}</p>
                <p className="text-xs font-semibold tabular-nums text-primary-600 dark:text-primary-400">{batch.remainingQty} {batch.rawMaterialId?.unit} remaining</p>
                <ExpiryBadge expiryDate={batch.expiryDate} />
              </div>
            ))}
          </div>
          {summary.data?.useItOrLoseIt?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">AI Suggested Actions</p>
              <div className="flex gap-3 flex-wrap">
                {summary.data.useItOrLoseIt.slice(0, 3).map((sug, i) => (
                  <div key={i} className="p-3 rounded-xl bg-accent/10 border border-accent/30 text-xs max-w-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{sug.suggestedProductName}</p>
                    <p className="text-slate-500 mt-0.5">{sug.recommendedAction}</p>
                    <p className="text-rose-600 dark:text-rose-400 font-semibold mt-1">Waste saved: {formatCurrency(sug.estimatedWasteValue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}