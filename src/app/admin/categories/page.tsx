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
  Home,
  Layers,
} from "lucide-react";
import type { CategoryItem } from "@/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "main" | "sub">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [isMainCategory, setIsMainCategory] = useState(true);
  const [parentHandle, setParentHandle] = useState("");
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [showUrlInput, setShowUrlInput] = useState(false);

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
    setIsMainCategory(true);
    setParentHandle("");
    setShowOnHomepage(true);
    setShowUrlInput(false);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setTitle(cat.title);
    setHandle(cat.handle);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    const isMain = cat.isMainCategory !== undefined ? cat.isMainCategory : !cat.parentHandle;
    setIsMainCategory(isMain);
    setParentHandle(cat.parentHandle || "");
    setShowOnHomepage(cat.showOnHomepage !== undefined ? cat.showOnHomepage : isMain);
    setShowUrlInput(false);
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
      isMainCategory,
      parentHandle: isMainCategory ? "" : parentHandle.trim(),
      showOnHomepage: isMainCategory ? showOnHomepage : false,
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

  const handleToggleHomepage = async (cat: CategoryItem) => {
    const newIsMain = !cat.isMainCategory;
    const newShowOnHome = newIsMain;
    const newParent = newIsMain ? "" : (cat.parentHandle || "formal-dresses");

    try {
      const res = await fetch(`/api/categories/${cat.handle}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isMainCategory: newIsMain,
          showOnHomepage: newShowOnHome,
          parentHandle: newParent,
        }),
      });
      const data = await res.json();
      if (res.ok && data.category) {
        setCategories((prev) =>
          prev.map((c) => (c.handle === cat.handle ? data.category : c))
        );
      }
    } catch {
      alert("Failed to update category status");
    }
  };

  const mainCategoriesCount = categories.filter((c) => c.isMainCategory || c.showOnHomepage).length;
  const subCategoriesCount = categories.filter((c) => !c.isMainCategory && !c.showOnHomepage).length;

  const filteredCategories = categories.filter((c) => {
    const isMain = c.isMainCategory || c.showOnHomepage;
    if (filterTab === "main" && !isMain) return false;
    if (filterTab === "sub" && isMain) return false;

    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.handle.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.parentHandle && c.parentHandle.toLowerCase().includes(q))
    );
  });

  // Potential parent categories (categories that are main or have no parent)
  const potentialParents = categories.filter(
    (c) => c.handle !== editingCategory?.handle && (c.isMainCategory || !c.parentHandle)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-black" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Category &amp; Sub-Category Management
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Organize main categories and subcategories. Main categories automatically show directly on the homepage.
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
            placeholder="Search categories by name, slug, or parent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-black"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium whitespace-nowrap pr-2">
          {filteredCategories.length} Categories
        </div>
      </div>

      {/* Category Tabs: All / Main (Homepage) / Sub-Categories */}
      <div className="flex gap-2 border-b border-gray-200 pb-1 flex-wrap">
        <button
          type="button"
          onClick={() => setFilterTab("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filterTab === "all"
              ? "bg-black text-white shadow-xs"
              : "text-gray-600 hover:text-black hover:bg-gray-100"
          }`}
        >
          All Categories ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("main")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filterTab === "main"
              ? "bg-black text-white shadow-xs"
              : "text-gray-600 hover:text-black hover:bg-gray-100"
          }`}
        >
          <Home className="h-3.5 w-3.5" />
          Main Categories (Homepage) ({mainCategoriesCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("sub")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filterTab === "sub"
              ? "bg-black text-white shadow-xs"
              : "text-gray-600 hover:text-black hover:bg-gray-100"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Sub-Categories ({subCategoriesCount})
        </button>
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
                  <th className="py-3 px-4">Type / Hierarchy</th>
                  <th className="py-3 px-4 text-center">Homepage</th>
                  <th className="py-3 px-4">URL Handle</th>
                  <th className="py-3 px-4 text-center">Products</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCategories.map((cat) => {
                  const isMain = cat.isMainCategory !== undefined ? cat.isMainCategory : !cat.parentHandle;
                  const parentCat = cat.parentHandle ? categories.find((c) => c.handle === cat.parentHandle) : null;

                  return (
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
                          <div>
                            <span className="font-semibold text-gray-900 text-sm block">
                              {cat.title}
                            </span>
                            {cat.description && (
                              <span className="text-[11px] text-gray-400 max-w-xs truncate block">
                                {cat.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Hierarchy Badge */}
                      <td className="py-3 px-4">
                        {isMain ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-black text-white px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                            <Layers className="h-3 w-3" />
                            Main Category
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[10px] font-medium">
                            Sub-Category of{" "}
                            <strong>{parentCat ? parentCat.title : cat.parentHandle}</strong>
                          </span>
                        )}
                      </td>

                      {/* Homepage Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleHomepage(cat)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-all ${
                            cat.showOnHomepage
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-xs"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"
                          }`}
                          title="Click to toggle Homepage display"
                        >
                          <Home className="h-3 w-3" />
                          <span>{cat.showOnHomepage ? "Shows on Homepage" : "Hidden from Homepage"}</span>
                        </button>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl my-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {editingCategory ? `Edit Category: ${editingCategory.title}` : "Add New Category"}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Categories without a parent automatically display directly on the homepage as their own collection section.
            </p>

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

              {/* Hierarchy Selection */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 space-y-3">
                <label className="block font-semibold uppercase tracking-wider text-gray-800 text-[11px]">
                  Category Type &amp; Hierarchy
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isMainCategory
                        ? "bg-white border-black shadow-xs text-black"
                        : "bg-transparent border-gray-200 text-gray-600 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="catType"
                      checked={isMainCategory}
                      onChange={() => {
                        setIsMainCategory(true);
                        setParentHandle("");
                        setShowOnHomepage(true);
                      }}
                      className="mt-0.5 accent-black"
                    />
                    <div>
                      <span className="font-bold text-xs block">Main Category</span>
                      <span className="text-[10px] text-gray-500 block leading-tight">
                        Displays directly on homepage
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      !isMainCategory
                        ? "bg-white border-black shadow-xs text-black"
                        : "bg-transparent border-gray-200 text-gray-600 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="catType"
                      checked={!isMainCategory}
                      onChange={() => {
                        setIsMainCategory(false);
                        setShowOnHomepage(false);
                      }}
                      className="mt-0.5 accent-black"
                    />
                    <div>
                      <span className="font-bold text-xs block">Sub-Category</span>
                      <span className="text-[10px] text-gray-500 block leading-tight">
                        Belongs to a main category
                      </span>
                    </div>
                  </label>
                </div>

                {!isMainCategory && (
                  <div className="pt-2">
                    <label className="block font-semibold text-gray-700 text-[11px] mb-1">
                      Choose Parent Category *
                    </label>
                    <select
                      value={parentHandle}
                      onChange={(e) => setParentHandle(e.target.value)}
                      required={!isMainCategory}
                      className="w-full rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-black bg-white"
                    >
                      <option value="">-- Select Parent Category --</option>
                      {potentialParents.map((p) => (
                        <option key={p.handle} value={p.handle}>
                          {p.title} (/collections/{p.handle})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isMainCategory && (
                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnHomepage}
                      onChange={(e) => setShowOnHomepage(e.target.checked)}
                      className="h-4 w-4 accent-black rounded"
                    />
                    <span className="text-xs font-medium text-gray-700">
                      Show this main category section on the Homepage
                    </span>
                  </label>
                )}
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
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black text-xs resize-none"
                />
              </div>

              {/* Direct Desktop Image Upload (No URL required!) */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Category Banner / Image
                </label>

                <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 text-center hover:border-gray-400 transition-colors bg-gray-50/50">
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
                    className="inline-flex flex-col items-center justify-center gap-2 cursor-pointer w-full py-2"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-7 w-7 animate-spin text-black" />
                        <span className="font-semibold text-xs text-gray-700">Uploading from desktop...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-7 w-7 text-gray-600" />
                        <span className="font-bold text-xs text-gray-900">
                          Click to upload image directly from computer
                        </span>
                        <span className="text-[11px] text-gray-500">
                          PNG, JPG, WEBP up to 25MB (Saved to database)
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {image && (
                  <div className="mt-2.5 flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 bg-white shadow-xs">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-gray-300 bg-gray-100">
                      <Image src={image} alt="Preview" fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-gray-800 block">Uploaded Image Preview</span>
                      <span className="truncate font-mono text-[10px] text-gray-400 block">{image}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Optional URL Toggle */}
                <div className="mt-2 text-right">
                  {!showUrlInput ? (
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(true)}
                      className="text-[11px] text-gray-500 hover:text-black underline cursor-pointer"
                    >
                      Or paste an external image URL
                    </button>
                  ) : (
                    <div className="mt-1 flex items-center gap-2 text-left">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1"
                      >
                        Hide
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || uploadingImage}
                  className="inline-flex items-center gap-2 rounded-md bg-black px-5 py-2 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
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
