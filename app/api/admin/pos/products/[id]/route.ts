import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const { id: productId } = context.params;
  let quantity: number;
  let action: string;

  try {
    const body = await request.json();
    quantity = body.quantity;
    action = body.action;
  } catch (e) {
    console.error("Error parsing request body:", e);
    return NextResponse.json(
      { error: "Invalid or missing JSON body" },
      { status: 400 }
    );
  }

  if (
    !productId ||
    typeof quantity === "undefined" ||
    typeof quantity !== "number" ||
    !action
  ) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid required fields: productId, quantity, or action",
      },
      { status: 400 }
    );
  }

  try {
    const conn = await mysqlPool.getConnection();
    await conn.beginTransaction();

    try {
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