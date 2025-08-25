// app/components/StockManagement.tsx

"use client";
import React, { useState, useEffect } from "react";
import { Package } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  stock_quantity: number;
}

interface StockUpdate {
  product_id: number;
  name: string;
  stock_quantity: number;
  new_quantity: number;
  isUpdating: boolean;
}

const StockManagement = ({
  stockData: initialStockData,
  fetchProducts,
}: {
  stockData: Product[];
  fetchProducts: () => void;
}) => {
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);

  // Sync initial data when parent's data changes
  useEffect(() => {
    setStockUpdates(
      initialStockData.map((p) => {
        const existing = stockUpdates.find((s) => s.product_id === p.id);
        return {
          product_id: p.id,
          name: p.name,
          stock_quantity: p.stock_quantity,
          new_quantity: existing ? existing.new_quantity : p.stock_quantity,
          isUpdating: false,
        };
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStockData]);

  const handleInputChange = (id: number, value: string) => {
    const qty = parseInt(value);
    setStockUpdates((prev) =>
      prev.map((item) =>
        item.product_id === id
          ? { ...item, new_quantity: isNaN(qty) ? 0 : qty }
          : item
      )
    );
  };

  const updateStock = async (item: StockUpdate) => {
    if (item.new_quantity < 0) {
      alert("จำนวนสต็อกใหม่ต้องไม่เป็นค่าลบ!");
      return;
    }

    setStockUpdates((prev) =>
      prev.map((i) =>
        i.product_id === item.product_id ? { ...i, isUpdating: true } : i
      )
    );

    try {
      const response = await fetch(`/api/admin/pos/products/${item.product_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", quantity: item.new_quantity }),
      });

      if (!response.ok) {
        throw new Error("Failed to update stock.");
      }

      alert(`อัปเดตสต็อก ${item.name} เป็น ${item.new_quantity} สำเร็จ`);
      fetchProducts(); // Refresh data in parent component
    } catch (error) {
      console.error("Stock update error:", error);
      alert("อัปเดตสต็อกไม่สำเร็จ: " + (error as Error).message);
    } finally {
      setStockUpdates((prev) =>
        prev.map((i) =>
          i.product_id === item.product_id ? { ...i, isUpdating: false } : i
        )
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
        <Package size={20} className="mr-2" /> จัดการสต็อกสินค้า
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สินค้า
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สต็อกปัจจุบัน
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                จำนวนใหม่
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                ดำเนินการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stockUpdates.map((item) => (
              <tr key={item.product_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.stock_quantity} ชิ้น
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <input
                    type="number"
                    min="0"
                    value={item.new_quantity}
                    onChange={(e) => handleInputChange(item.product_id, e.target.value)}
                    className="w-24 p-1 border border-gray-300 rounded-lg text-center"
                    disabled={item.isUpdating}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => updateStock(item)}
                    disabled={item.isUpdating || item.new_quantity === item.stock_quantity}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {item.isUpdating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                    ) : (
                      "บันทึก"
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockManagement;