import { NextResponse } from "next/server";
import { uploadBufferToGridFS } from "@/lib/gridfs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files: File[] = [];

    // Support both 'file' (single) and 'files' (multiple)
    const single = formData.get("file");
    if (single && typeof single === "object" && "arrayBuffer" in single) {
      files.push(single as File);
    }

    const multi = formData.getAll("files");
    for (const f of multi) {
      if (f && typeof f === "object" && "arrayBuffer" in f) {
        files.push(f as File);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const results = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = file.type || "application/octet-stream";
      const filename = file.name || "upload";

      const uploaded = await uploadBufferToGridFS(filename, contentType, buffer);
      results.push(uploaded);
    }

    return NextResponse.json({
      success: true,
      url: results[0]?.url,
      file: results[0],
      urls: results.map((r) => r.url),
      files: results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload file";
    console.error("Upload error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
