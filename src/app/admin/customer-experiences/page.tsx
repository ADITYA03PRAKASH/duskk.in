"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

interface Testimonial {
  id: string;
  customer_name: string;
  review_text: string;
  rating: number;
  location?: string | null;
  is_verified_buyer: boolean;
  source_type: string;
  source_url?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const SOURCE_TYPES = [
  "Customer Submission",
  "Google Review",
  "Instagram",
  "Facebook",
  "Other",
];

export default function CustomerExperiencesAdminPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Section Settings
  const [eyebrow, setEyebrow] = useState("CUSTOMER EXPERIENCES");
  const [heading, setHeading] = useState("Loved By Modern Muses");
  const [description, setDescription] = useState("");
  const [savingSection, setSavingSection] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [location, setLocation] = useState("");
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);
  const [sourceType, setSourceType] = useState("Customer Submission");
  const [sourceUrl, setSourceUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [savingItem, setSavingItem] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/testimonials");
      const data = await res.json();
      if (data.success) {
        setTestimonials(data.data || []);
        if (data.section) {
          setEyebrow(data.section.eyebrow || "CUSTOMER EXPERIENCES");
          setHeading(data.section.heading || "Loved By Modern Muses");
          setDescription(data.section.description || "");
        }
      }
    } catch (err) {
      console.error("Failed to load testimonials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSection(true);
    setMsg("");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/testimonials/section", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eyebrow, heading, description }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg("Customer Experiences section headers updated successfully!");
        setTimeout(() => setMsg(""), 3000);
      } else {
        setErrorMsg(data.message || "Failed to update section headers.");
      }
    } catch {
      setErrorMsg("Network error saving section headers.");
    } finally {
      setSavingSection(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setCustomerName("");
    setReviewText("");
    setRating(5);
    setLocation("");
    setIsVerifiedBuyer(false);
    setSourceType("Customer Submission");
    setSourceUrl("");
    setAvatarUrl("");
    setIsActive(true);
    setDisplayOrder(testimonials.length);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: Testimonial) => {
    setEditingItem(item);
    setCustomerName(item.customer_name);
    setReviewText(item.review_text);
    setRating(item.rating);
    setLocation(item.location || "");
    setIsVerifiedBuyer(item.is_verified_buyer);
    setSourceType(item.source_type || "Customer Submission");
    setSourceUrl(item.source_url || "");
    setAvatarUrl(item.avatar_url || "");
    setIsActive(item.is_active);
    setDisplayOrder(item.display_order || 0);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
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
        setAvatarUrl(data.data.url);
      } else {
        setErrorMsg(data.message || "Failed to upload avatar");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !reviewText.trim()) {
      setErrorMsg("Customer name and review text are required.");
      return;
    }

    if (sourceUrl && !sourceUrl.startsWith("http://") && !sourceUrl.startsWith("https://")) {
      setErrorMsg("Source URL must start with http:// or https://");
      return;
    }

    setSavingItem(true);
    setErrorMsg("");

    const payload = {
      customer_name: customerName.trim(),
      review_text: reviewText.trim(),
      rating,
      location: location.trim() || null,
      is_verified_buyer: isVerifiedBuyer,
      source_type: sourceType,
      source_url: sourceUrl.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      is_active: isActive,
      display_order: Number(displayOrder) || 0,
    };

    try {
      const url = editingItem
        ? `/api/admin/testimonials/${editingItem.id}`
        : "/api/admin/testimonials";
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        setMsg(`Testimonial ${editingItem ? "updated" : "created"} successfully!`);
        setTimeout(() => setMsg(""), 3000);
        await loadData();
      } else {
        setErrorMsg(data.message || "Failed to save testimonial.");
      }
    } catch {
      setErrorMsg("Network error saving testimonial.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleToggleActive = async (item: Testimonial) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      if (res.ok) {
        setTestimonials((prev) =>
          prev.map((t) => (t.id === item.id ? { ...t, is_active: !item.is_active } : t))
        );
      }
    } catch (err) {
      console.error("Toggle active error:", err);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer review?")) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
        setMsg("Testimonial deleted.");
        setTimeout(() => setMsg(""), 3000);
      } else {
        alert("Failed to delete testimonial.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error deleting testimonial.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-duskk-500 block">
            Storefront Social Proof & CMS
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-duskk-900">
            Customer Experiences ({testimonials.length})
          </h1>
          <p className="text-xs text-duskk-500 mt-1">
            Manage genuine customer reviews, source citations, ratings, and homepage display preferences.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition flex items-center space-x-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Review</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-medium flex items-center space-x-1.5">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* 1. Section Settings */}
      <div className="bg-white border border-duskk-200 rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-duskk-100">
          <h2 className="font-serif text-base font-semibold text-duskk-900">
            Homepage Section Titles
          </h2>
          <span className="text-[11px] text-duskk-400 font-mono">Live on Homepage</span>
        </div>

        <form onSubmit={handleSaveSection} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-duskk-700 uppercase mb-1">
              Section Eyebrow / Tagline
            </label>
            <input
              type="text"
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value)}
              placeholder="CUSTOMER EXPERIENCES"
              className="w-full px-3 py-2 border border-duskk-300 rounded font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-duskk-700 uppercase mb-1">
              Main Section Heading *
            </label>
            <input
              type="text"
              required
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Loved By Modern Muses"
              className="w-full px-3 py-2 border border-duskk-300 rounded font-serif text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-duskk-700 uppercase mb-1">
              Optional Subtitle / Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Real stories from our cherished community"
              className="w-full px-3 py-2 border border-duskk-300 rounded"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSection}
              className="px-5 py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-wider rounded transition flex items-center space-x-1.5 shadow"
            >
              {savingSection ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Update Section Titles</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Testimonials List */}
      <div className="bg-white border border-duskk-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-duskk-50 border-b border-duskk-200 flex justify-between items-center">
          <h3 className="font-serif text-sm font-semibold text-duskk-900">
            Published & Managed Testimonials
          </h3>
          <span className="text-[11px] text-duskk-500">
            Ordered by Display Order (Ascending)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-duskk-900 animate-spin mx-auto" />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="p-12 text-center text-duskk-500 text-xs space-y-3">
            <Sparkles className="w-8 h-8 text-duskk-300 mx-auto" />
            <p>No customer experiences published yet.</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-duskk-900 text-white text-xs rounded hover:bg-duskk-gold hover:text-duskk-900 font-semibold"
            >
              + Add First Customer Review
            </button>
          </div>
        ) : (
          <div className="divide-y divide-duskk-100">
            {testimonials.map((item) => (
              <div
                key={item.id}
                className={`p-6 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.is_active ? "bg-white hover:bg-duskk-50/50" : "bg-duskk-50/60 opacity-60"
                }`}
              >
                <div className="space-y-2 max-w-2xl">
                  {/* Rating & Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < item.rating ? "fill-current" : "text-duskk-200"
                          }`}
                        />
                      ))}
                    </div>

                    <span className="px-2 py-0.5 bg-duskk-100 text-duskk-700 text-[10px] font-mono uppercase rounded">
                      {item.source_type}
                    </span>

                    {item.is_verified_buyer && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Buyer</span>
                      </span>
                    )}

                    <span className="text-[10px] text-duskk-400 font-mono">
                      Order: #{item.display_order}
                    </span>
                  </div>

                  {/* Review Text */}
                  <p className="text-xs sm:text-sm text-duskk-800 italic leading-relaxed">
                    &ldquo;{item.review_text}&rdquo;
                  </p>

                  {/* Customer Info & Source Link */}
                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-duskk-600">
                    <strong className="text-duskk-900 font-serif">{item.customer_name}</strong>
                    {item.location && <span>&bull; {item.location}</span>}
                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-duskk-gold hover:underline inline-flex items-center gap-1 text-[11px]"
                      >
                        <span>View Original Review</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end md:self-center flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition ${
                      item.is_active
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        : "bg-duskk-200 text-duskk-700 hover:bg-duskk-300"
                    }`}
                    title={item.is_active ? "Active on storefront" : "Hidden from storefront"}
                  >
                    {item.is_active ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-duskk-500" />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-duskk-600 hover:text-duskk-900 hover:bg-duskk-100 rounded"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteTestimonial(item.id)}
                    className="p-1.5 text-duskk-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-lg shadow-2xl overflow-hidden border border-duskk-200 my-8">
            <div className="bg-duskk-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-serif text-lg font-medium">
                {editingItem ? `Edit Review: ${editingItem.customer_name}` : "Add Customer Experience"}
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

            <form onSubmit={handleSaveTestimonial} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-duskk-700 uppercase mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Natasha Kulkarni"
                    className="w-full px-3 py-2 border border-duskk-300 rounded"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-duskk-700 uppercase mb-1">
                    Customer Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="w-full px-3 py-2 border border-duskk-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-duskk-700 uppercase mb-1">
                    Rating (1-5) *
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-duskk-300 rounded bg-white text-duskk-900"
                  >
                    <option value={5}>★★★★★ (5 Stars)</option>
                    <option value={4}>★★★★☆ (4 Stars)</option>
                    <option value={3}>★★★☆☆ (3 Stars)</option>
                    <option value={2}>★★☆☆☆ (2 Stars)</option>
                    <option value={1}>★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-duskk-700 uppercase mb-1">
                    Source Platform
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full px-3 py-2 border border-duskk-300 rounded bg-white text-duskk-900"
                  >
                    {SOURCE_TYPES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-duskk-700 uppercase mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-duskk-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-duskk-700 uppercase mb-1">
                  Customer Review Text *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Paste genuine customer review or feedback..."
                  className="w-full px-3 py-2 border border-duskk-300 rounded leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-duskk-700 uppercase mb-1">
                  Original Review Source URL (Optional)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://g.page/r/... or Instagram post link"
                  className="w-full px-3 py-2 border border-duskk-300 rounded text-xs font-mono"
                />
                <p className="text-[10px] text-duskk-400 mt-1">
                  If provided, a subtle &ldquo;View Original Review &rarr;&rdquo; link will be displayed on the card.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-duskk-700 uppercase mb-1">
                  Customer Avatar / Photo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className={`cursor-pointer px-3 py-1.5 bg-duskk-100 hover:bg-duskk-200 text-duskk-900 border border-duskk-300 rounded font-semibold text-xs flex items-center space-x-1.5 transition ${uploadingAvatar ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{uploadingAvatar ? "Uploading..." : "Upload"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Or enter image URL"
                    className="flex-1 px-3 py-2 border border-duskk-300 rounded text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-duskk-200 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVerifiedBuyer}
                    onChange={(e) => setIsVerifiedBuyer(e.target.checked)}
                    className="rounded border-duskk-300"
                  />
                  <span className="font-semibold text-duskk-800">
                    Verified Buyer Status (Only enable if verified)
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-duskk-300"
                  />
                  <span className="font-semibold text-duskk-800">
                    Display on Storefront (Active)
                  </span>
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
                  disabled={savingItem}
                  className="px-6 py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white font-semibold rounded uppercase tracking-wider shadow"
                >
                  {savingItem ? "Saving..." : "Save Testimonial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
