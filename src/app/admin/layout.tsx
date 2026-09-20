"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Boxes,
  FileEdit,
  Tag,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isLoginPage) {
      fetch("/api/admin/auth/me")
        .then((res) => {
          if (!res.ok) {
            router.push("/admin/login");
          }
          return res.json();
        })
        .then((data) => {
          if (data.success) {
            setAdminUser(data.data);
          }
        })
        .catch(() => router.push("/admin/login"));
    }
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: Layers },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Customers (CRM)", href: "/admin/customers", icon: Users },
    { name: "Inventory", href: "/admin/inventory", icon: Boxes },
    { name: "Homepage CMS", href: "/admin/cms", icon: FileEdit },
    { name: "Coupons", href: "/admin/coupons", icon: Tag },
  ];

  return (
    <div className="min-h-screen bg-duskk-100 flex flex-col md:flex-row">
      {/* Mobile Top bar */}
      <div className="md:hidden bg-duskk-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-duskk-800 rounded"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-serif tracking-widest text-duskk-gold font-bold">DUSKK ADMIN</span>
        </div>
        <button onClick={handleLogout} className="text-xs text-duskk-400 hover:text-white">
          Logout
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-duskk-900 text-white flex-shrink-0 flex flex-col justify-between border-r border-duskk-800 z-30`}
      >
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-duskk-800">
            <Link href="/admin" className="block">
              <span className="font-serif text-2xl tracking-[0.3em] uppercase text-duskk-gold font-light">
                DUSKK
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-duskk-400 font-mono mt-0.5">
                Executive CMS &bull; 2026
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded text-xs font-medium uppercase tracking-wider transition ${
                    isActive
                      ? "bg-duskk-gold text-duskk-900 font-bold shadow-sm"
                      : "text-duskk-300 hover:bg-duskk-800 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-duskk-900" : "text-duskk-gold"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Footer */}
        <div className="p-4 border-t border-duskk-800 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between text-xs text-duskk-400 hover:text-duskk-gold transition px-2 py-1"
          >
            <span className="flex items-center space-x-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Live Storefront</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <div className="bg-duskk-850 p-3 rounded flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-white truncate">
                {adminUser?.name || "Admin"}
              </p>
              <p className="text-[10px] text-duskk-400 truncate">{adminUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-duskk-400 hover:text-rose-400 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="hidden md:flex bg-white border-b border-duskk-200 px-8 py-4 items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-mono text-duskk-500 uppercase">
            <span>DUSKK Retail Admin</span>
            <span>&bull;</span>
            <span className="text-duskk-800 font-semibold">{pathname.replace("/admin", "Dashboard")}</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Authorized Session
            </span>
          </div>
        </header>

        {/* Children View */}
        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
