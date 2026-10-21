import { NextResponse } from "next/server";
import { deleteBlog, getBlogBySlug, saveBlog } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const blog = await getBlogBySlug(id);
    if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    return NextResponse.json({ blog });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch blog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await saveBlog({ ...body, id });
    return NextResponse.json({ success: true, blog: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update blog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const deleted = await deleteBlog(id);
    if (!deleted) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete blog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
