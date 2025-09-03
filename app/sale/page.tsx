"use client";

import React, { useState, useEffect } from "react";
import SalesChart from "./components/SaleChart";
import RecentOrders from "./components/RecentOrders";
import FinancialOverview from "../pos/components/FinancialOverview";
import { RefreshCcw } from "lucide-react";

interface FinancialData {
  product_id: number;
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
}

export default function DashboardPage() {
  const [financialData, setFinancialData] = useState<FinancialData[] | null>(
    null
  );
  const [isLoadingFinancial, setIsLoadingFinancial] = useState<boolean>(true);
  const [financialError, setFinancialError] = useState<string | null>(null);

  const fetchFinancialData = async () => {
    setIsLoadingFinancial(true);
    setFinancialError(null);
    try {
      const response = await fetch("/api/admin/pos/financial");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const jsonData = await response.json();
      setFinancialData(jsonData);
    } catch (err) {
      console.error("Failed to fetch financial data:", err);
      setFinancialError("เกิดข้อผิดพลาดในการดึงข้อมูลภาพรวมการเงิน");
    } finally {
      setIsLoadingFinancial(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Financial Dashboard Music Day 2025
        </h1>
        <button
          onClick={fetchFinancialData}
          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <RefreshCcw size={16} className="mr-1" /> รีเฟรชข้อมูล
        </button>
      </div>

      {isLoadingFinancial && (
        <div className="text-center text-gray-500">กำลังโหลดข้อมูล...</div>
      )}
      {financialError && (
        <div className="text-center text-red-500">{financialError}</div>
      )}

      {financialData && <FinancialOverview data={financialData} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="lg:col-span-1">
          <RecentOrders />
        </div>
      </div>
    </div>
  );
}
