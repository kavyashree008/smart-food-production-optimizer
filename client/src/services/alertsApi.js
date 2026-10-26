import { api } from "./api.js";

export const alertsApi = {
  getAll: (params) => api.get("/alerts", { params }),
  markRead: (id) => api.patch(`/alerts/${id}/read`),
  markAllRead: () => api.patch("/alerts/read-all")
};