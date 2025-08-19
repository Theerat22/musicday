// components/FlowerRowItem.tsx
import { Flower } from "./types";
import QuantitySelector from "./QuantitySelector";

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
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-lg mb-1">{flower.name}</h3>
          {/* <p className="text-sm text-gray-600 mb-2">
            สี: {flower.colors.join(", ")}
          </p> */}
          <p className="text-lg font-bold text-blue-900">
            {flower.price.toLocaleString()} บาท / ดอก
          </p>
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
  );
}