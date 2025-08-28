"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Filter,
  Calendar,
  DollarSign,
  Leaf,
  Sparkles,
  List,
  User,
  Clock,
  CheckCircle,
  PackageCheck,
} from "lucide-react";

interface BouquetDetail {
  flower_id: number;
  flower_name: string;
  flower_color: string;
  flower_price: number;
  quantity: number;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  price: number;
  color: string;
  wrapping: string;
  cart_id: string;
  bouquet_details: BouquetDetail[];
}

type OrderStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "delivered"
  | "cancelled";

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

const AdminFinancePage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchAndSetOrders = async () => {
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

    fetchAndSetOrders();
    const interval = setInterval(fetchAndSetOrders, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (dateFrom || dateTo) {
        const orderDate = new Date(order.order_date);
        if (dateFrom && orderDate < new Date(dateFrom)) return false;
        if (dateTo && orderDate > new Date(dateTo + "T23:59:59")) return false;
      }
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const {
    totalRevenue,
    freshFlowerRevenue,
    velvetFlowerRevenue,
    freshFlowerSummary,
    velvetFlowerSummary,
    statusCounts,
    totalCustomers,
  } = useMemo(() => {
    let totalRevenue = 0;
    let freshFlowerRevenue = 0;
    let velvetFlowerRevenue = 0;
    const freshFlowers = new Map<string, { count: number }>();
    const velvetFlowers = new Map<string, { count: number }>();
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      delivered: 0,
      completed: 0,
    };
    const customerIds = new Set<string>();

    filteredOrders.forEach((order) => {
      if (order.status === "pending") statusCounts.pending++;
      if (order.status === "confirmed") statusCounts.confirmed++;
      if (order.status === "delivered") statusCounts.delivered++;
      if (order.status === "completed") statusCounts.completed++;
      customerIds.add(order.order_number);

      totalRevenue += Number(order.total_price);

      order.items.forEach((item) => {
        // ตรวจสอบประเภทสินค้าที่ชัดเจน
        const isFreshProduct =
          item.product_name.includes("ช่อดอกไม้สด") ||
          item.product_name.includes("ช่อลิลลี่");
        const isVelvetProduct =
          item.product_name.includes("ช่อกำมะหยี่") ||
          item.cart_id.includes("single");

        // คำนวณรายได้แต่ละประเภท และนับจำนวนดอกไม้

        const itemPrice = Number(item.price);
        if (isFreshProduct) {
          freshFlowerRevenue += itemPrice;
        } else if (isVelvetProduct) {
          velvetFlowerRevenue += itemPrice;
        }

        if (item.bouquet_details && item.bouquet_details.length > 0) {
          // ถ้ามีรายละเอียดดอกไม้ในช่อ ให้วนลูปนับจาก bouquet_details
          item.bouquet_details.forEach((flower) => {
            const currentFlowerName = flower.flower_name.trim();
            const quantity = flower.quantity;

            // ใช้ logic แยกประเภทจาก item หลัก
            if (isVelvetProduct) {
              const existingVelvet = velvetFlowers.get(currentFlowerName);
              if (existingVelvet) {
                existingVelvet.count += quantity;
              } else {
                velvetFlowers.set(currentFlowerName, { count: quantity });
              }
            } else {
              const existingFresh = freshFlowers.get(currentFlowerName);
              if (existingFresh) {
                existingFresh.count += quantity;
              } else {
                freshFlowers.set(currentFlowerName, { count: quantity });
              }
            }
          });
        } else {
          // ถ้าเป็นสินค้าเดี่ยว ให้ใช้ product_name และ wrapping เป็นจำนวน
          const flowerName = item.product_name.trim();
          const flowerCount = item.wrapping ? parseInt(item.wrapping, 10) : 1;

          if (isFreshProduct) {
            const existingFresh = freshFlowers.get(flowerName);
            if (existingFresh) {
              existingFresh.count += flowerCount;
            } else {
              freshFlowers.set(flowerName, { count: flowerCount });
            }
          } else if (isVelvetProduct) {
            const existingVelvet = velvetFlowers.get(flowerName);
            if (existingVelvet) {
              existingVelvet.count += flowerCount;
            } else {
              velvetFlowers.set(flowerName, { count: flowerCount });
            }
          }
        }
      });
    });

    const freshFlowerSummary = Array.from(freshFlowers.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);

    const velvetFlowerSummary = Array.from(velvetFlowers.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalRevenue,
      freshFlowerRevenue,
      velvetFlowerRevenue,
      freshFlowerSummary,
      velvetFlowerSummary,
      statusCounts,
      totalCustomers: customerIds.size,
    };
  }, [filteredOrders]);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH").format(price);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard pre-order
          </h1>
        </div>

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
          {showFilters && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {(dateFrom || dateTo) && (
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-full text-gray-600">
              <User size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">ส่งออเดอร์มาแล้ว</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCustomers} คน
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">ยืนยันสลิปแล้ว</p>
              <p className="text-2xl font-bold text-gray-900">
                {statusCounts.confirmed} ออร์เดอร์
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">ทำออเดอร์เสร็จแล้ว</p>
              <p className="text-2xl font-bold text-gray-900">
                {statusCounts.completed} ออร์เดอร์
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <PackageCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">มารับของแล้ว</p>
              <p className="text-2xl font-bold text-gray-900">
                {statusCounts.delivered} ออร์เดอร์
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  ภาพรวมยอดขาย
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ยอดขายรวมทั้งหมด</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ฿{formatPrice(totalRevenue)}
                    </p>
                  </div>
                </div>
                <div className="bg-lime-50 p-4 rounded-lg flex items-center gap-4">
                  <div className="p-3 bg-lime-100 rounded-full text-lime-600">
                    <Leaf size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ยอดขายดอกไม้สด</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ฿{formatPrice(freshFlowerRevenue)}
                    </p>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      ยอดขายดอกไม้กำมะหยี่
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ฿{formatPrice(velvetFlowerRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  รายการดอกไม้รวม
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  รวมจำนวนดอกไม้ที่ต้องใช้ทั้งหมด
                </p>
              </div>
              <div className="p-6">
                {/* Fresh Flower List */}
                <h3 className="flex items-center gap-2 text-lg font-medium text-gray-800 mb-3">
                  <Leaf size={20} className="text-lime-500" />
                  ดอกไม้สด
                </h3>
                {freshFlowerSummary.length > 0 ? (
                  <ul className="space-y-3 mb-6">
                    {freshFlowerSummary.map((flower, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-700 font-medium">
                          {flower.name}
                        </span>
                        <span className="font-bold text-lg text-gray-900">
                          {flower.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <List size={40} className="mx-auto mb-2 text-gray-300" />
                    <p>ไม่มีรายการดอกไม้สด</p>
                  </div>
                )}

                {/* Velvet Flower List */}
                <h3 className="flex items-center gap-2 text-lg font-medium text-gray-800 mb-3 mt-6 border-t pt-6 border-gray-200">
                  <Sparkles size={20} className="text-purple-500" />
                  ดอกไม้กำมะหยี่
                </h3>
                {velvetFlowerSummary.length > 0 ? (
                  <ul className="space-y-3">
                    {velvetFlowerSummary.map((flower, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-700 font-medium">
                          {flower.name}
                        </span>
                        <span className="font-bold text-lg text-gray-900">
                          {flower.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <List size={40} className="mx-auto mb-2 text-gray-300" />
                    <p>ไม่มีรายการดอกไม้กำมะหยี่</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinancePage;
