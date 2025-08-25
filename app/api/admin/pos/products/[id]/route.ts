import { NextRequest, NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import { ResultSetHeader } from "mysql2";

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { quantity, action } = (await request.json()) as {
      quantity: number;
      action: "increase" | "decrease" | "set";
    };

    const { id: productId } = context.params;

    if (!productId || typeof quantity !== "number" || !action) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    let sql: string;
    let values: any[];

    if (action === "increase") {
      sql = `
        INSERT INTO pos_product_stock (product_id, stock_quantity)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE stock_quantity = stock_quantity + VALUES(stock_quantity)
      `;
      values = [productId, quantity];
    } else if (action === "decrease") {
      sql = `
        UPDATE pos_product_stock
        SET stock_quantity = GREATEST(stock_quantity - ?, 0)
        WHERE product_id = ?
      `;
      values = [quantity, productId];
    } else {
      // action === "set"
      sql = `
        INSERT INTO pos_product_stock (product_id, stock_quantity)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity)
      `;
      values = [productId, quantity];
    }

    const [result] = await mysqlPool.query<ResultSetHeader>(sql, values);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Stock updated successfully",
      productId,
      quantity,
      action,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}