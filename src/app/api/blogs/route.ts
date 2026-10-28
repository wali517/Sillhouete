import { NextResponse } from "next/server";
import { getBlogs, saveBlog } from "@/lib/db";
import { runSeedIfEmpty } from "@/lib/seed";

export async function GET() {
  try {
    await runSeedIfEmpty();
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
    const blog = await saveBlog(body);
    return NextResponse.json({ success: true, blog });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create blog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
