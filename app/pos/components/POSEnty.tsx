// app/components/POSEntry.tsx

"use client";
import React, { useState, useMemo } from "react";
import { ShoppingCart, LayoutGrid, DollarSign, Plus, Minus, Trash2 } from "lucide-react";
import Image from "next/image";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  stock_quantity: number;
}

interface CartItem extends Product {
  cart_quantity: number;
}

const POSEntry = ({ products, refreshData }: { products: Product[], refreshData: () => void }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.price * item.cart_quantity,
      0
    );
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.cart_quantity >= existingItem.stock_quantity) {
          alert("สินค้าหมดสต็อก!");
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, cart_quantity: item.cart_quantity + 1 }
            : item
        );
      }
      if (product.stock_quantity > 0) {
        return [...prev, { ...product, cart_quantity: 1 }];
      }
      return prev; // Do nothing if stock is zero
    });
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart((prev) => {
      const updatedCart = prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.cart_quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.stock_quantity) {
              alert("สินค้าในสต็อกไม่พอ!");
              return item;
            }
            return { ...item, cart_quantity: newQty };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
      return updatedCart;
    });
  };

  const checkout = async () => {
    if (cart.length === 0 || isProcessing) return;

    if (!confirm(`ยืนยันการทำรายการ?\nยอดรวม: ฿${totalAmount.toFixed(2)}`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/admin/pos/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart,
          payment_method: paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process transaction.");
      }

      alert("บันทึกการขายสำเร็จ!");
      setCart([]);
      refreshData(); // Refresh product data (to update stock display)
    } catch (error) {
      console.error("Checkout error:", error);
      alert("บันทึกการขายไม่สำเร็จ: " + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product List */}
      <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm h-[700px] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
          <LayoutGrid size={20} className="mr-2" /> รายการสินค้า ({products.length})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className={`bg-gray-50 border border-gray-200 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer relative ${
                product.stock_quantity <= 0
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
            >
              <div className="relative w-full h-24 mb-2 rounded-md overflow-hidden">
                <Image
                  src={product.image || "/placeholder-product.png"}
                  alt={product.name}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <h4 className="font-medium text-sm truncate">{product.name}</h4>
              <p className="text-xs text-gray-600">
                ฿{product.price}
              </p>
              <p className={`text-xs font-bold ${product.stock_quantity <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                Stock: <span className="text-xs">{product.stock_quantity}</span>
              </p>
              {product.stock_quantity <= 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-0.5 rounded-bl-lg">
                  หมด
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cart/Checkout */}
      <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg flex flex-col h-[700px]">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
          <ShoppingCart size={20} className="mr-2" /> ตะกร้าสินค้า
        </h3>
        <div className="flex-grow space-y-3 overflow-y-auto pr-2">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <p>ไม่มีสินค้าในตะกร้า</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-600">
                    ฿{(item.price * item.cart_quantity).toFixed(2)} (฿
                    {item.price}/ชิ้น)
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateCartQuantity(item.id, -1)}
                    className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-semibold w-6 text-center text-sm">
                    {item.cart_quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.id, 1)}
                    className="p-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                    disabled={item.cart_quantity >= item.stock_quantity}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วิธีการชำระเงิน
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="cash">เงินสด</option>
              <option value="transfer">โอนเงิน</option>
              <option value="credit">บัตรเครดิต</option>
            </select>
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold text-gray-800">ยอดรวมสุทธิ:</span>
            <span className="text-2xl font-extrabold text-blue-600">
              ฿{totalAmount.toFixed(2)}
            </span>
          </div>
          <button
            onClick={checkout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b border-white"></div>
            ) : (
              <>
                <DollarSign size={20} className="mr-2" />
                ชำระเงิน
              </>
            )}
          </button>
          <button
            onClick={() => setCart([])}
            className="w-full mt-2 py-2 text-sm text-red-600 hover:text-red-700"
            disabled={isProcessing}
          >
            <Trash2 size={16} className="inline mr-1" /> ล้างตะกร้า
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSEntry;