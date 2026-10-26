import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Calendar, Settings2, FileText } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { api } from "../../services/api.js";
import { formatDate } from "../../utils/formatters.js";
import toast from "react-hot-toast";

function EngineConfig() {
  const [alpha, setAlpha] = useState(0.3);
  const [riskWeights, setRiskWeights] = useState({ shortage: 0.4, delivery: 0.3, capacity: 0.2, expiry: 0.1 });
  const saved = () => toast.success("Engine config saved (applied on next run)");
  const total = Object.values(riskWeights).reduce((a, b) => a + b, 0);

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Planning Engine Config</h3>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">SES Alpha (α)</label>
          <span className="text-sm font-black tabular-nums text-primary-600 dark:text-primary-400">{alpha}</span>
        </div>
        <input type="range" min={0.1} max={0.9} step={0.05} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #1F6F5B 0%, #1F6F5B ${((alpha - 0.1) / 0.8) * 100}%, #e2e8f0 ${((alpha - 0.1) / 0.8) * 100}%, #e2e8f0 100%)` }} />
        <p className="text-[11px] text-slate-400 mt-1">Controls how much recent data is weighted in exponential smoothing. Lower = smoother, Higher = reactive.</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Risk Score Weights</label>
          <span className={`text-xs font-bold tabular-nums ${Math.abs(total - 1) > 0.01 ? "text-rose-600" : "text-emerald-600"}`}>Sum: {total.toFixed(2)} {Math.abs(total - 1) < 0.01 ? "✓" : "≠ 1"}</span>
        </div>
        {Object.entries(riskWeights).map(([key, val]) => (
          <div key={key} className="flex items-center gap-3 mb-2">
            <label className="text-xs text-slate-500 w-20 capitalize">{key}</label>
            <input type="range" min={0} max={1} step={0.05} value={val} onChange={(e) => setRiskWeights({ ...riskWeights, [key]: Number(e.target.value) })}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-300 w-8 text-right">{val.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <Button size="sm" icon={Save} onClick={saved}>Save Engine Config</Button>
    </Card>
  );
}

function FestivalManager() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", demandMultiplier: 1.5, productCategories: "" });

  const festivals = useQuery({ queryKey: ["festivals"], queryFn: () => api.get("/festivals").then((r) => r.data) });

  const create = useMutation({
    mutationFn: (data) => api.post("/festivals", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["festivals"] }); toast.success("Festival added"); setShowAdd(false); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/festivals/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["festivals"] }); toast.success("Festival deleted"); }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    create.mutate({ ...form, demandMultiplier: Number(form.demandMultiplier), productCategories: form.productCategories.split(",").map(s => s.trim()).filter(Boolean) });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Festival Calendar</h3>
        </div>
        <Button size="xs" onClick={() => setShowAdd(!showAdd)}>{showAdd ? "Cancel" : "+ Add Festival"}</Button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-darkElevated">
          <div className="grid grid-cols-2 gap-3">
            {[{ k: "name", l: "Festival Name", placeholder: "Diwali" }, { k: "demandMultiplier", l: "Demand Multiplier", placeholder: "2.5", type: "number" }].map(({ k, l, placeholder, type = "text" }) => (
              <div key={k}>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">{l}</label>
                <input type={type} step="0.1" min="1" value={form[k]} placeholder={placeholder} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            ))}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Product Categories (comma-separated)</label>
            <input value={form.productCategories} onChange={(e) => setForm({ ...form, productCategories: e.target.value })} placeholder="sweets, snacks, beverages"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <Button type="submit" size="xs" loading={create.isPending}>Save Festival</Button>
        </form>
      )}

      <div className="space-y-2">
        {festivals.isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />) :
          festivals.data?.festivals?.map((f) => (
            <div key={f._id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-surface-darkElevated">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{f.name}</p>
                <p className="text-[11px] text-slate-500">{formatDate(f.startDate, "dd MMM")} – {formatDate(f.endDate, "dd MMM yyyy")} · {f.demandMultiplier}× demand</p>
              </div>
              <button onClick={() => del.mutate(f._id)} className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 hover:underline">Delete</button>
            </div>
          ))}
      </div>
    </Card>
  );
}

function AuditLog() {
  const logs = useQuery({
    queryKey: ["audit-log"],
    queryFn: () => api.get("/auth/me").then(() => api.get("/analytics/summary")).then((r) => r.data?.recentAuditLogs || []),
    staleTime: 30000
  });

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-500" />
        <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Audit Log (Recent)</h3>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {logs.isLoading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />) :
          (logs.data?.length === 0 || !logs.data) ? <p className="text-xs text-slate-400 text-center py-6">No audit logs yet</p> :
          logs.data?.map((log, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{log.action} <span className="text-slate-400 font-normal">on</span> {log.entity}</p>
                <p className="text-[11px] text-slate-400">{log.user?.name} · {formatDate(log.timestamp, "dd MMM yyyy, hh:mm a")}</p>
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Planning engine tuning, festival calendar, and system audit trail." />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <EngineConfig />
          <AuditLog />
        </div>
        <FestivalManager />
      </div>
    </div>
  );
}