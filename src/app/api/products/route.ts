import { NextResponse } from "next/server";
import { getProducts, saveProduct, searchProducts } from "@/lib/db";
import { runSeedIfEmpty } from "@/lib/seed";

export async function GET(req: Request) {
  try {
    await runSeedIfEmpty();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "0", 10);

    let products;

    if (search) {
      products = await searchProducts(search);
    } else {
      products = await getProducts();
    }

    if (category && category !== "All") {
      products = products.filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (limit > 0) products = products.slice(0, limit);

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
