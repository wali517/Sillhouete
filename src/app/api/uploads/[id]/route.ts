import { NextResponse } from "next/server";
import { getGridFSFile } from "@/lib/gridfs";
import { Readable } from "stream";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    // Strip optional filename suffix if present (e.g. /api/uploads/123/photo.jpg)
    const cleanId = id.split("/")[0].split(".")[0];

    const file = await getGridFSFile(cleanId);
    if (!file) {
      return new NextResponse("File not found", { status: 404 });
    }

    const { doc, stream } = file;
    const metadata = doc.metadata as { contentType?: string } | undefined;
    const contentType = metadata?.contentType || "application/octet-stream";

    // Read full stream into buffer - completely reliable on Vercel serverless
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
