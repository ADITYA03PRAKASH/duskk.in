"use client";

import React, { useState, useEffect } from "react";
import { ComboBoxDesign } from "@/types";
import { formatPrice, normalizeImageUrl } from "@/lib/utils";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Upload,
  Eye,
  Layers,
  Sparkles,
} from "lucide-react";

export function BoxDesignsSettingsTab() {
  const [designs, setDesigns] = useState<ComboBoxDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete State
  const [deletingDesign, setDeletingDesign] = useState<ComboBoxDesign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    supportedProductCount: "2",
    additionalPrice: "0",
    isActive: true,
    displayOrder: "0",
  });

  const fetchDesigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/combos/box-designs");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load box designs");
      }
      setDesigns(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load box packaging designs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const openCreateModal = () => {
    setEditingDesignId(null);
    setModalError(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      supportedProductCount: "2",
      additionalPrice: "0",
      isActive: true,
      displayOrder: (designs.length * 10).toString(),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (design: ComboBoxDesign) => {
    setEditingDesignId(design.id);
    setModalError(null);
    setFormData({
      name: design.name,
      slug: design.slug,
      description: design.description || "",
      imageUrl: design.imageUrl || "",
      supportedProductCount: design.supportedProductCount.toString(),
      additionalPrice: design.additionalPrice.toString(),
      isActive: design.isActive,
      displayOrder: design.displayOrder.toString(),
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setModalError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("bucket", "product-images");

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Image upload failed");
      }

      setFormData((prev) => ({ ...prev, imageUrl: json.data.publicUrl }));
    } catch (err: any) {
      setModalError(err.message || "Failed to upload box artwork");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.name.trim()) {
      setModalError("Please provide a box design name.");
      return;
    }

    const rawCount = formData.supportedProductCount;
    if (typeof rawCount !== "number" && typeof rawCount !== "string") {
      setModalError("Supported product count must be an integer >= 1.");
      return;
    }

    const countTrimmed = typeof rawCount === "string" ? rawCount.trim() : rawCount;
    if (countTrimmed === "") {
      setModalError("Supported product count must be an integer >= 1.");
      return;
    }

    const countNum = Number(countTrimmed);
    if (!Number.isInteger(countNum) || countNum < 1) {
      setModalError("Supported product count must be an integer >= 1.");
      return;
    }

    const priceNum = parseFloat(formData.additionalPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setModalError("Additional price must be a valid non-negative number.");
      return;
    }

    setSaving(true);

    try {
      const url = editingDesignId
        ? `/api/admin/combos/box-designs/${editingDesignId}`
        : `/api/admin/combos/box-designs`;
      const method = editingDesignId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim() || undefined,
          description: formData.description.trim() || null,
          imageUrl: formData.imageUrl.trim() || null,
          supportedProductCount: countNum,
          additionalPrice: priceNum,
          isActive: formData.isActive,
          displayOrder: parseInt(formData.displayOrder, 10) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save box design");
      }

      setSuccessMessage(
        editingDesignId ? `Updated "${formData.name}".` : `Created "${formData.name}".`
      );
      setTimeout(() => setSuccessMessage(null), 3500);

      setIsModalOpen(false);
      fetchDesigns();
    } catch (err: any) {
      setModalError(err.message || "Failed to save box design");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDesign) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/combos/box-designs/${deletingDesign.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete box design");
      }

      setSuccessMessage(`"${deletingDesign.name}" was deleted.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      setDeletingDesign(null);
      fetchDesigns();
    } catch (err: any) {
      setError(err.message || "Failed to delete box design");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-duskk-200 rounded-xl shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-duskk-gold text-xs font-bold uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Packaging & Presentation Atelier</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-duskk-900">
            Combo Box Packaging Designs
          </h2>
          <p className="text-xs text-duskk-600 mt-1 max-w-2xl leading-relaxed">
            Manage luxury gift boxes for the Build Your Own Combo flow. Each box supports an exact count of distinct jewellery pieces (e.g. Small Square for 2, Rectangle Set for 3, Hexagon Set for 4, Big Square Set for 5).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchDesigns}
            disabled={loading}
            className="p-2.5 text-duskk-600 hover:text-duskk-900 hover:bg-duskk-50 rounded-lg border border-duskk-300 transition shadow-xs"
            title="Refresh Box Designs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-duskk-gold" : ""}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2.5 bg-duskk-900 text-white text-xs uppercase tracking-widest font-semibold hover:bg-duskk-800 rounded-lg shadow-sm transition space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Box Design</span>
          </button>
        </div>
      </div>

      {/* Success & Error alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center space-x-3 text-xs shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold underline text-rose-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Box Designs Grid */}
      {loading ? (
        <div className="p-16 text-center bg-white border border-duskk-200 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-duskk-gold mx-auto mb-3" />
          <p className="text-xs text-duskk-500 font-medium">Loading presentation box catalog...</p>
        </div>
      ) : designs.length === 0 ? (
        <div className="p-16 text-center bg-white border border-dashed border-duskk-300 rounded-xl space-y-4">
          <Package className="w-12 h-12 text-duskk-300 mx-auto" />
          <div>
            <h3 className="font-serif text-lg font-medium text-duskk-900">
              No Box Designs Configured
            </h3>
            <p className="text-xs text-duskk-500 max-w-md mx-auto mt-1">
              Add your launch presentation boxes (Small Square, Rectangle Set, Hexagon Set, Big Square Set, Heart Shape Set) to enable the box-selection step.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-duskk-900 hover:bg-duskk-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition"
          >
            Create First Box Design
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <div
              key={design.id}
              className={`bg-white rounded-xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${design.isActive ? "border-duskk-200" : "border-duskk-200 bg-duskk-50/50 opacity-75"
                }`}
            >
              <div>
                {/* Artwork */}
                <div className="relative aspect-[16/10] bg-duskk-100 overflow-hidden border-b border-duskk-100">
                  {design.imageUrl ? (
                    <img
                      src={normalizeImageUrl(design.imageUrl)}
                      alt={design.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-duskk-400">
                      <Package className="w-8 h-8 mb-1 text-duskk-300" />
                      <span className="text-[10px] uppercase font-mono tracking-wider">No artwork uploaded</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 bg-duskk-900 text-duskk-gold px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold tracking-wider shadow">
                    Supports {design.supportedProductCount} Products
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${design.isActive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-duskk-200 text-duskk-600"
                        }`}
                    >
                      {design.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-serif text-base font-bold text-duskk-900 line-clamp-1">
                      {design.name}
                    </h3>
                    <span className="text-sm font-bold font-serif text-duskk-900 whitespace-nowrap">
                      {design.additionalPrice > 0 ? `+${formatPrice(design.additionalPrice)}` : "Complimentary"}
                    </span>
                  </div>

                  <p className="text-[11px] text-duskk-400 font-mono">slug: {design.slug}</p>

                  {design.description && (
                    <p className="text-xs text-duskk-600 line-clamp-2 leading-relaxed">
                      {design.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3.5 bg-duskk-50 border-t border-duskk-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-duskk-500 font-mono">
                  Order: {design.displayOrder}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(design)}
                    className="p-1.5 text-duskk-600 hover:text-duskk-900 hover:bg-duskk-200/60 rounded transition"
                    title="Edit Box Design"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingDesign(design)}
                    className="p-1.5 text-duskk-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                    title="Delete Box Design"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-duskk-200 shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="p-5 bg-duskk-cream border-b border-duskk-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-duskk-gold" />
                <h3 className="font-serif text-lg font-bold text-duskk-900">
                  {editingDesignId ? "Edit Box Packaging Design" : "New Box Packaging Design"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-duskk-400 hover:text-duskk-900 rounded-full hover:bg-duskk-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-duskk-700 font-semibold mb-1">
                    Box Design Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Small Square"
                    className="w-full px-3 py-2 border border-duskk-300 rounded-lg text-xs bg-white text-duskk-900 focus:outline-none focus:border-duskk-gold"
                  />
                </div>

                <div>
                  <label className="block text-duskk-700 font-semibold mb-1">
                    Slug (Auto-generated if empty)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. small-square"
                    className="w-full px-3 py-2 border border-duskk-300 rounded-lg text-xs bg-white text-duskk-900 font-mono focus:outline-none focus:border-duskk-gold"
                  />
                </div>
              </div>

              {/* Capacity & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-duskk-700 font-semibold mb-1">
                    Supported Product Count (Exact) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.supportedProductCount}
                    onChange={(e) => setFormData({ ...formData, supportedProductCount: e.target.value })}
                    className="w-full px-3 py-2 border border-duskk-300 rounded-lg text-xs bg-white text-duskk-900 font-mono focus:outline-none focus:border-duskk-gold"
                  />
                  <p className="text-[10px] text-duskk-500 mt-1">
                    Displayed only when combo has exactly this many distinct products.
                  </p>
                </div>

                <div>
                  <label className="block text-duskk-700 font-semibold mb-1">
                    Additional Price (INR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.additionalPrice}
                    onChange={(e) => setFormData({ ...formData, additionalPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-duskk-300 rounded-lg text-xs bg-white text-duskk-900 font-serif font-bold focus:outline-none focus:border-duskk-gold"
                  />
                  <p className="text-[10px] text-duskk-500 mt-1">
                    Set 0 for complimentary packaging. Excluded from combo discount.
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-duskk-700 font-semibold mb-1">
                  Description / Features
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Bespoke velvet interior with ribbon closure."
                  className="w-full px-3 py-2 border border-duskk-300 rounded-lg text-xs bg-white text-duskk-900 focus:outline-none focus:border-duskk-gold"
                />
              </div>

              {/* Artwork / Image Upload */}
              <div>
                <label className="block text-duskk-700 font-semibold mb-1">
                  Box Image URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://res.cloudinary.com/..."
                    className="flex-1 px-3 py-2 border border-duskk-300 rounded-lg text-xs bg-white text-duskk-900 font-mono focus:outline-none focus:border-duskk-gold"
                  />
                  <label className="cursor-pointer px-3 py-2 bg-duskk-100 hover:bg-duskk-200 text-duskk-800 rounded-lg font-semibold flex items-center space-x-1 transition whitespace-nowrap">
                    {uploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingImage ? "Uploading..." : "Upload Artwork"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Display Order & Active */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-duskk-700 font-semibold mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full px-3 py-2 border border-duskk-300 rounded-lg text-xs bg-white text-duskk-900 focus:outline-none focus:border-duskk-gold font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActiveBox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-duskk-900 border-duskk-300 rounded focus:ring-duskk-gold"
                  />
                  <label htmlFor="isActiveBox" className="text-xs font-semibold text-duskk-800 cursor-pointer">
                    Active (Visible to customers when count matches)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-duskk-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-duskk-300 text-duskk-700 hover:bg-duskk-100 rounded-lg uppercase tracking-wider font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-5 py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white rounded-lg uppercase tracking-wider font-semibold transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingDesignId ? "Save Changes" : "Create Design"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-duskk-200 shadow-2xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg font-bold text-duskk-900">Delete Box Design?</h3>
              <p className="text-xs text-duskk-600">
                Are you sure you want to delete <strong>&quot;{deletingDesign.name}&quot;</strong>? Historical orders referencing this box will retain their preserved snapshot details safely.
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDesign(null)}
                className="w-1/2 py-2.5 border border-duskk-300 text-duskk-700 hover:bg-duskk-100 rounded-lg text-xs uppercase tracking-wider font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs uppercase tracking-wider font-semibold flex items-center justify-center space-x-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
