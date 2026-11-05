import { NextResponse } from "next/server";
import { getProducts } from "@/lib/db";
import { executePredictiveSearch } from "@/lib/predictive-search";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({ suggestions: [], pages: [], collections: [], products: [] });
    }

    const all = await getProducts();
    const result = executePredictiveSearch(q, all, 6);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to perform predictive search";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
