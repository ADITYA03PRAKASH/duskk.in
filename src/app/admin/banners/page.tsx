"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PageBannerConfig, BannerObjectPosition, CategoryPageBannersMap } from "@/types";
import { normalizeImageUrl } from "@/lib/utils";
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  ExternalLink,
  Eye,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  Gift,
  Sliders,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Smartphone,
  Monitor,
} from "lucide-react";

interface PageMeta {
  key: string;
  name: string;
  path: string;
  defaultLabel: string;
  defaultTitle: string;
  defaultDescription: string;
  type: "category" | "combo";
}

const PAGES: PageMeta[] = [
  {
    key: "earrings",
    name: "Earrings",
    path: "/category/earrings",
    defaultLabel: "COLLECTION",
    defaultTitle: "Earrings",
    defaultDescription:
      "Explore our collection of handcrafted demi-fine earrings. Designed for timeless elegance and effortless everyday luxury.",
    type: "category",
  },
  {
    key: "necklaces",
    name: "Necklaces",
    path: "/category/necklaces",
    defaultLabel: "COLLECTION",
    defaultTitle: "Necklaces",
    defaultDescription:
      "Explore our collection of handcrafted demi-fine necklaces. Designed for timeless elegance and effortless everyday luxury.",
    type: "category",
  },
  {
    key: "rings",
    name: "Rings",
    path: "/category/rings",
    defaultLabel: "COLLECTION",
    defaultTitle: "Rings",
    defaultDescription:
      "Explore our collection of handcrafted demi-fine rings. Designed for timeless elegance and effortless everyday luxury.",
    type: "category",
  },
  {
    key: "payals",
    name: "Payals (Anklets)",
    path: "/category/payals",
    defaultLabel: "COLLECTION",
    defaultTitle: "Payals",
    defaultDescription:
      "Explore our collection of handcrafted demi-fine payals. Designed for timeless elegance and effortless everyday luxury.",
    type: "category",
  },
  {
    key: "bracelets",
    name: "Bracelets",
    path: "/category/bracelets",
    defaultLabel: "COLLECTION",
    defaultTitle: "Bracelets",
    defaultDescription:
      "Explore our collection of handcrafted demi-fine bracelets. Designed for timeless elegance and effortless everyday luxury.",
    type: "category",
  },
  {
    key: "mom-s-magic",
    name: "Mom’s Magic",
    path: "/category/mom-s-magic",
    defaultLabel: "MOM’S MAGIC",
    defaultTitle: "Mom’s Magic",
    defaultDescription:
      "Some love stories are forever, and a mom’s love is the most beautiful of them all. Explore meaningful jewellery that makes every moment with her even more special.",
    type: "category",
  },
  {
    key: "combos",
    name: "Gift Sets & Combos",
    path: "/combos",
    defaultLabel: "CURATED GIFT SETS",
    defaultTitle: "Curated Gift Sets & Combos",
    defaultDescription:
      "Handcrafted luxury jewelry pieces designed to dazzle together. Each gift set arrives packaged in our signature velvet-lined box with certificate of authenticity.",
    type: "combo",
  },
  {
    key: "build-your-combo",
    name: "Build Your Own Combo",
    path: "/build-your-combo",
    defaultLabel: "INTERACTIVE CUSTOM ATELIER",
    defaultTitle: "Build Your Own Luxury Combo",
    defaultDescription:
      "Handpick demi-fine jewelry pieces to build your custom pairing and unlock exclusive bundle pricing.",
    type: "combo",
  },
];

const POSITION_OPTIONS: { value: BannerObjectPosition; label: string; desc: string }[] = [
  { value: "center", label: "Center", desc: "Balanced focal point (recommended)" },
  { value: "top", label: "Top", desc: "Keeps jewelry aligned near top" },
  { value: "bottom", label: "Bottom", desc: "Keeps jewelry aligned near bottom" },
  { value: "left", label: "Left", desc: "Aligns composition to the left" },
  { value: "right", label: "Right", desc: "Aligns composition to the right" },
];

export default function AdminPageBannersPage() {
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<CategoryPageBannersMap>({});
  const [activeKey, setActiveKey] = useState<string>("earrings");

  // Draft form state for the currently active page banner
  const [draftBanner, setDraftBanner] = useState<PageBannerConfig>({
    key: "earrings",
    title: "Earrings",
    label: "COLLECTION",
    description: "",
    imageUrl: null,
    objectPosition: "center",
    overlayOpacity: 45,
    isEnabled: true,
  });

  const [initialDraft, setInitialDraft] = useState<PageBannerConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load all banners from server
  const loadBanners = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/banners/pages");
      const json = await res.json();
      if (res.ok && json.success) {
        setBanners(json.data || {});
        // Update current draft with saved values
        const current = json.data[activeKey];
        if (current) {
          setDraftBanner({ ...current });
          setInitialDraft({ ...current });
        }
      } else {
        setErrorMessage(json.message || "Failed to load page banners");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error loading page banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // When active page changes, populate draft form
  useEffect(() => {
    const meta = PAGES.find((p) => p.key === activeKey);
    const existing = banners[activeKey];
    const defaultData: PageBannerConfig = {
      key: activeKey,
      title: existing?.title || meta?.defaultTitle || "Collection",
      label: existing?.label ?? meta?.defaultLabel ?? "COLLECTION",
      description: existing?.description ?? meta?.defaultDescription ?? "",
      imageUrl: existing?.imageUrl || null,
      objectPosition: existing?.objectPosition || "center",
      overlayOpacity: existing?.overlayOpacity ?? 45,
      isEnabled: existing?.isEnabled !== false,
      updatedAt: existing?.updatedAt,
    };
    setDraftBanner(defaultData);
    setInitialDraft(defaultData);
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [activeKey, banners]);

  const activePageMeta = PAGES.find((p) => p.key === activeKey) || PAGES[0];

  // Handle image file upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image file exceeds 10MB limit. Please compress before uploading.");
      return;
    }

    setUploadingImage(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "banners");

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.data?.url) {
        setDraftBanner((prev) => ({ ...prev, imageUrl: data.data.url }));
        setSuccessMessage("Banner image uploaded successfully! Click 'Save Banner' to publish.");
      } else {
        setErrorMessage(data.message || "Failed to upload image file");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error during image upload");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove current image
  const handleRemoveImage = () => {
    setDraftBanner((prev) => ({ ...prev, imageUrl: null }));
    setSuccessMessage("Image cleared. The banner will render with the default solid luxury black gradient.");
  };

  // Reset to initial saved values
  const handleReset = () => {
    if (initialDraft) {
      setDraftBanner({ ...initialDraft });
      setSuccessMessage("Changes reset to last saved state.");
    }
  };

  // Save banner configuration for the active page
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/admin/banners/pages/${activeKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftBanner.title,
          label: draftBanner.label,
          description: draftBanner.description,
          imageUrl: draftBanner.imageUrl,
          objectPosition: draftBanner.objectPosition,
          overlayOpacity: draftBanner.overlayOpacity,
          isEnabled: draftBanner.isEnabled,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const updated = json.data;
        setBanners((prev) => ({ ...prev, [activeKey]: updated }));
        setDraftBanner({ ...updated });
        setInitialDraft({ ...updated });
        setSuccessMessage(
          `Successfully published banner for "${activePageMeta.name}"! Changes are live on the storefront.`
        );
      } else {
        setErrorMessage(json.message || "Failed to save banner configuration");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error saving banner");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = JSON.stringify(draftBanner) !== JSON.stringify(initialDraft);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-xl border border-duskk-200 shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-2 text-duskk-gold text-xs font-mono uppercase tracking-widest bg-duskk-900 px-3 py-1 rounded-full mb-2">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Storefront Presentation & Visuals</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-duskk-900">
            Category & Combo Page Banners
          </h1>
          <p className="text-xs sm:text-sm text-duskk-500 mt-1 max-w-2xl">
            Replace the black hero background with custom photography, titles, descriptions, and focal points across collection pages. Each page has independent configuration.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadBanners}
            disabled={loading}
            className="px-3.5 py-2 bg-duskk-100 hover:bg-duskk-200 text-duskk-800 rounded-lg text-xs font-semibold tracking-wider uppercase transition flex items-center space-x-1.5"
            title="Reload banners from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href={activePageMeta.path}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white hover:bg-duskk-50 border border-duskk-300 text-duskk-900 rounded-lg text-xs font-semibold tracking-wider uppercase transition flex items-center space-x-1.5 shadow-xs"
          >
            <span>View Live</span>
            <ExternalLink className="w-3.5 h-3.5 text-duskk-500" />
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <Link
            href={activePageMeta.path}
            target="_blank"
            className="underline font-semibold hover:text-emerald-900 ml-4 whitespace-nowrap"
          >
            Test on storefront &rarr;
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Main Layout: Left Selector + Right Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Page Selector Cards */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-duskk-200 shadow-xs p-4">
            <div className="flex items-center justify-between pb-3 border-b border-duskk-100 mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-duskk-500 font-semibold">
                Select Page ({PAGES.length})
              </span>
              <span className="text-[11px] text-duskk-400">Independent Config</span>
            </div>

            <div className="space-y-2">
              {PAGES.map((p) => {
                const banner = banners[p.key];
                const isSelected = activeKey === p.key;
                const hasImage = Boolean(banner?.imageUrl);
                const isEnabled = banner?.isEnabled !== false;

                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActiveKey(p.key)}
                    className={`w-full text-left p-3 rounded-lg border transition flex items-center space-x-3 ${
                      isSelected
                        ? "border-duskk-900 bg-duskk-900 text-white shadow-sm ring-1 ring-duskk-900"
                        : "border-duskk-200 hover:border-duskk-300 bg-white text-duskk-800 hover:bg-duskk-50"
                    }`}
                  >
                    {/* Thumbnail swatch */}
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-duskk-800 flex-shrink-0 border border-white/20 relative">
                      {hasImage && banner?.imageUrl ? (
                        <img
                          src={normalizeImageUrl(banner.imageUrl)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: banner.objectPosition || "center" }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[9px] text-duskk-300 font-mono">
                          <ImageIcon className="w-4 h-4 opacity-60 mb-0.5" />
                          <span>Black</span>
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-serif text-sm font-semibold truncate ${
                            isSelected ? "text-white" : "text-duskk-900"
                          }`}
                        >
                          {p.name}
                        </span>
                        {p.type === "combo" ? (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                              isSelected
                                ? "bg-duskk-gold/30 text-duskk-gold"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            Combo
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-duskk-100 text-duskk-600"
                            }`}
                          >
                            Category
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-1 text-[11px]">
                        <span
                          className={`truncate ${
                            isSelected ? "text-duskk-300" : "text-duskk-500"
                          }`}
                        >
                          {p.path}
                        </span>
                        <span className="text-duskk-400">&bull;</span>
                        <span
                          className={
                            hasImage
                              ? isSelected
                                ? "text-emerald-300 font-medium"
                                : "text-emerald-600 font-medium"
                              : isSelected
                              ? "text-duskk-400"
                              : "text-duskk-400"
                          }
                        >
                          {hasImage ? "Custom Image" : "Default Black"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Helper Tips Card */}
          <div className="bg-duskk-50 rounded-xl border border-duskk-200 p-4 text-xs text-duskk-600 space-y-2">
            <div className="flex items-center space-x-1.5 text-duskk-900 font-semibold">
              <Sparkles className="w-4 h-4 text-duskk-gold" />
              <span>Banner Best Practices</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-duskk-600 leading-relaxed">
              <li>Use high-resolution horizontal photography (recommended width: 1920px - 2560px, height: 600px - 900px).</li>
              <li>Keep the dark overlay around 40% - 60% so white typography remains readable across all mobile screens.</li>
              <li>Use the focal point control to preserve key jewelry details in the center, top, or bottom.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Editor Form & Live Interactive Preview */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Active Card Container */}
            <div className="bg-white rounded-xl border border-duskk-200 shadow-xs overflow-hidden">
              {/* Card Top Title & State Bar */}
              <div className="p-5 border-b border-duskk-100 bg-duskk-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-duskk-900 text-duskk-gold flex items-center justify-center font-bold text-sm shadow-xs">
                    {activePageMeta.type === "combo" ? (
                      <Gift className="w-5 h-5" />
                    ) : (
                      <Layers className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-duskk-900 flex items-center space-x-2">
                      <span>{activePageMeta.name} Banner Configuration</span>
                    </h2>
                    <span className="text-xs font-mono text-duskk-500">
                      Route: {activePageMeta.path} &bull; Key: {activePageMeta.key}
                    </span>
                  </div>
                </div>

                {/* Display Toggle Switch */}
                <label className="inline-flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-duskk-200 shadow-xs">
                  <input
                    type="checkbox"
                    checked={draftBanner.isEnabled !== false}
                    onChange={(e) =>
                      setDraftBanner((prev) => ({ ...prev, isEnabled: e.target.checked }))
                    }
                    className="w-4 h-4 accent-duskk-900 rounded cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-duskk-800">
                    {draftBanner.isEnabled !== false ? "Banner Active" : "Banner Hidden"}
                  </span>
                </label>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-6">
                {/* 1. Image Upload & Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-duskk-800 flex items-center space-x-1.5">
                      <ImageIcon className="w-4 h-4 text-duskk-600" />
                      <span>Banner Background Image</span>
                    </label>
                    {draftBanner.imageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Image (Revert to Black)</span>
                      </button>
                    )}
                  </div>

                  {/* Upload Controls Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="banner-file-input"
                    />

                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-xs"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading Image...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload From Computer</span>
                        </>
                      )}
                    </button>

                    <div className="relative flex-1">
                      <input
                        type="url"
                        placeholder="Or enter direct image URL (https://...)"
                        value={draftBanner.imageUrl || ""}
                        onChange={(e) =>
                          setDraftBanner((prev) => ({
                            ...prev,
                            imageUrl: e.target.value.trim() || null,
                          }))
                        }
                        className="w-full px-3 py-2 border border-duskk-300 rounded-lg text-xs text-duskk-900 placeholder-duskk-400 focus:outline-none focus:ring-2 focus:ring-duskk-900 font-mono"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-duskk-500">
                    Supported formats: JPEG, PNG, WebP up to 10MB. Stored securely in Supabase Storage with CDN optimization.
                  </p>
                </div>

                {/* 2. Positioning & Contrast Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-duskk-50/80 rounded-xl border border-duskk-200">
                  {/* Focal point */}
                  <div>
                    <label className="block text-xs font-semibold text-duskk-800 mb-1">
                      Image Focal Point (Object Position)
                    </label>
                    <select
                      value={draftBanner.objectPosition || "center"}
                      onChange={(e) =>
                        setDraftBanner((prev) => ({
                          ...prev,
                          objectPosition: e.target.value as BannerObjectPosition,
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-duskk-300 rounded-lg text-xs font-medium text-duskk-900 focus:outline-none focus:ring-2 focus:ring-duskk-900"
                    >
                      {POSITION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} — {opt.desc}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-duskk-500 mt-1 block">
                      Controls which part of the photo stays visible on small or cropped screens.
                    </span>
                  </div>

                  {/* Dark overlay opacity */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-duskk-800">
                        Dark Overlay Contrast
                      </label>
                      <span className="text-xs font-mono font-bold text-duskk-900 bg-white px-2 py-0.5 rounded border border-duskk-200">
                        {draftBanner.overlayOpacity ?? 45}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      step={5}
                      value={draftBanner.overlayOpacity ?? 45}
                      onChange={(e) =>
                        setDraftBanner((prev) => ({
                          ...prev,
                          overlayOpacity: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full accent-duskk-900 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-duskk-400 mt-0.5 font-mono">
                      <span>0% (Clear)</span>
                      <span>45% (Balanced)</span>
                      <span>90% (Deep)</span>
                    </div>
                  </div>
                </div>

                {/* 3. Text & Copy Content */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-duskk-800 mb-1">
                      Eyebrow Label
                    </label>
                    <input
                      type="text"
                      value={draftBanner.label ?? ""}
                      placeholder="e.g. COLLECTION, CURATED GIFT SETS"
                      onChange={(e) =>
                        setDraftBanner((prev) => ({ ...prev, label: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-duskk-300 rounded-lg text-xs tracking-wider uppercase font-mono text-duskk-900 focus:outline-none focus:ring-2 focus:ring-duskk-900"
                    />
                    <span className="text-[11px] text-duskk-500 mt-1 block">
                      Small golden pill badge displayed above the main title.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-duskk-800 mb-1">
                      Banner Title
                    </label>
                    <input
                      type="text"
                      value={draftBanner.title}
                      placeholder={activePageMeta.defaultTitle}
                      onChange={(e) =>
                        setDraftBanner((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-duskk-300 rounded-lg text-sm font-serif font-medium text-duskk-900 focus:outline-none focus:ring-2 focus:ring-duskk-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-duskk-800 mb-1">
                      Banner Description
                    </label>
                    <textarea
                      rows={3}
                      value={draftBanner.description ?? ""}
                      placeholder={activePageMeta.defaultDescription}
                      onChange={(e) =>
                        setDraftBanner((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-duskk-300 rounded-lg text-xs leading-relaxed text-duskk-900 focus:outline-none focus:ring-2 focus:ring-duskk-900"
                    />
                  </div>
                </div>

                {/* 4. Live Visual Preview */}
                <div className="space-y-2 pt-2 border-t border-duskk-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-duskk-800 flex items-center space-x-1.5">
                      <Eye className="w-4 h-4 text-duskk-600" />
                      <span>Live Storefront Preview</span>
                    </label>

                    {/* Desktop / Mobile preview device switch */}
                    <div className="inline-flex bg-duskk-100 p-0.5 rounded-lg border border-duskk-200">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 transition ${
                          previewDevice === "desktop"
                            ? "bg-white text-duskk-900 shadow-xs"
                            : "text-duskk-600 hover:text-duskk-900"
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Desktop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 transition ${
                          previewDevice === "mobile"
                            ? "bg-white text-duskk-900 shadow-xs"
                            : "text-duskk-600 hover:text-duskk-900"
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Mobile</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview Container */}
                  <div
                    className={`mx-auto transition-all duration-300 overflow-hidden rounded-xl border border-duskk-300 shadow-md ${
                      previewDevice === "mobile" ? "max-w-sm" : "w-full"
                    }`}
                  >
                    <div className="relative bg-duskk-900 text-white py-12 px-6 overflow-hidden min-h-[220px] flex flex-col justify-center text-center">
                      {draftBanner.imageUrl ? (
                        <>
                          <div className="absolute inset-0 w-full h-full">
                            <img
                              src={normalizeImageUrl(draftBanner.imageUrl)}
                              alt={draftBanner.title}
                              className="w-full h-full object-cover"
                              style={{ objectPosition: draftBanner.objectPosition || "center" }}
                            />
                          </div>
                          {/* Selected Dark Overlay */}
                          <div
                            className="absolute inset-0 bg-duskk-950 transition-opacity"
                            style={{
                              opacity:
                                Math.max(0, Math.min(100, draftBanner.overlayOpacity ?? 45)) / 100,
                            }}
                          />
                          {/* Atmospheric Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30 pointer-events-none" />
                        </>
                      ) : (
                        <div className="absolute top-0 right-1/4 w-72 h-72 bg-duskk-gold/5 rounded-full blur-3xl pointer-events-none" />
                      )}

                      {/* Foreground Preview Typography */}
                      <div className="relative z-10 max-w-xl mx-auto">
                        {draftBanner.label && (
                          <div className="inline-flex items-center space-x-1.5 text-duskk-gold bg-duskk-800/80 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase mb-3 border border-duskk-gold/20 shadow-xs backdrop-blur-xs">
                            <Sparkles className="w-3 h-3" />
                            <span>{draftBanner.label}</span>
                          </div>
                        )}

                        <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white drop-shadow-sm">
                          {draftBanner.title || activePageMeta.defaultTitle}
                        </h3>

                        {draftBanner.description && (
                          <p className="text-duskk-200 text-xs mt-2 max-w-md mx-auto leading-relaxed drop-shadow font-light">
                            {draftBanner.description}
                          </p>
                        )}
                      </div>

                      {/* Status indicator on preview */}
                      {draftBanner.isEnabled === false && (
                        <div className="absolute top-3 right-3 bg-rose-600/90 text-white px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold backdrop-blur-xs">
                          Hidden
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="p-4 bg-duskk-50 border-t border-duskk-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-duskk-500">
                  {draftBanner.updatedAt ? (
                    <span>Last updated: {new Date(draftBanner.updatedAt).toLocaleString()}</span>
                  ) : (
                    <span>Using default configuration</span>
                  )}
                  {isDirty && (
                    <span className="ml-2 inline-flex items-center text-amber-700 font-semibold">
                      &bull; Unsaved changes
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!isDirty || saving}
                    className="px-4 py-2 border border-duskk-300 rounded-lg text-xs font-semibold text-duskk-700 hover:bg-duskk-100 disabled:opacity-40 transition flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 flex-1 sm:flex-none"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Banner</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
