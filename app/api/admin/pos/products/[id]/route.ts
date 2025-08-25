import { NextRequest, NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import { ResultSetHeader } from "mysql2";

// This interface is now optional, but still good for clarity of the request body
interface UpdateStockBody {
  quantity: number;
  action: "increase" | "decrease" | "set";
}

export async function PATCH(
  request: NextRequest,
  // 💡 THE FIX: Define the required type inline instead of using the custom interface
  context: { params: { id: string } } 
) {
  try {
    const { quantity, action } = (await request.json()) as UpdateStockBody;

    const { id: productId } = context.params;

    if (!productId || typeof quantity !== "number" || !action) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    let sql: string;
    let values: Array<string | number>; 

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

    if (result.affectedRows === 0 && action === "decrease") {
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
  } catch (error: unknown) { 
    console.error("Database error:", error);
    
    let errorMessage = "Failed to update stock";
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}