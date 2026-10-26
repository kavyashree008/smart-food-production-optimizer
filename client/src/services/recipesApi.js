import { api } from "./api.js";

export const recipesApi = {
  getAll: () => api.get("/recipes"),
  getByProduct: (productId) => api.get(`/recipes/product/${productId}`),
  create: (data) => api.post("/recipes", data),
  update: (id, data) => api.put(`/recipes/${id}`, data)
};