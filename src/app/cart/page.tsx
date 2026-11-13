import { getProducts } from "@/lib/db";
import CartView from "@/components/cart/CartView";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Your Shopping Cart – Sillhouete",
  description: "Review and complete your Sillhouete luxury designer wear order.",
};

export default async function CartPage() {
  let recentProducts: Product[] = [];
  try {
    const all = await getProducts();
    recentProducts = all.slice(0, 5);
  } catch {
    recentProducts = [];
  }

  return <CartView initialRecentProducts={recentProducts} />;
}
