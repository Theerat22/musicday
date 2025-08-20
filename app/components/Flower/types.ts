// types.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

export interface Flower {
  id: number;
  name: string;
  colors: string[];
  price: number;
}

export interface FlowerSelection {
  flowerId: number;
  name: string;
  color: string;
  quantity: number;
  price: number;
}

// In Flower/types.ts
export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  cartId: string;
  type: "single" | "fresh_bouquet" | "preserved_bouquet";
  flowers?: FlowerSelection[];
  arrangementFee?: number;
  color: string;
  quantity: number; // ทำให้ quantity เป็น required field
  wrapping?: string; // ถ้ายังต้องการใช้
}

export type BouquetType = "fresh" | "preserved";

export type ViewType = "main" | "fresh_bouquet" | "preserved_bouquet";