// components/OrderForm.tsx
"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import { X, Upload, Check, Loader2 } from "lucide-react";
import Image from "next/image";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
  option: string; // ใช้สำหรับระบุไซส์ (เสื้อ) หรือ N/A
  quantity: number;
  cartId: string;
  category: "bag" | "keychain" | "shirt" | "other"; 
}

interface OrderFormData {
  firstName: string;
  lastName: string;
  nickname: string;
  grade: string;
  number: string;
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
    number: "",
    slipImage: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const handleFormChange = useCallback(
    (field: keyof OrderFormData, value: string | File | null) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      handleFormChange("slipImage", file);
    },
    [handleFormChange]
  );

  const handleSubmitOrder = useCallback(async () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.nickname ||
      !formData.grade ||
      !formData.number ||
      !formData.slipImage
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);
    console.log(formData)
    console.log(cart)
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("nickname", formData.nickname);
      formDataToSend.append("grade", formData.grade);
      formDataToSend.append("number", formData.number);
      formDataToSend.append("slipImage", formData.slipImage);
      formDataToSend.append("cart", JSON.stringify(cart));
      formDataToSend.append("totalPrice", totalPrice.toString());
      formDataToSend.append("orderDate", new Date().toISOString());

      const response = await fetch("/api/orders", {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        setOrderSuccess(true);
        console.log("Order submitted successfully:", result);


        // try {
        //   const emailResponse = await fetch("/api/send-email", {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify({
        //       firstName: formData.firstName,
        //       lastName: formData.lastName,
        //       nickname: formData.nickname,
        //       grade: formData.grade,
        //       cart: cart,
        //       totalPrice: totalPrice,
        //       number: formData.number,
        //     }),
        //   });

        //   if (emailResponse.ok) {
        //     console.log("Email sent successfully!");
        //   } else {
        //     console.error("Failed to send email.");
        //   }
        // } catch (emailError) {
        //   console.error("Error sending email:", emailError);
        // }

        setFormData({
          firstName: "",
          lastName: "",
          nickname: "",
          grade: "",
          number: "",
          slipImage: null,
        });

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
  }, [formData, cart, totalPrice, onSuccess, onClose]);

  const generateQR = async (totalPrice: number) => {
    setQrCodeUrl("");
    setIsGeneratingQR(true);
    try {
      console.log(totalPrice);
      const res = await fetch("/api/qr-promptpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalPrice }),
      });

      const data = await res.json();

      if (data.qrCodeDataUrl) {
        setQrCodeUrl(data.qrCodeDataUrl);
      } else {
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  useEffect(() => {
    generateQR(totalPrice);
  }, [totalPrice]);

  const QRCodeDisplay = useMemo(
    () => (
      <div className="bg-gray-50 p-6 rounded-lg text-center mb-6">
        <h4 className="text-lg font-medium mb-3 text-black">
          สแกน QR Code เพื่อชำระเงิน
        </h4>
        <div className="flex flex-col items-center justify-center">
          <div className="w-[200px] h-[200px] bg-gray-200 flex items-center justify-center">
            {isGeneratingQR ? (
              <div className="flex flex-col items-center">
                <Loader2
                  className="animate-spin text-gray-400 mb-2"
                  size={32}
                />
                <p className="text-gray-500 text-sm">กำลังสร้าง QR Code...</p>
              </div>
            ) : qrCodeUrl ? (
              <Image
                src={qrCodeUrl}
                alt="QR Code"
                width={200}
                height={200}
                className="object-contain"
              />
            ) : (
              <div className="text-gray-500 text-sm">
                ไม่สามารถโหลด QR Code ได้
              </div>
            )}
          </div>
        </div>
        <p className="text-lg text-gray-600 mt-2">
          ชื่อบัญชี :{" "}
          <span className="font-bold">น.ส.สุภณี ซะโยะโกะ แสนสุข</span>
        </p>
        <p className="text-lg text-gray-600 ">
          ยอดรวม:{" "}
          <span className="font-bold">
            ฿{totalPrice.toLocaleString("th-TH")}
          </span>
        </p>
      </div>
    ),
    [qrCodeUrl, totalPrice, isGeneratingQR]
  );

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 p-6 border-b bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-black">ข้อมูลการสั่งซื้อ</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
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
              {QRCodeDisplay}

              <div className="space-y-4 text-start">
                <div className="grid grid-cols-2 gap-4 text-start">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleFormChange("firstName", e.target.value)
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="กรอกชื่อ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleFormChange("lastName", e.target.value)
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="กรอกนามสกุล"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-start font-medium text-gray-700 mb-2">
                    ชื่อเล่น <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) =>
                      handleFormChange("nickname", e.target.value)
                    }
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="กรอกชื่อเล่น"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชั้น <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) =>
                        handleFormChange("grade", e.target.value)
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="เช่น 6/1 (ไม่มีให้ -)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เลขประจำตัว (4 หลัก)  <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) =>
                        handleFormChange("number", e.target.value)
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="เช่น 5830 (ไม่มีให้ -)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    อัปโหลดสลิปการโอนเงิน <span className="text-red-500">*</span>
                  </label>
                  {formData.slipImage ? (
                    <div className="relative border-2 border-solid border-gray-300 rounded-lg overflow-hidden">
                      <Image
                        src={URL.createObjectURL(formData.slipImage)}
                        alt="Payment Slip Preview"
                        className="w-full h-48 object-cover"
                        width={150}
                        height={150}
                      />
                      <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-2">
                        <button
                          type="button"
                          onClick={() => handleFormChange("slipImage", null)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
                        <p className="text-sm truncate">
                          {formData.slipImage.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors min-h-[120px] flex flex-col justify-center">
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
                        <p className="text-gray-600">คลิกเพื่อเลือกไฟล์สลิป</p>
                        <p className="text-xs text-gray-500 mt-1">
                          รองรับไฟล์ JPG, PNG
                        </p>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full bg-blue-950 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-6"
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