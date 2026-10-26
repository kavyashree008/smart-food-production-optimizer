import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import rawMaterialRoutes from "./routes/rawMaterialRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import festivalRoutes from "./routes/festivalRoutes.js";
import planningRoutes from "./routes/planningRoutes.js";
import demandRoutes from "./routes/demandRoutes.js";
import productionRoutes from "./routes/productionRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import simulatorRoutes from "./routes/simulatorRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: [env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"], credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 1000,
  message: { success: false, message: "Too many requests. Please try again after 15 minutes." },
  standardHeaders: true, legacyHeaders: false
});
app.use("/api", limiter);

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "Smart Food Production Optimizer API", timestamp: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/raw-materials", rawMaterialRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/festivals", festivalRoutes);
app.use("/api/planning", planningRoutes);
app.use("/api/demand", demandRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/simulator", simulatorRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/export", exportRoutes);

app.use("/api/*", (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

export default app;