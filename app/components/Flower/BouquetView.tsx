// components/BouquetView.tsx
import { ArrowLeft } from "lucide-react";
import { Flower, FlowerSelection, ViewType, BouquetType } from "./types";
import FlowerRowItem from "./FlowerRowItem";
import BouquetSummary from "./BouquetSummary";

interface BouquetViewProps {
  currentView: ViewType;
  flowers: Flower[];
  bouquetFlowers: FlowerSelection[];
  currentBouquetType: BouquetType;
  onBackToMain: () => void;
  onQuantityChange: (flowerId: number, quantity: number) => void;
  onRemoveFlower: (index: number) => void;
  onOpenOptionsModal: () => void; // เปลี่ยนชื่อ props
}

export default function BouquetView({
  currentView,
  flowers,
  bouquetFlowers,
  currentBouquetType,
  onBackToMain,
  onQuantityChange,
  onRemoveFlower,
  onOpenOptionsModal, // เปลี่ยนชื่อ props
}: BouquetViewProps) {
  const maxFlowers = currentBouquetType === "fresh" ? 5 : 20;
  const currentFlowerCount = bouquetFlowers.reduce((sum, f) => sum + f.quantity, 0);
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
    const arrangementFee = currentBouquetType === "fresh" ? 45 : 10;
    return flowerPrice + arrangementFee;
  };
  const getTitle = (): string => {
    return currentView === "fresh_bouquet" ? "จัดช่อดอกไม้สด" : "จัดช่อกัมมะหยี่";
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
            <p className="text-gray-600">
              {" "}
              เลือกได้สูงสุด {maxFlowers} ดอก | เลือกแล้ว:{" "}
              {currentFlowerCount} ดอก
            </p>
          </div>
        </div>

        {/* Selected flowers summary */}
        <BouquetSummary
          bouquetFlowers={bouquetFlowers}
          currentView={currentView}
          getTotalPrice={getBouquetTotalPrice}
          onRemoveFlower={onRemoveFlower}
          onOpenOptions={onOpenOptionsModal} // เรียกฟังก์ชันที่ถูกส่งมาจาก Products
        />

        {/* Flowers list with quantity selectors */}
        <div className="space-y-4">
          {flowers.map((flower) => {
            const currentQuantity = getFlowerQuantity(flower.id);
            const remainingSlots = maxFlowers - currentFlowerCount + currentQuantity;
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
        {flowers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">ไม่พบดอกไม้</p>
          </div>
        )}
      </div>
    </div>
  );
}