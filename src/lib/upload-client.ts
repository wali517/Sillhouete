/**
 * Reliable file uploader for Sillhouete that automatically handles:
 * 1. Small files (<= 3.5MB): fast single POST to /api/upload
 * 2. Large files / Videos (> 3.5MB): sliced 2MB chunked uploads to /api/upload/chunk
 *    which completely bypasses Vercel's 4.5MB request entity size limit.
 * 3. Graceful error handling that never crashes on HTML/plain-text 413 responses.
 */

export interface UploadOptions {
  onProgress?: (progressPct: number, message?: string) => void;
}

export interface UploadResponse {
  url: string;
  id?: string;
  filename?: string;
}

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk (safely below Vercel's 4.5MB limit)

export async function uploadFileWithChunks(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResponse> {
  const { onProgress } = options;

  // 1. If file is small (<= 3.5MB), use standard single upload
  if (file.size <= 3.5 * 1024 * 1024) {
    onProgress?.(10, "Uploading file...");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    let data: { url?: string; error?: string } = {};
    try {
      data = JSON.parse(text);
    } catch {
      // Response was plain text or HTML (e.g. Vercel proxy error)
    }

    if (!res.ok) {
      if (res.status === 413) {
        throw new Error("File exceeds server upload limit. Please try again or use a smaller file.");
      }
      throw new Error(data.error || text || `Upload failed with status ${res.status}`);
    }

    if (!data.url) {
      throw new Error("No URL returned from upload server");
    }

    onProgress?.(100, "Upload complete!");
    return { url: data.url };
  }

  // 2. Large file / Video (> 3.5MB): Slice and upload in 2MB chunks to /api/upload/chunk
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  onProgress?.(0, `Uploading large video in ${totalChunks} parts...`);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunkBlob = file.slice(start, end);

    const formData = new FormData();
    formData.append("uploadId", uploadId);
    formData.append("chunkIndex", String(chunkIndex));
    formData.append("totalChunks", String(totalChunks));
    formData.append("filename", file.name);
    formData.append("contentType", file.type || "video/mp4");
    formData.append("chunk", chunkBlob, file.name);

    const res = await fetch("/api/upload/chunk", {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      // Not JSON
    }

    if (!res.ok) {
      if (res.status === 413) {
        throw new Error(`Part ${chunkIndex + 1} of video was too large for server proxy.`);
      }
      throw new Error(data.error || text || `Part ${chunkIndex + 1} failed with status ${res.status}`);
    }

    const percent = Math.round(((chunkIndex + 1) / totalChunks) * 100);
    const isLast = chunkIndex === totalChunks - 1;

    if (!isLast) {
      onProgress?.(percent, `Uploading: ${percent}% (part ${chunkIndex + 1}/${totalChunks})`);
    } else {
      onProgress?.(99, "Processing & saving video in MongoDB GridFS...");
      if (data.url) {
        onProgress?.(100, "Video upload complete!");
        return {
          url: data.url,
          id: data.file?.id,
          filename: data.file?.filename,
        };
      }
    }
  }

  throw new Error("Video upload completed but no final URL was returned");
}

