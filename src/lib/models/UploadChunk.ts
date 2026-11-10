import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUploadChunk extends Document {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  filename: string;
  contentType: string;
  data: Buffer;
  createdAt: Date;
}

const UploadChunkSchema = new Schema<IUploadChunk>(
  {
    uploadId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    totalChunks: { type: Number, required: true },
    filename: { type: String, default: "upload" },
    contentType: { type: String, default: "application/octet-stream" },
    data: { type: Buffer, required: true },
    createdAt: { type: Date, default: Date.now, expires: 7200 }, // Auto clean up after 2 hours
  },
  { timestamps: true }
);

UploadChunkSchema.index({ uploadId: 1, chunkIndex: 1 }, { unique: true });

export const UploadChunkModel: Model<IUploadChunk> =
  mongoose.models.UploadChunk ||
  mongoose.model<IUploadChunk>("UploadChunk", UploadChunkSchema);

