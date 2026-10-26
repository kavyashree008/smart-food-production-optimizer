import { api } from "./api.js";

export const simulatorApi = {
  run: (data) => api.post("/simulator/run", data),
  save: (data) => api.post("/simulator/save", data),
  getHistory: () => api.get("/simulator/history")
};