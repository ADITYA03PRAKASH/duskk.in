"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const isLocalAdmin = pathname.startsWith("/admin");
  const targetDashboard = isLocalAdmin ? "/admin" : "/";

  const [email, setEmail] = useState("admin@duskk.in");
  const [password, setPassword] = useState("DuskkAdmin2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(targetDashboard);
        router.refresh();
      } else {
        setError(data.message || "Invalid administrative credentials");
      }
    } catch {
      setError("Unable to connect to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-duskk-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl overflow-hidden border border-duskk-700">
        {/* Header */}
        <div className="bg-black text-white p-8 text-center space-y-2">
          <span className="font-serif text-3xl tracking-[0.35em] text-duskk-gold block uppercase font-light">
            DUSKK
          </span>
          <span className="text-xs uppercase font-mono tracking-widest text-duskk-400 block">
            EXECUTIVE CONTROL PORTAL
          </span>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          <div className="bg-duskk-50 border border-duskk-200 p-3 rounded text-xs text-duskk-600 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Default Seed Credentials: <strong>admin@duskk.in</strong> / <strong>DuskkAdmin2026!</strong></span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-duskk-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-duskk-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-duskk-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white text-xs font-semibold uppercase tracking-widest rounded transition flex items-center justify-center space-x-2 shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Authenticate Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
