import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, CheckCircle, ArrowRight, Factory, Clock, Zap, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { RiskBadge } from "../../components/ui/RiskBadge.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { productionApi } from "../../services/productionApi.js";
import { formatDate } from "../../utils/formatters.js";
import { useAuth } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast";

function ProgressRing({ pct, size = 64, stroke = 6, color = "#1F6F5B" }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

const STATUS_CONFIG = {
  accepted: { label: "Accepted", color: "text-blue-600", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/40" },
  in_progress: { label: "In Progress", color: "text-amber-600", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/40" },
  completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40" },
  recommended: { label: "Recommended", color: "text-slate-500", bg: "bg-slate-50 border-slate-200 dark:bg-slate-800" }
};

function ProgressModal({ plan, open, onClose }) {
  const [progress, setProgress] = useState("");
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();
  const updateProgress = useMutation({
    mutationFn: (data) => productionApi.updateProgress(plan._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["production"] }); toast.success("Progress updated"); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });
  return (
    <Modal open={open} onClose={onClose} title="Update Production Progress" size="sm">
      <div className="space-y-4">
        <p className="text-xs text-slate-500">Plan: <span className="font-semibold text-slate-800 dark:text-slate-100">{plan?.productId?.name} — {plan?.quantity} {plan?.productId?.unit}</span></p>
        <div>
          <label className="text-xs font-semibold block mb-1.5 text-slate-600 dark:text-slate-300">Quantity Produced So Far ({plan?.productId?.unit})</label>
          <input type="number" value={progress} onChange={(e) => setProgress(e.target.value)} placeholder={`0 – ${plan?.quantity}`} max={plan?.quantity}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5 text-slate-600 dark:text-slate-300">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={updateProgress.isPending}
            onClick={() => updateProgress.mutate({ producedQuantity: Number(progress), producedQty: Number(progress), notes })}>
            Update Progress
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ProductionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [progressModal, setProgressModal] = useState({ open: false, plan: null });

  const schedule = useQuery({
    queryKey: ["production"],
    queryFn: () => productionApi.getSchedule().then((r) => r.data),
    refetchInterval: 30000
  });

  const scheduleRecommended = useMutation({
    mutationFn: () => productionApi.scheduleRecommended(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["production"] });
      qc.invalidateQueries({ queryKey: ["planning"] });
      toast.success(res.data?.message || "Recommended plans scheduled!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to schedule plans")
  });

  const startJob = useMutation({
    mutationFn: (id) => productionApi.startJob(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["production"] }); toast.success("Production job started!"); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to start job")
  });

  const completeJob = useMutation({
    mutationFn: (id) => productionApi.completeJob(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["production"] }); qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Job completed — stock updated!"); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to complete job")
  });

  const plans = schedule.data?.jobs || schedule.data?.schedule || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Schedule"
        description="Track active jobs, start production runs, and mark completions. Stock auto-updates on completion."
      >
        <Button
          size="sm"
          variant="outline"
          icon={ExternalLink}
          onClick={() => navigate("/planning")}
        >
          Planning Engine
        </Button>
        <Button
          size="sm"
          icon={Zap}
          loading={scheduleRecommended.isPending}
          onClick={() => scheduleRecommended.mutate()}
        >
          Schedule Recommended Plans
        </Button>
      </PageHeader>

      {schedule.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center">
            <Factory className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-base text-slate-800 dark:text-slate-100">No production jobs scheduled yet</h3>
            <p className="text-xs text-slate-500 max-w-sm">You can auto-schedule today's AI-recommended batches directly or review them in the Planning Engine.</p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              size="sm"
              icon={Zap}
              loading={scheduleRecommended.isPending}
              onClick={() => scheduleRecommended.mutate()}
            >
              Auto-Schedule Recommendations
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={ExternalLink}
              onClick={() => navigate("/planning")}
            >
              Open Planning Engine
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan, i) => {
            const producedQty = plan.producedQuantity ?? plan.inputsSnapshot?.producedQuantity ?? 0;
            const pct = plan.progressPercent ?? (plan.quantity > 0 ? Math.min(100, (producedQty / plan.quantity) * 100) : 0);
            const statusCfg = STATUS_CONFIG[plan.status] || STATUS_CONFIG.recommended;
            const progressColor = pct >= 100 ? "#22c55e" : pct > 0 ? "#F5A524" : "#1F6F5B";

            return (
              <motion.div key={plan._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className={`p-5 border ${statusCfg.bg}`} hover>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${statusCfg.color}`}>{statusCfg.label}</span>
                        <RiskBadge level={plan.riskLevel} />
                      </div>
                      <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base">{plan.productId?.name}</h3>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-2xl font-black tabular-nums text-primary-600 dark:text-primary-400">{plan.quantity}</span>
                        <span className="text-sm text-slate-500">{plan.productId?.unit}</span>
                        <span className="text-xs text-slate-400">target</span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(plan.date, "dd MMM yyyy")}</span>
                        <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">v{plan.version}</span>
                      </div>
                    </div>
                    <div className="relative shrink-0">
                      <ProgressRing pct={pct} color={progressColor} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[11px] font-black tabular-nums text-slate-700 dark:text-slate-200">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {producedQty > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: progressColor }} />
                      </div>
                      <span className="tabular-nums font-semibold shrink-0">{producedQty}/{plan.quantity} {plan.productId?.unit}</span>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 flex-wrap">
                    {plan.status === "accepted" && (
                      <Button size="xs" icon={Play} loading={startJob.isPending} onClick={() => startJob.mutate(plan._id)}>Start Job</Button>
                    )}
                    {plan.status === "in_progress" && (
                      <>
                        <Button size="xs" variant="outline" icon={ArrowRight} onClick={() => setProgressModal({ open: true, plan })}>Update Progress</Button>
                        <Button size="xs" icon={CheckCircle} loading={completeJob.isPending} onClick={() => completeJob.mutate(plan._id)}>Mark Complete</Button>
                      </>
                    )}
                    {plan.status === "completed" && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Production Completed — Stock Updated
                      </span>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <ProgressModal plan={progressModal.plan} open={progressModal.open} onClose={() => setProgressModal({ open: false, plan: null })} />
    </div>
  );
}