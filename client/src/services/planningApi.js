import { api } from "./api.js";

export const planningApi = {
  getRecommendations: () => api.get("/planning/recommendations"),
  runEngine: (data) => api.post("/planning/run", data),
  acceptPlan: (id) => api.post(`/planning/${id}/accept`),
  modifyPlan: (id, data) => api.post(`/planning/${id}/modify`, data),
  rejectPlan: (id, data) => api.post(`/planning/${id}/reject`, data),
  getPlanHistory: (id) => api.get(`/planning/${id}/history`)
};