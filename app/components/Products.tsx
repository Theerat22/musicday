"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ShoppingCart } from "lucide-react";
import OrderForm from "./OrderForm";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface CartItem extends Product {
  color: string;
  wrapping: string;
  cartId: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedWrapping, setSelectedWrapping] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/fetchProducts");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const colors = [
    "ชมพู",
    "ม่วง",
    "ชมพู+แดง",
    "ชมพู+เหลือง",
    "ชมพู+ม่วง",
    "ม่วง+เหลือง",
  ];

  const wrappings = ["ชมพู", "ขาวครีม", "น้ำตาล"];

  const handleAddClick = (product: Product) => {
    setSelectedProduct(product);
    setSelectedColor("");
    setSelectedWrapping("");
    setShowModal(true);
  };

  const handleAddToCart = () => {
    if (selectedProduct && selectedColor && selectedWrapping) {
      const cartItem: CartItem = {
        ...selectedProduct,
        color: selectedColor,
        wrapping: selectedWrapping,
        cartId: `${selectedProduct.id}-${Date.now()}`,
      };

      setCart((prev) => [...prev, cartItem]);
      setShowModal(false);
      setSelectedProduct(null);
      setSelectedColor("");
      setSelectedWrapping("");
    }
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + Number(item.price), 0);
  };

  const handleOrderClick = () => {
    setShowCart(false);
    setShowOrderForm(true);
  };

  const handleOrderSuccess = () => {
    setCart([]);
    setShowOrderForm(false);
  };

  //   console.log(getTotalPrice());
  return (
    <div className="min-h-screen bg-white p-6 mt-1">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-800 ">
            Pre-order ดอกไม้
          </h1>
          <p className="m-2 text-lg ">Music Day 2025</p>
          <div className="w-16 h-1 rounded-2xl bg-yellow-400 mx-auto"></div>
        </div>

        <OrderForm
          show={showOrderForm}
          onClose={() => setShowOrderForm(false)}
          cart={cart}
          totalPrice={getTotalPrice()}
          onSuccess={handleOrderSuccess}
        />

        {showCart && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-end z-50">
            <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
              <div className="p-6 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl  text-black">ตะกร้าสินค้า</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <p className="text-gray-500">ไม่มีสินค้าในตะกร้า</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => (
                        <div
                          key={item.cartId}
                          className="bg-gray-50 rounded-lg p-4 border"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-black">
                              {item.name}
                            </h3>
                            <button
                              onClick={() => removeFromCart(item.cartId)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            สี: {item.color}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            กระดาษห่อ: {item.wrapping}
                          </p>
                          <p className="font-bold text-black">
                            ฿{item.price.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-medium">รวม</span>
                        <span className="text-2xl font-bold text-black">
                          ฿{getTotalPrice().toLocaleString("th-TH")}
                        </span>
                      </div>
                      <button
                        className="w-full bg-black text-white py-4 rounded-lg font-medium text-lg hover:bg-gray-800 transition-colors"
                        onClick={handleOrderClick}
                      >
                        สั่งซื้อ
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gray-50 flex items-center justify-center p-4">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="object-cover w-full h-full rounded-md"
                />
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="text-xl font-light text-slate-700 mb-4">
                  {product.price}฿
                </div>

                {/* Button */}
                <button
                  className="w-full bg-blue-900 text-white py-3 px-4 rounded-md font-bold"
                  onClick={() => handleAddClick(product)}
                >
                  เพิ่ม
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowCart(!showCart)}
          className="bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all transform hover:scale-105 relative"
        >
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {cart.length}
            </div>
          )}
        </button>
      </div>

      {showModal && selectedProduct && (
        <section className="fixed inset-0 z-50 overflow-y-auto bg-white bg-opacity-60">
          <div className="min-h-full flex items-start justify-center p-4 py-12">
            <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-200 relative my-8">
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-sm z-10 transition-colors"
              >
                <X size={20} />
              </button>

              {/* Product Image Section */}
              <div className="bg-gray-50 p-8 text-center border-b">
                <h3 className="text-xl font-medium text-slate-800 mb-1">
                  {selectedProduct.name}
                </h3>
                <p className="text-2xl font-bold text-black">
                  ฿{selectedProduct.price.toLocaleString()}
                </p>
              </div>

              <div className="p-8">
                {/* Color Selection */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-black mb-4 tracking-wide">
                    สี
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {colors.map((color) => (
                      <label
                        key={color}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                          selectedColor === color
                            ? "border-black bg-gray-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="color"
                          value={color}
                          checked={selectedColor === color}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                            selectedColor === color
                              ? "border-black"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedColor === color && (
                            <div className="w-2 h-2 bg-black rounded-full"></div>
                          )}
                        </div>
                        <span className="text-slate-700 font-medium">
                          {color}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Wrapping Selection */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-black mb-4 tracking-wide">
                    กระดาษห่อ
                  </h4>
                  <div className="space-y-3">
                    {wrappings.map((wrapping) => (
                      <label
                        key={wrapping}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                          selectedWrapping === wrapping
                            ? "border-black bg-gray-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="wrapping"
                          value={wrapping}
                          checked={selectedWrapping === wrapping}
                          onChange={(e) => setSelectedWrapping(e.target.value)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                            selectedWrapping === wrapping
                              ? "border-black"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedWrapping === wrapping && (
                            <div className="w-2 h-2 bg-black rounded-full"></div>
                          )}
                        </div>
                        <span className="text-slate-700 font-medium">
                          {wrapping}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedColor || !selectedWrapping}
                  className="w-full bg-black text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  เพิ่มลงในตะกร้า
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
