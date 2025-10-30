"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ShoppingCart } from "lucide-react";
import OrderForm from "./OrderForm";

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: "bag" | "keychain" | "shirt" | "other";
}

interface CartItem extends Product {
  option: string;
  quantity: number;
  cartId: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const category = [
    { key: "keychain", label: "พวงกุญแจ" },
    { key: "sticker", label: "สติกเกอร์" },
    // { key: "shirt", label: "เสื้อ" },
  ];

  const keychain = [
    {
      title: "นกยูง",
      image:
        "https://res.cloudinary.com/dbasoxt2o/image/upload/v1760114658/IMG_7119_ys1sqv.jpg",
    },
    {
      title: "อีกา",
      image:
        "https://res.cloudinary.com/dbasoxt2o/image/upload/v1760114658/IMG_7119_ys1sqv.jpg",
    },
    {
      title: "วัว",
      image:
        "https://res.cloudinary.com/dbasoxt2o/image/upload/v1760114658/IMG_7119_ys1sqv.jpg",
    },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/fetchProducts");
        const data = await response.json();
        setProducts(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setIsLoading(false);
      }

      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  const shirtSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

  const handleAddClick = (product: Product) => {
    setSelectedProduct(product);
    setSelectedOption(
      product.category === "shirt" || product.id === 7 ? "" : "N/A"
    ); // Require size selection for shirt
    setQuantity(1);
    setShowModal(true);
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      if (selectedProduct.category === "shirt" && !selectedOption) {
        alert("กรุณาเลือกไซส์เสื้อ");
        return;
      }

      if (selectedProduct.id === 7 && !selectedOption) {
        alert("กรุณาเลือกลายพวงกุญแจ");
        return;
      }

      const itemOption =
        selectedProduct.category === "shirt" || selectedProduct.id === 7
          ? selectedOption
          : "N/A";

      const cartItem: CartItem = {
        ...selectedProduct,
        option: itemOption,
        quantity: quantity,
        cartId: `${selectedProduct.id}-${itemOption}-${Date.now()}`,
      };

      setCart((prev) => [...prev, cartItem]);
      setShowModal(false);
      setSelectedProduct(null);
      setSelectedOption("");
      setQuantity(1);
    }
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleOrderClick = () => {
    setShowCart(false);
    setShowOrderForm(true);
  };

  const handleOrderSuccess = () => {
    setCart([]);
    setShowOrderForm(false);
  };

  const handleQuantityChange = (type: "increment" | "decrement") => {
    if (type === "increment") {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrement" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 mt-1">
      <div className="max-w-6xl mx-auto">
        {/* Header Mobile View */}
        <div className="flex flex-row mb-7 items-start lg:hidden">
          <div className="h-16 w-1 bg-yellow-400"></div>
          <div className="text-start ml-3">
            <h1 className="text-slate-900 font-bold text-2xl ">
              CD56 Products
            </h1>
            <p className="text-gray-600 mt-1 text-lg">
              ผลิตภัณฑ์จากนักเรียนจิตรลดารุ่น 56
            </p>
          </div>
        </div>

        {/* Header Laptop View */}
        <div className="hidden flex-col justify-center items-center text-center mb-7 lg:block">
          <div className="text-center ml-3 mb-3.5">
            <h1 className="text-slate-900 font-bold text-3xl ">
              CD56 Products
            </h1>
            <p className="text-gray-600 mt-1 text-lg">
              ผลิตภัณฑ์จากนักเรียนจิตรลดารุ่น 56
            </p>
          </div>
          <div className="w-32 h-1 bg-yellow-400 mx-auto"></div>
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
            <div className="bg-white w-full sm:max-w-xs md:max-w-md lg:max-w-lg h-full overflow-y-auto shadow-2xl">
              <div className="p-6 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-black">ตะกร้าสินค้า</h2>
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
                          className="bg-gray-50 rounded-lg p-4 border text-start"
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
                          {item.category === "shirt" && (
                            <p className="text-sm text-gray-600 mb-1">
                              ไซส์: {item.option}
                            </p>
                          )}
                          {item.id === 7 && (
                            <p className="text-sm text-gray-600 mb-1">
                              ลาย: {item.option}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mb-2">
                            จำนวน: {item.quantity}
                          </p>
                          <p className="font-bold text-black">
                            ฿{(item.price * item.quantity).toLocaleString()}
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
                        disabled={cart.length === 0}
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

        {category.map((category) => (
          <div key={category.key} className="mb-8">
            <h2 className="text-xl font-bold text-start text-blue-900 mb-4 ml-1 lg:text-2xl">
              {category.label}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products
                .filter((product) => product.category === category.key)
                .map((product) => (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm"
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-gray-50 flex items-center justify-center p-2 sm:p-4">
                      {/* ปรับ Padding ของ Image Box */}
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="object-cover w-full h-full rounded-md"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="p-4 md:p-6">
                      <h3 className="text-base sm:text-lg font-medium text-slate-800 mb-2">
                        {product.name}
                      </h3>

                      <div className="text-lg sm:text-xl font-light text-slate-700 mb-3 md:mb-4">
                        {product.price}฿
                      </div>

                      {/* Button */}
                      <button
                        className="w-full bg-blue-900 text-white py-2 md:py-3 px-4 rounded-md font-bold text-sm md:text-base hover:bg-blue-800 transition-colors"
                        onClick={() => handleAddClick(product)}
                      >
                        เพิ่ม
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
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

      {/* Product Options Modal */}
      {showModal && selectedProduct && (
        <section className="fixed inset-0 z-50 overflow-y-auto bg-white bg-opacity-10">
          <div className="min-h-full flex items-start justify-center p-4 py-12">
            <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-200 relative my-8">
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-sm z-10 transition-colors"
              >
                <X size={20} />
              </button>

              {/* Product Info Section */}
              <div className="bg-gray-50 p-8 text-center border-b">
                <h3 className="text-xl font-medium text-slate-800 mb-1">
                  {selectedProduct.name}
                </h3>
                <p className="text-2xl font-bold text-black">
                  ฿{selectedProduct.price.toLocaleString()}
                </p>
              </div>

              <div className="p-8">
                {selectedProduct.category === "shirt" && (
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-black mb-4 tracking-wide">
                      ไซส์ที่ต้องการ
                    </h4>
                    <div className="grid grid-cols-4 gap-3">
                      {shirtSizes.map((size) => (
                        <label
                          key={size}
                          className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                            selectedOption === size
                              ? "border-black bg-gray-50 font-bold"
                              : "border-gray-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="size"
                            value={size}
                            checked={selectedOption === size}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="sr-only"
                          />
                          <span className="text-slate-700">{size}</span>
                        </label>
                      ))}
                    </div>
                    {/* Error message for shirt size */}
                    {!selectedOption && (
                      <p className="text-red-500 text-sm mt-2">
                        กรุณาเลือกไซส์
                      </p>
                    )}
                  </div>
                )}

                {selectedProduct.id === 7 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-black mb-4 tracking-wide">
                      ลายที่ต้องการ
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {keychain.map((item) => (
                        <label
                          key={item.title}
                          className={`flex flex-col items-center justify-center p-2 sm:p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 text-center 
                          ${
                            selectedOption === item.title
                              ? "border-black bg-gray-50 ring-2 ring-black font-bold"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="w-full aspect-square mb-2">
                            <Image
                              src={item.image}
                              alt={`Size ${item.title} preview`}
                              width={80}
                              height={80}
                              className="object-cover w-full h-full rounded-md border border-gray-100"
                            />
                          </div>

                          <input
                            type="radio"
                            name="size"
                            value={item.title}
                            checked={selectedOption === item.title}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="sr-only"
                          />

                          <span className="text-slate-700 text-sm sm:text-base font-semibold">
                            {item.title}
                          </span>
                        </label>
                      ))}
                    </div>
                    {/* Error message for shirt size */}
                    {!selectedOption && (
                      <p className="text-red-500 text-sm mt-2">กรุณาเลือกลาย</p>
                    )}
                  </div>
                )}

                {/* Quantity Selection (for all products) */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-black mb-4 tracking-wide">
                    จำนวน
                  </h4>
                  <div className="flex items-center justify-center max-w-[150px] mx-auto">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuantityChange("decrement")}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-full bg-red-700 text-white flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-red-600 transition-colors font-bold text-lg"
                        type="button"
                      >
                        -
                      </button>

                      <span className="w-8 text-center font-bold text-lg">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange("increment")}
                        className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-600 transition-colors font-bold text-lg"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={
                    (selectedProduct.category === "shirt" ||
                      selectedProduct.id === 7) &&
                    !selectedOption
                  }
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
