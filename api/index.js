import mongoose from "mongoose";
import app from "../server/src/app.js";

let isConnecting = false;

async function connectToMongo() {
  if (mongoose.connection.readyState >= 1) return;
  if (isConnecting) return;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("MONGO_URI not set yet in environment variables.");
    return;
  }

  try {
    isConnecting = true;
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("Connected to MongoDB via Vercel Serverless Function");
  } catch (err) {
    console.error("MongoDB Atlas connection error:", err.message);
  } finally {
    isConnecting = false;
  }
}

export default async function handler(req, res) {
  await connectToMongo();
  return app(req, res);
}
