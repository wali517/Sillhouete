"use client";

import { useEffect, useState, type FormEvent, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FolderTree,
  ExternalLink,
  UploadCloud,
  Loader2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

interface CategoryItem {
  handle: string;
  title: string;
  description?: string;
  image?: string;
  productCount?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setTitle("");
    setHandle("");
    setDescription("");
    setImage("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setTitle(cat.title);
    setHandle(cat.handle);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingCategory) {
      setHandle(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  // Direct desktop image upload for category
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (data.url) {
        setImage(data.url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image from desktop";
      alert(msg);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (catHandle: string, catTitle: string) => {
    if (!confirm(`Are you sure you want to delete category "${catTitle}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${catHandle}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.handle !== catHandle));
      } else {
        alert("Failed to delete category");
      }
    } catch {
      alert("Error deleting category");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Category title is required.");
      return;
    }

    const finalHandle =
      handle.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    setFormSubmitting(true);

    const payload = {
      title: title.trim(),
      handle: finalHandle,
      description: description.trim(),
      image: image.trim(),
    };

    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.handle}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");

        setCategories((prev) =>
          prev.map((c) => (c.handle === editingCategory.handle ? data.category : c))
        );
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");

        setCategories((prev) => [data.category, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.handle.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-black" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Category Management
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Add, edit, and organize product categories and collections across your store and homepage.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search categories by name or URL handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-black"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium whitespace-nowrap pr-2">
          {filteredCategories.length} Categories
        </div>
      </div>

      {/* Categories Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-black" />
            Loading categories from MongoDB...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No categories found matching &ldquo;{search}&rdquo;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 uppercase tracking-wider text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">URL Handle</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Products</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((cat) => (
                  <tr key={cat.handle} className="hover:bg-gray-50/75 transition-colors">
                    {/* Item Image & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100 border border-gray-200">
                          {cat.image ? (
                            <Image
                              src={cat.image}
                              alt={cat.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <FolderTree className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">
                          {cat.title}
                        </span>
                      </div>
                    </td>

                    {/* Handle / Storefront link */}
                    <td className="py-3 px-4">
                      <Link
                        href={`/collections/${cat.handle}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-600 hover:underline"
                        title="View collection page"
                      >
                        /collections/{cat.handle}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-xs truncate text-gray-500">
                      {cat.description || "—"}
                    </td>

                    {/* Products count */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                        {cat.productCount ?? 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
                          title="Edit Category"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.handle, cat.title)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete Category"
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

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingCategory ? `Edit Category: ${editingCategory.title}` : "Add New Category"}
            </h2>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Category Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Luxury Velvet Formals"
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  URL Handle (Slug) *
                </label>
                <input
                  type="text"
                  required
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="luxury-velvet-formals"
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this collection..."
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black text-xs"
                />
              </div>

              {/* Direct Desktop Image Upload */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Category Banner / Image (Upload from Desktop)
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="cat-image-file"
                  />
                  <label
                    htmlFor="cat-image-file"
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4" />
                        Choose image from desktop
                      </>
                    )}
                  </label>

                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="Or enter image URL (https://...)"
                    className="flex-1 rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-black"
                  />
                </div>

                {image && (
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 p-2 bg-gray-50">
                    <div className="relative h-12 w-12 overflow-hidden rounded border border-gray-300 bg-white">
                      <Image src={image} alt="Preview" fill sizes="48px" className="object-cover" />
                    </div>
                    <span className="flex-1 truncate font-mono text-[11px] text-gray-600">{image}</span>
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || uploadingImage}
                  className="inline-flex items-center gap-2 rounded-md bg-black px-5 py-2 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingCategory ? "Update Category" : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
