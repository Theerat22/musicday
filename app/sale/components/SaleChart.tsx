'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

const colors = ['#8884d8', '#82ca9d', '#ffc658', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];

const SalesChart = () => {
  const [data, setData] = useState<Record<string, Record<string, number>> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/pos/sales-data');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const jsonData: Record<string, Record<string, number>> = await response.json();
        setData(jsonData);
      } catch (err) {
        console.error("Failed to fetch sales data:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูลกราฟ");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSalesData();
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    return Object.keys(data).map(date => ({
      date,
      ...data[date]
    }));
  }, [data]);

  const productNames = useMemo(() => {
    if (!data) return [];
    const allNames = new Set<string>();
    Object.values(data).forEach(dayData => {
      Object.keys(dayData).forEach(productName => allNames.add(productName));
    });
    return Array.from(allNames);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-white rounded-lg shadow-lg">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8 bg-white rounded-lg shadow-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-96">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">ยอดขายรายวัน (แยกตามสินค้า)</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {productNames.map((product, index) => (
            <Line
              key={product}
              type="monotone"
              dataKey={product}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;