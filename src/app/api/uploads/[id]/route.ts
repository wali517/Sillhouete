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
    const fileSize = doc.length || 0;

    // Convert Node Readable stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => {
          controller.enqueue(chunk);
        });
        stream.on("end", () => {
          controller.close();
        });
        stream.on("error", (err) => {
          controller.error(err);
        });
      },
      cancel() {
        stream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileSize),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (err: unknown) {
    console.error("Error serving upload:", err);
    return new NextResponse("Failed to load file", { status: 500 });
  }
}
