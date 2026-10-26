import React, { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, AlertTriangle, Clock, Package, Zap, TrendingDown, CheckCheck, Filter } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { useAlerts } from "../../hooks/useDashboard.js";
import { alertsApi } from "../../services/alertsApi.js";
import { formatDate } from "../../utils/formatters.js";
import toast from "react-hot-toast";
import { useSocket } from "../../context/SocketContext.jsx";

const TYPE_CONFIG = {
  shortage: { icon: Package, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800" },
  expiry: { icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
  delivery: { icon: Zap, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
  capacity: { icon: TrendingDown, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800" },
  anomaly: { icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800" },
  delay: { icon: Clock, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800" }
};

const SEVERITY_VARIANT = { critical: "danger", warning: "warning", info: "info" };
const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

export function AlertsPage() {
  const [filter, setFilter] = useState({ severity: "all", type: "all", isRead: "all" });
  const qc = useQueryClient();

  const params = {
    severity: filter.severity !== "all" ? filter.severity : undefined,
    type: filter.type !== "all" ? filter.type : undefined,
    isRead: filter.isRead !== "all" ? filter.isRead : undefined
  };

  const alerts = useAlerts(params);
  const allAlerts = (alerts.data?.alerts || []).sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));

  const markRead = useMutation({
    mutationFn: (id) => alertsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] })
  });

  const markAllRead = useMutation({
    mutationFn: () => alertsApi.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alerts"] }); toast.success("All alerts marked as read"); }
  });

  const FILTER_OPTIONS = {
    severity: ["all", "critical", "warning", "info"],
    type: ["all", "shortage", "expiry", "delivery", "capacity", "anomaly", "delay"],
    isRead: ["all", "true", "false"]
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" description="Real-time alerts for shortages, expiry, delivery risks, and anomalies.">
        <Button size="sm" variant="outline" icon={CheckCheck} loading={markAllRead.isPending}
          onClick={() => markAllRead.mutate()}>
          Mark All Read
        </Button>
      </PageHeader>

      {/* Unread badge */}
      {alerts.data?.unreadCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-800/40 bg-rose-50/50 dark:bg-rose-950/20 w-fit">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{alerts.data.unreadCount} unread alert{alerts.data.unreadCount > 1 ? "s" : ""} require attention</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        {Object.entries(FILTER_OPTIONS).map(([key, options]) => (
          <select key={key} value={filter[key]} onChange={(e) => setFilter({ ...filter, [key]: e.target.value })}
            className="text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary-500 capitalize cursor-pointer">
            {options.map((o) => <option key={o} value={o}>{key === "isRead" ? (o === "true" ? "Read" : o === "false" ? "Unread" : "All") : o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
        ))}
      </div>

      {/* Alerts List */}
      {alerts.isLoading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : allAlerts.length === 0 ? (
        <EmptyState title="No alerts" description="All clear! The system will notify you of any risks." icon={BellOff} />
      ) : (
        <div className="space-y-3">
          {allAlerts.map((alert, i) => {
            const cfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.anomaly;
            const Icon = cfg.icon;
            return (
              <motion.div key={alert._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div onClick={() => !alert.isRead && markRead.mutate(alert._id)}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${alert.isRead ? "opacity-60 bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800" : `${cfg.bg} hover:opacity-90`}`}>
                  <div className={`mt-0.5 p-2 rounded-xl ${alert.isRead ? "bg-slate-100 dark:bg-slate-800" : "bg-white/60 dark:bg-white/10"} shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={SEVERITY_VARIANT[alert.severity]} dot>{alert.severity.toUpperCase()}</Badge>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{alert.type}</span>
                      {!alert.isRead && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">{alert.message}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{formatDate(alert.createdAt, "dd MMM yyyy, hh:mm a")}</p>
                  </div>
                  {alert.isRead && <BellOff className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}