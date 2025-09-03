'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import EditOrderModal from './EditOrderModal';
import type { Order } from '@/app/api/admin/pos/orders/route';
const RecentOrders = () => {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/pos/orders');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const jsonData: Order[] = await response.json();
      setOrders(jsonData);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("เกิดข้อผิดพลาดในการโหลดออเดอร์");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Refetch every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (orderId: number) => {
    setMessage("คุณต้องการลบออเดอร์นี้หรือไม่? ");
    const confirmed = window.confirm("คุณต้องการลบออเดอร์นี้หรือไม่?");
    if (confirmed) {
      try {
        const response = await fetch('/api/orders', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: orderId }),
        });
        if (!response.ok) {
          throw new Error('Failed to delete order');
        }
        setMessage("ลบออเดอร์สำเร็จ");
        fetchOrders();
      } catch (err) {
        setMessage("เกิดข้อผิดพลาดในการลบออเดอร์");
        console.error(err);
      }
    }
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    fetchOrders(); // Refetch orders after modal is closed
  };

  if (isLoading) {
    return <div className="text-center text-gray-500 p-6 bg-white rounded-lg shadow-lg">กำลังโหลดออเดอร์...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-6 bg-white rounded-lg shadow-lg">{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">คำสั่งซื้อล่าสุด</h3>
      {message && (
        <div className={`p-4 mb-4 rounded-md text-sm font-medium ${message.includes("เกิดข้อผิดพลาด") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายการ</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดรวม</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders?.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.product_names}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  ฿{order.total_amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(order)} className="text-blue-600 hover:text-blue-900 mr-2">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditOrderModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        order={selectedOrder}
      />
    </div>
  );
};

export default RecentOrders;