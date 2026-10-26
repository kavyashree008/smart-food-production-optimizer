import { api } from "./api.js";

export const rawMaterialsApi = {
  getAll: () => api.get("/raw-materials"),
  getById: (id) => api.get(`/raw-materials/${id}`),
  create: (data) => api.post("/raw-materials", data),
  update: (id, data) => api.put(`/raw-materials/${id}`, data),
  delete: (id) => api.delete(`/raw-materials/${id}`)
};