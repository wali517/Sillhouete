import { NextResponse } from "next/server";
import { getGridFSFile } from "@/lib/gridfs";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    // Strip optional filename suffix if present (e.g. /api/uploads/123/video.mp4)
    const cleanId = id.split("/")[0].split(".")[0];

    const rangeHeader = req.headers.get("range");

    if (rangeHeader) {
      // 1. Get file metadata to determine length
      const fileMeta = await getGridFSFile(cleanId);
      if (!fileMeta) {
        return new NextResponse("File not found", { status: 404 });
      }

      const fileSize = fileMeta.doc.length;
      const metadata = fileMeta.doc.metadata as { contentType?: string } | undefined;
      const contentType = metadata?.contentType || "video/mp4";

      // Parse range: bytes=start-end
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      // Max 2MB range per partial request to stay safely under any Vercel response limit
      const maxEnd = Math.min(start + 2 * 1024 * 1024 - 1, fileSize - 1);
      const end = parts[1] ? Math.min(parseInt(parts[1], 10), maxEnd) : maxEnd;

      if (isNaN(start) || start >= fileSize) {
        return new NextResponse("Requested range not satisfiable", {
          status: 416,
          headers: { "Content-Range": `bytes */${fileSize}` },
        });
      }

      const rangeFile = await getGridFSFile(cleanId, { start, end });
      if (!rangeFile) {
        return new NextResponse("File not found", { status: 404 });
      }

      const chunks: Buffer[] = [];
      for await (const chunk of rangeFile.stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const rangeBuffer = Buffer.concat(chunks);

      return new NextResponse(rangeBuffer, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${start + rangeBuffer.length - 1}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(rangeBuffer.length),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Standard full-file download (e.g. images)
    const file = await getGridFSFile(cleanId);
    if (!file) {
      return new NextResponse("File not found", { status: 404 });
    }

    const { doc, stream } = file;
    const metadata = doc.metadata as { contentType?: string } | undefined;
    const contentType = metadata?.contentType || "application/octet-stream";

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (err: unknown) {
    console.error("Error serving upload:", err);
    return new NextResponse("Failed to load file", { status: 500 });
  }
}
