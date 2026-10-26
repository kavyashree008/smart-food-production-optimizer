import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Connects to MongoDB database with auto-reconnect capability
 */
export async function connectDatabase() {
  try {
    const connection = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    
    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Reconnection pending...");
    });

    return connection;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    throw error;
  }
}

/**
 * Closes the active database connection
 */
export async function disconnectDatabase() {
  await mongoose.disconnect();
}
