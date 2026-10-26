import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../services/ordersApi.js";
import toast from "react-hot-toast";

export function useOrders(params) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: async () => {
      const res = await ordersApi.getAll(params);
      return res.data;
    }
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => ordersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["planning"] });
      toast.success("Order created — production plan is being updated");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Create failed")
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => ordersApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orders"] }); toast.success("Order status updated"); },
    onError: (err) => toast.error(err.response?.data?.message || "Update failed")
  });
}