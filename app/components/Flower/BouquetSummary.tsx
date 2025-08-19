// components/BouquetSummary.tsx
import { X } from "lucide-react";
import { FlowerSelection, ViewType } from "./types";

interface BouquetSummaryProps {
  bouquetFlowers: FlowerSelection[];
  currentView: ViewType;
  getTotalPrice: () => number;
  onRemoveFlower: (index: number) => void;
  onOpenOptions: () => void; // เปลี่ยนชื่อ props
}

export default function BouquetSummary({
  bouquetFlowers,
  currentView,
  getTotalPrice,
  onRemoveFlower,
  onOpenOptions, // เปลี่ยนชื่อ props
}: BouquetSummaryProps) {
  if (bouquetFlowers.length === 0) {
    return null;
  }
  const arrangementFee = currentView === "fresh_bouquet" ? 45 : 10;
  // const getDescription = (): string => {
  //   return currentView === "fresh_bouquet" ? "เลือกดอกไม้สด สูงสุด 5 ดอก" : "";
  // };

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
        <div className="border-t pt-2 flex justify-between items-center font-medium">
          <span>ค่าจัดช่อ:</span>
          <span>{arrangementFee} บาท</span>
        </div>
        <div className="border-t pt-2 flex justify-between items-center font-bold">
          <span>รวมทั้งหมด:</span>
          <span>{getTotalPrice().toLocaleString()} บาท</span>
        </div>
      </div>
      <button
        onClick={onOpenOptions} // เรียกใช้ฟังก์ชันใหม่
        className="w-full mt-4 bg-black text-white py-2 rounded-md hover:bg-green-700 transition-colors font-bold"
        type="button"
      >
        {" "}
        เพิ่มลงตะกร้า{" "}
      </button>
    </div>
  );
}