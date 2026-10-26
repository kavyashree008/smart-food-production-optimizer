import { api } from "./api.js";

export const aiApi = {
  chat: (messages) => api.post("/ai/chat", { messages }),
  explainPlan: (planId) => api.post(`/ai/explain/${planId}`)
};