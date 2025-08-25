import { NextRequest, NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import { ResultSetHeader } from "mysql2";

// กำหนดประเภทที่ถูกต้องสำหรับ context
interface RouteContext {
  params: {
    id: string; // ไม่ต้องเป็น Promise
  };
}

// กำหนดประเภทของ Body
interface UpdateStockBody {
  quantity: number;
  action: "increase" | "decrease" | "set";
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext // ใช้ประเภทที่ถูกต้อง
) {
  try {
    // กำหนดประเภทให้กับ await request.json()
    const { quantity, action } = (await request.json()) as UpdateStockBody;

    // ดึง id จาก context.params โดยตรง ไม่ต้องใช้ await
    const { id: productId } = context.params;

    if (!productId || typeof quantity !== "number" || !action) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    let sql: string;
    // ใช้ Array<string | number> แทน any[]
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

    // ตรวจสอบว่ามีการเปลี่ยนแปลงเกิดขึ้นหรือไม่
    if (result.affectedRows === 0 && action === "decrease") {
      // ตรวจสอบเฉพาะ 'decrease' ที่ใช้ UPDATE
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
  } catch (error: unknown) { // ใช้ unknown แทน any ใน catch block
    console.error("Database error:", error);
    
    // จัดการ error: unknown เพื่อดึงข้อความหากมี
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