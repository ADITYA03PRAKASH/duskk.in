"use client";

import React, { useState, useEffect } from "react";
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  RotateCcw,
  Loader2,
  X,
  Send,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [courierName, setCourierName] = useState("Blue Dart Express");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  const openOrderDetails = (ord: any) => {
    setSelectedOrder(ord);
    setNewStatus(ord.orderStatus || "CONFIRMED");
    setCourierName(ord.courierName || "Blue Dart Express");
    setTrackingNumber(ord.trackingNumber || "");
    setTrackingUrl(ord.trackingUrl || "");
    setEstimatedDelivery(ord.estimatedDelivery || "");
    setStatusNote("");
  };

  const handleCourierChange = (cName: string, awbVal: string) => {
    setCourierName(cName);
    if (!awbVal) return;
    if (cName.toLowerCase().includes("bluedart")) {
      setTrackingUrl(`https://www.bluedart.com/tracking?awb=${awbVal}`);
    } else if (cName.toLowerCase().includes("delhivery")) {
      setTrackingUrl(`https://www.delhivery.com/track/package/${awbVal}`);
    } else if (cName.toLowerCase().includes("dtdc")) {
      setTrackingUrl(`https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno=${awbVal}`);
    } else if (cName.toLowerCase().includes("xpressbees")) {
      setTrackingUrl(`https://www.xpressbees.com/track?awb=${awbVal}`);
    } else if (cName.toLowerCase().includes("ekart")) {
      setTrackingUrl(`https://ekartlogistics.com/shipmenttrack/${awbVal}`);
    } else if (cName.toLowerCase().includes("post")) {
      setTrackingUrl(`https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newStatus) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          courierName,
          trackingNumber,
          trackingUrl,
          estimatedDelivery,
          note: statusNote || `Status updated to ${newStatus}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrder((prev: any) => ({
          ...prev,
          orderStatus: newStatus,
          courierName,
          trackingNumber,
          trackingUrl,
          estimatedDelivery,
        }));
        setStatusNote("");
        loadOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const statusOptions = [
    "PENDING_PAYMENT",
    "PAID",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs uppercase font-mono tracking-widest text-duskk-500 block">
          Fulfillment & Dispatch
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-duskk-900">
          Customer Orders ({orders.length})
        </h1>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 border border-duskk-200 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-duskk-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order #, Name, Email, or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-duskk-300 rounded focus:outline-none focus:border-duskk-gold"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-4 h-4 text-duskk-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-duskk-300 rounded bg-white text-duskk-800"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {ORDER_STATUS_LABELS[st]?.label || st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-duskk-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-duskk-900 animate-spin mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-duskk-400 text-xs">
            No orders found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-duskk-50 text-duskk-600 uppercase font-mono tracking-wider border-b border-duskk-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-duskk-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-duskk-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-duskk-900">
                      {order.orderNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-duskk-900">{order.customerName}</div>
                      <div className="text-[10px] text-duskk-500 font-mono">
                        {order.customerEmail} &bull; {order.customerPhone}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-duskk-500 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-duskk-700">
                      {order.items?.length || 0} items
                    </td>

                    <td className="py-3 px-4 font-serif font-bold text-duskk-900 text-sm">
                      {formatPrice(order.totalAmount)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ORDER_STATUS_LABELS[order.orderStatus]?.color || "bg-duskk-100 text-duskk-800"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.orderStatus]?.label || order.orderStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="px-2.5 py-1 bg-duskk-100 hover:bg-duskk-900 hover:text-white rounded text-duskk-800 font-medium transition"
                      >
                        Inspect & Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail & Status Changer Drawer/Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-lg shadow-2xl overflow-hidden border border-duskk-200 my-8">
            <div className="bg-duskk-900 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-duskk-gold block">
                  ORDER FULFILLMENT & TRACKING
                </span>
                <h3 className="font-serif text-xl font-medium">
                  Order #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-duskk-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Order Status & Tracking Dispatch Form */}
              <form
                onSubmit={handleUpdateStatus}
                className="bg-duskk-50 border border-duskk-200 p-4 rounded-lg space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-duskk-900" />
                  <h4 className="font-semibold text-duskk-900 uppercase tracking-wider">
                    Courier Dispatch & Order Tracking:
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-duskk-600 mb-1 font-medium">Fulfillment Status:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-duskk-300 rounded bg-white text-duskk-900 font-medium"
                    >
                      {statusOptions.map((st) => (
                        <option key={st} value={st}>
                          {ORDER_STATUS_LABELS[st]?.label || st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-duskk-600 mb-1 font-medium">Courier Partner:</label>
                    <select
                      value={courierName}
                      onChange={(e) => handleCourierChange(e.target.value, trackingNumber)}
                      className="w-full px-3 py-2 border border-duskk-300 rounded bg-white text-duskk-900 font-medium"
                    >
                      <option value="Blue Dart Express">Blue Dart Express</option>
                      <option value="Delhivery Express">Delhivery Express</option>
                      <option value="DTDC Courier">DTDC Courier</option>
                      <option value="Ekart Logistics">Ekart Logistics</option>
                      <option value="Shadowfax">Shadowfax</option>
                      <option value="Xpressbees">Xpressbees</option>
                      <option value="India Post Speed Post">India Post Speed Post</option>
                      <option value="Other Courier">Other Courier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-duskk-600 mb-1 font-medium">AWB / Tracking Number:</label>
                    <input
                      type="text"
                      placeholder="e.g. BD918273645IN"
                      value={trackingNumber}
                      onChange={(e) => {
                        setTrackingNumber(e.target.value);
                        handleCourierChange(courierName, e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-duskk-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-duskk-600 mb-1 font-medium">Estimated Delivery Date:</label>
                    <input
                      type="text"
                      placeholder="e.g. 24 Sep 2026"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      className="w-full px-3 py-2 border border-duskk-300 rounded bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-duskk-600 mb-1 font-medium">Live Tracking URL:</label>
                    <input
                      type="url"
                      placeholder="https://www.bluedart.com/tracking?awb=..."
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-duskk-300 rounded bg-white font-mono text-[11px]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-duskk-600 mb-1 font-medium">Dispatch / Status Note:</label>
                    <input
                      type="text"
                      placeholder="e.g. Dispatched in tamper-evident velvet unboxing via express air"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="w-full px-3 py-2 border border-duskk-300 rounded bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white font-semibold rounded transition flex items-center space-x-1 uppercase tracking-wider"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Tracking...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save & Update Order Tracking</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Customer & Delivery Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-duskk-200 rounded space-y-1">
                  <span className="font-bold text-duskk-900 uppercase tracking-wider block mb-1">
                    Customer Information
                  </span>
                  <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                  <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                  <p><strong>Mobile:</strong> {selectedOrder.customerPhone}</p>
                  <p className="text-[10px] text-duskk-400 font-mono pt-1">
                    Customer ID: {selectedOrder.customerId}
                  </p>
                </div>

                <div className="p-4 bg-white border border-duskk-200 rounded space-y-1">
                  <span className="font-bold text-duskk-900 uppercase tracking-wider block mb-1">
                    Shipping Snapshot
                  </span>
                  <p>{selectedOrder.shippingAddressLine1}</p>
                  {selectedOrder.shippingAddressLine2 && <p>{selectedOrder.shippingAddressLine2}</p>}
                  <p>{selectedOrder.shippingCity}, {selectedOrder.shippingState} - {selectedOrder.shippingPincode}</p>
                  {selectedOrder.shippingLandmark && <p>Landmark: {selectedOrder.shippingLandmark}</p>}
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 bg-white border border-duskk-200 rounded space-y-3">
                <span className="font-bold text-duskk-900 uppercase tracking-wider block">
                  Ordered Items ({selectedOrder.items?.length || 0})
                </span>
                <div className="divide-y divide-duskk-100">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="py-2 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-duskk-900">{item.productName}</p>
                        <p className="text-[10px] text-duskk-400 font-mono">
                          SKU: {item.productSku} &bull; Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold font-serif text-duskk-900">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Financial Snapshot */}
              <div className="p-4 bg-white border border-duskk-200 rounded space-y-2">
                <span className="font-bold text-duskk-900 uppercase tracking-wider block mb-1">
                  Payment Reference
                </span>
                <div className="flex justify-between">
                  <span>Razorpay Order ID:</span>
                  <span className="font-mono">{selectedOrder.razorpayOrderId || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Razorpay Payment ID:</span>
                  <span className="font-mono">{selectedOrder.razorpayPaymentId || "Pending"}</span>
                </div>
                <div className="flex justify-between font-bold text-duskk-900 pt-2 border-t border-duskk-100 text-sm">
                  <span>Total Amount Paid:</span>
                  <span className="font-serif text-base">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
