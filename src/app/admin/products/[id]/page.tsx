import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductForm from "@/components/admin/ProductForm";
import { getProductById, getProductByHandle } from "@/lib/db";

export const metadata: Metadata = {
  title: "Edit Product | Admin Dashboard – Sillhouete",
};

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params;
  let product = null;

  try {
    product = (await getProductById(id)) || (await getProductByHandle(id));
  } catch {
    // fallback
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="py-2">
      <ProductForm initialProduct={product} isEdit={true} />
    </div>
  );
}

