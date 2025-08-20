// components/BouquetView.tsx
import { ArrowLeft } from "lucide-react";
import { Flower, FlowerSelection, ViewType, BouquetType } from "./types";
import FlowerRowItem from "./FlowerRowItem";
import BouquetSummary from "./BouquetSummary";
import { useState } from "react";

interface BouquetViewProps {
  currentView: ViewType;
  flowers: Flower[];
  bouquetFlowers: FlowerSelection[];
  currentBouquetType: BouquetType;
  onBackToMain: () => void;
  onQuantityChange: (flowerId: number, quantity: number) => void;
  onRemoveFlower: (index: number) => void;
  onOpenOptionsModal: () => void;
}

export default function BouquetView({
  currentView,
  flowers,
  bouquetFlowers,
  currentBouquetType,
  onBackToMain,
  onQuantityChange,
  onRemoveFlower,
  onOpenOptionsModal,
}: BouquetViewProps) {
  const [showAllFlowers, setShowAllFlowers] = useState(false);
  const maxFlowers = currentBouquetType === "fresh" ? 5 : 20;
  const currentFlowerCount = bouquetFlowers.reduce(
    (sum, f) => sum + f.quantity,
    0
  );
  const getFlowerQuantity = (flowerId: number): number => {
    return bouquetFlowers
      .filter((f) => f.flowerId === flowerId)
      .reduce((sum, f) => sum + f.quantity, 0);
  };
  const getBouquetTotalPrice = (): number => {
    const flowerPrice = bouquetFlowers.reduce(
      (sum, f) => sum + f.price * f.quantity,
      0
    );
    const arrangementFee = currentBouquetType === "fresh" ? 50 : 25;
    return flowerPrice + arrangementFee;
  };
  const getTitle = (): string => {
    return currentView === "fresh_bouquet"
      ? "จัดช่อดอกไม้สด"
      : "จัดช่อกำมะหยี่";
  };
  const flowersToDisplay = showAllFlowers ? flowers : flowers.slice(0, 5);
  const hasMoreFlowers = flowers.length > 5;

  const handleToggleShowAll = () => {
    setShowAllFlowers(!showAllFlowers);
  };

  const getDescription = (): string => {
    return currentView === "fresh_bouquet"
      ? "ค่าจัดช่อราคา 50 บาท (รวมกระดาษห่อ ริบบิ้น ใบยูคา ยิปโซ คาร์เนชั่น)"
      : "ค่าจัดช่อราคา 25 บาท";
  };

  return (
    <div className="min-h-screen bg-white p-6 mt-1">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBackToMain}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            type="button"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{getTitle()}</h1>
            <p>{getDescription()}</p>
          </div>
        </div>

        {/* Selected flowers summary */}
        <BouquetSummary
          bouquetFlowers={bouquetFlowers}
          currentView={currentView}
          getTotalPrice={getBouquetTotalPrice}
          onRemoveFlower={onRemoveFlower}
          onOpenOptions={onOpenOptionsModal}
        />

        {/* Flowers list with quantity selectors */}
        <div className="space-y-4">
          {flowersToDisplay.map((flower) => {
            const currentQuantity = getFlowerQuantity(flower.id);
            const remainingSlots =
              maxFlowers - currentFlowerCount + currentQuantity;
            const maxAllowedForThisFlower = Math.min(
              remainingSlots,
              maxFlowers
            );
            return (
              <FlowerRowItem
                key={flower.id}
                flower={flower}
                currentQuantity={currentQuantity}
                maxAllowed={maxAllowedForThisFlower}
                onQuantityChange={onQuantityChange}
              />
            );
          })}
        </div>
        {hasMoreFlowers && (
          <div className="text-center mt-6">
            <button
              onClick={handleToggleShowAll}
              className="text-blue-600 font-bold hover:underline"
              type="button"
            >
              {showAllFlowers ? "แสดงน้อยลง" : "ดูเพิ่มเติม"}
            </button>
          </div>
        )}
        <p className="text-gray-600 text-center mt-5">
          เลือกได้สูงสุด {maxFlowers} ดอก | เลือกแล้ว: {currentFlowerCount} ดอก
        </p>
        {flowers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">ไม่พบดอกไม้</p>
          </div>
        )}
      </div>
    </div>
  );
}
