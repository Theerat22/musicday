// components/FlowerRowItem.tsx
import { Flower } from "./types";
import QuantitySelector from "./QuantitySelector";
import Image from "next/image";

interface FlowerRowItemProps {
  flower: Flower;
  currentQuantity: number;
  maxAllowed: number;
  onQuantityChange: (flowerId: number, quantity: number) => void;
}

export default function FlowerRowItem({
  flower,
  currentQuantity,
  maxAllowed,
  onQuantityChange,
}: FlowerRowItemProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex items-center">
      <div className="flex-shrink-0 mr-4">
        <div className="w-24 h-24 bg-gray-50 rounded-md overflow-hidden">
          <Image
            src={`/flower/${flower.name}.jpg`}
            alt={flower.name}
            className="object-cover w-full h-full"
            width={100}
            height={100}
            quality={60} // เพิ่ม quality เพื่อลดขนาดไฟล์
            priority // เพิ่ม priority เพื่อให้โหลดภาพได้เร็วขึ้น
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // เพิ่ม sizes เพื่อให้เลือกขนาดภาพที่เหมาะสมกับ viewport
          />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-lg mb-1">{flower.name}</h3>
            {flower.id === 5 ? (
              <p className="text-lg font-bold text-blue-900">
                {flower.price.toLocaleString()} บาท / 3 ดอก
              </p>
            ) : (
              <p className="text-lg font-bold text-blue-900">
                {flower.price.toLocaleString()} บาท / ดอก
              </p>
            )}
          </div>
          <div className="flex-shrink-0 ml-4">
            <QuantitySelector
              flower={flower}
              currentQuantity={currentQuantity}
              maxAllowed={maxAllowed}
              onQuantityChange={onQuantityChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}