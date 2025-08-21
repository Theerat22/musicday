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
} from "lucide-react";
import Image from "next/image";

interface BouquetDetail {
  flower_id: number;
  flower_name: string;
  flower_color: string;
  flower_price: number;
  quantity: number;
}

interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  price: number;
  color: string;
  wrapping: string;
  cart_id: string;
  bouquet_details: BouquetDetail[];
}

type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface Order {
  id: number;
  order_number: string;
  first_name: string;
  last_name: string;
  nickname: string;
  grade: string;
  total_price: number;
  slip_image_url: string | null;
  order_date: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

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
      const response = await fetch("/api/admin/orders");
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
          order.order_number.toLowerCase().includes(searchLower) ||
          order.first_name.toLowerCase().includes(searchLower) ||
          order.last_name.toLowerCase().includes(searchLower) ||
          order.nickname.toLowerCase().includes(searchLower) ||
          order.grade.toLowerCase().includes(searchLower);

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

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdating(orderId);
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
            order.id === orderId
              ? { ...order, status: newStatus as OrderStatus }
              : order
          )
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            status: newStatus as OrderStatus,
          });
        }
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
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
        text: "ยืนยันแล้ว",
      },
      completed: {
        color: "bg-green-100 text-green-800",
        icon: Package,
        text: "เสร็จสิ้น",
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
    return null;
  };

  const getStatusButtonText = (status: OrderStatus) => {
    if (status === "pending") return "ยืนยันสลิป";
    if (status === "confirmed") return "มารับของ";
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">จัดการคำสั่งซื้อ</h1>
          <p className="text-gray-600 mt-2">
            ({filteredOrders.length} จาก {orders.length} รายการ)
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

          {/* Quick Status Filter - Always visible */}
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
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-800 hover:bg-green-200"
                }`}
              >
                เสร็จสิ้น ({statusCounts.completed || 0})
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
                      placeholder="หมายเลขออเดอร์, ชื่อ, ชื่อเล่น, ชั้น"
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
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          #{order.order_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.first_name} {order.last_name} ({order.nickname}
                          ) - ชั้น {order.grade}
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
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          <Eye size={14} />
                          ดูรายละเอียด
                        </button>

                        {getNextStatus(order.status) && (
                          <button
                            onClick={() =>
                              updateOrderStatus(
                                order.id,
                                getNextStatus(order.status)!
                              )
                            }
                            disabled={updating === order.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {updating === order.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
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
              <div className="bg-white rounded-lg shadow-sm">
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

                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      ข้อมูลลูกค้า
                    </h3>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-gray-600">หมายเลข:</span> #
                        {selectedOrder.order_number}
                      </p>
                      <p>
                        <span className="text-gray-600">ชื่อ:</span>{" "}
                        {selectedOrder.first_name} {selectedOrder.last_name}
                      </p>
                      <p>
                        <span className="text-gray-600">ชื่อเล่น:</span>{" "}
                        {selectedOrder.nickname}
                      </p>
                      <p>
                        <span className="text-gray-600">ชั้น:</span>{" "}
                        {selectedOrder.grade}
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

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                      รายการสินค้า
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item) => (
                        <div
                          key={item.cart_id}
                          className="bg-white p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-black">
                              {item.product_name}
                            </h3>
                          </div>

                          {/* Display for bouquets */}
                          {item.bouquet_details &&
                          item.bouquet_details.length > 0 ? (
                            <div className="text-sm text-gray-600 mb-1">
                              <p className="mb-1">ดอกไม้:</p>
                              <ul className="list-disc list-inside ml-2">
                                {item.bouquet_details.map((flower, idx) => (
                                  <li key={idx}>
                                    {flower.flower_name} x {flower.quantity}
                                    {/* Conditional rendering for flower color */}
                                    {item.product_name === "ช่อลิลลี่" && (
                                      <span className="text-gray-500">
                                        {" "}
                                        ({flower.flower_color})
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                              <p className="text-sm text-gray-600 ">
                                โทนสี: {item.color || "ไม่ระบุ"}
                              </p>
                              <p className="text-sm text-gray-600 ">
                                กระดาษห่อ: {item.wrapping || "ไม่ระบุ"}
                              </p>
                              <p className="text-sm text-gray-600 ">
                                ค่าจัดช่อ:{" "}
                                {formatPrice(
                                  item.price -
                                    (item.bouquet_details?.reduce(
                                      (sum, f) =>
                                        sum + f.flower_price * f.quantity,
                                      0
                                    ) || 0)
                                )}{" "}
                                บาท
                              </p>
                            </div>
                          ) : (
                            // Display for single flowers
                            <>
                              <p className="text-sm text-gray-600 mb-1">
                                ราคาดอก: ฿{formatPrice(item.price)}
                              </p>
                              <p className="text-sm text-gray-600 mb-1">
                                สี: {item.color || "ไม่ระบุ"}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                จำนวน: {item.wrapping}
                              </p>
                            </>
                          )}
                          <p className="font-bold text-black">
                            ฿{formatPrice(item.price)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <p className="font-semibold">
                        ยอดรวม: ฿{formatPrice(selectedOrder.total_price)}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.slip_image_url && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">
                        สลิปการโอนเงิน
                      </h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <Image
                          src={selectedOrder.slip_image_url}
                          alt="Payment slip"
                          width={150}
                          height={150}
                          className="w-full h-auto"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder-slip.png";
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {getNextStatus(selectedOrder.status) && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() =>
                          updateOrderStatus(
                            selectedOrder.id,
                            getNextStatus(selectedOrder.status)!
                          )
                        }
                        disabled={updating === selectedOrder.id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updating === selectedOrder.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
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
              <div className="bg-white rounded-lg shadow-sm">
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
