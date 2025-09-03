'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import type { Order } from '@/app/api/admin/pos/orders/route';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const EditOrderModal = ({ isOpen, onClose, order }: EditOrderModalProps) => {
  const [formData, setFormData] = useState({
    total_amount: '',
    payment_method: '',
    note: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setFormData({
        total_amount: order.total_amount.toString(),
        payment_method: order.payment_method,
        note: order.note || '',
      });
      setMessage(null);
    }
  }, [order]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!order) return;

    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: order.id,
          ...formData
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update order');
      }
      setMessage('ออเดอร์ได้รับการอัปเดตเรียบร้อยแล้ว');
      onClose();
    } catch (err) {
      setMessage('เกิดข้อผิดพลาดในการอัปเดตออเดอร์');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog as="div" className="relative z-10" open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
            แก้ไขคำสั่งซื้อ #{order?.id}
          </Dialog.Title>
          {message && (
            <div className={`mt-2 p-3 rounded-md text-sm font-medium ${message.includes("เกิดข้อผิดพลาด") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700">ยอดรวม</label>
              <input
                type="number"
                id="total_amount"
                name="total_amount"
                value={formData.total_amount}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">วิธีชำระเงิน</label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="cash">เงินสด</option>
                <option value="transfer">โอน</option>
                <option value="credit">เครดิต</option>
              </select>
            </div>
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">หมายเหตุ</label>
              <input
                type="text"
                id="note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                disabled={isSaving}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditOrderModal;