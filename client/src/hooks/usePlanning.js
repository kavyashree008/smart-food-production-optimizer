import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { planningApi } from "../services/planningApi.js";
import toast from "react-hot-toast";

export function usePlanningRecommendations() {
  return useQuery({
    queryKey: ["planning", "recommendations"],
    queryFn: async () => {
      const res = await planningApi.getRecommendations();
      return res.data;
    },
    staleTime: 60000
  });
}

export function useRunPlanningEngine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => planningApi.runEngine(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planning"] });
      toast.success("Planning engine executed successfully");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Planning engine failed")
  });
}

export function useAcceptPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => planningApi.acceptPlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planning"] });
      toast.success("Plan accepted and added to production schedule");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Accept failed")
  });
}

export function useModifyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }) => planningApi.modifyPlan(id, { quantity }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planning"] });
      toast.success("Plan modified with live material re-check");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Modify failed")
  });
}

export function useRejectPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => planningApi.rejectPlan(id, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["planning"] });
      toast.success("Plan rejected");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Reject failed")
  });
}