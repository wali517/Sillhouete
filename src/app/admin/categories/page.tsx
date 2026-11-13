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
  X,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { CategoryItem } from "@/types";
import { uploadFileWithChunks } from "@/lib/upload-client";
import AdminPagination from "@/components/admin/AdminPagination";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletons";

export default function AdminCategoriesPage() {
  // Navigation State: null = Level 1 (Main Categories list), CategoryItem = Level 2 (Subcategories of that Main Category)
  const [selectedMainCategory, setSelectedMainCategory] = useState<CategoryItem | null>(null);

  const selectCategoryView = (cat: CategoryItem | null) => {
    setSelectedMainCategory(cat);
    setCurrentPage(1);
    setSearch("");
  };

  // Main Categories state
  const [mainCategories, setMainCategories] = useState<CategoryItem[]>([]);
  const [loadingMains, setLoadingMains] = useState(true);

  // Subcategories state (for selected main category)
  const [subcategories, setSubcategories] = useState<CategoryItem[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Search filter
  const [search, setSearch] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"main" | "sub">("main");
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Main Categories
  const fetchMainCategories = async () => {
    try {
      const res = await fetch("/api/categories?type=main");
      const data = await res.json();
      if (data.categories) {
        setMainCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to load main categories:", err);
    } finally {
      setLoadingMains(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadMainCategories = async () => {
      try {
        const res = await fetch("/api/categories?type=main");
        const data = await res.json();
        if (!cancelled && data.categories) {
          setMainCategories(data.categories);
        }
      } catch (err) {
        console.error("Failed to load main categories:", err);
      } finally {
        if (!cancelled) setLoadingMains(false);
      }
    };

    void loadMainCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  // When selectedMainCategory changes, fetch its subcategories
  useEffect(() => {
    if (!selectedMainCategory) return;

    let cancelled = false;
    const loadSubcategories = async () => {
      try {
        const parentParam = selectedMainCategory.handle;
        const res = await fetch(`/api/categories?parent=${encodeURIComponent(parentParam)}`);
        const data = await res.json();
        if (!cancelled && data.categories) {
          setSubcategories(data.categories);
        }
      } catch (err) {
        console.error("Failed to load subcategories:", err);
      } finally {
        if (!cancelled) setLoadingSubs(false);
      }
    };

    void Promise.resolve().then(() => {
      if (cancelled) return;
      setLoadingSubs(true);
      return loadSubcategories();
    });
    return () => {
      cancelled = true;
    };
  }, [selectedMainCategory]);

  // Open modal for Main Category
  const openAddMainModal = () => {
    setModalMode("main");
    setEditingCategory(null);
    setTitle("");
    setHandle("");
    setDescription("");
    setImage("");
    setOrder(mainCategories.length);
    setIsActive(true);
    setShowUrlInput(false);
    setFormError("");
    setIsModalOpen(true);
  };

  // Open modal for Subcategory inside selected Main Category
  const openAddSubModal = () => {
    if (!selectedMainCategory) return;
    setModalMode("sub");
    setEditingCategory(null);
    setTitle("");
    setHandle("");
    setDescription("");
    setImage("");
    setOrder(subcategories.length);
    setIsActive(true);
    setShowUrlInput(false);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem, mode: "main" | "sub") => {
    setModalMode(mode);
    setEditingCategory(cat);
    setTitle(cat.title);
    setHandle(cat.handle);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setOrder(cat.order !== undefined ? cat.order : 0);
    setIsActive(cat.isActive !== undefined ? cat.isActive : true);
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

  // Direct desktop image upload (safe chunked & Vercel friendly)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await uploadFileWithChunks(file);
      if (res.url) {
        setImage(res.url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image from desktop";
      alert(msg);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Safe delete
  const handleDelete = async (cat: CategoryItem, mode: "main" | "sub") => {
    const typeLabel = mode === "main" ? "Main Category" : "Subcategory";
    if (!confirm(`Are you sure you want to delete ${typeLabel} "${cat.title}"?`)) return;

    setDeleteErrorMessage("");
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(cat.handle)}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setDeleteErrorMessage(data.error || `Failed to delete ${typeLabel}`);
        return;
      }

      if (mode === "main") {
        setMainCategories((prev) => prev.filter((c) => c.handle !== cat.handle));
      } else {
        setSubcategories((prev) => prev.filter((c) => c.handle !== cat.handle));
        // Refresh main category counts
        fetchMainCategories();
      }
    } catch {
      setDeleteErrorMessage(`Error connecting to server to delete ${typeLabel}`);
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (cat: CategoryItem, mode: "main" | "sub") => {
    const newActive = !(cat.isActive !== false);
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(cat.handle)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: newActive,
          isMainCategory: mode === "main",
          parentHandle: mode === "sub" ? (cat.parentHandle || selectedMainCategory?.handle) : "",
        }),
      });
      const data = await res.json();
      if (res.ok && data.category) {
        if (mode === "main") {
          setMainCategories((prev) =>
            prev.map((c) => (c.handle === cat.handle ? { ...c, isActive: newActive } : c))
          );
        } else {
          setSubcategories((prev) =>
            prev.map((c) => (c.handle === cat.handle ? { ...c, isActive: newActive } : c))
          );
        }
      }
    } catch {
      alert("Failed to update status");
    }
  };

  // Submit modal form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Category name is required.");
      return;
    }

    const finalHandle =
      handle.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    setFormSubmitting(true);

    const isMain = modalMode === "main";
    const parentH = isMain ? "" : selectedMainCategory?.handle || "";
    const parentId = isMain ? "" : String(selectedMainCategory?._id || selectedMainCategory?.id || "");

    const payload = {
      title: title.trim(),
      handle: finalHandle,
      description: description.trim(),
      image: image.trim(),
      order: Number(order) || 0,
      isActive,
      isMainCategory: isMain,
      parentHandle: parentH,
      mainCategoryId: parentId,
      showOnHomepage: isMain ? true : false,
    };

    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${encodeURIComponent(editingCategory.handle)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");

        if (isMain) {
          setMainCategories((prev) =>
            prev.map((c) => (c.handle === editingCategory.handle ? data.category : c))
          );
          if (selectedMainCategory?.handle === editingCategory.handle) {
            setSelectedMainCategory(data.category);
          }
        } else {
          setSubcategories((prev) =>
            prev.map((c) => (c.handle === editingCategory.handle ? data.category : c))
          );
          fetchMainCategories();
        }
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");

        if (isMain) {
          setMainCategories((prev) => [data.category, ...prev]);
        } else {
          setSubcategories((prev) => [data.category, ...prev]);
          fetchMainCategories();
        }
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter lists based on search
  const filteredMainCategories = mainCategories.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q);
  });

  const filteredSubcategories = subcategories.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.handle.toLowerCase().includes(q);
  });

  const paginatedMainCategories = filteredMainCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedSubcategories = filteredSubcategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Global Error Banner */}
      {deleteErrorMessage && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span className="font-medium">{deleteErrorMessage}</span>
          </div>
          <button
            onClick={() => setDeleteErrorMessage("")}
            className="rounded p-1 text-red-500 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {selectedMainCategory ? (
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <button
                  onClick={() => selectCategoryView(null)}
                  className="hover:text-black flex items-center gap-1 font-medium text-gray-600 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Main Categories
                </button>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-black font-semibold">{selectedMainCategory.title}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Subcategories</span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">
                {selectedMainCategory.title} — Subcategories
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage subcategories nested strictly inside &quot;{selectedMainCategory.title}&quot;.
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">
                Main Categories
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Top-level storefront main categories. Click &quot;Manage Subcategories&quot; to view or add subcategories.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selectedMainCategory ? (
            <>
              <button
                onClick={() => selectCategoryView(null)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Main Categories
              </button>
              <button
                onClick={openAddSubModal}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Subcategory
              </button>
            </>
          ) : (
            <button
              onClick={openAddMainModal}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Main Category
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              selectedMainCategory
                ? `Search subcategories in ${selectedMainCategory.title}...`
                : "Search main categories by name or slug..."
            }
            className="w-full rounded-lg border-0 bg-transparent pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-0 placeholder:text-gray-400"
          />
        </div>
        <span className="text-xs text-gray-400 pr-2">
          {selectedMainCategory
            ? `${filteredSubcategories.length} subcategories`
            : `${filteredMainCategories.length} main categories`}
        </span>
      </div>

      {/* ──────────────── LEVEL 1: MAIN CATEGORIES TABLE ──────────────── */}
      {!selectedMainCategory && (
        <>
          {loadingMains ? (
            <AdminTableSkeleton
              columns={["Order", "Category", "Slug", "Direct Products", "Subcategories", "Status", "Actions"]}
              rows={6}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
              {filteredMainCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <FolderTree className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-base font-medium text-gray-900">No Main Categories found</h3>
              <p className="mt-1 text-sm text-gray-500 max-w-sm">
                Get started by creating your first Main Category (e.g. Women, Men, Kids, Accessories).
              </p>
              <button
                onClick={openAddMainModal}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Add Main Category
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                  <tr>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Slug</th>
                    <th className="px-4 py-3.5 text-center">Subcategories</th>
                    <th className="px-4 py-3.5 text-center">Products</th>
                    <th className="px-4 py-3.5 text-center">Order</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedMainCategories.map((cat) => {
                    const isAct = cat.isActive !== false;
                    const subCount = cat.subcategoriesCount ?? 0;
                    const prodCount = cat.productCount ?? 0;

                    return (
                      <tr key={cat.handle} className="hover:bg-gray-50/80 transition-colors">
                        {/* Image + Title */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
                              {cat.image ? (
                                <Image
                                  src={cat.image}
                                  alt={cat.title}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-300">
                                  <Layers className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{cat.title}</div>
                              {cat.description && (
                                <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">
                                  {cat.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Slug */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            /{cat.handle}
                          </span>
                        </td>

                        {/* Subcategories count pill */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => selectCategoryView(cat)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                            title="Click to view & manage subcategories"
                          >
                            <FolderTree className="h-3.5 w-3.5" />
                            {subCount} {subCount === 1 ? "subcategory" : "subcategories"}
                          </button>
                        </td>

                        {/* Product count */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                            {prodCount}
                          </span>
                        </td>

                        {/* Display Order */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-xs text-gray-500 font-mono">{cat.order ?? 0}</span>
                        </td>

                        {/* Status Toggle */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleToggleActive(cat, "main")}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                              isAct
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {isAct ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5 text-gray-400" /> Inactive
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Manage Subcategories Button */}
                            <button
                              onClick={() => selectCategoryView(cat)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 shadow-xs hover:bg-gray-50 hover:border-black transition-colors"
                              title="Manage Subcategories inside this category"
                            >
                              <FolderTree className="h-3.5 w-3.5 text-blue-600" />
                              Manage Subcategories
                            </button>

                            {/* View Live */}
                            <Link
                              href={`/collections/${cat.handle}`}
                              target="_blank"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black transition-colors"
                              title="View storefront collection"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>

                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(cat, "main")}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black transition-colors"
                              title="Edit Main Category"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(cat, "main")}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete Main Category"
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

          <AdminPagination
            currentPage={currentPage}
            totalItems={filteredMainCategories.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
        )}
      </>
      )}

      {/* ──────────────── LEVEL 2: SUBCATEGORIES TABLE (INSIDE MAIN CATEGORY) ──────────────── */}
      {selectedMainCategory && (
        <div className="space-y-4">
          {loadingSubs ? (
            <AdminTableSkeleton
              columns={["Subcategory", "Slug", "Products", "Status", "Actions"]}
              rows={5}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
              {filteredSubcategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Layers className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-base font-medium text-gray-900">
                  No Subcategories inside &quot;{selectedMainCategory.title}&quot;
                </h3>
                <p className="mt-1 text-sm text-gray-500 max-w-sm">
                  Add subcategories to organize products under {selectedMainCategory.title} (e.g. Clothing, Bridal, Accessories).
                </p>
                <button
                  onClick={openAddSubModal}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Add First Subcategory
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    <tr>
                      <th className="px-5 py-3.5">Subcategory</th>
                      <th className="px-4 py-3.5">Slug</th>
                      <th className="px-4 py-3.5 text-center">Products</th>
                      <th className="px-4 py-3.5 text-center">Order</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedSubcategories.map((sub) => {
                      const isAct = sub.isActive !== false;
                      const prodCount = sub.productCount ?? 0;

                      return (
                        <tr key={sub.handle} className="hover:bg-gray-50/80 transition-colors">
                          {/* Image + Title */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
                                {sub.image ? (
                                  <Image
                                    src={sub.image}
                                    alt={sub.title}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                                    <Layers className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{sub.title}</div>
                                {sub.description && (
                                  <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">
                                    {sub.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Slug */}
                          <td className="px-4 py-3.5">
                            <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                              /{sub.handle}
                            </span>
                          </td>

                          {/* Products count */}
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                              {prodCount}
                            </span>
                          </td>

                          {/* Order */}
                          <td className="px-4 py-3.5 text-center">
                            <span className="text-xs text-gray-500 font-mono">{sub.order ?? 0}</span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => handleToggleActive(sub, "sub")}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                isAct
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {isAct ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3.5 w-3.5 text-gray-400" /> Inactive
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View live */}
                              <Link
                                href={`/collections/${sub.handle}`}
                                target="_blank"
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black transition-colors"
                                title="View storefront collection"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>

                              {/* Edit */}
                              <button
                                onClick={() => openEditModal(sub, "sub")}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black transition-colors"
                                title="Edit Subcategory"
                              >
                                <Edit className="h-4 w-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(sub, "sub")}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Delete Subcategory"
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

            <AdminPagination
              currentPage={currentPage}
              totalItems={filteredSubcategories.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
          )}
        </div>
      )}

      {/* ──────────────── MODAL: ADD / EDIT CATEGORY ──────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-gray-900">
                  {editingCategory
                    ? `Edit ${modalMode === "main" ? "Main Category" : "Subcategory"}`
                    : `Add ${modalMode === "main" ? "Main Category" : "Subcategory"}`}
                </h2>
                {modalMode === "sub" && selectedMainCategory && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Parent: <strong className="text-gray-800">{selectedMainCategory.title}</strong>
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  {modalMode === "main" ? "Main Category Name" : "Subcategory Name"} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={
                    modalMode === "main"
                      ? "e.g. Women, Men, Kids, Accessories"
                      : "e.g. Clothing, Bridal, Footwear, Kurtis"
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  URL Slug
                </label>
                <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                  <span>/collections/</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="slug"
                    className="flex-1 border-0 bg-transparent p-0 pl-1 text-sm text-gray-900 focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional SEO and category description..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Image Upload: Desktop First */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Category Image
                </label>
                <div className="flex items-center gap-4">
                  {image ? (
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                      <Image src={image} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : null}

                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="cat-image-file"
                    />
                    <label
                      htmlFor="cat-image-file"
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-xs font-medium text-gray-700 hover:border-black hover:bg-gray-50 transition-colors"
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      ) : (
                        <UploadCloud className="h-4 w-4 text-gray-500" />
                      )}
                      <span>{uploadingImage ? "Uploading from Desktop..." : "Upload from Desktop"}</span>
                    </label>

                    {/* Or URL input toggle */}
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>or enter an image URL</span>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="text-blue-600 hover:underline"
                      >
                        {showUrlInput ? "Hide URL input" : "Paste URL"}
                      </button>
                    </div>

                    {showUrlInput && (
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-black focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Display Order & Status */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Status
                  </label>
                  <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || uploadingImage}
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
