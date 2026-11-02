
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

let cached = global._mongooseConn;

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Check your .env.local file.");
  }

  if (cached) {
    return cached;
  }

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  cached = mongoose.connect(MONGODB_URI, opts);
  global._mongooseConn = cached;

  try {
    await cached;
    console.log("MongoDB connected successfully.");
    return cached;
  } catch (err) {
    global._mongooseConn = undefined;
    cached = undefined;
   console.error("MongoDB connection failed:", err);
    throw err;
  }
}

export default connectDB;
