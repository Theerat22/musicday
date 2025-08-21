// components/BouquetSummary.tsx
import { X } from "lucide-react";
import { FlowerSelection, ViewType } from "./types";

interface BouquetSummaryProps {
  bouquetFlowers: FlowerSelection[];
  currentView: ViewType;
  getTotalPrice: () => number;
  onRemoveFlower: (index: number) => void;
  onOpenOptions: () => void;
  hasExtraCarnations: boolean; // New prop
  setHasExtraCarnations: (checked: boolean) => void; // New prop
}

export default function BouquetSummary({
  bouquetFlowers,
  currentView,
  getTotalPrice,
  onRemoveFlower,
  onOpenOptions,
  hasExtraCarnations,
  setHasExtraCarnations,
}: BouquetSummaryProps) {
  if (bouquetFlowers.length === 0 && !hasExtraCarnations) {
    return null;
  }
  const arrangementFee = currentView === "fresh_bouquet" ? 55 : 25;

  const handleOpenOptions = () => {
    // Calculate the total quantity of selected flowers
    const totalFlowerQuantity =
      bouquetFlowers.reduce((sum, flower) => sum + flower.quantity, 0) +
      (hasExtraCarnations ? 3 : 0);

    // Check the condition only for preserved flowers
    if (currentView === "preserved_bouquet" && totalFlowerQuantity < 2) {
      alert("กรุณาเลือกดอกไม้อย่างน้อย 2 ดอก");
      return; // Stop the function here
    }

    // If the condition is met or not applicable, proceed
    onOpenOptions();
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <h3 className="font-bold mb-3">ดอกไม้ที่เลือก:</h3>
      <div className="space-y-2">
        {bouquetFlowers.map((flower, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm">
              {" "}
              {flower.name} x {flower.quantity}{" "}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {" "}
                {(flower.price * flower.quantity).toLocaleString()} บาท{" "}
              </span>
              <button
                onClick={() => onRemoveFlower(index)}
                className="text-red-600 hover:text-red-700 transition-colors"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
        {/* New checkbox for extra carnations */}

        {hasExtraCarnations && (
          <div className="flex justify-between items-center">
            <span className="text-sm">คาร์เนชั่น x 3</span>
            <span className="text-sm font-medium">30 บาท</span>
          </div>
        )}
        <div className="border-t pt-2 flex justify-between items-center font-medium">
          <span>ค่าจัดช่อ:</span>
          <span>{arrangementFee} บาท</span>
        </div>
        <div className="border-t pt-2 flex justify-between items-center font-bold">
          <span>รวมทั้งหมด:</span>
          <span>{getTotalPrice().toLocaleString()} บาท</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="extra-carnations"
          checked={hasExtraCarnations}
          onChange={(e) => setHasExtraCarnations(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="extra-carnations" className="text-sm text-gray-700">
          เพิ่มคาร์เนชั่น 3 ดอก
        </label>
      </div>
      <button
        onClick={handleOpenOptions} // Call the new validation function
        className="w-full mt-4 bg-black text-white py-2 rounded-md hover:bg-green-700 transition-colors font-bold"
        type="button"
      >
        {" "}
        เพิ่มลงตะกร้า{" "}
      </button>
    </div>
  );
}
