import { api } from "./api.js";

export const batchesApi = {
  getAll: (params) => api.get("/batches", { params }),
  getExpiringSoon: () => api.get("/batches/expiring-soon"),
  create: (data) => api.post("/batches", data),
  markDamaged: (id, data) => api.post(`/batches/${id}/mark-damaged`, data)
};