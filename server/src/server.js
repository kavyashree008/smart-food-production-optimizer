import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cron from "node-cron";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: [env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"], methods: ["GET", "POST", "PATCH", "DELETE"] }
});

io.on("connection", (socket) => {
  socket.on("join", (room) => socket.join(room));
});

app.set("io", io);

async function startServer() {
  try {
    await connectDatabase();
    console.log(`Connected to MongoDB at ${env.MONGO_URI}`);

    server.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Nightly planning engine re-run at 1:00 AM
    cron.schedule("0 1 * * *", async () => {
      console.log("[CRON] Nightly planning engine triggered at 1 AM");
      try {
        const { runPlanningEngine } = await import("./services/planningEngine/replan.js");
        await runPlanningEngine({ changeReason: "Nightly automated re-plan", io });
      } catch (err) {
        console.error("[CRON] Nightly replan failed:", err.message);
      }
    });

    // Every 3 hours: check for expiring batches and create alerts
    cron.schedule("0 */3 * * *", async () => {
      try {
        const { Batch } = await import("./models/Batch.js");
        const { Alert } = await import("./models/Alert.js");
        const today = new Date();
        const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const expiring = await Batch.find({
          status: "active", remainingQty: { $gt: 0 }, expiryDate: { $gte: today, $lte: in7Days }
        }).populate("rawMaterialId", "name unit");

        for (const batch of expiring) {
          const daysLeft = Math.round((new Date(batch.expiryDate) - today) / (1000 * 60 * 60 * 24));
          const severity = daysLeft <= 3 ? "critical" : "warning";

          const exists = await Alert.findOne({ relatedId: batch._id, isRead: false, type: "expiry" });
          if (!exists) {
            const newAlert = await Alert.create({
              type: "expiry", severity,
              message: `Batch ${batch.batchNo} (${batch.rawMaterialId?.name}, ${batch.remainingQty} ${batch.rawMaterialId?.unit}) expires in ${daysLeft} days. Use it or face loss.`,
              relatedId: batch._id
            });
            io.emit("alert:new", newAlert);
          }
        }
      } catch (err) {
        console.error("[CRON] Expiry alert check failed:", err.message);
      }
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();