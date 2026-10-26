import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../services/productsApi.js";
import toast from "react-hot-toast";

export function useProducts(params) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const res = await productsApi.getAll(params);
      return res.data;
    }
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => productsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Product created"); },
    onError: (err) => toast.error(err.response?.data?.message || "Create failed")
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => productsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Product updated"); },
    onError: (err) => toast.error(err.response?.data?.message || "Update failed")
  });
}