import { NextResponse } from "next/server";
import {
  getMainCategories,
  getSubcategories,
  getCollections,
  saveCollection,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parent = searchParams.get("parent");
    const activeOnly = searchParams.get("active") === "true";
    const all = searchParams.get("all") === "true";

    // 1. Get subcategories for a specific parent
    if (parent) {
      const subcategories = await getSubcategories(parent, activeOnly);
      return NextResponse.json({ success: true, categories: subcategories });
    }

    // 2. Explicitly request all categories (flat)
    if (all) {
      const categories = await getCollections();
      return NextResponse.json({ success: true, categories });
    }

    // 3. Default or type=main: return ONLY Main Categories
    const mainCategories = await getMainCategories(activeOnly);
    return NextResponse.json({ success: true, categories: mainCategories });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "Category title is required" }, { status: 400 });
    }

    const isMain =
      body.isMainCategory !== undefined
        ? Boolean(body.isMainCategory)
        : !body.parentHandle;

    if (!isMain && !body.parentHandle && !body.mainCategoryId) {
      return NextResponse.json(
        { error: "Subcategory must be assigned to a parent Main Category." },
        { status: 400 }
      );
    }

    const saved = await saveCollection({
      ...body,
      isMainCategory: isMain,
    });
    return NextResponse.json({ success: true, category: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
