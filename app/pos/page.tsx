// app/components/AdminPOSPage.tsx (หรือ app/admin/pos/page.tsx)

"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Package, BarChart2 } from "lucide-react";
import POSEntry from "./components/POSEnty";
import StockManagement from "./components/StockManagement";
import FinancialOverview from "./components/FinancialOverview";

// --- INTERFACES ---
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  stock_quantity: number;
}

interface FinancialData {
  product_id: number;
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
}
// -----------------

const AdminPOSPage = () => {
  const [activeTab, setActiveTab] = useState<
    "pos" | "stock" | "financial"
  >("pos");
  const [products, setProducts] = useState<Product[]>([]);
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch products and their stock
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/pos/products");
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }, []);

  // Function to fetch financial overview data
  const fetchFinancialData = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/pos/financial");
      const data: FinancialData[] = await response.json();
      setFinancialData(data);
    } catch (error) {
      console.error("Failed to fetch financial data:", error);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchProducts();
    // Fetch financial data only when needed, or on first load
    if (activeTab === "financial" || financialData.length === 0) {
      fetchFinancialData();
    }
    setIsLoading(false);
  }, [activeTab, fetchProducts, fetchFinancialData, financialData.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabStyle =
    "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        ระบบจัดการ POS และสต็อก
      </h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("pos")}
            className={`${tabStyle} ${
              activeTab === "pos"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ShoppingCart size={16} className="inline mr-1" /> บันทึกการขาย (POS)
          </button>
          <button
            onClick={() => setActiveTab("stock")}
            className={`${tabStyle} ${
              activeTab === "stock"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Package size={16} className="inline mr-1" /> จัดการสต็อก
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`${tabStyle} ${
              activeTab === "financial"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <BarChart2 size={16} className="inline mr-1" /> ภาพรวมการเงิน
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === "pos" && (
          <POSEntry products={products} refreshData={fetchProducts} />
        )}
        {activeTab === "stock" && (
          <StockManagement stockData={products} fetchProducts={fetchProducts} />
        )}
        {activeTab === "financial" && <FinancialOverview data={financialData} />}
      </div>
    </div>
  );
};

export default AdminPOSPage;