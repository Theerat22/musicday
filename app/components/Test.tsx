// components/Products.tsx
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ShoppingCart } from "lucide-react";
import OrderForm from "./OrderForm";
import BouquetView from "./Flower/BouquetView";
import {
  Product,
  Flower,
  FlowerSelection,
  CartItem,
  BouquetType,
  ViewType,
} from "./Flower/types";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [freshFlowers, setFreshFlowers] = useState<Flower[]>([]);
  const [preservedFlowers, setPreservedFlowers] = useState<Flower[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedWrapping, setSelectedWrapping] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>("main");
  const [bouquetFlowers, setBouquetFlowers] = useState<FlowerSelection[]>([]);
  const [currentBouquetType, setCurrentBouquetType] =
    useState<BouquetType>("fresh");
  const [showBouquetOptionsModal, setShowBouquetOptionsModal] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [customQuantities, setCustomQuantities] = useState<{
    [key: string]: number;
  }>({ ขาว: 0, ชมพู: 0 }); // New state for product 30004

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, freshFlowersRes, preservedFlowersRes] =
          await Promise.all([
            fetch("/api/fetchProducts"),
            fetch("/api/fetchFreshFlowers"),
            fetch("/api/fetchPreservedFlowers"),
          ]);

        const productsData = await productsRes.json();
        const freshFlowersData = await freshFlowersRes.json();
        const preservedFlowersData = await preservedFlowersRes.json();

        setProducts(productsData);
        setFreshFlowers(freshFlowersData);
        setPreservedFlowers(preservedFlowersData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const productColors: { [key: number]: string[] } = {
    30001: [],
    30002: ["ขาว", "ฟ้า", "ม่วง", "ชมพู"],
    30003: ["ขาว", "ฟ้า", "ม่วง", "ชมพู"],
    30004: ["ขาว", "ชมพู"],
  };

  const wrappings = ["ชมพู", "ขาวครีม", "น้ำตาล"];

  const wrappings_preserved = ["น้ำตาล", "ขาว", "ฟ้า", "ม่วง", "ชมพู", "แสด"];

  const handleAddClick = (product: Product) => {
    setSelectedProduct(product);
    setSelectedColor("");
    setSelectedWrapping("");
    setSelectedQuantity(1);
    setCustomQuantities({ ขาว: 0, ชมพู: 0 }); // Reset custom quantities
    setShowModal(true);
  };

  const handleBouquetClick = (type: "fresh" | "preserved") => {
    setCurrentBouquetType(type);
    setCurrentView(type === "fresh" ? "fresh_bouquet" : "preserved_bouquet");
    setBouquetFlowers([]);
  };

  const handleQuantityChange = (
    flowerId: number,
    newQuantity: number
  ): void => {
    const flowers =
      currentBouquetType === "fresh" ? freshFlowers : preservedFlowers;
    const flower = flowers.find((f) => f.id === flowerId);
    if (!flower) return;
    const maxFlowers = currentBouquetType === "fresh" ? 5 : 20;
    const currentTotal = bouquetFlowers.reduce((sum, f) => sum + f.quantity, 0);
    const currentFlowerQuantity = bouquetFlowers
      .filter((f) => f.flowerId === flowerId)
      .reduce((sum, f) => sum + f.quantity, 0);
    const quantityDiff = newQuantity - currentFlowerQuantity;
    if (currentTotal + quantityDiff > maxFlowers) {
      return;
    }
    const updatedBouquet = bouquetFlowers.filter(
      (f) => f.flowerId !== flowerId
    );
    if (newQuantity > 0) {
      const defaultColor = flower.colors[0] || "ไม่ระบุสี";
      updatedBouquet.push({
        flowerId: flower.id,
        name: flower.name,
        color: defaultColor,
        price: flower.price,
        quantity: newQuantity,
      });
    }
    setBouquetFlowers(updatedBouquet);
  };

  const handleCustomQuantityChange = (color: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setCustomQuantities((prev) => ({ ...prev, [color]: newQuantity }));
  };

  const removeFlowerFromBouquet = (index: number) => {
    setBouquetFlowers(bouquetFlowers.filter((_, i) => i !== index));
  };

  const addBouquetToCart = () => {
    if (!selectedWrapping) {
      alert("กรุณาเลือกสีและกระดาษห่อ");
      return;
    }
    const totalFlowerPrice = bouquetFlowers.reduce(
      (sum, f) => sum + f.price * f.quantity,
      0
    );
    const arrangementFee = currentBouquetType === "fresh" ? 55 : 25;
    const totalPrice = totalFlowerPrice + arrangementFee;

    const cartItem: CartItem = {
      id: Date.now(),
      name: `ช่อ${currentBouquetType === "fresh" ? "ดอกไม้สด" : "กำมะหยี่"}`,
      price: totalPrice,
      image: "",
      cartId: `bouquet-${Date.now()}`,
      type:
        currentBouquetType === "fresh" ? "fresh_bouquet" : "preserved_bouquet",
      flowers: [...bouquetFlowers],
      arrangementFee,
      color: selectedColor,
      wrapping: selectedWrapping,
      quantity: 1,
    };

    setCart((prev) => [...prev, cartItem]);
    setBouquetFlowers([]);
    setCurrentView("main");
    setShowBouquetOptionsModal(false);
    setSelectedColor("");
    setSelectedWrapping("");
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    if (selectedProduct.id === 30004) {
      const flowersInBouquet: FlowerSelection[] = Object.keys(customQuantities)
        .filter((color) => customQuantities[color] > 0)
        .map((color) => {
          return {
            flowerId: selectedProduct.id,
            name: selectedProduct.name,
            color: color,
            price: selectedProduct.price,
            quantity: customQuantities[color],
          };
        });

      if (Object.values(customQuantities).every((q) => q === 0)) {
        alert("กรุณาเลือกจำนวนดอกไม้อย่างน้อย 1 ดอก");
        return;
      }

      if (!selectedWrapping) {
        alert("กรุณาเลือกกระดาษห่อ");
        return;
      }

      const arrangementFee = 15;
      const totalFlowerPrice = flowersInBouquet.reduce(
        (sum, flower) => sum + flower.price * flower.quantity,
        0
      );
      const totalPrice = totalFlowerPrice + arrangementFee;

      const cartItem: CartItem = {
        id: selectedProduct.id,
        name: "ช่อลิลลี่",
        price: totalPrice,
        image: selectedProduct.image,
        cartId: `bouquet-custom-${Date.now()}`,
        type: "fresh_bouquet", // Changed type to "fresh_bouquet"
        flowers: flowersInBouquet,
        arrangementFee: arrangementFee,
        color: "ไม่ระบุ", // Color for the whole bouquet is not applicable
        wrapping: selectedWrapping,
        quantity: 1,
      };

      setCart((prev) => [...prev, cartItem]);
      setShowModal(false);
      setSelectedProduct(null);
      setSelectedWrapping("");
      setCustomQuantities({ ขาว: 0, ชมพู: 0 });
      return;
    }

    // Original logic for other products
    const requiresColor =
      productColors[selectedProduct.id] &&
      productColors[selectedProduct.id].length > 0;
    if (requiresColor && !selectedColor) {
      alert("กรุณาเลือกสี");
      return;
    }

    const cartItem: CartItem = {
      ...selectedProduct,
      price: selectedProduct.price * selectedQuantity,
      quantity: selectedQuantity,
      color: selectedColor || "ไม่ระบุสี",
      wrapping: selectedQuantity.toString(),
      cartId: `single-${selectedProduct.id}-${Date.now()}`,
      type: "single",
    };
    setCart((prev) => [...prev, cartItem]);
    setShowModal(false);
    setSelectedProduct(null);
    setSelectedColor("");
    setSelectedQuantity(1);
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

  const openBouquetOptionsModal = () => {
    if (bouquetFlowers.length === 0) {
      alert("กรุณาเลือกดอกไม้อย่างน้อย 1 ดอก");
      return;
    }
    setShowBouquetOptionsModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentView === "fresh_bouquet" || currentView === "preserved_bouquet") {
    const flowers =
      currentView === "fresh_bouquet" ? freshFlowers : preservedFlowers;
    return (
      <>
        <BouquetView
          currentView={currentView}
          flowers={flowers}
          bouquetFlowers={bouquetFlowers}
          currentBouquetType={currentBouquetType}
          onBackToMain={() => setCurrentView("main")}
          onQuantityChange={handleQuantityChange}
          onRemoveFlower={removeFlowerFromBouquet}
          onOpenOptionsModal={openBouquetOptionsModal}
        />
        {showBouquetOptionsModal && (
          <section className="fixed inset-0 z-50 overflow-y-auto bg-white bg-opacity-60">
            <div className="min-h-full flex items-start justify-center p-4 py-12">
              <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-200 relative my-8">
                <button
                  onClick={() => setShowBouquetOptionsModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-sm z-10 transition-colors"
                  type="button"
                >
                  <X size={20} />
                </button>
                <div className="bg-gray-50 p-8 text-center border-b">
                  <h3 className="text-xl font-medium text-slate-800 mb-1">
                    เลือกรายละเอียดช่อดอกไม้
                  </h3>
                </div>
                <div className="p-8">
                  {currentBouquetType === "fresh" && ( // เพิ่มเงื่อนไขนี้
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-black mb-4 tracking-wide">
                        โทนสี
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          "ชมพู",
                          "ม่วง",
                          "ชมพู+แดง",
                          "ชมพู+เหลือง",
                          "ชมพู+ม่วง",
                          "ม่วง+เหลือง",
                        ].map((color) => (
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
                              name="bouquet-color"
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
                  )}{" "}
                  {/* สิ้นสุดเงื่อนไข */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-black mb-4 tracking-wide">
                      กระดาษห่อ
                    </h4>
                    <div className="space-y-3">
                      {currentBouquetType === "preserved"
                        ? wrappings_preserved.map((wrapping) => (
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
                                name="bouquet-wrapping"
                                value={wrapping}
                                checked={selectedWrapping === wrapping}
                                onChange={(e) =>
                                  setSelectedWrapping(e.target.value)
                                }
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
                          ))
                        : wrappings.map((wrapping) => (
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
                                name="bouquet-wrapping"
                                value={wrapping}
                                checked={selectedWrapping === wrapping}
                                onChange={(e) =>
                                  setSelectedWrapping(e.target.value)
                                }
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
                  <button
                    onClick={addBouquetToCart}
                    disabled={!selectedWrapping}
                    className="w-full bg-black text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    type="button"
                  >
                    ตกลง
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 mt-1">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Pre-order ดอกไม้
          </h1>
          <p className="m-2 text-lg">Music Day 2025</p>
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
                  <h2 className="text-xl text-black">ตะกร้าสินค้า</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="text-gray-400 hover:text-gray-600 p-2"
                    type="button"
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
                              {item.quantity && (
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                  x{item.quantity}
                                </span>
                              )}
                            </h3>
                            <button
                              onClick={() => removeFromCart(item.cartId)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              type="button"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          {item.type === "single" && (
                            <>
                              <p className="text-sm text-gray-600 mb-1">
                                ราคาดอก: {item.price/item.quantity}
                              </p>
                              <p className="text-sm text-gray-600 mb-1">
                                สี: {item.color || "ไม่ระบุ"}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                จำนวน: {item.wrapping}
                              </p>
                            </>
                          )}

                          {(item.type === "fresh_bouquet" ||
                            item.type === "preserved_bouquet") &&
                            item.flowers && (
                              <div className="text-sm text-gray-600 mb-2">
                                <p className="mb-1">ดอกไม้:</p>
                                {item.flowers.map((flower, idx) => (
                                  <p key={idx} className="ml-2">
                                    • {flower.name} (
                                    {flower.flowerId === 30004
                                      ? flower.color
                                      : flower.price}
                                    ) x {flower.quantity}
                                  </p>
                                ))}
                                <p className="text-sm text-gray-600 ">
                                  โทนสี: {item.color}
                                </p>
                                <p className="text-sm text-gray-600 ">
                                  กระดาษห่อ: {item.wrapping}
                                </p>
                                <p className="">
                                  ค่าจัดช่อ: {item.arrangementFee} บาท
                                </p>
                              </div>
                            )}

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
                        className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors"
                        onClick={handleOrderClick}
                        type="button"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button onClick={() => handleBouquetClick("fresh")} type="button">
            <div className="relative group">
              <div>
                <Image
                  src="/test1.jpg"
                  alt="Fresh Bouquet"
                  width={200}
                  height={200}
                  className="object-cover w-full h-[150px] shadow-md rounded-lg transition-all duration-300 ease-in-out transform group-hover:shadow-lg"
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black via-black/30 to-transparent rounded-lg transition-all duration-300 group-hover:from-black/80 group-hover:via-black/60">
                  <h5 className="text-white text-3xl font-bold drop-shadow-2xl">
                    จัดช่อดอกไม้สด
                  </h5>
                  <p className="text-white">กดเพื่อจัดช่อ</p>
                </div>
              </div>
            </div>
          </button>

          <button onClick={() => handleBouquetClick("preserved")} type="button">
            <div className="relative group">
              <div>
                <Image
                  src="/preserved.jpeg"
                  alt="Preserved Bouquet"
                  width={200}
                  height={200}
                  className="object-cover w-full h-[150px] shadow-md rounded-lg transition-all duration-300 ease-in-out transform group-hover:shadow-lg"
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black via-black/30 to-transparent rounded-lg transition-all duration-300 group-hover:from-black/80 group-hover:via-black/60">
                  <h5 className="text-white text-3xl font-bold drop-shadow-2xl">
                    จัดช่อดอกไม้กำมะหยี่
                  </h5>
                  <p className="text-white">กดเพื่อจัดช่อ</p>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm"
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center p-4">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="object-cover w-full h-full rounded-md"
                />
              </div>

              <div className="p-6">
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  {product.name}
                </h3>
                <div className="text-xl font-light text-slate-700 mb-4">
                  {product.price}฿
                </div>
                <button
                  className="w-full bg-blue-900 text-white py-3 px-4 rounded-md font-bold"
                  onClick={() => handleAddClick(product)}
                  type="button"
                >
                  เพิ่ม
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            setShowCart(!showCart);
            console.log(cart);
          }}
          className="bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all transform hover:scale-105 relative"
          type="button"
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
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-sm z-10 transition-colors"
                type="button"
              >
                <X size={20} />
              </button>

              <div className="bg-gray-50 p-8 text-center border-b">
                <h3 className="text-xl font-medium text-slate-800 mb-1">
                  {selectedProduct.name}
                </h3>
                <p className="text-2xl font-bold text-black">
                  ฿
                  {(selectedProduct.id === 30004
                    ? Object.values(customQuantities).reduce(
                        (sum, q) => sum + q,
                        0
                      ) *
                        selectedProduct.price +
                      15
                    : selectedProduct.price * selectedQuantity
                  ).toLocaleString()}
                </p>
                {selectedProduct.id === 30004 && (
                  <p className="text-sm text-gray-500 mt-1">
                    (ดอกละ 80 บาท + ค่าจัดช่อ 15 บาท)
                  </p>
                )}
              </div>

              <div className="p-8">
                {selectedProduct.id !== 30004 &&
                  productColors[selectedProduct.id] &&
                  productColors[selectedProduct.id].length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-black mb-4 tracking-wide">
                        สี
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {productColors[selectedProduct.id].map((color) => (
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
                  )}

                {selectedProduct.id === 30004 ? (
                  <>
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-black mb-4 tracking-wide">
                        จำนวน
                      </h4>
                      <div className="space-y-4">
                        {productColors[30004].map((color) => (
                          <div
                            key={color}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                          >
                            <span className="font-medium text-slate-700">
                              {color}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleCustomQuantityChange(
                                    color,
                                    customQuantities[color] - 1
                                  )
                                }
                                disabled={customQuantities[color] <= 0}
                                className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                                type="button"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-sm font-bold">
                                {customQuantities[color]}
                              </span>
                              <button
                                onClick={() =>
                                  handleCustomQuantityChange(
                                    color,
                                    customQuantities[color] + 1
                                  )
                                }
                                className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                                type="button"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                              onChange={(e) =>
                                setSelectedWrapping(e.target.value)
                              }
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
                  </>
                ) : (
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-black mb-4 tracking-wide">
                      จำนวน
                    </h4>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setSelectedQuantity(Math.max(1, selectedQuantity - 1))
                        }
                        disabled={selectedQuantity <= 1}
                        className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-red-600 transition-colors font-bold text-lg"
                        type="button"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-lg">
                        {selectedQuantity}
                      </span>
                      <button
                        onClick={() =>
                          setSelectedQuantity(selectedQuantity + 1)
                        }
                        className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-600 transition-colors font-bold text-lg"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleAddToCart}
                  disabled={
                    (selectedProduct.id !== 30004 &&
                      productColors[selectedProduct.id] &&
                      productColors[selectedProduct.id].length > 0 &&
                      !selectedColor) ||
                    (selectedProduct.id === 30004 &&
                      (Object.values(customQuantities).reduce(
                        (sum, q) => sum + q,
                        0
                      ) === 0 ||
                        !selectedWrapping))
                  }
                  className="w-full bg-black text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  type="button"
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
