import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle, XCircle, Edit3, ChevronDown, ChevronUp, History, RefreshCw } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { RiskBadge } from "../../components/ui/RiskBadge.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { usePlanningRecommendations, useRunPlanningEngine, useAcceptPlan, useModifyPlan, useRejectPlan } from "../../hooks/usePlanning.js";
import { planningApi } from "../../services/planningApi.js";
import { formatDate } from "../../utils/formatters.js";

const STATUS_CONFIG = {
  recommended: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
  modified: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300",
  rejected: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200"
};

function PlanRow({ plan, onAccept, onReject, onModify, onViewHistory }) {
  const [expanded, setExpanded] = useState(false);
  const product = plan.productId;
  const snap = plan.inputsSnapshot;

  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white dark:bg-surface-dark">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-900 dark:text-white text-sm">{product?.name}</p>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_CONFIG[plan.status] || STATUS_CONFIG.recommended}`}>
              {plan.status}
            </span>
            <RiskBadge level={plan.riskLevel} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200">{plan.quantity} {product?.unit}</span>
            {" · "}{formatDate(plan.date, "dd MMM yyyy")}
            {" · "} v{plan.version}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {plan.status === "recommended" && (
            <>
              <Button size="xs" variant="primary" icon={CheckCircle} onClick={() => onAccept(plan._id)}>Accept</Button>
              <Button size="xs" variant="outline" icon={Edit3} onClick={() => onModify(plan)}>Modify</Button>
              <Button size="xs" variant="ghost" icon={XCircle} onClick={() => onReject(plan)}>Reject</Button>
            </>
          )}
          <button onClick={() => onViewHistory(plan._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors">
            <History className="w-4 h-4" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-surface-darkElevated px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Reasoning</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{plan.aiExplanation || plan.reasoning}</p>
            {snap?.netReq && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Inputs Snapshot</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    ["Forecast Demand", snap.netReq.forecastDemand],
                    ["Orders Demand", snap.netReq.ordersDemand],
                    ["Safety Stock", snap.netReq.safetyStock],
                    ["Current Stock", snap.netReq.currentStock]
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="p-2.5 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{lbl}</p>
                      <p className="text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100 mt-0.5">{val ?? "—"} <span className="font-normal text-slate-400 text-xs">{product?.unit}</span></p>
                    </div>
                  ))}
                </div>
              </>
            )}
            {snap?.materialResult?.shortages?.length > 0 && (
              <div className="mt-3 p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30">
                <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-1">⚠️ Material Shortages</p>
                {snap.materialResult.shortages.map((s, i) => (
                  <p key={i} className="text-xs text-rose-600 dark:text-rose-400">{s.name}: need {s.required} {s.unit}, have {s.available} {s.unit}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HistoryModal({ planId, open, onClose }) {
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && planId) {
      setLoading(true);
      planningApi.getPlanHistory(planId).then((res) => { setHistory(res.data?.history || []); }).finally(() => setLoading(false));
    }
  }, [open, planId]);

  return (
    <Modal open={open} onClose={onClose} title="Plan Version History" size="lg">
      {loading ? <Skeleton className="h-40 w-full" /> : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {history.length === 0 ? <p className="text-xs text-slate-400 text-center py-8">No previous versions</p> :
            history.map((h) => (
              <div key={h._id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-surface-darkElevated">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">v{h.version} — {h.quantity} {h.productId?.unit}</span>
                  <RiskBadge level={h.riskLevel} />
                  <span className={`px-2 py-0.5 rounded-full text-[11px] border ${STATUS_CONFIG[h.status] || ""}`}>{h.status}</span>
                </div>
                {h.changeReason && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"{h.changeReason}"</p>}
                <p className="text-[10px] text-slate-400 mt-1">{formatDate(h.createdAt, "dd MMM yyyy, hh:mm a")}</p>
              </div>
            ))}
        </div>
      )}
    </Modal>
  );
}

function ModifyModal({ plan, open, onClose }) {
  const [qty, setQty] = useState("");
  const modifyPlan = useModifyPlan();
  const handleSubmit = () => {
    if (!qty) return;
    modifyPlan.mutate({ id: plan._id, quantity: Number(qty) });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={`Modify Plan — ${plan?.productId?.name}`} size="sm">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">New Quantity ({plan?.productId?.unit})</label>
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={String(plan?.quantity || "")}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <p className="text-[11px] text-slate-400">Material availability will be re-checked with the new quantity.</p>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} loading={modifyPlan.isPending}>Apply Modification</Button>
        </div>
      </div>
    </Modal>
  );
}

function RejectModal({ plan, open, onClose }) {
  const [reason, setReason] = useState("");
  const rejectPlan = useRejectPlan();
  const handleSubmit = () => {
    rejectPlan.mutate({ id: plan._id, reason: reason || "Rejected manually" });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Reject Plan" size="sm">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">Reason (optional)</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Demand lower than expected..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="danger" onClick={handleSubmit} loading={rejectPlan.isPending}>Reject Plan</Button>
        </div>
      </div>
    </Modal>
  );
}

export function PlanningPage() {
  const plans = usePlanningRecommendations();
  const runEngine = useRunPlanningEngine();
  const acceptPlan = useAcceptPlan();
  const [historyModal, setHistoryModal] = useState({ open: false, planId: null });
  const [modifyModal, setModifyModal] = useState({ open: false, plan: null });
  const [rejectModal, setRejectModal] = useState({ open: false, plan: null });

  const allPlans = plans.data?.plans || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Production Planning" description="AI-assisted, FEFO-driven recommendations with version history.">
        <Button size="sm" variant="outline" icon={RefreshCw} loading={runEngine.isPending}
          onClick={() => runEngine.mutate({ changeReason: "Manual engine re-run from Planning page" })}>
          Re-run Engine
        </Button>
        <Button size="sm" icon={Play} onClick={() => runEngine.mutate({ changeReason: "Manual engine run" })} loading={runEngine.isPending}>
          Generate Plan
        </Button>
      </PageHeader>

      {plans.isLoading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : allPlans.length === 0 ? (
        <EmptyState title="No production plans yet" description="Click 'Generate Plan' to run the planning engine." icon={Play} action={() => runEngine.mutate({ changeReason: "First run" })} actionLabel="Generate Plan" />
      ) : (
        <motion.div className="space-y-3">
          {allPlans.map((plan, i) => (
            <motion.div key={plan._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <PlanRow plan={plan}
                onAccept={(id) => acceptPlan.mutate(id)}
                onModify={(p) => setModifyModal({ open: true, plan: p })}
                onReject={(p) => setRejectModal({ open: true, plan: p })}
                onViewHistory={(id) => setHistoryModal({ open: true, planId: id })}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <HistoryModal planId={historyModal.planId} open={historyModal.open} onClose={() => setHistoryModal({ open: false, planId: null })} />
      <ModifyModal plan={modifyModal.plan} open={modifyModal.open} onClose={() => setModifyModal({ open: false, plan: null })} />
      <RejectModal plan={rejectModal.plan} open={rejectModal.open} onClose={() => setRejectModal({ open: false, plan: null })} />
    </div>
  );
}