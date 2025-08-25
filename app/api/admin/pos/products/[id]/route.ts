import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function PATCH(
  request: Request,
  // The clean and widely accepted inline type for the context/params argument
  { params }: { params: { id: string } } 
) {
  const productId = params.id;
  let quantity: number;
  let action: string;

  // Robustly handle the request body parsing
  try {
    const body = await request.json();
    quantity = body.quantity;
    action = body.action;
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid or missing JSON body" },
      { status: 400 }
    );
  }

  // Type check the required fields
  if (!productId || typeof quantity === 'undefined' || typeof quantity !== 'number' || !action) {
    return NextResponse.json(
      { error: "Missing or invalid required fields: productId (string), quantity (number), or action (string)" },
      { status: 400 }
    );
  }

  try {
    const conn = await mysqlPool.getConnection();
    await conn.beginTransaction();

    try {
      // Your existing database logic
      // Note: This logic SETS the stock_quantity, it doesn't add/subtract.
      await conn.query(
        `INSERT INTO pos_product_stock (product_id, stock_quantity)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE stock_quantity = ?`,
        [productId, quantity, quantity]
      );
      
      await conn.commit();
      conn.release();

      return NextResponse.json(
        { message: "Stock updated successfully" },
        { status: 200 }
      );
    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}