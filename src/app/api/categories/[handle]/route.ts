import { NextResponse } from "next/server";
import { getCollectionByHandle, saveCollection, deleteCategorySafely } from "@/lib/db";

type Props = { params: Promise<{ handle: string }> };

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: Props) {
  try {
    const { handle } = await params;
    const category = await getCollectionByHandle(handle);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, category });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Props) {
  try {
    const { handle } = await params;
    const body = await req.json();

    const isMain =
      body.isMainCategory !== undefined
        ? Boolean(body.isMainCategory)
        : !body.parentHandle;

    if (!isMain && !body.parentHandle && !body.mainCategoryId) {
      return NextResponse.json(
        { error: "Subcategory must have a parent Main Category." },
        { status: 400 }
      );
    }

    const updated = await saveCollection({
      ...body,
      handle,
      isMainCategory: isMain,
    });
    return NextResponse.json({ success: true, category: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Props) {
  try {
    const { handle } = await params;
    await deleteCategorySafely(handle);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete category";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
