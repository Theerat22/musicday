// components/QuantitySelector.tsx
import { Flower } from "./types";

interface QuantitySelectorProps {
  flower: Flower;
  currentQuantity: number;
  maxAllowed: number;
  onQuantityChange: (flowerId: number, quantity: number) => void;
}

export default function QuantitySelector({
  flower,
  currentQuantity,
  maxAllowed,
  onQuantityChange,
}: QuantitySelectorProps) {
  const canIncrease = currentQuantity < maxAllowed;
  const canDecrease = currentQuantity > 0;

  const handleDecrease = () => {
    if (canDecrease) {
      onQuantityChange(flower.id, Math.max(0, currentQuantity - 1));
    }
  };

  const handleIncrease = () => {
    if (canIncrease) {
      onQuantityChange(flower.id, currentQuantity + 1);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={handleDecrease}
          disabled={!canDecrease}
          className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-red-600 transition-colors font-bold text-lg"
          type="button"
        >
          -
        </button>

        <span className="w-8 text-center font-bold text-lg">
          {currentQuantity}
        </span>
        <button
          onClick={handleIncrease}
          disabled={!canIncrease}
          className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-600 transition-colors font-bold text-lg"
          type="button"
        >
          +
        </button>
      </div>

      {/* {currentQuantity > 0 && (
        <span className="text-sm font-medium text-blue-600">
          {(flower.price * currentQuantity).toLocaleString()} บาท
        </span>
      )} */}

      
    </div>
  );
}
