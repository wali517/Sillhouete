import { NextResponse } from "next/server";
import { getProducts, saveProduct } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let products = await getProducts();

    if (category) {
      products = products.filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase(),
      );
    }

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q) ||
          p.alt.toLowerCase().includes(q),
      );
    }

    return NextResponse.json({ products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title || !body.price) {
      return NextResponse.json({ error: "Title and price are required" }, { status: 400 });
    }

    const newProduct = await saveProduct(body);
    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
