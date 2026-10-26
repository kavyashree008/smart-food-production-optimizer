import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, List, LayoutGrid, Package, Clock, Truck, CheckCircle, AlertCircle } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { useOrders, useCreateOrder, useUpdateOrderStatus } from "../../hooks/useOrders.js";
import { useProducts } from "../../hooks/useProducts.js";
import { formatDate } from "../../utils/formatters.js";
import { differenceInDays } from "date-fns";

const STATUS_COLUMNS = [
  { id: "pending", label: "Pending", icon: Clock, color: "text-slate-500" },
  { id: "confirmed", label: "Confirmed", icon: Package, color: "text-blue-600" },
  { id: "in_production", label: "In Production", icon: AlertCircle, color: "text-amber-600" },
  { id: "ready", label: "Ready", icon: CheckCircle, color: "text-emerald-600" },
  { id: "delivered", label: "Delivered", icon: Truck, color: "text-purple-600" }
];

const PRIORITY_CONFIG = {
  urgent: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  high: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  normal: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
  low: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
};

function OrderCard({ order, onStatusChange }) {
  const daysUntilDue = differenceInDays(new Date(order.dueDate), new Date());
  const isOverdue = daysUntilDue < 0;

  return (
    <div className={`bg-white dark:bg-surface-dark border rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow ${isOverdue ? "border-rose-200 dark:border-rose-800/50" : "border-slate-100 dark:border-slate-800"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-slate-400">{order.orderNo}</p>
          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{order.customer}</p>
        </div>
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${PRIORITY_CONFIG[order.priority]}`}>
          {order.priority}
        </span>
      </div>
      <div className="space-y-1 mb-3">
        {order.items?.slice(0, 2).map((item, i) => (
          <p key={i} className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {item.productId?.name || "Product"} — <span className="font-semibold">{item.qty}</span> {item.productId?.unit}
          </p>
        ))}
        {order.items?.length > 2 && <p className="text-[11px] text-slate-400">+{order.items.length - 2} more</p>}
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-semibold tabular-nums ${isOverdue ? "text-rose-600 dark:text-rose-400" : daysUntilDue <= 3 ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
          {isOverdue ? `${Math.abs(daysUntilDue)}d overdue` : daysUntilDue === 0 ? "Due today" : `${daysUntilDue}d left`}
        </p>
        <select value={order.status} onChange={(e) => onStatusChange(order._id, e.target.value)}
          className="text-[11px] font-semibold border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 bg-white dark:bg-surface-dark focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer">
          {STATUS_COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          <option value="delayed">Delayed</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>
    </div>
  );
}

function CreateOrderModal({ open, onClose }) {
  const products = useProducts();
  const createOrder = useCreateOrder();
  const [form, setForm] = useState({ orderNo: `ORD-${Date.now().toString().slice(-6)}`, customer: "", priority: "normal", dueDate: "", items: [{ productId: "", qty: "" }] });

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: "", qty: "" }] });
  const updateItem = (i, key, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [key]: val };
    setForm({ ...form, items });
  };
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, items: form.items.map((it) => ({ ...it, qty: Number(it.qty) })) };
    createOrder.mutate(payload, { onSuccess: () => { onClose(); setForm({ orderNo: `ORD-${Date.now().toString().slice(-6)}`, customer: "", priority: "normal", dueDate: "", items: [{ productId: "", qty: "" }] }); } });
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Order" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[{ k: "orderNo", l: "Order No" }, { k: "customer", l: "Customer" }].map(({ k, l }) => (
            <div key={k}>
              <label className="text-xs font-semibold block mb-1.5 text-slate-600 dark:text-slate-300">{l}</label>
              <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-600 dark:text-slate-300">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500">
              {["low", "normal", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-600 dark:text-slate-300">Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Order Items</label>
            <button type="button" onClick={addItem} className="text-xs text-primary-600 font-semibold hover:underline">+ Add Item</button>
          </div>
          <div className="space-y-2">
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select value={item.productId} onChange={(e) => updateItem(i, "productId", e.target.value)} required
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select product...</option>
                  {products.data?.products?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input type="number" placeholder="Qty" value={item.qty} onChange={(e) => updateItem(i, "qty", e.target.value)} required
                  className="w-24 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500" />
                {form.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={createOrder.isPending}>Create Order</Button>
        </div>
      </form>
    </Modal>
  );
}

export function OrdersPage() {
  const [viewMode, setViewMode] = useState("kanban");
  const [createOpen, setCreateOpen] = useState(false);
  const orders = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const allOrders = orders.data?.orders || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Kanban board — create orders and watch the planning engine auto-replan.">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          {[{ id: "kanban", icon: LayoutGrid }, { id: "list", icon: List }].map(({ id, icon: Icon }) => (
            <button key={id} onClick={() => setViewMode(id)}
              className={`p-2 rounded-lg transition-all ${viewMode === id ? "bg-white dark:bg-surface-dark text-primary-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <Button size="sm" icon={Plus} onClick={() => setCreateOpen(true)}>New Order</Button>
      </PageHeader>

      {orders.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {STATUS_COLUMNS.map(({ id, label, icon: Icon, color }) => {
            const col = allOrders.filter((o) => o.status === id);
            return (
              <div key={id} className="flex flex-col gap-2">
                <div className={`flex items-center gap-2 px-1 mb-1 ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                  <span className="ml-auto text-xs font-bold tabular-nums">{col.length}</span>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {col.length === 0 ? (
                    <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">Empty</div>
                  ) : col.map((order) => (
                    <motion.div key={order._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <OrderCard order={order} onStatusChange={(id, status) => updateStatus.mutate({ id, status })} />
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-surface-darkElevated">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {["Order No", "Customer", "Items", "Priority", "Due Date", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {allOrders.map((order, i) => (
                  <motion.tr key={order._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50 dark:hover:bg-surface-darkElevated transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-100">{order.orderNo}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{order.customer}</td>
                    <td className="px-4 py-3 text-slate-500">{order.items?.length} item(s)</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${PRIORITY_CONFIG[order.priority]}`}>{order.priority}</span></td>
                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{formatDate(order.dueDate, "dd MMM yyyy")}</td>
                    <td className="px-4 py-3">
                      <select value={order.status} onChange={(e) => updateStatus.mutate({ id: order._id, status: e.target.value })}
                        className="text-[11px] font-semibold border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-surface-dark focus:outline-none cursor-pointer">
                        {["pending","confirmed","in_production","ready","delivered","delayed"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}