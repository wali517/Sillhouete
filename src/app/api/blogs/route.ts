import { NextResponse } from "next/server";
import { getBlogs, saveBlog } from "@/lib/db";

export async function GET() {
  try {
    const blogs = await getBlogs();
    return NextResponse.json({ blogs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch blogs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title || !body.content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const saved = await saveBlog(body);
    return NextResponse.json({ success: true, blog: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create blog post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
