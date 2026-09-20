"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Check, Loader2, Sparkles, RefreshCw } from "lucide-react";

export default function AdminCMSPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const loadCMS = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms");
      const data = await res.json();
      if (data.success) setSections(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCMS();
  }, []);

  const handleUpdateSection = async (sec: any) => {
    setSavingId(sec.id);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/cms/${sec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sec.title,
          subtitle: sec.subtitle,
          image: sec.image,
          link: sec.link,
          active: sec.active,
        }),
      });
      if (res.ok) {
        setMsg(`Saved "${sec.title}" successfully!`);
        setTimeout(() => setMsg(""), 3000);
      }
    } catch {
      setMsg("Failed to save changes.");
    } finally {
      setSavingId(null);
    }
  };

  const handleFieldChange = (id: string, field: string, value: any) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs uppercase font-mono tracking-widest text-duskk-500 block">
          Homepage Content & Storytelling
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-duskk-900">
          CMS Section Manager
        </h1>
        <p className="text-xs text-duskk-500 mt-1">
          Customize headlines, promotional banners, imagery, and marketing copy live without code deployments.
        </p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-medium flex items-center space-x-1.5">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 text-duskk-900 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((sec) => (
            <div
              key={sec.id}
              className="bg-white border border-duskk-200 rounded-lg shadow-sm p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-duskk-100">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-duskk-100 font-mono text-[10px] text-duskk-700 uppercase rounded font-bold">
                    KEY: {sec.key}
                  </span>
                  <h3 className="font-serif text-base font-semibold text-duskk-900">
                    {sec.key.replace("_", " ").toUpperCase()}
                  </h3>
                </div>

                <label className="flex items-center space-x-2 text-xs text-duskk-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sec.active}
                    onChange={(e) => handleFieldChange(sec.id, "active", e.target.checked)}
                  />
                  <span>Active on Homepage</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-duskk-700 mb-1">Headline / Title</label>
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => handleFieldChange(sec.id, "title", e.target.value)}
                    className="w-full px-3 py-2 border border-duskk-300 rounded font-serif text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-duskk-700 mb-1">Subtitle / Body Description</label>
                  <textarea
                    rows={2}
                    value={sec.subtitle || ""}
                    onChange={(e) => handleFieldChange(sec.id, "subtitle", e.target.value)}
                    className="w-full px-3 py-2 border border-duskk-300 rounded"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-duskk-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={sec.image || ""}
                    onChange={(e) => handleFieldChange(sec.id, "image", e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 border border-duskk-300 rounded"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-duskk-700 mb-1">Target Link</label>
                  <input
                    type="text"
                    value={sec.link || ""}
                    onChange={(e) => handleFieldChange(sec.id, "link", e.target.value)}
                    placeholder="/shop"
                    className="w-full px-3 py-2 border border-duskk-300 rounded"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleUpdateSection(sec)}
                  disabled={savingId === sec.id}
                  className="px-5 py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-wider rounded transition flex items-center space-x-1.5"
                >
                  {savingId === sec.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish Changes</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
