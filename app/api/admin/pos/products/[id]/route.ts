import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const productId = params.id;
  const { quantity, action } = await request.json();

  if (!productId || typeof quantity === 'undefined' || !action) {
    return NextResponse.json(
      { error: "Missing required fields: productId, quantity, or action" },
      { status: 400 }
    );
  }

  try {
    const conn = await mysqlPool.getConnection();
    await conn.beginTransaction();

    try {
      // Use INSERT ... ON DUPLICATE KEY UPDATE to either insert a new row or update an existing one
      // If the product doesn't exist in stock table, it will be inserted.
      // If it exists, the quantity will be updated.
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
