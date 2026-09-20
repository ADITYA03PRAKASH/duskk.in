"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Check, Loader2 } from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80");
    setSortOrder("1");
    setActive(true);
    setIsModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingCategory(c);
    setName(c.name || "");
    setSlug(c.slug || "");
    setDescription(c.description || "");
    setImage(c.image || c.image_url || "");
    setSortOrder((c.sortOrder ?? c.display_order ?? 0).toString());
    setActive(c.active !== undefined ? c.active : (c.is_active !== undefined ? c.is_active : true));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description,
          image,
          imageUrl: image,
          sortOrder: Number(sortOrder),
          displayOrder: Number(sortOrder),
          active,
          isActive: active,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success !== false) {
        setIsModalOpen(false);
        loadCategories();
      } else {
        alert(data.message || "Failed to save category");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      loadCategories();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-duskk-500 block">
            Category Taxonomy
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-duskk-900">
            Jewelry Categories ({categories.length})
          </h1>
        </div>

        <button
          onClick={openCreate}
          className="px-4 py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center">
            <Loader2 className="w-8 h-8 text-duskk-900 animate-spin mx-auto" />
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-duskk-200 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div className="aspect-video w-full bg-duskk-100 relative overflow-hidden">
                <img
                  src={cat.image || "/placeholder.jpg"}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                  Order: {cat.sortOrder}
                </div>
              </div>

              <div className="p-4 space-y-2 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-duskk-900">{cat.name}</h3>
                    <p className="text-[11px] text-duskk-400 font-mono">/{cat.slug}</p>
                  </div>
                  <span className="text-xs font-semibold text-duskk-600 bg-duskk-50 px-2 py-0.5 rounded">
                    {cat._count?.products || 0} pieces
                  </span>
                </div>
                {cat.description && (
                  <p className="text-xs text-duskk-600 line-clamp-2">{cat.description}</p>
                )}
              </div>

              <div className="p-3 bg-duskk-50 border-t border-duskk-100 flex justify-end space-x-2">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 text-duskk-600 hover:text-duskk-900"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 text-duskk-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-lg shadow-2xl overflow-hidden border border-duskk-200">
            <div className="bg-duskk-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-serif text-base font-medium">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated from name if blank"
                  className="w-full px-3 py-2 border rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Image URL</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Display Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-duskk-900 text-white rounded font-semibold uppercase tracking-wider"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
