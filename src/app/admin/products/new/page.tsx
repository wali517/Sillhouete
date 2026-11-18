import type { Metadata } from "next";
import ProductForm from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "New Product | Admin Dashboard – Sillhouete",
};

export default function AdminNewProductPage() {
  return (
    <div className="py-2">
      <ProductForm isEdit={false} />
    </div>
  );
}

