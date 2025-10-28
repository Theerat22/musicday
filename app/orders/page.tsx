"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Eye,
  Check,
  Package,
  X,
  Clock,
  Filter,
  Search,
  Calendar,
  Loader2,
} from "lucide-react";
import Image from "next/image";

interface OrderItem {
  product_id: number | null;
  product_name: string;
  item_price: number;
  quantity: number;
  product_option: string | null;
}

type OrderStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "delivered"
  | "cancelled";

interface Order {
  order_id: string; // "MD..."
  customer_name: string;
  customer_contact: string;
  total_price: number;
  slip_image_url: string | null;
  order_date: string;
  status: OrderStatus;
  items: OrderItem[];
}

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null); // (string "MD...")

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/orders");
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const data: Order[] = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          order.order_id.toLowerCase().includes(searchLower) ||
          order.customer_name.toLowerCase().includes(searchLower) ||
          order.customer_contact.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        const orderDate = new Date(order.order_date);
        if (dateFrom && orderDate < new Date(dateFrom)) return false;
        if (dateTo && orderDate > new Date(dateTo + "T23:59:59")) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm, dateFrom, dateTo]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(orderId); // orderId คือ string ("MD...")
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(
          orders.map((order) =>
            order.order_id === orderId ? { ...order, status: newStatus } : order
          )
        );
        if (selectedOrder && selectedOrder.order_id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            status: newStatus,
          });
        }
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("ไม่สามารถอัปเดตสถานะได้");
    } finally {
      setUpdating(null);
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        text: "รอดำเนินการ",
      },
      confirmed: {
        color: "bg-blue-100 text-blue-800",
        icon: Check,
        text: "ยืนยืนแล้ว",
      },
      completed: {
        color: "bg-purple-100 text-purple-800",
        icon: Package,
        text: "ทำออเดอร์แล้ว",
      },
      delivered: {
        color: "bg-green-100 text-green-800",
        icon: Package,
        text: "มารับแล้ว",
      },
      cancelled: { color: "bg-red-100 text-red-800", icon: X, text: "ยกเลิก" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}
      >
        <Icon size={12} />
        {config.text}
      </span>
    );
  };

  const getNextStatus = (currentStatus: OrderStatus) => {
    if (currentStatus === "pending") return "confirmed";
    if (currentStatus === "confirmed") return "completed";
    if (currentStatus === "completed") return "delivered";
    return null;
  };

  const getStatusButtonText = (status: OrderStatus) => {
    if (status === "pending") return "ยืนยันสลิป";
    if (status === "confirmed") return "ทำออเดอร์เสร็จ";
    if (status === "completed") return "ยืนยันรับของ";
    return null;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH").format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  const statusCounts = useMemo(() => {
    return orders.reduce(
      (counts, order) => {
        counts[order.status] = (counts[order.status] || 0) + 1;
        counts.all = (counts.all || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );
  }, [orders]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">จัดการคำสั่งซื้อ</h1>
          <p className="text-gray-600 mt-2">
            จัดการและติดตามสถานะคำสั่งซื้อทั้งหมด ({filteredOrders.length} จาก{" "}
            {orders.length} รายการ)
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-600" />
                <h2 className="text-lg font-medium text-gray-900">ตัวกรอง</h2>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {showFilters ? "ซ่อน" : "แสดง"}ตัวกรอง
              </button>
            </div>
          </div>
          {/* Quick Status Filter */}
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                  statusFilter === "all"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ทั้งหมด ({statusCounts.all || 0})
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                  statusFilter === "pending"
                    ? "bg-yellow-600 text-white"
                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                }`}
              >
                รอดำเนินการ ({statusCounts.pending || 0})
              </button>
              <button
                onClick={() => setStatusFilter("confirmed")}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                  statusFilter === "confirmed"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                }`}
              >
                ยืนยันแล้ว ({statusCounts.confirmed || 0})
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                  statusFilter === "completed"
                    ? "bg-purple-600 text-white"
                    : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                }`}
              >
                ทำออเดอร์แล้ว ({statusCounts.completed || 0})
              </button>
              <button
                onClick={() => setStatusFilter("delivered")}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                  statusFilter === "delivered"
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-800 hover:bg-green-200"
                }`}
              >
                มารับแล้ว ({statusCounts.delivered || 0})
              </button>
              <button
                onClick={() => setStatusFilter("cancelled")}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                  statusFilter === "cancelled"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-800 hover:bg-red-200"
                }`}
              >
                ยกเลิก ({statusCounts.cancelled || 0})
              </button>
            </div>
          </div>
          {/* Advanced Filters */}
          {showFilters && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ค้นหา
                  </label>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="หมายเลขออเดอร์, ชื่อ, ชั้น"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่เริ่มต้น
                  </label>
                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่สิ้นสุด
                  </label>
                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              {/* Clear Filters */}
              {(statusFilter !== "all" || searchTerm || dateFrom || dateTo) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  รายการคำสั่งซื้อ
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {/* 🟨 FIX 1: เปลี่ยน key={order.id} เป็น key={order.order_id} */}
                {filteredOrders.map((order) => (
                  <div
                    key={order.order_id} // (key "MD...")
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          #{order.order_id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.customer_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.customer_contact}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p>จำนวน: {order.items?.length || 0} รายการ</p>
                        <p>ยอดรวม: ฿{formatPrice(order.total_price)}</p>
                        <p>วันที่: {formatDate(order.order_date)}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          <Eye size={14} />
                          ดูรายละเอียด
                        </button>

                        {getNextStatus(order.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(
                                order.order_id, // (string "MD...")
                                getNextStatus(order.status)!
                              );
                            }}
                            disabled={updating === order.order_id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {updating === order.order_id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            {getStatusButtonText(order.status)}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>
                      {orders.length === 0
                        ? "ไม่มีคำสั่งซื้อ"
                        : "ไม่พบคำสั่งซื้อที่ตรงกับการกรอง"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Detail */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <div className="bg-white rounded-lg shadow-sm sticky top-6">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                      รายละเอียดคำสั่งซื้อ
                    </h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                  {/* Customer Info */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      ข้อมูลลูกค้า
                    </h3>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-gray-600">หมายเลข:</span> #
                        {selectedOrder.order_id}
                      </p>
                      <p>
                        <span className="text-gray-600">ชื่อ:</span>{" "}
                        {selectedOrder.customer_name}
                      </p>
                      <p>
                        <span className="text-gray-600">ข้อมูลติดต่อ:</span>{" "}
                        {selectedOrder.customer_contact}
                      </p>
                      <p>
                        <span className="text-gray-600">วันที่สั่ง:</span>{" "}
                        {formatDate(selectedOrder.order_date)}
                      </p>
                      <p>
                        <span className="text-gray-600">สถานะ:</span>{" "}
                        {getStatusBadge(selectedOrder.status)}
                      </p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                      รายการสินค้า ({selectedOrder.items.length})
                    </h3>
                    <div className="space-y-3">
                      {/* 🟨 FIX 2: เปลี่ยน key={item.id} เป็น key ที่ unique */}
                      {selectedOrder.items?.map((item, index) => (
                        <div
                          key={`${item.product_id}-${item.product_option}-${index}`} // (ใช้ key ที่ unique ภายใน list)
                          className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-gray-900">
                              {item.product_name}
                            </h4>
                            <p className="font-bold text-gray-900">
                              ฿
                              {formatPrice(
                                item.item_price * item.quantity
                              )}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            {item.quantity} x ฿{formatPrice(item.item_price)}
                          </p>
                          {item.product_option && (
                            <p className="text-sm text-gray-600">
                              ตัวเลือก: {item.product_option}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <p className="text-lg font-semibold text-right">
                        ยอดรวม: ฿{formatPrice(selectedOrder.total_price)}
                      </p>
                    </div>
                  </div>

                  {/* Slip Image */}
                  {selectedOrder.slip_image_url && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">
                        สลิปการโอนเงิน
                      </h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <a
                          href={selectedOrder.slip_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {/* 🟨 FIX 3: เปลี่ยน <Image> เป็น <img> */}
                          <Image
                            src={selectedOrder.slip_image_url}
                            alt="Payment slip"
                            width={400}
                            height={600}
                            className="w-full h-auto object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/400x600/eee/ccc?text=No+Slip";
                            }}
                          />
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Buttons */}
                  {selectedOrder.status !== "cancelled" &&
                    selectedOrder.status !== "delivered" && (
                      <div
                        className={`${
                          getNextStatus(selectedOrder.status) ? "" : "pt-4 border-t"
                        } border-gray-200`}
                      >
                        <button
                          onClick={() =>
                            updateOrderStatus(selectedOrder.order_id, "cancelled")
                          }
                          disabled={updating === selectedOrder.order_id}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {updating === selectedOrder.order_id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <X size={16} />
                          )}
                          ยกเลิกออเดอร์
                        </button>
                      </div>
                    )}

                  {getNextStatus(selectedOrder.status) && (
                    <div
                      className={`${
                        selectedOrder.status === "cancelled" ||
                        selectedOrder.status === "delivered"
                          ? "pt-4 border-t"
                          : ""
                      } border-gray-200`}
                    >
                      <button
                        onClick={() =>
                          updateOrderStatus(
                            selectedOrder.order_id,
                            getNextStatus(selectedOrder.status)!
                          )
                        }
                        disabled={updating === selectedOrder.order_id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updating === selectedOrder.order_id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Check size={16} />
                        )}
                        {getStatusButtonText(selectedOrder.status)}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm sticky top-6">
                <div className="p-12 text-center text-gray-500">
                  <Eye size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>เลือกคำสั่งซื้อเพื่อดูรายละเอียด</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;

