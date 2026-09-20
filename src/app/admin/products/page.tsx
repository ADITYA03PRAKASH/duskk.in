"use client";

import React, { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
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
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    setFeatured(false);
    setBestSeller(false);
    setNewArrival(true);
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
    setMaterial(p.material || "Demi-Fine Gold on 925 Sterling Silver");
    setColor(p.color || "Gold");
    setDescription(p.description || "");
    setShortDescription(p.shortDescription || "");
    setFeatured(!!p.featured);
    setBestSeller(!!p.bestSeller);
    setNewArrival(!!p.newArrival);
    setImageUrl(p.images?.[0]?.url || p.images?.[0]?.image_url || "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const payload = {
      sku,
      name,
      categoryId,
      price,
      mrp: mrp || price,
      discount,
      stockQuantity,
      material,
      color,
      description,
      shortDescription,
      featured,
      bestSeller,
      newArrival,
      images: imageUrl ? [{ url: imageUrl, altText: name }] : [],
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
    if (!confirm("Are you sure you want to remove this product?")) return;
    try {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      loadData();
    } catch (e) {
      console.error(e);
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
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-duskk-100">
                {products.map((p) => {
                  const img = p.images?.[0]?.url || "/placeholder.jpg";
                  return (
                    <tr key={p.id} className="hover:bg-duskk-50/50">
                      <td className="py-3 px-4 flex items-center space-x-3">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded bg-duskk-50 border border-duskk-100 flex-shrink-0"
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
                </div>
              </div>

              <div>
                <label className="block font-semibold text-duskk-700 uppercase mb-1">Primary Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-duskk-300 rounded"
                />
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
