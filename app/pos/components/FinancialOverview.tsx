// app/components/FinancialOverview.tsx

import React, { useMemo } from "react";
import { BarChart2 } from "lucide-react";

interface FinancialData {
  product_id: number;
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
}

const FinancialOverview = ({ data }: { data: FinancialData[] }) => {
  const totalRevenue = useMemo(() => {
    return data.reduce((sum, item) => sum + Number(item.total_revenue), 0);
  }, [data]);

  const totalItemsSold = useMemo(() => {
    return data.reduce(
      (sum, item) => sum + Number(item.total_quantity_sold),
      0
    );
  }, [data]);

  const totalProfit = useMemo(() => {
    return (
      data.reduce((sum, item) => sum + Number(item.total_revenue), 0) - 59712
    );
  }, [data]);

  const remain = 2000 - totalItemsSold;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
        <BarChart2 size={20} className="mr-2" /> ภาพรวมการเงิน
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
          <p className="text-sm font-medium text-blue-800">ยอดขายรวม</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-1">
            ฿{totalRevenue}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
          <p className="text-sm font-medium text-blue-800">กำไรรวม</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-1">
            ฿{totalProfit.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
          <p className="text-sm font-medium text-green-800">
            รวมจำนวนสินค้าที่ขาย
          </p>
          <p className="text-3xl font-extrabold text-green-600 mt-1">
            {totalItemsSold} ชิ้น
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
          <p className="text-sm font-medium text-green-800">
            รวมจำนวนสินค้าที่เหลือ
          </p>
          <p className="text-3xl font-extrabold text-green-600 mt-1">
            {remain} ชิ้น
          </p>
        </div>
      </div>

      <h4 className="text-lg font-semibold mt-6 mb-3 border-b pb-2">
        ยอดขายรายสินค้า
      </h4>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สินค้า
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                จำนวนที่ขาย
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                รายได้รวม
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.product_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.product_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.total_quantity_sold} ชิ้น
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  ฿{item.total_revenue}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-500">
                  ยังไม่มีข้อมูลการขาย
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialOverview;
