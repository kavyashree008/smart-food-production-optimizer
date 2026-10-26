import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, AlertTriangle, Package, Layers, ShoppingBag, Wrench } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { ExpiryBadge } from "../../components/ui/ExpiryBadge.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { useProducts } from "../../hooks/useProducts.js";
import { batchesApi } from "../../services/batchesApi.js";
import { rawMaterialsApi } from "../../services/rawMaterialsApi.js";
import { analyticsApi } from "../../services/analyticsApi.js";
import { formatDate, formatCurrency } from "../../utils/formatters.js";
import { differenceInDays } from "date-fns";
import toast from "react-hot-toast";

function ExpiryBar({ expiryDate }) {
  const days = differenceInDays(new Date(expiryDate), new Date());
  const total = 30;
  const pct = Math.min(100, Math.max(0, (days / total) * 100));
  const color = days < 0 ? "bg-slate-300" : days <= 3 ? "bg-rose-500" : days <= 7 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function AddBatchModal({ open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ rawMaterialId: "", batchNo: "", quantity: "", expiryDate: "", costPerUnit: "" });
  const rawMaterials = useQuery({ queryKey: ["raw-materials"], queryFn: () => rawMaterialsApi.getAll().then((r) => r.data) });

  const create = useMutation({
    mutationFn: (data) => batchesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["batches"] }); toast.success("Batch added!"); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add batch")
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    create.mutate({ ...form, quantity: Number(form.quantity), costPerUnit: Number(form.costPerUnit) });
  };

  const fields = [
    { key: "batchNo", label: "Batch Number", placeholder: "BAT-001" },
    { key: "quantity", label: "Quantity", placeholder: "500", type: "number" },
    { key: "expiryDate", label: "Expiry Date", type: "date" },
    { key: "costPerUnit", label: "Cost Per Unit (₹)", placeholder: "45", type: "number" }
  ];

  return (
    <Modal open={open} onClose={onClose} title="Add New Batch">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">Raw Material</label>
          <select value={form.rawMaterialId} onChange={(e) => setForm({ ...form, rawMaterialId: e.target.value })} required
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Select material...</option>
            {rawMaterials.data?.rawMaterials?.map((rm) => <option key={rm._id} value={rm._id}>{rm.name} ({rm.unit})</option>)}
          </select>
        </div>
        {fields.map(({ key, label, placeholder, type = "text" }) => (
          <div key={key}>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">{label}</label>
            <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        ))}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={create.isPending}>Add Batch</Button>
        </div>
      </form>
    </Modal>
  );
}

function MarkDamagedModal({ batch, open, onClose }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [qty, setQty] = useState("");
  const mark = useMutation({
    mutationFn: (data) => batchesApi.markDamaged(batch._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["batches"] }); toast.success("Batch marked damaged"); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed")
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    mark.mutate({ reason, quantity: Number(qty) || undefined });
  };
  return (
    <Modal open={open} onClose={onClose} title="Mark Batch as Damaged" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500">Batch: <span className="font-semibold text-slate-800 dark:text-slate-100">{batch?.batchNo}</span></p>
        <div>
          <label className="text-xs font-semibold block mb-1.5 text-slate-600 dark:text-slate-300">Damaged Quantity (leave blank for full batch)</label>
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={String(batch?.remainingQty || "")}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-rose-500" />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5 text-slate-600 dark:text-slate-300">Reason</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} required placeholder="e.g. Contamination detected..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" variant="danger" loading={mark.isPending}>Mark Damaged</Button>
        </div>
      </form>
    </Modal>
  );
}

export function InventoryPage() {
  const [tab, setTab] = useState("batches");
  const [addBatchOpen, setAddBatchOpen] = useState(false);
  const [damageModal, setDamageModal] = useState({ open: false, batch: null });

  const products = useProducts();
  const rawMaterials = useQuery({ queryKey: ["raw-materials"], queryFn: () => rawMaterialsApi.getAll().then((r) => r.data) });
  const batches = useQuery({
    queryKey: ["batches"],
    queryFn: () => batchesApi.getAll({ sort: "expiry" }).then((r) => r.data),
    refetchInterval: 60000
  });
  const summary = useQuery({ queryKey: ["analytics", "summary"], queryFn: () => analyticsApi.getSummary().then((r) => r.data), staleTime: 30000 });

  const purchaseSuggestions = summary.data?.purchaseSuggestions || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="FEFO-sorted raw material batches, finished goods stock, and purchase suggestions.">
        <Button size="sm" icon={Plus} onClick={() => setAddBatchOpen(true)}>Add Batch</Button>
      </PageHeader>

      {/* Purchase Suggestions */}
      {purchaseSuggestions.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-3">🛒 Purchase Suggestions — Order Now to Avoid Shortages</p>
          <div className="flex flex-wrap gap-3">
            {purchaseSuggestions.map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-amber-200 dark:border-amber-800 text-xs max-w-xs">
                <p className="font-bold text-slate-800 dark:text-slate-100">{s.materialName}</p>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">{s.message}</p>
                <p className="text-amber-700 dark:text-amber-300 font-semibold mt-1">Order: {s.suggestedOrderQty} {s.unit} by {s.orderBy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit">
        {[{ id: "batches", label: "Raw Material Batches", icon: Layers }, { id: "products", label: "Finished Goods", icon: Package }, { id: "materials", label: "Raw Materials", icon: ShoppingBag }].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${tab === id ? "bg-white dark:bg-surface-dark text-primary-700 dark:text-primary-300 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* FEFO Batch Table */}
      {tab === "batches" && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-surface-darkElevated">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {["FEFO", "Batch No", "Material", "Remaining", "Expiry", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {batches.isLoading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td></tr>
                )) : batches.data?.batches?.map((batch, i) => (
                  <motion.tr key={batch._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50 dark:hover:bg-surface-darkElevated transition-colors">
                    <td className="px-4 py-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${i === 0 ? "bg-primary-600" : i <= 2 ? "bg-primary-400" : "bg-slate-300"}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-100">{batch.batchNo}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{batch.rawMaterialId?.name}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="tabular-nums font-bold text-slate-800 dark:text-slate-100">{batch.remainingQty} <span className="font-normal text-slate-400">{batch.rawMaterialId?.unit}</span></p>
                        <ExpiryBar expiryDate={batch.expiryDate} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-600 dark:text-slate-300">{formatDate(batch.expiryDate, "dd MMM yyyy")}</p>
                        <ExpiryBadge expiryDate={batch.expiryDate} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${batch.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300" : batch.status === "damaged" ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {batch.status === "active" && (
                        <button onClick={() => setDamageModal({ open: true, batch })}
                          className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors">
                          <Wrench className="w-3 h-3" /> Damage
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Finished Goods */}
      {tab === "products" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.isLoading ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />) :
            products.data?.products?.map((p) => {
              const safetyPct = p.safetyStock > 0 ? (p.currentStock / p.safetyStock) * 100 : 100;
              const atRisk = p.currentStock < p.safetyStock;
              return (
                <Card key={p._id} className={`p-5 ${atRisk ? "border-rose-200 dark:border-rose-800/50" : ""}`} hover>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.sku}</p>
                    </div>
                    {atRisk && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">{p.currentStock}</span>
                      <span className="text-xs text-slate-400">{p.unit}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Safety stock: {p.safetyStock} {p.unit}</p>
                    <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${atRisk ? "bg-rose-500" : safetyPct < 150 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, safetyPct)}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Badge variant={atRisk ? "danger" : "success"}>{atRisk ? "Below Safety Stock" : "Adequate"}</Badge>
                    <span className="text-[11px] text-slate-400">{p.productionRatePerHour} {p.unit}/hr</span>
                  </div>
                </Card>
              );
            })}
        </div>
      )}

      {/* Raw Materials */}
      {tab === "materials" && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-surface-darkElevated">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {["Name", "Unit", "Supplier", "Lead Time", "Reorder Level", "Cost/Unit"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {rawMaterials.isLoading ? Array(6).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td></tr>
                )) : rawMaterials.data?.rawMaterials?.map((rm, i) => (
                  <motion.tr key={rm._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-slate-50 dark:hover:bg-surface-darkElevated transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{rm.name}</td>
                    <td className="px-4 py-3 text-slate-500">{rm.unit}</td>
                    <td className="px-4 py-3 text-slate-500">{rm.supplier}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{rm.leadTimeDays}d</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{rm.reorderLevel} {rm.unit}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(rm.costPerUnit)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AddBatchModal open={addBatchOpen} onClose={() => setAddBatchOpen(false)} />
      <MarkDamagedModal batch={damageModal.batch} open={damageModal.open} onClose={() => setDamageModal({ open: false, batch: null })} />
    </div>
  );
}