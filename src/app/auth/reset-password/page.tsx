"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase/client";
import { Lock, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      // 1. Update password in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        password: password,
      });

      if (authError) {
        throw new Error(authError.message || "Failed to update password. Recovery link may have expired.");
      }

      // 2. Sync password hash in customer database profile
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (accessToken) {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            newPassword: password,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          console.warn("Profile sync note:", data.message);
        }
      }

      setStatus("success");
      setMessage("Your password has been successfully updated.");
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2500);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to update password. Please request a new reset link.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Navbar />
      <main className="min-h-[75vh] flex items-center justify-center bg-[#FAF8F5] py-16 px-4">
        <div className="w-full max-w-md bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAF8F5] text-duskk-gold mb-3">
              <Lock className="w-6 h-6 text-duskk-gold" />
            </span>
            <h1 className="font-serif text-2xl text-duskk-900 font-semibold tracking-wide">
              Create New Password
            </h1>
            <p className="text-xs text-duskk-600 mt-2">
              Choose a strong password to secure your DUSKK account.
            </p>
          </div>

          {status === "success" ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3 animate-bounce" />
              <p className="text-sm font-medium text-duskk-900">{message}</p>
              <p className="text-xs text-duskk-500 mt-2">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === "error" && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wider text-duskk-700 font-medium mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-[#D1D1D1] rounded-lg text-sm focus:outline-none focus:border-duskk-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-duskk-700 font-medium mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-[#D1D1D1] rounded-lg text-sm focus:outline-none focus:border-duskk-900 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-duskk-900 text-white text-xs uppercase tracking-widest font-medium rounded-lg hover:bg-black transition-colors disabled:opacity-50"
              >
                {loading ? "Updating Password..." : "Set New Password"}
              </button>

              <div className="text-center mt-4">
                <Link
                  href="/login"
                  className="text-xs text-duskk-600 hover:text-duskk-900 underline underline-offset-4"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
