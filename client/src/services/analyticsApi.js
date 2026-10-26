import { api } from "./api.js";

export const analyticsApi = {
  getSummary: () => api.get("/analytics/summary"),
  getWaste: () => api.get("/analytics/waste"),
  getDemand: (productId) => api.get(`/demand/${productId}`)
};