import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UploadChunkModel } from "@/lib/models/UploadChunk";
import { uploadBufferToGridFS } from "@/lib/gridfs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await connectDB();
    const formData = await req.formData();

    const uploadId = formData.get("uploadId") as string;
    const chunkIndexStr = formData.get("chunkIndex") as string;
    const totalChunksStr = formData.get("totalChunks") as string;
    const filename = (formData.get("filename") as string) || "video.mp4";
    const contentType = (formData.get("contentType") as string) || "video/mp4";
    const file = formData.get("chunk") as File | null;

    if (!uploadId || chunkIndexStr === null || !totalChunksStr || !file) {
      return NextResponse.json(
        { error: "Missing required chunk upload fields (uploadId, chunkIndex, totalChunks, chunk)" },
        { status: 400 }
      );
    }

    const chunkIndex = parseInt(chunkIndexStr, 10);
    const totalChunks = parseInt(totalChunksStr, 10);

    const arrayBuffer = await file.arrayBuffer();
    const chunkBuffer = Buffer.from(arrayBuffer);

    // Save this chunk to MongoDB
    await UploadChunkModel.findOneAndUpdate(
      { uploadId, chunkIndex },
      {
        uploadId,
        chunkIndex,
        totalChunks,
        filename,
        contentType,
        data: chunkBuffer,
      },
      { upsert: true, new: true }
    );

    // Check if this is the last chunk
    const count = await UploadChunkModel.countDocuments({ uploadId });
    if (count < totalChunks) {
      // Still waiting for remaining chunks
      return NextResponse.json({
        success: true,
        completed: false,
        receivedChunks: count,
        totalChunks,
        progress: Math.round((count / totalChunks) * 100),
      });
    }

    // All chunks received! Assemble in order
    const allChunks = await UploadChunkModel.find({ uploadId })
      .sort({ chunkIndex: 1 })
      .lean();

    if (allChunks.length !== totalChunks) {
      return NextResponse.json(
        { error: `Incomplete chunks: received ${allChunks.length} of ${totalChunks}` },
        { status: 400 }
      );
    }

    // Combine all chunks into single buffer
    const buffers = allChunks.map((c) => c.data);
    const fullBuffer = Buffer.concat(buffers);

    // Upload complete file to MongoDB GridFS
    const uploaded = await uploadBufferToGridFS(filename, contentType, fullBuffer);

    // Clean up temporary chunks from MongoDB
    await UploadChunkModel.deleteMany({ uploadId });

    return NextResponse.json({
      success: true,
      completed: true,
      url: uploaded.url,
      file: uploaded,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process chunk upload";
    console.error("Chunk upload error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

