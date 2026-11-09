"use client";

import { useEffect, useState, type FormEvent, useRef } from "react";
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
  ExternalLink,
  UploadCloud,
  Loader2,
  Video,
  Image as ImageIcon,
  Ruler,
  FolderTree,
} from "lucide-react";
import type { Product, CategoryItem } from "@/types";
import { formatPrice } from "@/lib/format";

const DEFAULT_CATEGORIES = [
  "Maahi II Luxury Eid Pret",
  "Silk Solids'26",
  "Raha Eid Pret'26",
  "Best Sellers",
  "Formal",
  "Bridal",
  "Luxury Pret",
  "Pret",
  "Sale",
  "Accessories",
];

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "Custom Size"];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Dynamic Categories from MongoDB
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORIES);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("Luxury Pret");

  // Category Hierarchy State
  const [mainCategoriesList, setMainCategoriesList] = useState<CategoryItem[]>([]);
  const [allCategoriesList, setAllCategoriesList] = useState<CategoryItem[]>([]);
  const [subcategoriesList, setSubcategoriesList] = useState<CategoryItem[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState("");
  const [selectedMainCategorySlug, setSelectedMainCategorySlug] = useState("");
  const [selectedMainCategoryName, setSelectedMainCategoryName] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState("");
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState("");
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  // Images & Media State
  const [image, setImage] = useState("");
  const [hoverImage, setHoverImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  // Custom Size State
  const [customSizeImage, setCustomSizeImage] = useState("");

  // Video State
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");

  // Details
  const [description, setDescription] = useState("");
  const [fabric, setFabric] = useState("Pure Raw Silk / Chiffon");
  const [sizes, setSizes] = useState<string[]>(["XS", "S", "M", "L", "XL"]);
  const [inStock, setInStock] = useState(true);
  const [isNew, setIsNew] = useState(true);

  // Upload Loaders
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingHover, setUploadingHover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingCustomSize, setUploadingCustomSize] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // URL input visibility toggles (desktop upload is primary)
  const [showMainUrl, setShowMainUrl] = useState(false);
  const [showHoverUrl, setShowHoverUrl] = useState(false);
  const [showSizeUrl, setShowSizeUrl] = useState(false);
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);

  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // File Input Refs
  const mainFileRef = useRef<HTMLInputElement>(null);
  const hoverFileRef = useRef<HTMLInputElement>(null);
  const galleryFilesRef = useRef<HTMLInputElement>(null);
  const customSizeFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

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

  const loadSubcategoriesForMain = async (
    mainSlug: string,
    currentSubSlugOrName?: string
  ) => {
    if (!mainSlug) {
      setSubcategoriesList([]);
      return;
    }
    try {
      setLoadingSubcategories(true);
      const res = await fetch(`/api/categories?parent=${encodeURIComponent(mainSlug)}&active=true`);
      const data = await res.json();
      if (Array.isArray(data.categories)) {
        setSubcategoriesList(data.categories);
        if (currentSubSlugOrName) {
          const match = data.categories.find(
            (s: CategoryItem) =>
              s.handle === currentSubSlugOrName ||
              String(s._id) === currentSubSlugOrName ||
              s.title.toLowerCase() === currentSubSlugOrName.toLowerCase()
          );
          if (match) {
            setSelectedSubcategoryId(String(match._id || match.id || ""));
            setSelectedSubcategorySlug(match.handle);
            setSelectedSubcategoryName(match.title);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch subcategories:", err);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const [mainsRes, allRes] = await Promise.all([
        fetch("/api/categories?type=main&active=true"),
        fetch("/api/categories?all=true"),
      ]);
      const mainsData = await mainsRes.json();
      const allData = await allRes.json();

      if (Array.isArray(mainsData.categories)) {
        setMainCategoriesList(mainsData.categories);
      }
      if (Array.isArray(allData.categories)) {
        setAllCategoriesList(allData.categories);
        const titles: string[] = Array.from(
          new Set(
            allData.categories
              .map((c: CategoryItem) => c.title)
              .filter(Boolean) as string[]
          )
        );
        if (titles.length > 0) {
          setCategoryOptions(titles);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleMainCategoryChange = (slug: string) => {
    const found = mainCategoriesList.find((m) => m.handle === slug);
    if (found) {
      setSelectedMainCategoryId(String(found._id || found.id || ""));
      setSelectedMainCategorySlug(found.handle);
      setSelectedMainCategoryName(found.title);
      // Reset subcategory
      setSelectedSubcategoryId("");
      setSelectedSubcategorySlug("");
      setSelectedSubcategoryName("");
      loadSubcategoriesForMain(found.handle);
    } else {
      setSelectedMainCategoryId("");
      setSelectedMainCategorySlug("");
      setSelectedMainCategoryName("");
      setSelectedSubcategoryId("");
      setSelectedSubcategorySlug("");
      setSelectedSubcategoryName("");
      setSubcategoriesList([]);
    }
  };

  const handleSubcategoryChange = (slug: string) => {
    const found = subcategoriesList.find((s) => s.handle === slug);
    if (found) {
      setSelectedSubcategoryId(String(found._id || found.id || ""));
      setSelectedSubcategorySlug(found.handle);
      setSelectedSubcategoryName(found.title);
    } else {
      setSelectedSubcategoryId("");
      setSelectedSubcategorySlug("");
      setSelectedSubcategoryName("");
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchProducts();
      void fetchCategories();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setTitle("");
    setHandle("");
    setPrice("");
    setOriginalPrice("");
    setCategory("Luxury Pret");
    setSelectedMainCategoryId("");
    setSelectedMainCategorySlug("");
    setSelectedMainCategoryName("");
    setSelectedSubcategoryId("");
    setSelectedSubcategorySlug("");
    setSelectedSubcategoryName("");
    setSubcategoriesList([]);
    setImage("");
    setHoverImage("");
    setGalleryImages([]);
    setCustomSizeImage("");
    setVideoUrl("");
    setVideoId("");
    setDescription("");
    setFabric("Pure Raw Silk / Chiffon");
    setSizes(["XS", "S", "M", "L", "XL"]);
    setInStock(true);
    setIsNew(true);
    setShowMainUrl(false);
    setShowHoverUrl(false);
    setShowSizeUrl(false);
    setShowVideoUrlInput(false);
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

    // Match main category and subcategory
    let mainSlug = p.mainCategorySlug || "";
    let mainId = p.mainCategoryId || "";
    let mainName = p.mainCategoryName || "";
    let subSlug = p.subcategorySlug || "";

    if (!mainSlug && allCategoriesList.length > 0) {
      // Check if p.category matches a subcategory directly
      const subMatch = allCategoriesList.find(
        (c) =>
          !c.isMainCategory &&
          c.parentHandle &&
          (c.handle === p.category?.toLowerCase() ||
            c.title.toLowerCase() === p.category?.toLowerCase() ||
            (p.collections || []).includes(c.handle))
      );
      if (subMatch) {
        subSlug = subMatch.handle;
        mainSlug = subMatch.parentHandle || "";
        const parentMatch = allCategoriesList.find((c) => c.handle === mainSlug);
        if (parentMatch) {
          mainId = String(parentMatch._id || parentMatch.id || "");
          mainName = parentMatch.title;
        }
      } else {
        const match = mainCategoriesList.find(
          (m) =>
            m.handle === p.category?.toLowerCase() ||
            m.title.toLowerCase() === p.category?.toLowerCase() ||
            (p.collections || []).includes(m.handle)
        );
        if (match) {
          mainSlug = match.handle;
          mainId = String(match._id || match.id || "");
          mainName = match.title;
        }
      }
    }

    setSelectedMainCategoryId(mainId);
    setSelectedMainCategorySlug(mainSlug);
    setSelectedMainCategoryName(mainName);

    if (mainSlug) {
      const subTarget = subSlug || p.subcategoryId || p.category || "";
      loadSubcategoriesForMain(mainSlug, subTarget);
    } else {
      setSubcategoriesList([]);
      setSelectedSubcategoryId("");
      setSelectedSubcategorySlug("");
      setSelectedSubcategoryName("");
    }

    setImage(p.image || "");
    setHoverImage(p.hoverImage || "");
    setGalleryImages(Array.isArray(p.images) ? p.images : []);
    setCustomSizeImage(p.customSizeImage || "");
    setVideoUrl(p.videoUrl || "");
    setVideoId(p.videoId || "");
    setDescription(p.description || p.alt || "");
    setFabric(p.fabric || "Pure Raw Silk / Chiffon");
    setSizes(p.sizes || ["XS", "S", "M", "L", "XL"]);
    setInStock(p.inStock !== false);
    setIsNew(!!p.isNew);
    setShowMainUrl(false);
    setShowHoverUrl(false);
    setShowSizeUrl(false);
    setShowVideoUrlInput(false);
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
      setHandle(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  const toggleSize = (s: string) => {
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  // Generic desktop single file uploader
  const uploadSingleFile = async (
    file: File,
    setLoader: (val: boolean) => void,
    onSuccess: (url: string) => void
  ) => {
    try {
      setLoader(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (data.url) {
        onSuccess(data.url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "File upload failed";
      alert(msg);
    } finally {
      setLoader(false);
    }
  };

  // Gallery multi-file upload from desktop
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingGallery(true);
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gallery upload failed");

      if (Array.isArray(data.urls) && data.urls.length > 0) {
        setGalleryImages((prev) => [...prev, ...data.urls]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload gallery images";
      alert(msg);
    } finally {
      setUploadingGallery(false);
      if (galleryFilesRef.current) galleryFilesRef.current.value = "";
    }
  };

  const addGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    setGalleryImages((prev) => [...prev, newGalleryUrl.trim()]);
    setNewGalleryUrl("");
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setGalleryAsMain = (index: number) => {
    const selected = galleryImages[index];
    if (!selected) return;
    // Swap main with this gallery image
    const oldMain = image;
    setImage(selected);
    setGalleryImages((prev) => {
      const next = [...prev];
      if (oldMain) next[index] = oldMain;
      else next.splice(index, 1);
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !price) {
      setFormError("Title and price are required.");
      return;
    }

    if (!selectedMainCategorySlug) {
      setFormError("Please select a Main Category for this product.");
      return;
    }

    setFormSubmitting(true);

    // Filter and combine gallery images
    const cleanGallery = Array.from(new Set(galleryImages.map((u) => u.trim()).filter(Boolean)));

    const finalCategory =
      selectedSubcategoryName || selectedMainCategoryName || category || "Luxury Pret";

    const payload = {
      title: title.trim(),
      handle: handle.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category: finalCategory,
      mainCategoryId: selectedMainCategoryId,
      mainCategorySlug: selectedMainCategorySlug,
      mainCategoryName: selectedMainCategoryName,
      subcategoryId: selectedSubcategoryId,
      subcategorySlug: selectedSubcategorySlug,
      subcategoryName: selectedSubcategoryName,
      image: image.trim(),
      hoverImage: hoverImage.trim() || image.trim(),
      images: cleanGallery,
      customSizeImage: customSizeImage.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      videoId: videoId.trim() || undefined,
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
    const cf = categoryFilter.toLowerCase();
    const matchCategory =
      categoryFilter === "All" ||
      (p.category && p.category.toLowerCase().includes(cf)) ||
      (p.mainCategoryName && p.mainCategoryName.toLowerCase().includes(cf)) ||
      (p.subcategoryName && p.subcategoryName.toLowerCase().includes(cf)) ||
      (p.collections && p.collections.some((c) => c.toLowerCase() === cf || c.toLowerCase().includes(cf)));

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
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your store items, upload desktop images, gallery, custom sizes, and videos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/categories"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <FolderTree className="h-4 w-4 text-black" />
            Manage Categories
          </Link>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, SKU, or slug..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-black"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
          {["All", ...categoryOptions.slice(0, 7)].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
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
                  <th className="py-3 px-4">Price (PKR)</th>
                  <th className="py-3 px-4">Gallery</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/75 transition-colors">
                    {/* Item Image & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded bg-gray-100 border border-gray-200">
                          {p.image ? (
                            <Image
                              src={p.image}
                              alt={p.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 block max-w-xs truncate text-sm">
                            {p.title}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-gray-400">
                            {p.sku || p.handle}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 text-xs">
                          {p.mainCategoryName || p.category || "Luxury Pret"}
                        </span>
                        {p.subcategoryName && p.subcategoryName !== p.mainCategoryName ? (
                          <span className="text-[11px] text-gray-500 font-normal">
                            › {p.subcategoryName}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {formatPrice(p.price)}
                    </td>

                    {/* Gallery Images count */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                        <ImageIcon className="h-3 w-3 text-gray-500" />
                        {1 + (p.images?.length || 0)} photos
                        {p.videoUrl || p.videoId ? (
                          <span className="ml-1 text-emerald-600 font-bold">• Video</span>
                        ) : null}
                      </span>
                    </td>

                    {/* In Stock */}
                    <td className="py-3 px-4">
                      {p.inStock !== false ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          <Check className="h-3 w-3" /> In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-200">
                          <X className="h-3 w-3" /> Out of Stock
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/products/${p.handle}`}
                          target="_blank"
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black transition-colors"
                          title="View on store"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.title)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete Product"
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

      {/* ===================== ADD / EDIT PRODUCT MODAL ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="relative my-8 w-full max-w-3xl rounded-2xl bg-white p-6 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingProduct ? `Edit Product: ${editingProduct.title}` : "Add New Designer Product"}
            </h2>

            {formError && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Basic Information */}
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
                    placeholder="e.g. Iris Royal Blue Shirt & Sharara"
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
                    placeholder="iris-royal-blue-shirt"
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black font-mono text-xs"
                  />
                </div>
              </div>

              {/* Price & Category */}
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
                    Original Price (Optional)
                  </label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="54900"
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black"
                  />
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                  {/* Parent Category Dropdown */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                        1. Parent Category (Main Category) *
                      </label>
                      <Link
                        href="/admin/categories"
                        target="_blank"
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        <FolderTree className="h-3 w-3" />
                        Manage
                      </Link>
                    </div>
                    <select
                      required
                      value={selectedMainCategorySlug}
                      onChange={(e) => handleMainCategoryChange(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2.5 text-sm outline-none focus:border-black bg-white"
                    >
                      <option value="">-- Select Parent Category --</option>
                      {mainCategoriesList.map((m) => (
                        <option key={m.handle} value={m.handle}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Choose primary category (e.g. Women, Men, Kids, Formals)
                    </p>
                  </div>

                  {/* Child Category Dropdown */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                        2. Child Category (Subcategory)
                      </label>
                      {selectedMainCategorySlug && (
                        <span className="text-[11px] text-gray-500">
                          in {selectedMainCategoryName}
                        </span>
                      )}
                    </div>
                    <select
                      disabled={!selectedMainCategorySlug || loadingSubcategories}
                      value={selectedSubcategorySlug}
                      onChange={(e) => handleSubcategoryChange(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2.5 text-sm outline-none focus:border-black bg-white disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      {!selectedMainCategorySlug ? (
                        <option value="">-- Select Parent Category first --</option>
                      ) : loadingSubcategories ? (
                        <option value="">Loading child categories...</option>
                      ) : subcategoriesList.length === 0 ? (
                        <option value="">(No child categories exist for this parent category)</option>
                      ) : (
                        <>
                          <option value="">-- Select Child Category (Optional) --</option>
                          {subcategoriesList.map((s) => (
                            <option key={s.handle} value={s.handle}>
                              {s.title}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {selectedMainCategorySlug && subcategoriesList.length === 0 ? (
                        <span className="text-amber-600">
                          No child categories found. You can add one in Category Management.
                        </span>
                      ) : (
                        "Specific department (e.g. Clothing, Bridal, Dupatta)"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* ================= MAIN IMAGE (Upload from Desktop) ================= */}
              <div className="border rounded-xl p-4 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-900 text-xs">
                      Main Product Image * (Front View)
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Upload directly from your computer / desktop
                    </span>
                  </div>
                  {!image && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>

                <div className="rounded-xl border-2 border-dashed border-gray-300 p-3.5 text-center bg-white hover:border-black transition-colors">
                  <input
                    type="file"
                    ref={mainFileRef}
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadSingleFile(f, setUploadingMain, setImage);
                    }}
                    className="hidden"
                    id="main-image-file"
                  />
                  <label
                    htmlFor="main-image-file"
                    className="inline-flex flex-col items-center justify-center gap-1.5 cursor-pointer w-full py-2 select-none"
                  >
                    {uploadingMain ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-black" />
                        <span className="font-semibold text-xs text-gray-800">Uploading main image from desktop...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-6 w-6 text-black" />
                        <span className="font-bold text-xs text-gray-900">
                          {image ? "Click to change / upload another image" : "Click to choose main image from desktop"}
                        </span>
                        <span className="text-[11px] text-gray-400">PNG, JPG, WEBP (Saved directly to database)</span>
                      </>
                    )}
                  </label>
                </div>

                {image && (
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 bg-white shadow-xs">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded border border-gray-200">
                      <Image src={image} alt="Main Preview" fill sizes="60px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-emerald-700 block">✓ Main Image Uploaded</span>
                      <span className="truncate font-mono text-[10px] text-gray-400 block">{image}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="text-right">
                  {!showMainUrl ? (
                    <button
                      type="button"
                      onClick={() => setShowMainUrl(true)}
                      className="text-[11px] text-gray-400 hover:text-black underline cursor-pointer"
                    >
                      Or paste an external image URL
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 pt-1 text-left">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="flex-1 rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-black bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMainUrl(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1"
                      >
                        Hide
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ================= HOVER IMAGE (Upload from Desktop) ================= */}
              <div className="border rounded-xl p-4 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-900 text-xs">
                      Hover Product Image (Back / Detail View)
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Shows when visitor hovers over product card
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-dashed border-gray-300 p-3.5 text-center bg-white hover:border-black transition-colors">
                  <input
                    type="file"
                    ref={hoverFileRef}
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadSingleFile(f, setUploadingHover, setHoverImage);
                    }}
                    className="hidden"
                    id="hover-image-file"
                  />
                  <label
                    htmlFor="hover-image-file"
                    className="inline-flex flex-col items-center justify-center gap-1.5 cursor-pointer w-full py-2 select-none"
                  >
                    {uploadingHover ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-black" />
                        <span className="font-semibold text-xs text-gray-800">Uploading hover image from desktop...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-6 w-6 text-black" />
                        <span className="font-bold text-xs text-gray-900">
                          {hoverImage ? "Click to change / upload another hover image" : "Click to choose hover image from desktop"}
                        </span>
                        <span className="text-[11px] text-gray-400">Optional back or detail view</span>
                      </>
                    )}
                  </label>
                </div>

                {hoverImage && (
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 bg-white shadow-xs">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded border border-gray-200">
                      <Image src={hoverImage} alt="Hover Preview" fill sizes="60px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-emerald-700 block">✓ Hover Image Uploaded</span>
                      <span className="truncate font-mono text-[10px] text-gray-400 block">{hoverImage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHoverImage("")}
                      className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                      title="Remove hover image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="text-right">
                  {!showHoverUrl ? (
                    <button
                      type="button"
                      onClick={() => setShowHoverUrl(true)}
                      className="text-[11px] text-gray-400 hover:text-black underline cursor-pointer"
                    >
                      Or paste an external hover image URL
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 pt-1 text-left">
                      <input
                        type="url"
                        value={hoverImage}
                        onChange={(e) => setHoverImage(e.target.value)}
                        placeholder="https://example.com/back.jpg"
                        className="flex-1 rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-black bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowHoverUrl(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1"
                      >
                        Hide
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ================= IMAGE GALLERY (Multi-upload from Desktop) ================= */}
              <div className="border rounded-xl p-4 bg-gray-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-gray-900">
                      Image Gallery (Add as many images as you like!)
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Upload multiple high-resolution photos directly from your computer.
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    {galleryImages.length} Gallery Photos
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="file"
                    ref={galleryFilesRef}
                    multiple
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    className="hidden"
                    id="gallery-files"
                  />
                  <label
                    htmlFor="gallery-files"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-neutral-800 cursor-pointer transition-colors"
                  >
                    {uploadingGallery ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        Uploading gallery...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4" />
                        Upload Multiple Photos from Desktop
                      </>
                    )}
                  </label>

                  <div className="flex-1 flex gap-2">
                    <input
                      type="url"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      placeholder="Or paste an image URL..."
                      className="flex-1 rounded-lg border border-gray-300 p-2 text-xs outline-none focus:border-black bg-white"
                    />
                    <button
                      type="button"
                      onClick={addGalleryUrl}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      + Add URL
                    </button>
                  </div>
                </div>

                {/* Thumbnails Grid */}
                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                    {galleryImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-lg border border-gray-200 overflow-hidden bg-white shadow-xs aspect-3/4"
                      >
                        <Image src={imgUrl} alt={`Gallery ${idx + 1}`} fill sizes="120px" className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="self-end rounded-full bg-red-600 p-1 text-white hover:bg-red-700 shadow"
                            title="Remove image"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setGalleryAsMain(idx)}
                            className="w-full text-center rounded bg-white/90 py-0.5 text-[9px] font-bold text-black uppercase hover:bg-white"
                          >
                            Set Main
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ================= SIZES & CUSTOM SIZE SECTION ================= */}
              <div className="border rounded-xl p-4 bg-gray-50/50 space-y-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-900 mb-1">
                    Available Sizes (Includes Custom Size)
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ALL_SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSize(s)}
                        className={`rounded-lg px-3 py-1.5 font-bold uppercase transition-colors ${
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

                {/* Custom Size Chart Image upload */}
                {sizes.includes("Custom Size") && (
                  <div className="border-t border-gray-200 pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Ruler className="h-4 w-4 text-black" />
                        <label className="font-bold uppercase tracking-wider text-gray-900 text-xs">
                          Custom Size Chart Image (Upload from Desktop)
                        </label>
                      </div>
                      <span className="text-[11px] text-gray-500">
                        Shows in Size Guide modal when selected
                      </span>
                    </div>

                    <div className="rounded-xl border-2 border-dashed border-gray-300 p-3 text-center bg-white hover:border-black transition-colors">
                      <input
                        type="file"
                        ref={customSizeFileRef}
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadSingleFile(f, setUploadingCustomSize, setCustomSizeImage);
                        }}
                        className="hidden"
                        id="custom-size-file"
                      />
                      <label
                        htmlFor="custom-size-file"
                        className="inline-flex flex-col items-center justify-center gap-1.5 cursor-pointer w-full py-1.5 select-none"
                      >
                        {uploadingCustomSize ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin text-black" />
                            <span className="font-semibold text-xs text-gray-800">Uploading size chart...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-5 w-5 text-black" />
                            <span className="font-bold text-xs text-gray-900">
                              {customSizeImage ? "Click to change size chart image" : "Upload size chart image directly from desktop"}
                            </span>
                            <span className="text-[11px] text-gray-400">Attach custom measurements guidance chart</span>
                          </>
                        )}
                      </label>
                    </div>

                    {customSizeImage && (
                      <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 bg-white shadow-xs">
                        <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded border border-gray-200">
                          <Image src={customSizeImage} alt="Size Chart Preview" fill sizes="60px" className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-emerald-700 block">✓ Custom Size Chart Uploaded</span>
                          <span className="truncate font-mono text-[10px] text-gray-400 block">{customSizeImage}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomSizeImage("")}
                          className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                          title="Remove size chart"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <div className="text-right">
                      {!showSizeUrl ? (
                        <button
                          type="button"
                          onClick={() => setShowSizeUrl(true)}
                          className="text-[11px] text-gray-400 hover:text-black underline cursor-pointer"
                        >
                          Or paste size chart URL
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 pt-1 text-left">
                          <input
                            type="url"
                            value={customSizeImage}
                            onChange={(e) => setCustomSizeImage(e.target.value)}
                            placeholder="https://example.com/sizechart.jpg"
                            className="flex-1 rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-black bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSizeUrl(false)}
                            className="text-xs text-gray-400 hover:text-gray-600 px-1"
                          >
                            Hide
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ================= PRODUCT VIDEO REEL (Upload from Desktop) ================= */}
              <div className="border rounded-xl p-4 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-black" />
                    <label className="font-bold uppercase tracking-wider text-gray-900 text-xs">
                      Product Video Reel (Upload from Computer / Desktop)
                    </label>
                  </div>
                  <span className="text-[11px] text-gray-500">Plays in bottom floating reel on product page</span>
                </div>

                <div className="rounded-xl border-2 border-dashed border-gray-300 p-3 text-center bg-white hover:border-black transition-colors">
                  <input
                    type="file"
                    ref={videoFileRef}
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadSingleFile(f, setUploadingVideo, setVideoUrl);
                    }}
                    className="hidden"
                    id="video-file"
                  />
                  <label
                    htmlFor="video-file"
                    className="inline-flex flex-col items-center justify-center gap-1.5 cursor-pointer w-full py-1.5 select-none"
                  >
                    {uploadingVideo ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-black" />
                        <span className="font-semibold text-xs text-gray-800">Uploading video from system...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-5 w-5 text-black" />
                        <span className="font-bold text-xs text-gray-900">
                          {videoUrl ? "Click to change / upload another video" : "Choose video from computer (.mp4, .mov)"}
                        </span>
                        <span className="text-[11px] text-gray-400">Desktop video upload stored directly in MongoDB GridFS</span>
                      </>
                    )}
                  </label>
                </div>

                {videoUrl && (
                  <div className="rounded-lg border border-gray-200 p-2.5 bg-white flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-700">✓ Video Attached</span>
                      <button
                        type="button"
                        onClick={() => setVideoUrl("")}
                        className="text-xs text-red-600 hover:underline cursor-pointer"
                      >
                        Remove Video
                      </button>
                    </div>
                    <video src={videoUrl} controls className="max-h-48 w-full rounded bg-black" />
                  </div>
                )}

                <div className="text-right">
                  {!showVideoUrlInput ? (
                    <button
                      type="button"
                      onClick={() => setShowVideoUrlInput(true)}
                      className="text-[11px] text-gray-400 hover:text-black underline cursor-pointer"
                    >
                      Or paste video URL / YouTube ID
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 pt-1 text-left">
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="Or enter direct video URL (.mp4)"
                          className="flex-1 rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-black bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowVideoUrlInput(false)}
                          className="text-xs text-gray-400 hover:text-gray-600 px-1"
                        >
                          Hide
                        </button>
                      </div>
                      <input
                        type="text"
                        value={videoId}
                        onChange={(e) => setVideoId(e.target.value)}
                        placeholder="Or YouTube Video ID (e.g. 4mWBAj2s6yU)"
                        className="w-full rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-black bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Description & Fabric Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Fabric &amp; Details
                  </label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="e.g. 100% Pure Raw Silk with Hand Zardozi &amp; Dabka Work"
                    className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black text-xs"
                  />
                </div>

                <div className="flex items-center gap-6 pt-5">
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
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the cut, embroidery, occasion, dupatta &amp; pants included..."
                  className="w-full rounded-md border border-gray-300 p-2.5 outline-none focus:border-black text-xs"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    formSubmitting ||
                    uploadingMain ||
                    uploadingHover ||
                    uploadingGallery ||
                    uploadingCustomSize ||
                    uploadingVideo
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                  {editingProduct ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
