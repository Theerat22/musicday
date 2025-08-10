"use client";

import { useState } from "react";
import { X, Upload, Check } from "lucide-react";
import Image from "next/image";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  color: string;
  wrapping: string;
  cartId: string;
}

interface OrderFormData {
  firstName: string;
  lastName: string;
  nickname: string;
  grade: string;
  slipImage: File | null;
}

interface OrderFormProps {
  show: boolean;
  onClose: () => void;
  cart: CartItem[];
  totalPrice: number;
  onSuccess: () => void;
}

export default function OrderForm({
  show,
  onClose,
  cart,
  totalPrice,
  onSuccess,
}: OrderFormProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    firstName: "",
    lastName: "",
    nickname: "",
    grade: "",
    slipImage: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  if (!show) return null;

  const handleFormChange = (
    field: keyof OrderFormData,
    value: string | File | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFormChange("slipImage", file);
  };

  const handleSubmitOrder = async () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.nickname ||
      !formData.grade ||
      !formData.slipImage
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);

    try {
      // สร้าง FormData สำหรับส่งไฟล์
      const formDataToSend = new FormData();
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("nickname", formData.nickname);
      formDataToSend.append("grade", formData.grade);
      formDataToSend.append("slipImage", formData.slipImage);
      formDataToSend.append("cart", JSON.stringify(cart));
      formDataToSend.append("totalPrice", totalPrice.toString());
      formDataToSend.append("orderDate", new Date().toISOString());

      console.log(formDataToSend);

      // ส่งข้อมูลไปยัง API
      const response = await fetch("/api/orders", {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        setOrderSuccess(true);
        console.log("Order submitted successfully:", result);


        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          nickname: "",
          grade: "",
          slipImage: null,
        });

        // แสดงข้อความสำเร็จ
        setTimeout(() => {
          onSuccess();
          onClose();
          setOrderSuccess(false);
        }, 3000);
      } else {
        throw new Error("Failed to submit order");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("เกิดข้อผิดพลาดในการส่งคำสั่งซื้อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // QR Code component (placeholder - ใช้ QR code จริงของคุณ)
  const QRCodeDisplay = () => (
    <div className="bg-gray-50 p-6 rounded-lg text-center mb-6">
      <h4 className="text-lg font-medium mb-4 text-black">
        สแกน QR Code เพื่อชำระเงิน
      </h4>
      <div className="flex flex-col items-center justify-center">
        <Image src="/qr-promptpay.JPG" alt="QR Code" width={200} height={200} />
      </div>
      <p className="text-sm text-gray-600 mt-4">
        ยอดรวม: <span className="font-bold">฿{totalPrice.toLocaleString("th-TH")}</span>
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-black">ข้อมูลการสั่งซื้อ</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {orderSuccess ? (
            <div className="text-center py-8">
              <Check size={64} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-green-600 mb-2">
                สั่งซื้อสำเร็จ
              </h3>
              <p className="text-gray-600">ขอบคุณสำหรับการสั่งซื้อ</p>
            </div>
          ) : (
            <>
              {/* QR Code Section */}
              <QRCodeDisplay />

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อ *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleFormChange("firstName", e.target.value)
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-black focus:outline-none"
                      placeholder="กรอกชื่อ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      นามสกุล *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleFormChange("lastName", e.target.value)
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-black focus:outline-none"
                      placeholder="กรอกนามสกุล"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อเล่น *
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) =>
                      handleFormChange("nickname", e.target.value)
                    }
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-black focus:outline-none"
                    placeholder="กรอกชื่อเล่น"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชั้น *
                  </label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(e) => handleFormChange("grade", e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-black focus:outline-none"
                    placeholder="เช่น ม.4/1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    อัปโหลดสลิปการโอนเงิน *
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="slip-upload"
                    />
                    <label htmlFor="slip-upload" className="cursor-pointer">
                      <Upload
                        size={32}
                        className="mx-auto text-gray-400 mb-2"
                      />
                      <p className="text-gray-600">
                        {formData.slipImage
                          ? formData.slipImage.name
                          : "คลิกเพื่อเลือกไฟล์สลิป"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        รองรับไฟล์ JPG, PNG
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full bg-blue-950 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-6"
              >
                {isSubmitting ? "กำลังส่ง..." : "ส่งคำสั่งซื้อ"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
