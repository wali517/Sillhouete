import { NextResponse } from "next/server";
import { getBlogBySlug, saveBlog, deleteBlog } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const blog = await getBlogBySlug(id);
    if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    return NextResponse.json({ blog });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch blog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    if (!body.title || !body.content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }
    const blog = await saveBlog({ ...body, id });
    return NextResponse.json({ success: true, blog });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update blog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const ok = await deleteBlog(id);
    if (!ok) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete blog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
