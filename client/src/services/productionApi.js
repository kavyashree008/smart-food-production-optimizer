import { api } from "./api.js";

export const productionApi = {
  getSchedule: () => api.get("/production/schedule"),
  scheduleRecommended: () => api.post("/production/schedule-recommended"),
  startJob: (id) => api.patch(`/production/${id}/start`),
  updateProgress: (id, data) => api.patch(`/production/${id}/progress`, data),
  completeJob: (id) => api.patch(`/production/${id}/complete`)
};