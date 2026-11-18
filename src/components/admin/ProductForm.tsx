"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Loader2,
  Trash2,
  Plus,
  ArrowLeft,
  Check,
  X,
  Play,
  Video,
  Ruler,
  Layers,
  Sparkles,
  Info,
  HelpCircle,
  FolderTree,
  AlertCircle,
  Tag,
  Sliders,
} from "lucide-react";
import type { Product, CategoryItem, ProductOption, ProductVariant, ChoiceGroup } from "@/types";
import { formatPrice } from "@/lib/format";
import { uploadFileWithChunks } from "@/lib/upload-client";
import { parseVideoSource } from "@/lib/video";

interface ProductFormProps {
  initialProduct?: Product | null;
  isEdit?: boolean;
}

export default function ProductForm({ initialProduct, isEdit = false }: ProductFormProps) {
  const router = useRouter();

  // Basic Details
  const [title, setTitle] = useState(initialProduct?.title || "");
  const [handle, setHandle] = useState(initialProduct?.handle || "");
  const [sku, setSku] = useState(initialProduct?.sku || "");
  const [price, setPrice] = useState(initialProduct?.price?.toString() || "");
  const [originalPrice, setOriginalPrice] = useState(initialProduct?.originalPrice ? String(initialProduct.originalPrice) : "");
  const [onSale, setOnSale] = useState(Boolean(initialProduct?.onSale || initialProduct?.isSale));
  const [saleNote, setSaleNote] = useState(initialProduct?.saleNote || "");
  const [color, setColor] = useState(initialProduct?.color || "");
  const [style, setStyle] = useState(initialProduct?.style || "");
  const [category, setCategory] = useState(initialProduct?.category || "Luxury Pret");
  const [inStock, setInStock] = useState(initialProduct?.inStock !== false);
  const [isNew, setIsNew] = useState(initialProduct?.isNew ?? true);
  const [isBestSeller, setIsBestSeller] = useState(initialProduct?.isBestSeller ?? false);
  const [expressAllowed, setExpressAllowed] = useState(initialProduct?.expressAllowed ?? true);

  // Category Hierarchy
  const [mainCategoriesList, setMainCategoriesList] = useState<CategoryItem[]>([]);
  const [allCategoriesList, setAllCategoriesList] = useState<CategoryItem[]>([]);
  const [subcategoriesList, setSubcategoriesList] = useState<CategoryItem[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState(initialProduct?.mainCategoryId || "");
  const [selectedMainCategorySlug, setSelectedMainCategorySlug] = useState(initialProduct?.mainCategorySlug || "");
  const [selectedMainCategoryName, setSelectedMainCategoryName] = useState(initialProduct?.mainCategoryName || "");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(initialProduct?.subcategoryId || "");
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState(initialProduct?.subcategorySlug || "");
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState(initialProduct?.subcategoryName || "");
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  // Media & Images
  const [image, setImage] = useState(initialProduct?.image || "");
  const [hoverImage, setHoverImage] = useState(initialProduct?.hoverImage || "");
  const [galleryImages, setGalleryImages] = useState<string[]>(() => {
    if (!initialProduct?.images || !Array.isArray(initialProduct.images)) return [];
    const prim = initialProduct.image || "";
    const hov = initialProduct.hoverImage || "";
    return initialProduct.images.filter((img) => img && img !== prim && img !== hov);
  });
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [sizeChartImage, setSizeChartImage] = useState(
    initialProduct?.sizeChartImage || initialProduct?.customSizeImage || ""
  );

  // Video
  const [videoUrl, setVideoUrl] = useState(initialProduct?.videoUrl || "");
  const [videoId, setVideoId] = useState(initialProduct?.videoId || "");

  // Description
  const [description, setDescription] = useState(initialProduct?.description || "");

  // Fabric & Details
  const [fabric, setFabric] = useState(initialProduct?.fabric || "Pure Silk / Chiffon");
  const [readyMadeDetails, setReadyMadeDetails] = useState(
    initialProduct?.readyMadeDetails ||
    "Fabric Detail:\nShirt: Tassel Silk\nLining: Cotton Silk\nShalwar: Tassel Silk\nDupatta: Georgette Chiffon\n\nPrice Includes: Shirt, Trousers & Dupatta.\n\nCustomization:\nSize customization: Yes.\nColour customization: No"
  );
  const [unstitchedDetails, setUnstitchedDetails] = useState(initialProduct?.unstitchedDetails || "");

  // Options & Variants Matrix
  const [options, setOptions] = useState<ProductOption[]>(() => {
    if (initialProduct?.options && initialProduct.options.length > 0) {
      return initialProduct.options;
    }
    // Default starting options
    return [
      {
        name: "Size",
        useInSku: true,
        values: initialProduct?.sizes?.length ? initialProduct.sizes : ["XS", "S", "M", "L", "XL", "Custom Size"],
      },
    ];
  });

  const [variants, setVariants] = useState<ProductVariant[]>(() => {
    if (initialProduct?.variants && initialProduct.variants.length > 0) {
      return initialProduct.variants;
    }
    return [];
  });

  // Customer Add-on Choice Groups
  const [choiceGroups, setChoiceGroups] = useState<ChoiceGroup[]>(() => {
    if (initialProduct?.choiceGroups && initialProduct.choiceGroups.length > 0) {
      return initialProduct.choiceGroups;
    }
    return [];
  });

  // Upload States
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingHover, setUploadingHover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingSizeChart, setUploadingSizeChart] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState("");

  // Input view toggles
  const [showMainUrl, setShowMainUrl] = useState(false);
  const [showHoverUrl, setShowHoverUrl] = useState(false);
  const [showSizeUrl, setShowSizeUrl] = useState(false);
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);

  // Form submission
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // File Input Refs
  const mainFileRef = useRef<HTMLInputElement>(null);
  const hoverFileRef = useRef<HTMLInputElement>(null);
  const galleryFilesRef = useRef<HTMLInputElement>(null);
  const sizeChartFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (Array.isArray(data.categories)) {
          setAllCategoriesList(data.categories);
          const mains = data.categories.filter((c: CategoryItem) => c.isMainCategory);
          setMainCategoriesList(mains);

          // If editing or existing, match category
          const currentMainSlug = selectedMainCategorySlug || initialProduct?.mainCategorySlug;
          if (currentMainSlug) {
            loadSubcategories(currentMainSlug, selectedSubcategorySlug || initialProduct?.subcategorySlug);
          } else if (mains.length > 0 && !selectedMainCategoryId) {
            setSelectedMainCategoryId(String(mains[0]._id || mains[0].id || ""));
            setSelectedMainCategorySlug(mains[0].handle);
            setSelectedMainCategoryName(mains[0].title);
            loadSubcategories(mains[0].handle);
          }
        }
      } catch (err) {
        console.warn("Failed to load categories:", err);
      }
    };

    fetchCategories();
  }, []);

  const loadSubcategories = async (mainSlug: string, currentSubSlug?: string) => {
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
        if (currentSubSlug) {
          const match = data.categories.find(
            (s: CategoryItem) => s.handle === currentSubSlug || s.title.toLowerCase() === currentSubSlug.toLowerCase()
          );
          if (match) {
            setSelectedSubcategoryId(String(match._id || match.id || ""));
            setSelectedSubcategorySlug(match.handle);
            setSelectedSubcategoryName(match.title);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const handleMainCategoryChange = (slug: string) => {
    const found = mainCategoriesList.find((m) => m.handle === slug);
    if (found) {
      setSelectedMainCategoryId(String(found._id || found.id || ""));
      setSelectedMainCategorySlug(found.handle);
      setSelectedMainCategoryName(found.title);
      setSelectedSubcategoryId("");
      setSelectedSubcategorySlug("");
      setSelectedSubcategoryName("");
      loadSubcategories(found.handle);
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

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit && !handle) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setHandle(generated);
      if (!sku) {
        setSku(`SLH-${generated.toUpperCase()}`);
      }
    }
  };

  // Upload helper
  const uploadSingleFile = async (
    file: File,
    setLoader: (val: boolean) => void,
    onSuccess: (url: string) => void,
    onProgressMsg?: (msg: string) => void
  ) => {
    try {
      setLoader(true);
      const res = await uploadFileWithChunks(file, {
        onProgress: (_pct, msg) => {
          if (onProgressMsg && msg) onProgressMsg(msg);
        },
      });
      if (res.url) onSuccess(res.url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "File upload failed");
    } finally {
      setLoader(false);
      if (onProgressMsg) onProgressMsg("");
    }
  };

  // Gallery file handler
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadingGallery(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const res = await uploadFileWithChunks(files[i]);
        if (res.url) newUrls.push(res.url);
      }
      if (newUrls.length > 0) {
        setGalleryImages((prev) => [...prev, ...newUrls]);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to upload gallery images");
    } finally {
      setUploadingGallery(false);
      if (galleryFilesRef.current) galleryFilesRef.current.value = "";
    }
  };

  /* ──────────────── OPTION BUILDER FUNCTIONS ──────────────── */

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      {
        name: `Option ${prev.length + 1}`,
        useInSku: false,
        values: [],
      },
    ]);
  };

  const updateOptionName = (idx: number, name: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], name };
      return next;
    });
  };

  const updateOptionUseInSku = (idx: number, useInSku: boolean) => {
    setOptions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], useInSku };
      return next;
    });
  };

  const addOptionValue = (idx: number, val: string) => {
    const clean = val.trim();
    if (!clean) return;
    setOptions((prev) => {
      const next = [...prev];
      const curVals = next[idx].values;
      if (!curVals.includes(clean)) {
        next[idx] = { ...next[idx], values: [...curVals, clean] };
      }
      return next;
    });
  };

  const removeOptionValue = (optIdx: number, valIdx: number) => {
    setOptions((prev) => {
      const next = [...prev];
      next[optIdx] = {
        ...next[optIdx],
        values: next[optIdx].values.filter((_, i) => i !== valIdx),
      };
      return next;
    });
  };

  const removeOption = (idx: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ──────────────── VARIANT MATRIX GENERATION ──────────────── */

  const generateVariantsMatrix = () => {
    const validOptions = options.filter((o) => o.name.trim() && o.values.length > 0);
    if (validOptions.length === 0) {
      alert("Please add at least one option with values before generating variants.");
      return;
    }

    // Cartesian product of option values
    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
        [[]]
      );
    };

    const valueArrays = validOptions.map((o) => o.values);
    const combinations = cartesian(valueArrays);

    const basePriceNum = Number(price) || 0;
    const baseSkuClean = (sku || handle || "SLH").trim().toUpperCase();

    const generated: ProductVariant[] = combinations.map((combo, idx) => {
      const attrs = combo.map((val, i) => ({
        name: validOptions[i].name,
        value: val,
      }));

      // Build SKU: baseSku + values of options that have useInSku === true
      const skuParts = [baseSkuClean];
      validOptions.forEach((o, i) => {
        if (o.useInSku) {
          skuParts.push(combo[i].replace(/\s+/g, "").toUpperCase());
        }
      });
      const variantSku = skuParts.join("-");

      // Check if variant already exists to preserve custom pricing
      const existing = variants.find((v) => {
        if (!v.attributes || v.attributes.length !== attrs.length) return false;
        return v.attributes.every((a, index) => a.name === attrs[index].name && a.value === attrs[index].value);
      });

      return {
        id: existing?.id || `var-${Date.now()}-${idx}`,
        title: combo.join(" / "),
        sku: existing?.sku || variantSku,
        price: existing?.price !== undefined ? existing.price : basePriceNum,
        salePrice: existing?.salePrice || null,
        stock: existing?.stock !== undefined ? existing.stock : 12,
        attributes: attrs,
        option1: combo[0] || null,
        option2: combo[1] || null,
        option3: combo[2] || null,
      };
    });

    setVariants(generated);
  };

  const updateVariant = (idx: number, field: keyof ProductVariant, val: any) => {
    setVariants((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const removeVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const applyBasePriceToAll = () => {
    const p = Number(price);
    if (!p) return;
    setVariants((prev) => prev.map((v) => ({ ...v, price: p })));
  };

  const applyStockToAll = (qty = 10) => {
    setVariants((prev) => prev.map((v) => ({ ...v, stock: qty })));
  };

  /* ──────────────── CHOICE GROUPS (CUSTOMER ADD-ONS) ──────────────── */

  const addChoiceGroup = () => {
    setChoiceGroups((prev) => [
      ...prev,
      {
        title: "You may also add:",
        choices: ["Select One", "Slip With Sleeves (complimentary)", "Slip Without Sleeves (complimentary)"],
      },
    ]);
  };

  const updateChoiceGroupTitle = (idx: number, titleVal: string) => {
    setChoiceGroups((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], title: titleVal };
      return next;
    });
  };

  const updateChoiceGroupRawChoices = (idx: number, text: string) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    setChoiceGroups((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], choices: lines };
      return next;
    });
  };

  const removeChoiceGroup = (idx: number) => {
    setChoiceGroups((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ──────────────── SUBMIT HANDLER ──────────────── */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!title.trim() || !price) {
      setFormError("Product Title and Price are required.");
      return;
    }

    if (!selectedMainCategorySlug) {
      setFormError("Please choose a Main Category.");
      return;
    }

    setFormSubmitting(true);

    const cleanGallery = galleryImages.map((u) => u.trim()).filter(Boolean);
    const finalCategory = selectedSubcategoryName || selectedMainCategoryName || category || "Luxury Pret";

    // Strictly enforce sequence: Primary (#1) -> Hover (#2) -> Multi-angle gallery shots in exact order added
    const primaryImg = image.trim();
    const hoverImg = hoverImage.trim() || primaryImg;
    const orderedImages: string[] = [];
    if (primaryImg) orderedImages.push(primaryImg);
    if (hoverImg && hoverImg !== primaryImg) orderedImages.push(hoverImg);
    for (const g of cleanGallery) {
      if (g && !orderedImages.includes(g)) {
        orderedImages.push(g);
      }
    }

    // Extract sizes list from options (if 'Size' option exists)
    const sizeOpt = options.find((o) => o.name.toLowerCase() === "size");
    const extractedSizes = sizeOpt?.values.length ? sizeOpt.values : ["XS", "S", "M", "L", "XL"];

    // Compute min and max price across variants
    const allPrices = variants.length > 0 ? variants.map((v) => Number(v.price) || 0) : [Number(price) || 0];
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    const parsedVid = parseVideoSource(videoUrl, videoId);
    const resolvedVideoUrl = parsedVid?.type === "mp4" ? parsedVid.src : (parsedVid?.type === "youtube" ? parsedVid.watchUrl : (videoUrl.trim() || undefined));
    const resolvedVideoId = parsedVid?.type === "youtube" ? parsedVid.youtubeId : (videoId.trim() || undefined);

    const payload = {
      title: title.trim(),
      handle: handle.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      sku: sku.trim() || `SLH-${handle.toUpperCase()}`,
      price: Number(price),
      originalPrice: originalPrice.trim() ? Number(originalPrice) : null,
      onSale,
      saleNote: saleNote.trim(),
      color: color.trim(),
      style: style.trim(),
      category: finalCategory,
      mainCategoryId: selectedMainCategoryId,
      mainCategorySlug: selectedMainCategorySlug,
      mainCategoryName: selectedMainCategoryName,
      subcategoryId: selectedSubcategoryId,
      subcategorySlug: selectedSubcategorySlug,
      subcategoryName: selectedSubcategoryName,
      image: primaryImg || (orderedImages[0] ?? ""),
      hoverImage: hoverImg || (orderedImages[1] ?? primaryImg),
      images: orderedImages,
      sizeChartImage: sizeChartImage.trim() || undefined,
      customSizeImage: sizeChartImage.trim() || undefined,
      videoId: resolvedVideoId,
      videoUrl: resolvedVideoUrl,
      description: description.trim(),
      fabric: fabric.trim(),
      readyMadeDetails: readyMadeDetails.trim(),
      unstitchedDetails: unstitchedDetails.trim(),
      expressAllowed,
      inStock,
      isNew,
      isBestSeller,
      sizes: extractedSizes,
      options: options.filter((o) => o.name.trim() && o.values.length > 0),
      variants,
      choiceGroups: choiceGroups.filter((cg) => cg.title.trim() && cg.choices.length > 0),
      minPrice,
      maxPrice,
      alt: title.trim(),
    };

    try {
      const endpoint = isEdit && initialProduct?.id ? `/api/products/${initialProduct.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      setFormSuccess(`Product "${title}" successfully saved!`);
      setTimeout(() => {
        router.push("/admin/products");
      }, 900);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error saving product");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-500 mb-1">
            <Link href="/admin/products" className="hover:text-black flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Products
            </Link>
            <span>/</span>
            <span>{isEdit ? "Edit Product" : "New Product"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-serif">
            {isEdit ? `Edit Product: ${title || "Untitled"}` : "Create New Product"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={formSubmitting}
            className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Update Product" : "Publish Product"}
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 rounded">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2 rounded">
          <Check className="h-5 w-5 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* ──────────────── CARD 1: BASIC INFORMATION ──────────────── */}
      <div className="bg-white border border-neutral-200 rounded p-6 space-y-6 shadow-sm">
        <div className="border-b border-neutral-100 pb-3">
          <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Tag className="h-4 w-4 text-neutral-700" /> Basic Information
          </h2>
          <p className="text-xs text-neutral-500">Title, SKU, pricing, category hierarchy, and availability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Solara, Amore, Camilla"
              className="w-full border border-neutral-300 px-3.5 py-2.5 text-sm rounded outline-none focus:border-black"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Handle / URL Slug
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="e.g. solara-luxury-pret"
              className="w-full border border-neutral-300 px-3.5 py-2.5 text-sm rounded outline-none focus:border-black font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Base SKU
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. RHF-9, RSS-6, SLH-LIVIA"
              className="w-full border border-neutral-300 px-3.5 py-2.5 text-sm rounded outline-none focus:border-black font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Base Price (PKR) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 68400"
              className="w-full border border-neutral-300 px-3.5 py-2.5 text-sm rounded outline-none focus:border-black font-mono font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Compare-at / Original Price (PKR)
            </label>
            <input
              type="number"
              min="0"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="Optional strike-through price (e.g. 76000)"
              className="w-full border border-neutral-300 px-3.5 py-2.5 text-sm rounded outline-none focus:border-black font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Color &amp; Garment Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Color: Purple, Black..."
                className="w-full border border-neutral-300 px-3 py-2 text-xs rounded outline-none focus:border-black"
              />
              <input
                type="text"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="Style: Long A-line shirt..."
                className="w-full border border-neutral-300 px-3 py-2 text-xs rounded outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Categories Hierarchy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-neutral-100">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5 text-neutral-600" /> Main Category *
            </label>
            <select
              value={selectedMainCategorySlug}
              onChange={(e) => handleMainCategoryChange(e.target.value)}
              className="w-full border border-neutral-300 px-3.5 py-2.5 text-sm rounded outline-none focus:border-black bg-white"
            >
              <option value="">-- Choose Main Category --</option>
              {mainCategoriesList.map((m) => (
                <option key={m.handle} value={m.handle}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
              <span>Subcategory (Child Collection)</span>
              {loadingSubcategories && <span className="text-[10px] text-neutral-400">Loading...</span>}
            </label>
            <select
              value={selectedSubcategorySlug}
              onChange={(e) => handleSubcategoryChange(e.target.value)}
              disabled={subcategoriesList.length === 0}
              className="w-full border border-neutral-300 px-3.5 py-2.5 text-sm rounded outline-none focus:border-black bg-white disabled:bg-neutral-100 disabled:text-neutral-400"
            >
              <option value="">-- None / Direct Main Category --</option>
              {subcategoriesList.map((s) => (
                <option key={s.handle} value={s.handle}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-neutral-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-neutral-800">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="h-4 w-4 accent-black rounded"
            />
            <span>In Stock</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-neutral-800">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="h-4 w-4 accent-black rounded"
            />
            <span>New Arrival Badge</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-neutral-800">
            <input
              type="checkbox"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="h-4 w-4 accent-black rounded"
            />
            <span>Best Seller Badge</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-neutral-800">
            <input
              type="checkbox"
              checked={expressAllowed}
              onChange={(e) => setExpressAllowed(e.target.checked)}
              className="h-4 w-4 accent-black rounded"
            />
            <span>Allow Express Expedited Shipping (+Rs.9,000)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-neutral-800">
            <input
              type="checkbox"
              checked={onSale}
              onChange={(e) => setOnSale(e.target.checked)}
              className="h-4 w-4 accent-black rounded"
            />
            <span>On Sale Tag</span>
          </label>
        </div>

        {onSale && (
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs space-y-1">
            <label className="font-bold uppercase tracking-wider text-neutral-700">Sale Banner Note</label>
            <input
              type="text"
              value={saleNote}
              onChange={(e) => setSaleNote(e.target.value)}
              placeholder="e.g. Eid Festive Special 10% Off"
              className="w-full border border-neutral-300 px-3 py-2 text-xs rounded outline-none focus:border-black bg-white"
            />
          </div>
        )}
      </div>

      {/* ──────────────── CARD 2: MEDIA, IMAGES & SIZE CHART ──────────────── */}
      <div className="bg-white border border-neutral-200 rounded p-6 space-y-6 shadow-sm">
        <div className="border-b border-neutral-100 pb-3">
          <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-neutral-700" /> Media &amp; Size Chart
          </h2>
          <p className="text-xs text-neutral-500">Primary image, hover shot, multi-angle gallery, video, and size chart.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Primary Image */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Primary Image *
            </label>
            <div className="relative aspect-[2/3] border-2 border-dashed border-neutral-300 rounded overflow-hidden bg-neutral-50 flex flex-col items-center justify-center p-2 text-center">
              {image ? (
                <>
                  <Image src={image} alt="Primary" fill sizes="200px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="absolute top-2 right-2 bg-black/75 hover:bg-black text-white p-1 rounded-full cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="h-8 w-8 text-neutral-400 mx-auto" />
                  <button
                    type="button"
                    onClick={() => mainFileRef.current?.click()}
                    disabled={uploadingMain}
                    className="px-3 py-1.5 bg-black text-white text-[11px] font-bold uppercase tracking-wider rounded cursor-pointer hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {uploadingMain ? "Uploading..." : "Upload from PC"}
                  </button>
                  <p className="text-[10px] text-neutral-400">or paste URL below</p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={mainFileRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadSingleFile(f, setUploadingMain, setImage);
              }}
            />
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://...image.jpg or /api/uploads/..."
              className="w-full border border-neutral-300 px-2.5 py-1.5 text-xs rounded outline-none focus:border-black font-mono"
            />
          </div>

          {/* Hover Shot Image */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Hover Angle Shot
            </label>
            <div className="relative aspect-[2/3] border-2 border-dashed border-neutral-300 rounded overflow-hidden bg-neutral-50 flex flex-col items-center justify-center p-2 text-center">
              {hoverImage ? (
                <>
                  <Image src={hoverImage} alt="Hover" fill sizes="200px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setHoverImage("")}
                    className="absolute top-2 right-2 bg-black/75 hover:bg-black text-white p-1 rounded-full cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="h-8 w-8 text-neutral-400 mx-auto" />
                  <button
                    type="button"
                    onClick={() => hoverFileRef.current?.click()}
                    disabled={uploadingHover}
                    className="px-3 py-1.5 bg-black text-white text-[11px] font-bold uppercase tracking-wider rounded cursor-pointer hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {uploadingHover ? "Uploading..." : "Upload from PC"}
                  </button>
                  <p className="text-[10px] text-neutral-400">or paste URL below</p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={hoverFileRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadSingleFile(f, setUploadingHover, setHoverImage);
              }}
            />
            <input
              type="text"
              value={hoverImage}
              onChange={(e) => setHoverImage(e.target.value)}
              placeholder="https://...hover.jpg or /api/uploads/..."
              className="w-full border border-neutral-300 px-2.5 py-1.5 text-xs rounded outline-none focus:border-black font-mono"
            />
          </div>

          {/* Custom Size Chart Image */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
              <span>Size Chart Image</span>
              <Ruler className="h-3.5 w-3.5 text-neutral-500" />
            </label>
            <div className="relative aspect-[2/3] border-2 border-dashed border-neutral-300 rounded overflow-hidden bg-neutral-50 flex flex-col items-center justify-center p-2 text-center">
              {sizeChartImage ? (
                <>
                  <Image src={sizeChartImage} alt="Size Chart" fill sizes="200px" className="object-contain p-2" />
                  <button
                    type="button"
                    onClick={() => setSizeChartImage("")}
                    className="absolute top-2 right-2 bg-black/75 hover:bg-black text-white p-1 rounded-full cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Ruler className="h-8 w-8 text-neutral-400 mx-auto" />
                  <button
                    type="button"
                    onClick={() => sizeChartFileRef.current?.click()}
                    disabled={uploadingSizeChart}
                    className="px-3 py-1.5 bg-black text-white text-[11px] font-bold uppercase tracking-wider rounded cursor-pointer hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {uploadingSizeChart ? "Uploading..." : "Upload Size Chart"}
                  </button>
                  <p className="text-[10px] text-neutral-400">Optional custom chart image</p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={sizeChartFileRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadSingleFile(f, setUploadingSizeChart, setSizeChartImage);
              }}
            />
            <input
              type="text"
              value={sizeChartImage}
              onChange={(e) => setSizeChartImage(e.target.value)}
              placeholder="https://...sizechart.png or /api/uploads/..."
              className="w-full border border-neutral-300 px-2.5 py-1.5 text-xs rounded outline-none focus:border-black font-mono"
            />
          </div>
        </div>

        {/* Multi-angle Gallery Shots */}
        <div className="space-y-3 pt-3 border-t border-neutral-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Gallery Multi-Angle Images ({galleryImages.length})
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => galleryFilesRef.current?.click()}
                disabled={uploadingGallery}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {uploadingGallery ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                Add Photos from PC
              </button>
            </div>
          </div>
          <input
            type="file"
            ref={galleryFilesRef}
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleGalleryUpload}
          />

          {galleryImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {galleryImages.map((src, i) => (
                <div key={i} className="group relative aspect-[2/3] border border-neutral-200 rounded overflow-hidden bg-neutral-50">
                  <Image src={src} alt={`Angle ${i + 1}`} fill sizes="100px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setGalleryImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newGalleryUrl}
              onChange={(e) => setNewGalleryUrl(e.target.value)}
              placeholder="Or paste an image URL to append..."
              className="flex-1 border border-neutral-300 px-3 py-2 text-xs rounded outline-none focus:border-black font-mono"
            />
            <button
              type="button"
              onClick={() => {
                if (newGalleryUrl.trim()) {
                  setGalleryImages((prev) => [...prev, newGalleryUrl.trim()]);
                  setNewGalleryUrl("");
                }
              }}
              className="px-4 py-2 bg-neutral-800 text-white text-xs font-bold uppercase rounded cursor-pointer hover:bg-black"
            >
              Add URL
            </button>
          </div>
        </div>

        {/* Product Video */}
        <div className="space-y-3 pt-3 border-t border-neutral-100">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Video className="h-4 w-4 text-neutral-700" /> Product Video (YouTube or MP4)
            </span>
            <button
              type="button"
              onClick={() => videoFileRef.current?.click()}
              disabled={uploadingVideo}
              className="text-xs font-bold text-neutral-700 hover:text-black underline cursor-pointer"
            >
              {uploadingVideo ? "Uploading..." : "Upload MP4 from PC"}
            </button>
          </label>
          <input
            type="file"
            ref={videoFileRef}
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadSingleFile(f, setUploadingVideo, setVideoUrl, setVideoUploadProgress);
            }}
          />
          {videoUploadProgress && (
            <p className="text-xs text-blue-600 font-medium">{videoUploadProgress}</p>
          )}

          <input
            type="text"
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              const p = parseVideoSource(e.target.value);
              if (p?.type === "youtube") setVideoId(p.youtubeId);
            }}
            placeholder="YouTube URL (e.g. https://youtu.be/4mWBAj2s6yU) or direct MP4 URL"
            className="w-full border border-neutral-300 px-3 py-2.5 text-xs rounded outline-none focus:border-black font-mono"
          />

          {(() => {
            const p = parseVideoSource(videoUrl, videoId);
            if (!p) return null;
            return (
              <div className="relative aspect-[16/9] max-w-sm rounded overflow-hidden border border-neutral-300 bg-black">
                {p.type === "youtube" ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${p.youtubeId}?rel=0`}
                    title="Video Preview"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video src={p.src} controls className="w-full h-full object-cover" />
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ──────────────── CARD 3: VARIANT OPTIONS & VARIANTS MATRIX ──────────────── */}
      <div className="bg-white border border-neutral-200 rounded p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-neutral-700" /> Variant Options &amp; Pricing Matrix
            </h2>
            <p className="text-xs text-neutral-500">
              Define product options (Size, Dupatta, Add-ons) and generate individual variants with custom prices and SKUs.
            </p>
          </div>
          <button
            type="button"
            onClick={addOption}
            className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 cursor-pointer hover:bg-neutral-800 self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" /> Add Option
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-4">
          {options.map((opt, optIdx) => (
            <div key={optIdx} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="text"
                    value={opt.name}
                    onChange={(e) => updateOptionName(optIdx, e.target.value)}
                    placeholder="Option Name (e.g. Size, Dupatta, AD ONS)"
                    className="border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold rounded outline-none focus:border-black max-w-[220px]"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!opt.useInSku}
                      onChange={(e) => updateOptionUseInSku(optIdx, e.target.checked)}
                      className="h-3.5 w-3.5 accent-black rounded"
                    />
                    <span>Include in SKU</span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeOption(optIdx)}
                  className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer self-end sm:self-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>

              {/* Option Values Tags */}
              <div className="flex flex-wrap items-center gap-2">
                {opt.values.map((v, vIdx) => (
                  <span
                    key={vIdx}
                    className="inline-flex items-center gap-1.5 bg-white border border-neutral-300 px-2.5 py-1 text-xs font-medium rounded-full text-neutral-800 shadow-2xs"
                  >
                    <span>{v}</span>
                    <button
                      type="button"
                      onClick={() => removeOptionValue(optIdx, vIdx)}
                      className="text-neutral-400 hover:text-red-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {/* Add new value input */}
                <input
                  type="text"
                  placeholder="+ Add value (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOptionValue(optIdx, e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  className="border border-dashed border-neutral-300 bg-white px-3 py-1 text-xs rounded-full outline-none focus:border-black w-36"
                />
              </div>
            </div>
          ))}

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-neutral-500">
            <span>Quick add preset:</span>
            <button
              type="button"
              onClick={() => {
                setOptions((prev) => [
                  ...prev.filter((o) => o.name.toLowerCase() !== "size"),
                  { name: "Size", useInSku: true, values: ["XS", "S", "M", "L", "XL", "Custom Size"] },
                ]);
              }}
              className="px-2 py-0.5 border border-neutral-300 bg-white rounded hover:border-black cursor-pointer text-[11px]"
            >
              Standard Sizes (XS-XL)
            </button>
            <button
              type="button"
              onClick={() => {
                setOptions((prev) => [
                  ...prev,
                  {
                    name: "Dupatta",
                    useInSku: false,
                    values: ["Organza Ruffled dupatta", "Organza dupatta with pearl spray", "None"],
                  },
                ]);
              }}
              className="px-2 py-0.5 border border-neutral-300 bg-white rounded hover:border-black cursor-pointer text-[11px]"
            >
              Dupatta Choices
            </button>
            <button
              type="button"
              onClick={() => {
                setOptions((prev) => [
                  ...prev,
                  { name: "AD ONS", useInSku: false, values: ["None", "Grip Head scarf"] },
                ]);
              }}
              className="px-2 py-0.5 border border-neutral-300 bg-white rounded hover:border-black cursor-pointer text-[11px]"
            >
              Ad Ons (Head scarf)
            </button>
          </div>
        </div>

        {/* Generate Matrix Button */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 p-4 rounded-lg">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Generate Variants Matrix
            </h3>
            <p className="text-[11px] text-neutral-500">
              Automatically creates all variant rows with custom prices, SKUs, and stock tracking.
            </p>
          </div>
          <button
            type="button"
            onClick={generateVariantsMatrix}
            className="px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-neutral-800 flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Sparkles className="h-4 w-4" /> ⚡ Generate Matrix ({variants.length} existing)
          </button>
        </div>

        {/* Variants Matrix Table */}
        {variants.length > 0 && (
          <div className="space-y-3 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-neutral-800">Generated Variants ({variants.length})</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyBasePriceToAll}
                  className="px-2.5 py-1 border border-neutral-300 bg-white text-[11px] rounded hover:border-black cursor-pointer"
                >
                  Set Base Price ({formatPrice(Number(price) || 0)}) on All
                </button>
                <button
                  type="button"
                  onClick={() => applyStockToAll(12)}
                  className="px-2.5 py-1 border border-neutral-300 bg-white text-[11px] rounded hover:border-black cursor-pointer"
                >
                  Set Stock 12 on All
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-neutral-200 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-100 text-neutral-700 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3">Variant Attributes</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Price (PKR)</th>
                    <th className="py-2.5 px-3">Sale Price</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {variants.map((v, i) => (
                    <tr key={i} className="hover:bg-neutral-50/60">
                      <td className="py-2 px-3 font-semibold text-neutral-900">
                        {v.attributes && v.attributes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {v.attributes.map((a, aIdx) => (
                              <span key={aIdx} className="bg-neutral-100 px-1.5 py-0.5 rounded text-[11px]">
                                <span className="text-neutral-500 font-normal">{a.name}:</span> {a.value}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span>{v.title || `Variant ${i + 1}`}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.sku || ""}
                          onChange={(e) => updateVariant(i, "sku", e.target.value)}
                          className="border border-neutral-200 px-2 py-1 text-xs rounded font-mono uppercase w-32"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={v.price ?? ""}
                          onChange={(e) => updateVariant(i, "price", Number(e.target.value))}
                          className="border border-neutral-200 px-2 py-1 text-xs rounded font-mono font-bold w-24"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={v.salePrice ?? ""}
                          onChange={(e) =>
                            updateVariant(i, "salePrice", e.target.value ? Number(e.target.value) : null)
                          }
                          placeholder="Optional"
                          className="border border-neutral-200 px-2 py-1 text-xs rounded font-mono w-24"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={v.stock ?? 10}
                          onChange={(e) => updateVariant(i, "stock", Number(e.target.value))}
                          className="border border-neutral-200 px-2 py-1 text-xs rounded font-mono w-16"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeVariant(i)}
                          className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────── CARD 4: CUSTOMER ADD-ON CHOICE GROUPS ──────────────── */}
      <div className="bg-white border border-neutral-200 rounded p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-neutral-700" /> Customer Add-on Choices (Choice Groups)
            </h2>
            <p className="text-xs text-neutral-500">
              Complimentary or customizable options selected via radio buttons on the product page (e.g., &quot;Slip With Sleeves&quot;).
            </p>
          </div>
          <button
            type="button"
            onClick={addChoiceGroup}
            className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 cursor-pointer hover:bg-neutral-800 self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" /> Add Choice Group
          </button>
        </div>

        {choiceGroups.length === 0 ? (
          <div className="p-6 border border-dashed border-neutral-300 rounded text-center text-xs text-neutral-500 space-y-2">
            <p>No customer choice groups added yet.</p>
            <button
              type="button"
              onClick={addChoiceGroup}
              className="text-black font-bold underline cursor-pointer"
            >
              + Click here to add &quot;You may also add:&quot; (Slips, Linings, Sleeves)
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {choiceGroups.map((cg, cgIdx) => (
              <div key={cgIdx} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 max-w-sm">
                    <label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                      Group Title (Displayed on website)
                    </label>
                    <input
                      type="text"
                      value={cg.title}
                      onChange={(e) => updateChoiceGroupTitle(cgIdx, e.target.value)}
                      placeholder="e.g. You may also add: or Lining Option:"
                      className="w-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold rounded outline-none focus:border-black"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChoiceGroup(cgIdx)}
                    className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove Group
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 block">
                    Choices List (Enter one choice per line)
                  </label>
                  <textarea
                    rows={3}
                    value={cg.choices.join("\n")}
                    onChange={(e) => updateChoiceGroupRawChoices(cgIdx, e.target.value)}
                    placeholder={"Select One\nSlip With Sleeves (complimentary)\nSlip Without Sleeves (complimentary)"}
                    className="w-full border border-neutral-300 bg-white p-2.5 text-xs rounded outline-none focus:border-black font-mono leading-relaxed"
                  />
                  <p className="text-[10px] text-neutral-400">
                    Each line becomes a radio selection option on the product page.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ──────────────── CARD 5: FABRIC & GARMENT SPECIFICATIONS ──────────────── */}
      <div className="bg-white border border-neutral-200 rounded p-6 space-y-6 shadow-sm">
        <div className="border-b border-neutral-100 pb-3">
          <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Info className="h-4 w-4 text-neutral-700" /> Fabric &amp; Garment Details
          </h2>
          <p className="text-xs text-neutral-500">
            Artisanal fabric specifications, ready-made details, and unstitched piece breakdowns.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Fabric Overview Summary
            </label>
            <input
              type="text"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              placeholder="e.g. Pure Tissue Silk / Georgette Chiffon / Korean Raw Silk"
              className="w-full border border-neutral-300 px-3.5 py-2.5 text-sm rounded outline-none focus:border-black"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Ready-Made Fabric Details &amp; Customization
              </label>
              <button
                type="button"
                onClick={() =>
                  setReadyMadeDetails(
                    `Fabric Detail:\nShirt: Tassel Silk\nLining: Cotton Silk\nShalwar: Tassel Silk\nDupatta: Georgette Chiffon\n\nPrice Includes: Shirt, Trousers & Dupatta.\n\nColor:\n${color || "Purple"}.\n\nCustomization:\nSize customization: Yes.\nColour customization: No`
                  )
                }
                className="text-xs text-neutral-600 hover:text-black underline cursor-pointer"
              >
                Insert Standard Template
              </button>
            </div>
            <textarea
              rows={6}
              value={readyMadeDetails}
              onChange={(e) => setReadyMadeDetails(e.target.value)}
              placeholder={`Fabric Detail:\nShirt: Organza\nTrousers: PK Rawsilk\nBustier top/Lining: PK Rawsilk\n\nPrice Includes: Shirt, Bustier top, Pants.\n\nColor:\nPurple\n\nCustomization:\nSize customization: Yes\nColour customization: No`}
              className="w-full border border-neutral-300 p-3 text-xs rounded outline-none focus:border-black font-mono leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Unstitched Details (Pieces Breakdown)
            </label>
            <textarea
              rows={4}
              value={unstitchedDetails}
              onChange={(e) => setUnstitchedDetails(e.target.value)}
              placeholder={`Embroidered Shirt Front Left & Right (Korean Raw Silk) 2Pcs\nEmbroidered Shirt Front Left & Right Panels (Korean Raw Silk) 2Pcs\nEmbroidered Back (Korean Raw Silk) 1.5Y\nEmbroidered Sleeves (Korean Raw Silk) 2Pcs\nEmbroidered Dupatta (Organza) 3Y\nDyed Trousers (Korean Raw Silk) 5.5Y`}
              className="w-full border border-neutral-300 p-3 text-xs rounded outline-none focus:border-black font-mono leading-relaxed"
            />
            <p className="text-[10px] text-neutral-400">
              Optional: Leave empty if this product is ready-made only.
            </p>
          </div>
        </div>
      </div>

      {/* ──────────────── CARD 6: DESCRIPTION ──────────────── */}
      <div className="bg-white border border-neutral-200 rounded p-6 space-y-4 shadow-sm">
        <div className="border-b border-neutral-100 pb-3">
          <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Tag className="h-4 w-4 text-neutral-700" /> Description &amp; Story
          </h2>
          <p className="text-xs text-neutral-500">Atelier notes, embroidery details, and styling advice.</p>
        </div>

        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed description of craftsmanship, handwork (Swarovski, dabka, crystals, pearls) and silhouette..."
          className="w-full border border-neutral-300 p-3 text-xs rounded outline-none focus:border-black leading-relaxed"
        />
      </div>

      {/* Bottom Floating Bar */}
      <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur border border-neutral-300 p-4 rounded shadow-lg flex items-center justify-between">
        <div className="text-xs text-neutral-600">
          Ready to publish? Check title, category, price, and variant matrix.
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={formSubmitting}
            className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
          >
            {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </form>
  );
}

