"use client";

import React, { useState, useEffect } from "react";
import { formatPrice, getProductPrimaryImage, normalizeImageUrl } from "@/lib/utils";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  AlertCircle,
  Loader2,
  Sparkles,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Star,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form State
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [discount, setDiscount] = useState("0");
  const [stockQuantity, setStockQuantity] = useState("20");
  const [material, setMaterial] = useState("Demi-Fine Gold on 925 Sterling Silver");
  const [color, setColor] = useState("Gold");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [newArrival, setNewArrival] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [backImageUrl, setBackImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBackImage, setUploadingBackImage] = useState(false);

  // Rating Controls State
  const [displayRating, setDisplayRating] = useState(true);
  const [ratingSource, setRatingSource] = useState<"AUTO" | "CUSTOM">("AUTO");
  const [manualRating, setManualRating] = useState("");
  const [manualReviewCount, setManualReviewCount] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isBack = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isBack) {
      setUploadingBackImage(true);
    } else {
      setUploadingImage(true);
    }
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "product-images");
      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.url) {
        if (isBack) {
          setBackImageUrl(data.data.url);
        } else {
          setImageUrl(data.data.url);
        }
      } else {
        setErrorMsg(data.message || "Failed to upload image file to Supabase Storage");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload image file");
    } finally {
      if (isBack) {
        setUploadingBackImage(false);
      } else {
        setUploadingImage(false);
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/admin/products${search ? `?search=${encodeURIComponent(search)}` : ""}`),
        fetch("/api/admin/categories"),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      if (prodData.success) setProducts(prodData.data);
      if (catData.success) {
        setCategories(catData.data);
        if (catData.data.length > 0 && !categoryId) {
          setCategoryId(catData.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setSku(`DSK-${Math.floor(100 + Math.random() * 900)}`);
    setName("");
    setCategoryId(categories.length > 0 ? categories[0].id : "");
    setPrice("");
    setMrp("");
    setDiscount("0");
    setStockQuantity("25");
    setDescription("");
    setShortDescription("");
    setImageUrl("https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80");
    setBackImageUrl("");
    setFeatured(false);
    setBestSeller(false);
    setNewArrival(true);

    // Rating controls defaults
    setDisplayRating(true);
    setRatingSource("AUTO");
    setManualRating("");
    setManualReviewCount("");

    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name || p.title);
    setCategoryId(p.categoryId || p.category_id || (categories.find(c => c.name === p.categoryName)?.id) || categories[0]?.id || "");
    setPrice((p.price ?? "").toString());
    setMrp((p.mrp ?? p.price ?? "").toString());
    setDiscount(p.discount?.toString() || "0");
    setStockQuantity((p.stockQuantity ?? 20).toString());
    const existingMaterial = p.material || p.specifications?.material || p.specifications?.Material || "";
    const existingColor = p.color || p.specifications?.color || p.specifications?.Color || "";
    setMaterial(existingMaterial);
    setColor(existingColor);
    setDescription(p.description || "");
    setShortDescription(p.shortDescription || p.short_description || "");
    setFeatured(!!p.featured);
    setBestSeller(!!p.bestSeller);
    setNewArrival(!!p.newArrival);

    // Front image population (primary image or first image)
    const frontImg = getProductPrimaryImage(p, "");
    setImageUrl(frontImg);

    // Back image population (second image if distinct from front image)
    const rawImgs = p.images || p.product_images || [];
    let backImg = "";
    if (Array.isArray(rawImgs) && rawImgs.length > 1) {
      const secondNorm = normalizeImageUrl(rawImgs[1], "");
      if (secondNorm && secondNorm !== frontImg && secondNorm !== "/placeholder.svg") {
        backImg = secondNorm;
      }
    }
    setBackImageUrl(backImg);

    // Rating controls population
    const dispRating = p.displayRating !== undefined ? Boolean(p.displayRating) : (p.display_rating !== undefined ? Boolean(p.display_rating) : true);
    setDisplayRating(dispRating);
    setRatingSource((p.ratingSource || p.rating_source || "AUTO").toUpperCase() === "CUSTOM" ? "CUSTOM" : "AUTO");
    const manRating = p.manualRating !== null && p.manualRating !== undefined ? p.manualRating : (p.manual_rating !== null && p.manual_rating !== undefined ? p.manual_rating : "");
    setManualRating(manRating !== "" ? String(manRating) : "");
    const manCount = p.manualReviewCount !== null && p.manualReviewCount !== undefined ? p.manualReviewCount : (p.manual_review_count !== null && p.manual_review_count !== undefined ? p.manual_review_count : "");
    setManualReviewCount(manCount !== "" ? String(manCount) : "");

    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const numPrice = price !== "" ? Number(price) : undefined;
    const numMrp = mrp !== "" ? Number(mrp) : undefined;

    if (numPrice !== undefined && (isNaN(numPrice) || numPrice < 0)) {
      setErrorMsg("Selling price cannot be negative.");
      setSaving(false);
      return;
    }

    if (numMrp !== undefined && (isNaN(numMrp) || numMrp < 0)) {
      setErrorMsg("MRP cannot be negative.");
      setSaving(false);
      return;
    }

    if (numPrice !== undefined && numMrp !== undefined && numPrice > numMrp) {
      setErrorMsg("Selling Price cannot be higher than MRP.");
      setSaving(false);
      return;
    }

    // Rating validation
    if (displayRating && ratingSource === "CUSTOM") {
      if (manualRating !== "") {
        const nr = Number(manualRating);
        if (isNaN(nr) || nr < 0 || nr > 5.0) {
          setErrorMsg("Custom rating must be a valid number between 0.0 and 5.0.");
          setSaving(false);
          return;
        }
      }
      if (manualReviewCount !== "") {
        const nc = Number(manualReviewCount);
        if (isNaN(nc) || nc < 0 || !Number.isInteger(nc)) {
          setErrorMsg("Custom review count must be a non-negative whole integer.");
          setSaving(false);
          return;
        }
      }
    }

    // Construct images array: front image (order 0), back image (order 1), plus existing additional gallery images
    const imageList: Array<{ url: string; altText: string }> = [];
    if (imageUrl && imageUrl.trim()) {
      imageList.push({ url: imageUrl.trim(), altText: name });
    }
    if (backImageUrl && backImageUrl.trim() && backImageUrl.trim() !== imageUrl?.trim()) {
      imageList.push({ url: backImageUrl.trim(), altText: `${name} - Alternate view` });
    }
    // If editing, preserve any extra gallery images beyond index 1 that the product originally had
    if (editingProduct && Array.isArray(editingProduct.images)) {
      const extraImgs = editingProduct.images.slice(2);
      for (const extra of extraImgs) {
        const extraUrl = typeof extra === "string" ? extra : (extra?.url || extra?.image_url);
        if (extraUrl && !imageList.some((img) => img.url === extraUrl)) {
          imageList.push({ url: extraUrl, altText: extra.alt_text || extra.altText || name });
        }
      }
    }

    const payload = {
      sku,
      name,
      categoryId,
      price,
      mrp: mrp ? mrp : undefined,
      discount,
      stockQuantity,
      material,
      color,
      description,
      shortDescription,
      featured,
      bestSeller,
      newArrival,
      images: imageList,
      displayRating,
      ratingSource,
      manualRating: manualRating !== "" ? Number(Number(manualRating).toFixed(1)) : null,
      manualReviewCount: manualReviewCount !== "" ? parseInt(manualReviewCount, 10) : null,
    };

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        setErrorMsg(data.message || "Failed to save product");
      }
    } catch {
      setErrorMsg("Network error saving product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to remove this product? It will be archived and removed from the active catalog.")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.message || "Failed to remove product");
      }
      await loadData();
    } catch (e) {
      console.error("Delete product network error:", e);
      alert("Network error removing product.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-duskk-500 block">
            Catalog Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-duskk-900">
            Products & Atelier Pieces ({products.length})
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition flex items-center space-x-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-4 border border-duskk-200 rounded-lg shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-duskk-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-duskk-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-duskk-900 animate-spin mx-auto" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-duskk-500 text-xs">
            No products match your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-duskk-50 text-duskk-600 uppercase font-mono tracking-wider border-b border-duskk-200">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price / MRP</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Badges</th>
                  <th className="py-3 px-4">Rating Display</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-duskk-100">
                {products.map((p) => {
                  const img = getProductPrimaryImage(p);
                  return (
                    <tr key={p.id} className="hover:bg-duskk-50/50">
                      <td className="py-3 px-4 flex items-center space-x-3">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded bg-duskk-50 border border-duskk-100 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                        <div>
                          <p className="font-semibold text-duskk-900 line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-duskk-400 font-mono">SKU: {p.sku}</p>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-duskk-700">
                        {p.category?.name || "Jewellery"}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-duskk-900 font-serif text-sm">
                          {formatPrice(p.price)}
                        </span>
                        {p.mrp > p.price && (
                          <span className="text-[10px] text-duskk-400 line-through block">
                            {formatPrice(p.mrp)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.stockQuantity <= 0
                              ? "bg-rose-100 text-rose-800"
                              : p.stockQuantity <= 10
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {p.stockQuantity} units
                        </span>
                      </td>

                      <td className="py-3 px-4 space-x-1">
                        {p.bestSeller && (
                          <span className="bg-duskk-900 text-white text-[9px] uppercase px-1.5 py-0.5 font-bold">
                            Bestseller
                          </span>
                        )}
                        {p.newArrival && (
                          <span className="bg-duskk-gold text-duskk-900 text-[9px] uppercase px-1.5 py-0.5 font-bold">
                            New
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {p.displayRating === false || p.display_rating === false ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-duskk-100 text-duskk-500">
                            <EyeOff className="w-3 h-3 text-duskk-400" />
                            <span>Hidden</span>
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                              <span className="font-bold text-duskk-900 text-xs">
                                {typeof p.avgRating === "number" ? p.avgRating.toFixed(1) : (p.avgRating || "4.9")}
                              </span>
                              <span className="text-duskk-400 text-[10px]">
                                ({p.reviewCount ?? 14})
                              </span>
                            </div>
                            <span
                              className={`inline-block px-1.5 py-0.5 text-[9px] font-mono uppercase rounded ${
                                (p.ratingSource || p.rating_source) === "CUSTOM"
                                  ? "bg-purple-100 text-purple-800 font-semibold"
                                  : "bg-duskk-100 text-duskk-600"
                              }`}
                            >
                              {(p.ratingSource || p.rating_source) === "CUSTOM" ? "CMS Custom" : "Auto"}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-duskk-600 hover:text-duskk-900 hover:bg-duskk-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-duskk-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-lg shadow-2xl overflow-hidden border border-duskk-200 my-8">
            <div className="bg-duskk-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-serif text-lg font-medium">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : "Create New Jewelry Product"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-duskk-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-duskk-700 uppercase mb-1">Product SKU *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-duskk-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-duskk-700 uppercase mb-1">Category *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-duskk-300 rounded bg-white text-duskk-900"
                  >
                    {categories.length === 0 ? (
                      <option value="" disabled>Loading categories...</option>
                    ) : null}
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-duskk-700 uppercase mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Baroque Pearl Drop Earrings"
                  className="w-full px-3 py-2 border border-duskk-300 rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-duskk-700 uppercase mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2499"
                    className="w-full px-3 py-2 border border-duskk-300 rounded"
                  />
                  <p className="text-[10px] text-duskk-500 mt-1">Customer purchase price</p>
                </div>

                <div>
                  <label className="block font-semibold text-duskk-700 uppercase mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    placeholder="3499"
                    className="w-full px-3 py-2 border border-duskk-300 rounded"
                  />
                  <p className="text-[10px] text-duskk-500 mt-1">Catalog MRP (≥ Selling Price)</p>
                </div>

                <div>
                  <label className="block font-semibold text-duskk-700 uppercase mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-duskk-300 rounded"
                  />
                  <p className="text-[10px] text-duskk-500 mt-1">Units available</p>
                </div>
              </div>

              {/* Product Images: Front & Back */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-duskk-50/50 border border-duskk-200 rounded-lg">
                {/* Front Image */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-duskk-800 uppercase text-xs">
                      Front Image (Primary) *
                    </label>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="text-[10px] text-rose-600 hover:text-rose-800 uppercase font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <label className={`cursor-pointer px-3 py-1.5 bg-white hover:bg-duskk-100 text-duskk-900 border border-duskk-300 rounded font-semibold text-xs flex items-center space-x-1.5 transition shadow-sm ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}>
                        {uploadingImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-duskk-900" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-duskk-700" />
                        )}
                        <span>{uploadingImage ? "Uploading..." : "Upload File"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileUpload(e, false)}
                          disabled={uploadingImage}
                        />
                      </label>
                      <span className="text-[10px] text-duskk-400 font-mono">PNG, JPG, WEBP</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {imageUrl ? (
                        <div className="w-14 h-14 rounded border border-duskk-200 overflow-hidden bg-white flex-shrink-0 relative group shadow-sm">
                          <img
                            src={normalizeImageUrl(imageUrl)}
                            alt="Front Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded border border-dashed border-duskk-300 bg-white flex items-center justify-center text-duskk-400 flex-shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Paste front image URL"
                        className="w-full px-3 py-2 border border-duskk-300 bg-white rounded text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Back Image (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-duskk-800 uppercase text-xs">
                      Back Image (Optional / Hover view)
                    </label>
                    {backImageUrl && (
                      <button
                        type="button"
                        onClick={() => setBackImageUrl("")}
                        className="text-[10px] text-rose-600 hover:text-rose-800 uppercase font-semibold"
                      >
                        Remove Back Image
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <label className={`cursor-pointer px-3 py-1.5 bg-white hover:bg-duskk-100 text-duskk-900 border border-duskk-300 rounded font-semibold text-xs flex items-center space-x-1.5 transition shadow-sm ${uploadingBackImage ? "opacity-50 pointer-events-none" : ""}`}>
                        {uploadingBackImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-duskk-900" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-duskk-700" />
                        )}
                        <span>{uploadingBackImage ? "Uploading..." : "Upload File"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileUpload(e, true)}
                          disabled={uploadingBackImage}
                        />
                      </label>
                      <span className="text-[10px] text-duskk-400 font-mono">PNG, JPG, WEBP</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {backImageUrl ? (
                        <div className="w-14 h-14 rounded border border-duskk-200 overflow-hidden bg-white flex-shrink-0 relative group shadow-sm">
                          <img
                            src={normalizeImageUrl(backImageUrl)}
                            alt="Back Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded border border-dashed border-duskk-300 bg-white flex items-center justify-center text-duskk-400 flex-shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <input
                        type="url"
                        value={backImageUrl}
                        onChange={(e) => setBackImageUrl(e.target.value)}
                        placeholder="Paste back/alternate image URL"
                        className="w-full px-3 py-2 border border-duskk-300 bg-white rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-duskk-700 uppercase mb-1">Material & Finish</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-3 py-2 border border-duskk-300 rounded"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-duskk-700 uppercase mb-1">Color / Tone</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 border border-duskk-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-duskk-700 uppercase mb-1">Product Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-duskk-300 rounded"
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-duskk-300"
                  />
                  <span>Featured Collection</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bestSeller}
                    onChange={(e) => setBestSeller(e.target.checked)}
                    className="rounded border-duskk-300"
                  />
                  <span>Bestseller Badge</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newArrival}
                    onChange={(e) => setNewArrival(e.target.checked)}
                    className="rounded border-duskk-300"
                  />
                  <span>New Arrival Badge</span>
                </label>
              </div>

              {/* Rating & Review Display Controls Section */}
              <div className="pt-4 border-t border-duskk-200 space-y-3 bg-duskk-50/70 p-4 rounded-lg border border-duskk-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <h4 className="font-semibold text-duskk-900 uppercase text-xs tracking-wider">
                      Storefront Rating & Review Display
                    </h4>
                  </div>
                  <label className="inline-flex items-center space-x-2 cursor-pointer bg-white px-3 py-1 rounded border border-duskk-200 shadow-sm">
                    <input
                      type="checkbox"
                      checked={displayRating}
                      onChange={(e) => setDisplayRating(e.target.checked)}
                      className="rounded border-duskk-300 text-duskk-900 focus:ring-duskk-gold"
                    />
                    <span className="text-xs font-semibold text-duskk-800">
                      {displayRating ? "Rating Display: Enabled" : "Rating Display: Disabled"}
                    </span>
                  </label>
                </div>

                <p className="text-[11px] text-duskk-600 leading-relaxed">
                  Controls whether product ratings and review counts appear on customer-facing product cards, category pages, search results, and the product detail page.
                </p>

                {displayRating ? (
                  <div className="space-y-3 pt-2">
                    {/* Rating Source Selection */}
                    <div>
                      <label className="block font-semibold text-duskk-700 uppercase mb-1.5 text-[11px]">
                        Rating Source
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label
                          className={`flex items-start space-x-2.5 p-3 rounded-lg border cursor-pointer transition ${
                            ratingSource === "AUTO"
                              ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-300"
                              : "bg-white border-duskk-200 hover:bg-duskk-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="ratingSource"
                            value="AUTO"
                            checked={ratingSource === "AUTO"}
                            onChange={() => setRatingSource("AUTO")}
                            className="mt-0.5 text-duskk-900 focus:ring-duskk-gold"
                          />
                          <div>
                            <span className="font-semibold text-duskk-900 block text-xs">
                              Automatic (Real Reviews)
                            </span>
                            <span className="text-[10px] text-duskk-500 block leading-tight mt-0.5">
                              Calculates average rating dynamically from approved customer reviews (or catalog default if none submitted).
                            </span>
                          </div>
                        </label>

                        <label
                          className={`flex items-start space-x-2.5 p-3 rounded-lg border cursor-pointer transition ${
                            ratingSource === "CUSTOM"
                              ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-300"
                              : "bg-white border-duskk-200 hover:bg-duskk-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="ratingSource"
                            value="CUSTOM"
                            checked={ratingSource === "CUSTOM"}
                            onChange={() => setRatingSource("CUSTOM")}
                            className="mt-0.5 text-duskk-900 focus:ring-duskk-gold"
                          />
                          <div>
                            <span className="font-semibold text-duskk-900 block text-xs">
                              Administrator Managed (Custom)
                            </span>
                            <span className="text-[10px] text-duskk-500 block leading-tight mt-0.5">
                              Explicit display rating and review count managed by CMS admin without overwriting genuine customer reviews.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Custom Rating & Review Count Inputs */}
                    {ratingSource === "CUSTOM" && (
                      <div className="p-3 bg-white border border-duskk-200 rounded-lg space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-duskk-700 uppercase text-[11px] mb-1">
                              Product Rating (0.0 – 5.0) *
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.0"
                              max="5.0"
                              value={manualRating}
                              onChange={(e) => setManualRating(e.target.value)}
                              placeholder="e.g. 4.8"
                              className="w-full px-3 py-2 border border-duskk-300 rounded text-xs focus:outline-none focus:border-duskk-gold"
                            />
                            <p className="text-[10px] text-duskk-400 mt-1">Decimal value from 0.0 to 5.0</p>
                          </div>

                          <div>
                            <label className="block font-semibold text-duskk-700 uppercase text-[11px] mb-1">
                              Review Count (≥ 0) *
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={manualReviewCount}
                              onChange={(e) => setManualReviewCount(e.target.value)}
                              placeholder="e.g. 24"
                              className="w-full px-3 py-2 border border-duskk-300 rounded text-xs focus:outline-none focus:border-duskk-gold"
                            />
                            <p className="text-[10px] text-duskk-400 mt-1">Non-negative whole integer</p>
                          </div>
                        </div>

                        {/* Live Storefront Preview */}
                        <div className="pt-2 border-t border-duskk-100 flex items-center justify-between">
                          <span className="text-[11px] text-duskk-500 font-medium">Storefront Preview:</span>
                          <div className="flex items-center space-x-1.5 bg-duskk-50 px-2.5 py-1 rounded border border-duskk-200">
                            <div className="flex items-center text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </div>
                            <span className="text-xs font-bold text-duskk-900">
                              {manualRating ? Number(manualRating).toFixed(1) : "4.9"}
                            </span>
                            <span className="text-xs text-duskk-500">
                              ({manualReviewCount !== "" ? manualReviewCount : "0"} Ratings)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded text-[11px] text-amber-800 flex items-center space-x-2">
                    <EyeOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      Ratings and review counts will be hidden across all customer-facing product cards and product detail views.
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-duskk-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-duskk-300 text-duskk-700 rounded hover:bg-duskk-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white font-semibold rounded uppercase tracking-wider"
                >
                  {saving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
