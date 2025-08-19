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

export interface CartItem extends Product {
  color: string;
  wrapping: string;
  cartId: string;
  type: "single" | "fresh_bouquet" | "preserved_bouquet";
  flowers?: FlowerSelection[];
  arrangementFee?: number;
}

export type BouquetType = "fresh" | "preserved";

export type ViewType = "main" | "fresh_bouquet" | "preserved_bouquet";