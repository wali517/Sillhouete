import mongoose from "mongoose";
import connectDB from "./mongodb";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

export interface UploadResult {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
}

/**
 * Upload a Buffer to MongoDB Atlas GridFS and optionally save to public/uploads
 */
export async function uploadBufferToGridFS(
  filename: string,
  contentType: string,
  buffer: Buffer
): Promise<UploadResult> {
  await connectDB();

  if (!mongoose.connection.db) {
    throw new Error("MongoDB database connection not ready");
  }

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });

  // Sanitize filename and create unique name
  const safeBase = filename.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
  const uniqueFilename = `${Date.now()}-${safeBase}`;

  // Optionally write to public/uploads for instant local static access
  try {
    const publicDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, uniqueFilename), buffer);
  } catch (err) {
    // Non-fatal if filesystem is read-only (e.g. Vercel serverless)
    console.warn("Could not save to local filesystem, persisting to GridFS:", err);
  }

  // Upload to GridFS
  const uploadStream = bucket.openUploadStream(uniqueFilename, {
    metadata: { contentType, originalName: filename, uploadedAt: new Date() },
  });

  await new Promise<void>((resolve, reject) => {
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);

    readable
      .pipe(uploadStream)
      .on("finish", () => resolve())
      .on("error", (err) => reject(err));
  });

  const fileId = uploadStream.id.toString();
  const url = `/api/uploads/${fileId}`;

  return {
    id: fileId,
    filename: uniqueFilename,
    contentType,
    size: buffer.length,
    url,
  };
}

/**
 * Retrieve file stream and metadata from GridFS by ID
 */
export async function getGridFSFile(id: string) {
  await connectDB();

  if (!mongoose.connection.db) {
    throw new Error("MongoDB database connection not ready");
  }

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });

  let objectId: mongoose.Types.ObjectId;
  try {
    objectId = new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }

  const files = await bucket.find({ _id: objectId }).toArray();
  if (!files || files.length === 0) {
    return null;
  }

  const fileDoc = files[0];
  const downloadStream = bucket.openDownloadStream(objectId);

  return {
    doc: fileDoc,
    stream: downloadStream,
  };
}
