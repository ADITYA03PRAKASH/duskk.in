"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import {
  IndianRupee,
  ShoppingBag,
  Users,
  AlertTriangle,
  Package,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const pathname = usePathname() || "";
  const isLocalAdmin = pathname.startsWith("/admin");
  const ordersHref = isLocalAdmin ? "/admin/orders" : "/orders";
  const inventoryHref = isLocalAdmin ? "/admin/inventory" : "/inventory";
  const productsHref = isLocalAdmin ? "/admin/products" : "/products";
  const cmsHref = isLocalAdmin ? "/admin/cms" : "/cms";
  const couponsHref = isLocalAdmin ? "/admin/coupons" : "/coupons";

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-duskk-900 animate-spin" />
      </div>
    );
  }

  const { metrics, lowStockItems, recentOrders } = data || {};

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <span className="text-xs uppercase font-mono tracking-widest text-duskk-500 block">
          Overview & Insights
        </span>
        <h1 className="font-serif text-3xl font-semibold text-duskk-900">
          Executive Operations Dashboard
        </h1>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white p-6 border border-duskk-200 rounded-lg shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-duskk-500 uppercase tracking-wider font-semibold">
            <span>Total Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-full">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <span className="font-serif text-2xl font-bold text-duskk-900 block">
            {formatPrice(metrics?.totalRevenue || 0)}
          </span>
          <span className="text-xs text-emerald-700 font-medium flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Today: {formatPrice(metrics?.todayRevenue || 0)}
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 border border-duskk-200 rounded-lg shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-duskk-500 uppercase tracking-wider font-semibold">
            <span>Total Orders</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-full">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <span className="font-serif text-2xl font-bold text-duskk-900 block">
            {metrics?.totalOrders || 0}
          </span>
          <span className="text-xs text-duskk-600">
            {metrics?.todayOrders || 0} new today &bull; {metrics?.pendingOrders || 0} pending fulfillment
          </span>
        </div>

        {/* Unique Customers */}
        <div className="bg-white p-6 border border-duskk-200 rounded-lg shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-duskk-500 uppercase tracking-wider font-semibold">
            <span>Patrons (Customers)</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-full">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="font-serif text-2xl font-bold text-duskk-900 block">
            {metrics?.totalCustomers || 0}
          </span>
          <span className="text-xs text-duskk-600">
            Guest + Registered unified
          </span>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 border border-duskk-200 rounded-lg shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-duskk-500 uppercase tracking-wider font-semibold">
            <span>Stock Alerts</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-full">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="font-serif text-2xl font-bold text-duskk-900 block">
            {metrics?.lowStockCount || 0} Low Stock
          </span>
          <span className="text-xs text-rose-600 font-medium">
            {metrics?.outOfStockCount || 0} pieces currently out of stock
          </span>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Inventory Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-duskk-200 rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-duskk-100">
            <h2 className="font-serif text-lg font-semibold text-duskk-900">
              Recent Customer Orders
            </h2>
            <Link
              href={ordersHref}
              className="text-xs text-duskk-700 hover:text-duskk-gold font-semibold uppercase tracking-wider flex items-center space-x-1"
            >
              <span>View All Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-duskk-50 text-duskk-600 uppercase font-mono tracking-wider border-b border-duskk-200">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-duskk-100">
                {!recentOrders || recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-duskk-400">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-duskk-50/50">
                      <td className="py-3 px-3 font-mono font-semibold text-duskk-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-duskk-900">{order.customerName}</div>
                        <div className="text-[10px] text-duskk-400">{order.customerEmail}</div>
                      </td>
                      <td className="py-3 px-3 text-duskk-500 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-3 font-bold font-serif text-duskk-900">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            ORDER_STATUS_LABELS[order.orderStatus]?.color || "bg-duskk-100 text-duskk-800"
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.orderStatus]?.label || order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Alerts & Quick Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Low Stock Card */}
          <div className="bg-white border border-duskk-200 rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="font-serif text-base font-semibold text-duskk-900 pb-2 border-b border-duskk-100 flex items-center justify-between">
              <span>Low Inventory Watch</span>
              <Link href={inventoryHref} className="text-xs text-duskk-gold hover:underline">
                Manage
              </Link>
            </h3>

            {!lowStockItems || lowStockItems.length === 0 ? (
              <p className="text-xs text-emerald-700 font-medium">All items have healthy inventory levels.</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-amber-50/50 border border-amber-200/60 rounded">
                    <div>
                      <p className="font-semibold text-duskk-900 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-duskk-500">{formatPrice(item.price)}</p>
                    </div>
                    <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                      {item.stockQuantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Management Links */}
          <div className="bg-duskk-900 text-white rounded-lg p-6 space-y-3">
            <h3 className="font-serif text-base font-medium text-duskk-gold">
              Administrative Quick Actions
            </h3>
            <div className="space-y-2 text-xs">
              <Link
                href={productsHref}
                className="block p-2 bg-duskk-800 hover:bg-duskk-700 rounded transition"
              >
                + Add / Manage Products & Media
              </Link>
              <Link
                href={cmsHref}
                className="block p-2 bg-duskk-800 hover:bg-duskk-700 rounded transition"
              >
                &bull; Update Homepage Hero Banners & Announcements
              </Link>
              <Link
                href={couponsHref}
                className="block p-2 bg-duskk-800 hover:bg-duskk-700 rounded transition"
              >
                % Manage Promotional Coupon Codes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
