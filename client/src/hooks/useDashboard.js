import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../services/analyticsApi.js";
import { alertsApi } from "../services/alertsApi.js";
import { batchesApi } from "../services/batchesApi.js";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => {
      const res = await analyticsApi.getSummary();
      return res.data;
    },
    staleTime: 30000,
    refetchInterval: 60000
  });
}

export function useAlerts(params) {
  return useQuery({
    queryKey: ["alerts", params],
    queryFn: async () => {
      const res = await alertsApi.getAll(params);
      return res.data;
    },
    refetchInterval: 30000
  });
}

export function useExpiringSoon() {
  return useQuery({
    queryKey: ["batches", "expiring-soon"],
    queryFn: async () => {
      const res = await batchesApi.getExpiringSoon();
      return res.data;
    },
    refetchInterval: 120000
  });
}