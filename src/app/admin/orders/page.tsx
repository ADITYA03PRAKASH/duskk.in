"use client";

import React, { useState, useEffect } from "react";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, getPaymentStatusBadge, normalizeImageUrl } from "@/lib/utils";
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
  CreditCard,
  AlertTriangle,
  RefreshCw,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"fulfillment" | "cancellations" | "exchanges" | "refunds" | "details">("fulfillment");

  // Fulfillment tab state
  const [newStatus, setNewStatus] = useState("");
  const [courierName, setCourierName] = useState("Blue Dart Express");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState("");
  const [statusError, setStatusError] = useState("");

  // Cancellation processing state
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelDecision, setCancelDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [cancelNotes, setCancelNotes] = useState("");
  const [processingCancel, setProcessingCancel] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Exchange processing state
  const [exchangingId, setExchangingId] = useState<string | null>(null);
  const [exchangeDecision, setExchangeDecision] = useState<string>("APPROVE");
  const [exchangeNotes, setExchangeNotes] = useState("");
  const [pickupCourier, setPickupCourier] = useState("Blue Dart Express");
  const [pickupAwb, setPickupAwb] = useState("");
  const [replacementCourier, setReplacementCourier] = useState("Blue Dart Express");
  const [replacementAwb, setReplacementAwb] = useState("");
  const [replacementVariantId, setReplacementVariantId] = useState("");
  const [processingExchange, setProcessingExchange] = useState(false);
  const [exchangeMsg, setExchangeMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Refund processing state
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("Admin initiated customer refund");
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundMsg, setRefundMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
        if (selectedOrder) {
          const updated = data.data.find((o: any) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  const openOrderDetails = (ord: any) => {
    setSelectedOrder(ord);
    setActiveTab("fulfillment");
    setNewStatus(ord.orderStatus || "CONFIRMED");
    setCourierName(ord.courierName || "Blue Dart Express");
    setTrackingNumber(ord.trackingNumber || "");
    setTrackingUrl(ord.trackingUrl || "");
    setEstimatedDelivery(ord.estimatedDelivery || "");
    setStatusNote("");
    setStatusSuccess("");
    setStatusError("");
    setCancelMsg(null);
    setExchangeMsg(null);
    setRefundMsg(null);

    // Default refund amount to remaining refundable balance
    const totalRefunded = (ord.refunds || [])
      .filter((r: any) => r.status === "COMPLETED" || r.status === "PENDING" || r.status === "PROCESSING")
      .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    const balance = Math.max(0, Number(ord.totalAmount) - totalRefunded);
    setRefundAmount(balance > 0 ? balance.toString() : "");
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

    setUpdatingStatus(true);
    setStatusSuccess("");
    setStatusError("");

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
        setStatusSuccess(data.message || `Status successfully updated to ${newStatus}`);
        setStatusNote("");
        await loadOrders();
      } else {
        setStatusError(data.message || "Failed to update order status.");
      }
    } catch (e: any) {
      setStatusError(e.message || "Network error updating order status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleProcessCancellation = async (cancellationId: string) => {
    setProcessingCancel(true);
    setCancelMsg(null);

    try {
      const res = await fetch(`/api/admin/orders/cancellations/${cancellationId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: cancelDecision,
          notes: cancelNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCancelMsg({ type: "success", text: data.message });
        setCancelNotes("");
        setCancellingId(null);
        await loadOrders();
      } else {
        setCancelMsg({ type: "error", text: data.message || "Failed to process cancellation." });
      }
    } catch (e: any) {
      setCancelMsg({ type: "error", text: e.message || "Network error processing cancellation." });
    } finally {
      setProcessingCancel(false);
    }
  };

  const handleProcessExchange = async (exchangeId: string) => {
    setProcessingExchange(true);
    setExchangeMsg(null);

    try {
      const res = await fetch(`/api/admin/orders/exchanges/${exchangeId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: exchangeDecision,
          notes: exchangeNotes,
          replacementVariantId: replacementVariantId || undefined,
          pickupCourier,
          pickupAwb,
          replacementCourier,
          replacementAwb,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setExchangeMsg({ type: "success", text: data.message });
        setExchangeNotes("");
        setExchangingId(null);
        await loadOrders();
      } else {
        setExchangeMsg({ type: "error", text: data.message || "Failed to process exchange." });
      }
    } catch (e: any) {
      setExchangeMsg({ type: "error", text: e.message || "Network error processing exchange." });
    } finally {
      setProcessingExchange(false);
    }
  };

  const handleInitiateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setProcessingRefund(true);
    setRefundMsg(null);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: refundAmount ? Number(refundAmount) : undefined,
          reason: refundReason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRefundMsg({ type: "success", text: data.message });
        await loadOrders();
      } else {
        setRefundMsg({ type: "error", text: data.message || "Failed to process refund." });
      }
    } catch (e: any) {
      setRefundMsg({ type: "error", text: e.message || "Network error executing refund." });
    } finally {
      setProcessingRefund(false);
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

  // Helper calculations for selected order refunds
  const totalPaid = Number(selectedOrder?.totalAmount || 0);
  const existingRefunds = selectedOrder?.refunds || [];
  const totalRefunded = existingRefunds
    .filter((r: any) => r.status === "COMPLETED" || r.status === "PROCESSING" || r.status === "PENDING")
    .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
  const remainingRefundable = Math.max(0, totalPaid - totalRefunded);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <span className="text-xs uppercase font-mono tracking-widest text-duskk-500 block">
          Concierge & Logistics
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-duskk-900">
          Order Management Desk ({orders.length})
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
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status & Requests</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-duskk-100">
                {orders.map((order) => {
                  const hasPendingCancel = (order.cancellations || []).some(
                    (c: any) => c.status === "REQUESTED"
                  );
                  const hasPendingExchange = (order.exchanges || []).some(
                    (e: any) => e.status === "REQUESTED"
                  );
                  const hasRefund = (order.refunds || []).length > 0;

                  return (
                    <tr key={order.id} className="hover:bg-duskk-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-duskk-900">
                        {order.orderNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-duskk-900">{order.customerName}</div>
                        <div className="text-[10px] text-duskk-500 font-mono">
                          {order.customerEmail}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-duskk-500 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="py-3 px-4 font-serif font-bold text-duskk-900 text-sm">
                        {formatPrice(order.totalAmount)}
                      </td>

                      <td className="py-3 px-4">
                        {(() => {
                          const badge = getPaymentStatusBadge(order.paymentStatus);
                          return (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              ORDER_STATUS_LABELS[order.orderStatus]?.color || "bg-duskk-100 text-duskk-800"
                            }`}
                          >
                            {ORDER_STATUS_LABELS[order.orderStatus]?.label || order.orderStatus}
                          </span>

                          {hasPendingCancel && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 animate-pulse">
                              Cancel Req
                            </span>
                          )}

                          {hasPendingExchange && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 animate-pulse">
                              Exchange Req
                            </span>
                          )}

                          {hasRefund && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              Refund ({order.refunds.length})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openOrderDetails(order)}
                          className="px-2.5 py-1 bg-duskk-100 hover:bg-duskk-900 hover:text-white rounded text-duskk-800 font-medium transition"
                        >
                          Manage Order
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Order Management Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white max-w-4xl w-full rounded-lg shadow-2xl overflow-hidden border border-duskk-200 my-8">
            {/* Modal Header */}
            <div className="bg-duskk-900 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-duskk-gold block">
                  ORDER LIFECYCLE MANAGEMENT
                </span>
                <h3 className="font-serif text-xl font-medium">
                  Order #{selectedOrder.orderNumber}
                </h3>
                <span className="text-xs text-duskk-300">
                  {selectedOrder.customerName} ({selectedOrder.customerEmail})
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-duskk-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-duskk-200 bg-duskk-50 text-xs font-semibold uppercase tracking-wider">
              <button
                onClick={() => setActiveTab("fulfillment")}
                className={`px-4 py-3 border-b-2 flex items-center space-x-1.5 transition ${
                  activeTab === "fulfillment"
                    ? "border-duskk-gold text-duskk-900 bg-white"
                    : "border-transparent text-duskk-500 hover:text-duskk-800"
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Fulfillment & Status</span>
              </button>

              <button
                onClick={() => setActiveTab("cancellations")}
                className={`px-4 py-3 border-b-2 flex items-center space-x-1.5 transition ${
                  activeTab === "cancellations"
                    ? "border-duskk-gold text-duskk-900 bg-white"
                    : "border-transparent text-duskk-500 hover:text-duskk-800"
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Cancellations ({selectedOrder.cancellations?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("exchanges")}
                className={`px-4 py-3 border-b-2 flex items-center space-x-1.5 transition ${
                  activeTab === "exchanges"
                    ? "border-duskk-gold text-duskk-900 bg-white"
                    : "border-transparent text-duskk-500 hover:text-duskk-800"
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Exchanges ({selectedOrder.exchanges?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("refunds")}
                className={`px-4 py-3 border-b-2 flex items-center space-x-1.5 transition ${
                  activeTab === "refunds"
                    ? "border-duskk-gold text-duskk-900 bg-white"
                    : "border-transparent text-duskk-500 hover:text-duskk-800"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Razorpay Refunds ({selectedOrder.refunds?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-3 border-b-2 flex items-center space-x-1.5 transition ${
                  activeTab === "details"
                    ? "border-duskk-gold text-duskk-900 bg-white"
                    : "border-transparent text-duskk-500 hover:text-duskk-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Items & Snapshot</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[72vh] overflow-y-auto text-xs space-y-6">
              {/* TAB 1: FULFILLMENT & STATUS */}
              {activeTab === "fulfillment" && (
                <div className="space-y-6">
                  {statusSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                      <span>{statusSuccess}</span>
                    </div>
                  )}

                  {statusError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                      <span>{statusError}</span>
                    </div>
                  )}

                  <form
                    onSubmit={handleUpdateStatus}
                    className="bg-duskk-50 border border-duskk-200 p-5 rounded-lg space-y-4"
                  >
                    <div className="flex items-center space-x-2 pb-2 border-b border-duskk-200">
                      <Truck className="w-4 h-4 text-duskk-900" />
                      <h4 className="font-semibold text-duskk-900 uppercase tracking-wider">
                        Update Fulfillment & Dispatch Tracking
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-duskk-700 mb-1 font-semibold">
                          Target Order Status *
                        </label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-duskk-300 rounded bg-white text-duskk-900 font-semibold"
                        >
                          {statusOptions.map((st) => (
                            <option key={st} value={st}>
                              {ORDER_STATUS_LABELS[st]?.label || st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-duskk-700 mb-1 font-semibold">
                          Courier Partner
                        </label>
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
                        <label className="block text-duskk-700 mb-1 font-semibold">
                          AWB / Tracking Number
                        </label>
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
                        <label className="block text-duskk-700 mb-1 font-semibold">
                          Estimated Delivery Date
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 25 Oct 2026"
                          value={estimatedDelivery}
                          onChange={(e) => setEstimatedDelivery(e.target.value)}
                          className="w-full px-3 py-2 border border-duskk-300 rounded bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-duskk-700 mb-1 font-semibold">
                          Courier Tracking URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://www.bluedart.com/tracking?awb=..."
                          value={trackingUrl}
                          onChange={(e) => setTrackingUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-duskk-300 rounded bg-white font-mono text-[11px]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-duskk-700 mb-1 font-semibold">
                          Status Transition Note
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Dispatched in tamper-evident velvet box via Express Air"
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          className="w-full px-3 py-2 border border-duskk-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={updatingStatus}
                        className="px-5 py-2.5 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white font-semibold rounded uppercase tracking-wider transition flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        {updatingStatus ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Updating PostgreSQL & Notifying Customer...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Save Status & Dispatch Email</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Status Timeline History */}
                  <div className="bg-white border border-duskk-200 rounded-lg p-5 space-y-3">
                    <h4 className="font-semibold text-duskk-900 uppercase tracking-wider">
                      Status Audit History ({selectedOrder.timeline?.length || 0} transitions)
                    </h4>
                    <div className="divide-y divide-duskk-100">
                      {selectedOrder.timeline?.map((h: any, i: number) => (
                        <div key={i} className="py-2.5 flex justify-between items-start text-xs">
                          <div>
                            <span className="font-semibold text-duskk-900">
                              {ORDER_STATUS_LABELS[h.status]?.label || h.status}
                            </span>
                            <p className="text-duskk-600 mt-0.5">{h.note || "No note"}</p>
                            {h.changedBy && (
                              <p className="text-[10px] text-duskk-400 font-mono">By: {h.changedBy}</p>
                            )}
                          </div>
                          <span className="text-[11px] text-duskk-500 whitespace-nowrap">
                            {formatDate(h.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CANCELLATIONS */}
              {activeTab === "cancellations" && (
                <div className="space-y-6">
                  {cancelMsg && (
                    <div
                      className={`p-3 rounded border flex items-center space-x-2 ${
                        cancelMsg.type === "success"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}
                    >
                      {cancelMsg.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span>{cancelMsg.text}</span>
                    </div>
                  )}

                  {(!selectedOrder.cancellations || selectedOrder.cancellations.length === 0) ? (
                    <div className="p-8 text-center text-duskk-400 border border-dashed border-duskk-200 rounded-lg">
                      No cancellation requests have been submitted for this order.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedOrder.cancellations.map((c: any) => (
                        <div
                          key={c.id}
                          className="border border-duskk-200 rounded-lg p-5 space-y-3 bg-white"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-duskk-100">
                            <div>
                              <span className="font-semibold text-duskk-900 text-sm">
                                Request ID: {c.id.substring(0, 8)}...
                              </span>
                              <p className="text-[11px] text-duskk-500">
                                Submitted on {formatDate(c.created_at)}
                              </p>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                                c.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : c.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <p><strong>Reason:</strong> {c.reason}</p>
                            {c.details && <p><strong>Customer Note:</strong> {c.details}</p>}
                            {c.admin_notes && (
                              <p className="sm:col-span-2 text-duskk-700">
                                <strong>Admin Decision Note:</strong> {c.admin_notes}
                              </p>
                            )}
                          </div>

                          {/* Admin Review Action Form */}
                          {c.status === "REQUESTED" && (
                            <div className="mt-4 pt-4 border-t border-duskk-100 bg-duskk-50 p-4 rounded space-y-3">
                              <h5 className="font-semibold text-duskk-900 uppercase tracking-wider">
                                Review & Process Customer Cancellation
                              </h5>

                              <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="cancelDecision"
                                    value="APPROVE"
                                    checked={cancelDecision === "APPROVE"}
                                    onChange={() => setCancelDecision("APPROVE")}
                                  />
                                  <span className="text-emerald-800 font-semibold">
                                    Approve Cancellation & Release Stock
                                  </span>
                                </label>

                                <label className="flex items-center space-x-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="cancelDecision"
                                    value="REJECT"
                                    checked={cancelDecision === "REJECT"}
                                    onChange={() => setCancelDecision("REJECT")}
                                  />
                                  <span className="text-rose-800 font-semibold">
                                    Reject Cancellation
                                  </span>
                                </label>
                              </div>

                              <div>
                                <label className="block text-duskk-600 mb-1 font-medium">
                                  Decision Notes for Customer:
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Approved. Stock restored to inventory and refund scheduled."
                                  value={cancelNotes}
                                  onChange={(e) => setCancelNotes(e.target.value)}
                                  className="w-full px-3 py-2 border border-duskk-300 rounded bg-white"
                                />
                              </div>

                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  disabled={processingCancel}
                                  onClick={() => handleProcessCancellation(c.id)}
                                  className="px-4 py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white font-semibold rounded uppercase tracking-wider transition disabled:opacity-50 flex items-center space-x-1"
                                >
                                  {processingCancel ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <span>Execute Decision</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EXCHANGES */}
              {activeTab === "exchanges" && (
                <div className="space-y-6">
                  {exchangeMsg && (
                    <div
                      className={`p-3 rounded border flex items-center space-x-2 ${
                        exchangeMsg.type === "success"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}
                    >
                      {exchangeMsg.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span>{exchangeMsg.text}</span>
                    </div>
                  )}

                  {(!selectedOrder.exchanges || selectedOrder.exchanges.length === 0) ? (
                    <div className="p-8 text-center text-duskk-400 border border-dashed border-duskk-200 rounded-lg">
                      No exchange requests have been submitted for this order.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedOrder.exchanges.map((ex: any) => (
                        <div
                          key={ex.id}
                          className="border border-duskk-200 rounded-lg p-5 space-y-3 bg-white"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-duskk-100">
                            <div>
                              <span className="font-semibold text-duskk-900 text-sm">
                                Exchange Request ID: {ex.id.substring(0, 8)}...
                              </span>
                              <p className="text-[11px] text-duskk-500">
                                Submitted on {formatDate(ex.created_at)}
                              </p>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                                ex.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : ex.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {ex.status}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p><strong>Exchange Reason:</strong> {ex.reason}</p>
                            {ex.details && <p><strong>Customer Note:</strong> {ex.details}</p>}
                            {ex.pickup_tracking_number && (
                              <p className="text-blue-800">
                                <strong>Pickup:</strong> {ex.pickup_courier} | AWB:{" "}
                                <span className="font-mono">{ex.pickup_tracking_number}</span>
                              </p>
                            )}
                            {ex.replacement_tracking_number && (
                              <p className="text-emerald-800">
                                <strong>Replacement Dispatch:</strong> {ex.replacement_courier} | AWB:{" "}
                                <span className="font-mono">{ex.replacement_tracking_number}</span>
                              </p>
                            )}
                            {ex.admin_notes && (
                              <p className="text-duskk-700">
                                <strong>Admin Note:</strong> {ex.admin_notes}
                              </p>
                            )}
                          </div>

                          {/* Action Form for Exchange Progression */}
                          {ex.status !== "COMPLETED" && ex.status !== "REJECTED" && (
                            <div className="mt-4 pt-4 border-t border-duskk-100 bg-duskk-50 p-4 rounded space-y-3">
                              <h5 className="font-semibold text-duskk-900 uppercase tracking-wider">
                                Advance Exchange Lifecycle
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-duskk-600 mb-1 font-semibold">
                                    Next Action / Status:
                                  </label>
                                  <select
                                    value={exchangeDecision}
                                    onChange={(e) => setExchangeDecision(e.target.value)}
                                    className="w-full px-3 py-2 border border-duskk-300 rounded bg-white text-duskk-900 font-medium"
                                  >
                                    <option value="APPROVE">APPROVE (Accept Request)</option>
                                    <option value="PICKUP_SCHEDULED">PICKUP_SCHEDULED (Assign Courier)</option>
                                    <option value="INSPECTION_PENDING">INSPECTION_PENDING (Received at Facility)</option>
                                    <option value="REPLACEMENT_DISPATCHED">REPLACEMENT_DISPATCHED (Send New Item)</option>
                                    <option value="COMPLETED">COMPLETED (Exchange Delivered)</option>
                                    <option value="REJECT">REJECT (Decline Request)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-duskk-600 mb-1 font-semibold">
                                    Pickup Courier & AWB:
                                  </label>
                                  <div className="grid grid-cols-2 gap-1">
                                    <input
                                      type="text"
                                      placeholder="Courier"
                                      value={pickupCourier}
                                      onChange={(e) => setPickupCourier(e.target.value)}
                                      className="px-2 py-1.5 border border-duskk-300 rounded bg-white text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Pickup AWB"
                                      value={pickupAwb}
                                      onChange={(e) => setPickupAwb(e.target.value)}
                                      className="px-2 py-1.5 border border-duskk-300 rounded bg-white text-xs font-mono"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-duskk-600 mb-1 font-semibold">
                                    Replacement Courier & AWB:
                                  </label>
                                  <div className="grid grid-cols-2 gap-1">
                                    <input
                                      type="text"
                                      placeholder="Courier"
                                      value={replacementCourier}
                                      onChange={(e) => setReplacementCourier(e.target.value)}
                                      className="px-2 py-1.5 border border-duskk-300 rounded bg-white text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Replacement AWB"
                                      value={replacementAwb}
                                      onChange={(e) => setReplacementAwb(e.target.value)}
                                      className="px-2 py-1.5 border border-duskk-300 rounded bg-white text-xs font-mono"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-duskk-600 mb-1 font-semibold">
                                    Admin Notes to Customer:
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Courier assigned for complimentary insured pickup"
                                    value={exchangeNotes}
                                    onChange={(e) => setExchangeNotes(e.target.value)}
                                    className="w-full px-3 py-1.5 border border-duskk-300 rounded bg-white text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  disabled={processingExchange}
                                  onClick={() => handleProcessExchange(ex.id)}
                                  className="px-4 py-2 bg-duskk-900 hover:bg-duskk-gold hover:text-duskk-900 text-white font-semibold rounded uppercase tracking-wider transition disabled:opacity-50 flex items-center space-x-1"
                                >
                                  {processingExchange ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <span>Update Exchange State</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: RAZORPAY REFUNDS */}
              {activeTab === "refunds" && (
                <div className="space-y-6">
                  {refundMsg && (
                    <div
                      className={`p-3 rounded border flex items-center space-x-2 ${
                        refundMsg.type === "success"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}
                    >
                      {refundMsg.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span>{refundMsg.text}</span>
                    </div>
                  )}

                  {/* Financial Balance Summary Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-duskk-50 border border-duskk-200 rounded-lg">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-duskk-500 block">
                        Order Total
                      </span>
                      <span className="font-serif text-xl font-bold text-duskk-900">
                        {formatPrice(totalPaid)}
                      </span>
                      <p className="text-[10px] text-duskk-400 mt-1">Captured via Razorpay</p>
                    </div>

                    <div className="p-4 bg-duskk-50 border border-duskk-200 rounded-lg">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-duskk-500 block">
                        Total Refunded
                      </span>
                      <span className="font-serif text-xl font-bold text-emerald-700">
                        {formatPrice(totalRefunded)}
                      </span>
                      <p className="text-[10px] text-duskk-400 mt-1">{existingRefunds.length} past refund(s)</p>
                    </div>

                    <div className="p-4 bg-duskk-50 border border-duskk-200 rounded-lg">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-duskk-500 block">
                        Remaining Refundable Balance
                      </span>
                      <span className="font-serif text-xl font-bold text-duskk-900">
                        {formatPrice(remainingRefundable)}
                      </span>
                      <p className="text-[10px] text-duskk-400 mt-1">Available for disbursement</p>
                    </div>
                  </div>

                  {/* Razorpay Refund Action Form */}
                  {remainingRefundable > 0 && selectedOrder.razorpayPaymentId && (
                    <form
                      onSubmit={handleInitiateRefund}
                      className="bg-amber-50/60 border border-amber-200 p-5 rounded-lg space-y-4"
                    >
                      <div className="flex items-center space-x-2 pb-2 border-b border-amber-200">
                        <CreditCard className="w-4 h-4 text-amber-800" />
                        <h4 className="font-semibold text-amber-900 uppercase tracking-wider">
                          Execute Gateway Refund via Razorpay API
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-amber-900 mb-1 font-semibold">
                            Refund Amount (INR) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            max={remainingRefundable}
                            min="1"
                            required
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-amber-300 rounded bg-white text-duskk-900 font-serif font-bold text-sm"
                          />
                          <p className="text-[10px] text-amber-700 mt-1">
                            Cannot exceed remaining balance of {formatPrice(remainingRefundable)}.
                          </p>
                        </div>

                        <div>
                          <label className="block text-amber-900 mb-1 font-semibold">
                            Refund Reason *
                          </label>
                          <input
                            type="text"
                            required
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="e.g. Customer cancellation approved / defective item returned"
                            className="w-full px-3 py-2 border border-amber-300 rounded bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={processingRefund}
                          className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded uppercase tracking-wider transition flex items-center space-x-1.5 disabled:opacity-50"
                        >
                          {processingRefund ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Calling Razorpay API & Reconciling...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Disburse ₹{refundAmount || remainingRefundable} via Razorpay</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Past Refunds Table */}
                  <div className="bg-white border border-duskk-200 rounded-lg p-5 space-y-3">
                    <h4 className="font-semibold text-duskk-900 uppercase tracking-wider">
                      Reconciled Gateway Refunds ({existingRefunds.length})
                    </h4>

                    {existingRefunds.length === 0 ? (
                      <p className="text-duskk-400 text-xs py-2">No refunds recorded yet.</p>
                    ) : (
                      <div className="divide-y divide-duskk-100">
                        {existingRefunds.map((r: any) => (
                          <div key={r.id} className="py-2.5 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold font-serif text-sm text-duskk-900">
                                {formatPrice(r.amount)}
                              </span>
                              <span
                                className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  r.status === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : r.status === "FAILED"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {r.status}
                              </span>
                              <p className="text-duskk-600 mt-0.5">{r.reason || "Refund"}</p>
                              {r.razorpay_refund_id && (
                                <p className="text-[10px] text-duskk-400 font-mono">
                                  Razorpay Refund ID: {r.razorpay_refund_id}
                                </p>
                              )}
                            </div>
                            <span className="text-[11px] text-duskk-400">
                              {formatDate(r.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: ITEMS & SNAPSHOT */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  {/* Customer & Delivery Snapshot */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-duskk-50 border border-duskk-200 rounded space-y-1">
                      <span className="font-bold text-duskk-900 uppercase tracking-wider block mb-1">
                        Customer Profile
                      </span>
                      <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                      <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                      <p><strong>Mobile:</strong> {selectedOrder.customerPhone}</p>
                      <p className="text-[10px] text-duskk-400 font-mono pt-1">
                        Customer ID: {selectedOrder.customerId}
                      </p>
                    </div>

                    <div className="p-4 bg-duskk-50 border border-duskk-200 rounded space-y-1">
                      <span className="font-bold text-duskk-900 uppercase tracking-wider block mb-1">
                        Shipping Address
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
                      Ordered Products ({selectedOrder.items?.length || 0})
                    </span>
                    <div className="divide-y divide-duskk-100">
                      {selectedOrder.items?.map((item: any) => (
                        <div key={item.id} className="py-2.5 flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <img
                              src={normalizeImageUrl(item.productImage)}
                              alt={item.productName}
                              className="w-10 h-10 object-cover rounded bg-duskk-50 border border-duskk-100"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                            <div>
                              <p className="font-semibold text-duskk-900">{item.productName}</p>
                              <p className="text-[10px] text-duskk-400 font-mono">
                                {item.variantTitle ? `${item.variantTitle} • ` : ""}SKU: {item.productSku} • Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold font-serif text-duskk-900">
                            {formatPrice(item.subtotal || item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Reference */}
                  <div className="p-4 bg-duskk-50 border border-duskk-200 rounded space-y-2">
                    <span className="font-bold text-duskk-900 uppercase tracking-wider block mb-1">
                      Payment Reconciliation
                    </span>
                    <div className="flex justify-between items-center">
                      <span>Payment Status:</span>
                      {(() => {
                        const badge = getPaymentStatusBadge(selectedOrder.paymentStatus);
                        return (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badge.color}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex justify-between">
                      <span>Razorpay Order ID:</span>
                      <span className="font-mono">{selectedOrder.razorpayOrderId || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Razorpay Payment ID:</span>
                      <span className="font-mono">{selectedOrder.razorpayPaymentId || "Pending"}</span>
                    </div>
                    <div className="flex justify-between font-bold text-duskk-900 pt-2 border-t border-duskk-200 text-sm">
                      <span>Grand Total:</span>
                      <span className="font-serif text-base">{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
