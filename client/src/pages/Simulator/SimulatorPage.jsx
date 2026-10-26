import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Play, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { RiskBadge } from "../../components/ui/RiskBadge.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { simulatorApi } from "../../services/simulatorApi.js";
import { formatCurrency } from "../../utils/formatters.js";
import toast from "react-hot-toast";

function Slider({ label, min, max, step = 1, value, onChange, unit = "", tooltip }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
        <span className={`text-sm font-black tabular-nums ${value > 0 ? "text-primary-600 dark:text-primary-400" : value < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
          {value > 0 ? "+" : ""}{value}{unit}
        </span>
      </div>
      <div className="relative">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700"
          style={{ background: `linear-gradient(to right, #1F6F5B 0%, #1F6F5B ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)` }} />
      </div>
      {tooltip && <p className="text-[11px] text-slate-400">{tooltip}</p>}
    </div>
  );
}

function DeltaBadge({ delta }) {
  if (delta === 0 || delta === null || delta === undefined) return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  if (delta > 0) return <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 text-xs font-bold tabular-nums"><TrendingUp className="w-3 h-3" />+{delta}</span>;
  return <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold tabular-nums"><TrendingDown className="w-3 h-3" />{delta}</span>;
}

export function SimulatorPage() {
  const [inputs, setInputs] = useState({ demandChangePct: 0, supplierDelayDays: 0, capacityChangePct: 0, urgentOrder: null });
  const [results, setResults] = useState(null);
  const [addUrgent, setAddUrgent] = useState(false);
  const [urgentForm, setUrgentForm] = useState({ productId: "", qty: "", dueDays: 3 });

  const runSim = useMutation({
    mutationFn: (payload) => simulatorApi.run(payload),
    onSuccess: (res) => { setResults(res.data); toast.success("Simulation complete!"); },
    onError: (err) => toast.error(err.response?.data?.message || "Simulation failed")
  });

  const handleRun = () => {
    const payload = { ...inputs };
    if (addUrgent && urgentForm.productId && urgentForm.qty) payload.urgentOrder = urgentForm;
    runSim.mutate(payload);
  };

  const comparison = results?.comparison || [];
  const liveSummary = results?.liveSummary;
  const simSummary = results?.simSummary;

  return (
    <div className="space-y-6">
      <PageHeader title="Scenario Simulator" description="Test 'what-if' scenarios without touching live data. Runs in a sandboxed environment." />

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <p className="text-xs font-bold text-amber-700 dark:text-amber-300">🔬 SANDBOX MODE — No data is written to production</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="xl:col-span-1 space-y-4">
          <Card className="p-6 space-y-6">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Scenario Inputs</h3>
            <Slider label="Demand Change" min={-50} max={100} step={5} value={inputs.demandChangePct} unit="%" tooltip="±% of the forecasted demand for all products"
              onChange={(v) => setInputs({ ...inputs, demandChangePct: v })} />
            <Slider label="Supplier Delay" min={0} max={14} value={inputs.supplierDelayDays} unit=" days" tooltip="How many additional days raw material delivery is delayed"
              onChange={(v) => setInputs({ ...inputs, supplierDelayDays: v })} />
            <Slider label="Capacity Change" min={-40} max={40} step={5} value={inputs.capacityChangePct} unit="%" tooltip="±% adjustment to factory daily production capacity"
              onChange={(v) => setInputs({ ...inputs, capacityChangePct: v })} />

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Add Urgent Order</p>
                <button onClick={() => setAddUrgent(!addUrgent)} className={`text-xs font-bold ${addUrgent ? "text-rose-600" : "text-primary-600"} hover:underline`}>
                  {addUrgent ? "Remove" : "+ Add"}
                </button>
              </div>
              {addUrgent && (
                <div className="space-y-2">
                  <input placeholder="Product ID or name" value={urgentForm.productId} onChange={(e) => setUrgentForm({ ...urgentForm, productId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <div className="flex gap-2">
                    <input type="number" placeholder="Qty" value={urgentForm.qty} onChange={(e) => setUrgentForm({ ...urgentForm, qty: e.target.value })}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <input type="number" placeholder="Due (days)" value={urgentForm.dueDays} onChange={(e) => setUrgentForm({ ...urgentForm, dueDays: Number(e.target.value) })}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              )}
            </div>

            <Button icon={Play} loading={runSim.isPending} onClick={handleRun} className="w-full justify-center">Run Simulation</Button>
          </Card>
        </div>

        {/* Results */}
        <div className="xl:col-span-2">
          <AnimatePresence mode="wait">
            {!results && !runSim.isPending ? (
              <div className="h-full flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <div className="text-5xl mb-4">🔬</div>
                  <p className="font-heading font-semibold text-slate-600 dark:text-slate-400">Configure inputs and click Run Simulation</p>
                  <p className="text-xs text-slate-400 mt-1">Results will appear here as a side-by-side comparison</p>
                </div>
              </div>
            ) : runSim.isPending ? (
              <div className="h-full flex items-center justify-center min-h-[300px]">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">Running simulation engine...</p>
                </div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Summary Cards */}
                {(liveSummary || simSummary) && (
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 border-primary-100 dark:border-primary-800/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">LIVE Plan</p>
                      <p className="text-xs text-slate-500">Total Production: <span className="font-bold text-slate-800 dark:text-slate-100">{liveSummary?.totalQty || 0} units</span></p>
                      <p className="text-xs text-slate-500 mt-0.5">Avg Risk: <span className="font-bold">{liveSummary?.avgRiskScore?.toFixed(2) || "—"}</span></p>
                    </Card>
                    <Card className="p-4 border-amber-100 dark:border-amber-800/40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">SIMULATED Plan</p>
                      <p className="text-xs text-slate-500">Total Production: <span className="font-bold text-slate-800 dark:text-slate-100">{simSummary?.totalQty || 0} units</span></p>
                      <p className="text-xs text-slate-500 mt-0.5">Avg Risk: <span className="font-bold">{simSummary?.avgRiskScore?.toFixed(2) || "—"}</span></p>
                    </Card>
                  </div>
                )}

                {/* Comparison Table */}
                <Card className="p-0 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Product-by-Product Comparison</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-surface-darkElevated">
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-500">Product</th>
                          <th className="px-4 py-3 text-right font-bold uppercase tracking-wider text-primary-500">Live Qty</th>
                          <th className="px-4 py-3 text-right font-bold uppercase tracking-wider text-amber-500">Sim Qty</th>
                          <th className="px-4 py-3 text-right font-bold uppercase tracking-wider text-slate-500">Δ Change</th>
                          <th className="px-4 py-3 text-center font-bold uppercase tracking-wider text-slate-500">Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {comparison.map((row, i) => (
                          <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            className="hover:bg-slate-50 dark:hover:bg-surface-darkElevated transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{row.productName}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-primary-700 dark:text-primary-400 font-bold">{row.liveQty}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-amber-700 dark:text-amber-400 font-bold">{row.simQty}</td>
                            <td className="px-4 py-3 text-right"><DeltaBadge delta={row.simQty - row.liveQty} /></td>
                            <td className="px-4 py-3 text-center"><RiskBadge level={row.simRiskLevel} /></td>
                          </motion.tr>
                        ))}
                        {comparison.length === 0 && (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No comparison data returned</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}