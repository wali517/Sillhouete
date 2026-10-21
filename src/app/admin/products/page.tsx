"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/format";

const CATEGORIES = [
  "All",
  "Luxury Pret",
  "Formal",
  "Bridal",
  "Pret",
  "Silk Solids",
  "Accessories",
];

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "Custom Size"];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("Luxury Pret");
  const [image, setImage] = useState("");
  const [hoverImage, setHoverImage] = useState("");
  const [description, setDescription] = useState("");
  const [fabric, setFabric] = useState("Pure Raw Silk / Chiffon");
  const [sizes, setSizes] = useState<string[]>(["XS", "S", "M", "L", "XL"]);
  const [inStock, setInStock] = useState(true);
  const [isNew, setIsNew] = useState(true);

  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setTitle("");
    setHandle("");
    setPrice("");
    setOriginalPrice("");
    setCategory("Luxury Pret");
    setImage("https://sillhouete.com/cdn/shop/files/sillhouete-formal-iris-royal-blue-intricate-embroidery.jpg?v=1776742287");
    setHoverImage("https://sillhouete.com/cdn/shop/files/sillhouete-formal-name-color-intricate-embroidery-back.jpg?v=1776742287");
    setDescription("");
    setFabric("Pure Raw Silk / Chiffon");
    setSizes(["XS", "S", "M", "L", "XL"]);
    setInStock(true);
    setIsNew(true);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setHandle(p.handle);
    setPrice(p.price.toString());
    setOriginalPrice(p.originalPrice ? p.originalPrice.toString() : "");
    setCategory(p.category || "Luxury Pret");
    setImage(p.image);
    setHoverImage(p.hoverImage);
    setDescription(p.description || p.alt || "");
    setFabric(p.fabric || "Pure Raw Silk / Chiffon");
    setSizes(p.sizes || ["XS", "S", "M", "L", "XL"]);
    setInStock(p.inStock !== false);
    setIsNew(!!p.isNew);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, productTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${productTitle}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete product");
      }
    } catch {
      alert("Error deleting product");
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingProduct) {
      setHandle(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const toggleSize = (s: string) => {
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !price) {
      setFormError("Title and price are required.");
      return;
    }

    setFormSubmitting(true);

    const payload = {
      title: title.trim(),
      handle: handle.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category,
      image: image.trim(),
      hoverImage: hoverImage.trim() || image.trim(),
      description: description.trim(),
      fabric: fabric.trim(),
      sizes,
      inStock,
      isNew,
      alt: title.trim(),
    };

    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? data.product : p)));
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
        setProducts((prev) => [data.product, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchCategory =
      categoryFilter === "All" ||
      (p.category && p.category.toLowerCase().includes(categoryFilter.toLowerCase()));
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(q) ||
      p.handle.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q));
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products Catalog</h1>
          <p className="text-sm text-gray-500">
            Manage dresses, collections, inventory, pricing, and variants.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product title, handle, or SKU..."
            className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-4 text-xs outline-none focus:border-black"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No products found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 uppercase tracking-wider text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Sizes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
                          <Image
                            src={p.image}
                            alt={p.title}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block text-sm">{p.title}</span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {p.sku || `SLH-${p.handle.toUpperCase()}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="rounded bg-gray-100 px-2 py-1 font-medium text-gray-700">
                        {p.category || "Luxury Pret"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 text-sm">{formatPrice(p.price)}</div>
                      {p.originalPrice && (
                        <div className="text-[11px] text-gray-400 line-through">
                          {formatPrice(p.originalPrice)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(p.sizes || ALL_SIZES.slice(0, 5)).map((s) => (
                          <span
                            key={s}
                            className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-600"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            p.inStock !== false ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        <span className="text-gray-700">
                          {p.inStock !== false ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${p.handle}`}
                          target="_blank"
                          className="rounded p-1 text-gray-400 hover:text-black hover:bg-gray-100"
                          title="View on Storefront"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.title)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProduct ? `Edit Product: ${editingProduct.title}` : "Add New Designer Dress"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Iris Royal Blue"
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    URL Handle (slug) *
                  </label>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="e.g. iris-royal-blue"
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="44900"
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Original Price (for Sale)
                  </label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="54900"
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black bg-white"
                  >
                    <option value="Luxury Pret">Luxury Pret</option>
                    <option value="Formal">Formal</option>
                    <option value="Bridal">Bridal</option>
                    <option value="Pret">Pret</option>
                    <option value="Silk Solids">Silk Solids</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Main Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Hover Image URL
                  </label>
                  <input
                    type="url"
                    value={hoverImage}
                    onChange={(e) => setHoverImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Fabric &amp; Details
                </label>
                <input
                  type="text"
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                  placeholder="e.g. 100% Pure Raw Silk with Hand Zardozi &amp; Dabka Work"
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the dress cut, embroidery, occasion and styling tips..."
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ALL_SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`rounded px-3 py-1.5 font-bold uppercase transition-colors ${
                        sizes.includes(s)
                          ? "bg-black text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <span>In Stock (Available to Order)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <span>Mark as &quot;New Arrival&quot;</span>
                </label>
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded bg-red-50 p-2.5 text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-md bg-black px-6 py-2 font-bold uppercase tracking-wider text-white hover:bg-gray-800"
                >
                  {formSubmitting ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
