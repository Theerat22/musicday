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
    // กำหนดประเภทของ values เป็น Array<string | number> เพื่อให้ถูกหลัก TypeScript
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
      // ใน MySQL query นี้ ลำดับของค่าที่ส่งคือ [quantity, productId]
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
      // หมายเหตุ: สำหรับ 'increase' หรือ 'set' ที่มีการ 'INSERT ... ON DUPLICATE KEY UPDATE'
      // affectedRows จะเป็น 1 สำหรับ INSERT หรือ 2 สำหรับ UPDATE (ใน MySQL2)
      // ดังนั้นการเช็ค 0 อาจใช้ได้เฉพาะกับ 'decrease' ที่เป็น UPDATE
      return NextResponse.json(
        { error: "Product not found or not affected" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Stock updated successfully",
      productId,
      quantity,
      action,
    });
  } catch (error: unknown) { // ใช้ unknown แทน any
    // ในการจัดการ error: unknown ต้องตรวจสอบประเภทก่อนใช้งาน
    let errorMessage = "Failed to update stock";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    console.error("Database error:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}