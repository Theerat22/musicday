import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db"; // Assuming this is your MySQL connection pool
import { RowDataPacket } from "mysql2";

// Define interfaces for database rows
interface ProductDB extends RowDataPacket {
  id: number;
  name: string;
  price: number;
  image: string;
  stock_quantity: number | null;
}

export async function GET() {
  try {
    // Join pos_product with pos_product_stock to get all products with their current stock
    const [products] = await mysqlPool.query<ProductDB[]>(`
      SELECT 
        p.id, 
        p.name, 
        p.price, 
        p.image,
        COALESCE(s.stock_quantity, 0) as stock_quantity
      FROM pos_product p
      LEFT JOIN pos_product_stock s ON p.id = s.product_id
      ORDER BY p.id ASC
    `);

    // Return the combined data
    return NextResponse.json(products);

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}