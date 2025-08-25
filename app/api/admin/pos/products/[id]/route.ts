import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

// 1. กำหนด Interface สำหรับ Context (รวมถึง params)
interface RouteContext {
  params: {
    // ชื่อตัวแปรต้องตรงกับชื่อ Dynamic Segment ใน Path ([id])
    id: string; 
  };
}

export async function PATCH(
  request: Request,
  // 2. ใช้ Interface ในการกำหนด Type ให้กับ Argument ตัวที่สอง (context)
  context: RouteContext 
) {
  // Destructure เอา params ออกมาใช้งาน
  const { id: productId } = context.params; 
  
  // ตรวจสอบ Request Body
  // NOTE: การเรียกใช้ await request.json() ต้องอยู่ใน try...catch
  // หรือตรวจสอบก่อนว่า body มีข้อมูลหรือไม่
  let quantity, action;
  try {
    const body = await request.json();
    quantity = body.quantity;
    action = body.action;
  } catch (e) {
    // กรณี body ไม่ใช่ JSON หรือไม่มี
    console.error("Error parsing request body:", e);
    return NextResponse.json(
      { error: "Invalid or missing request body" },
      { status: 400 }
    );
  }

  if (!productId || typeof quantity === 'undefined' || !action) {
    return NextResponse.json(
      { error: "Missing required fields: productId, quantity, or action" },
      { status: 400 }
    );
  }

  // --- ส่วนจัดการ Database ---
  try {
    const conn = await mysqlPool.getConnection();
    await conn.beginTransaction();

    try {
      // NOTE: ถ้า action เป็น 'add' หรือ 'subtract'
      // Query จะต้องแก้ไขเป็นการคำนวณ: stock_quantity = stock_quantity + ?
      
      // Query ปัจจุบัน: กำหนดค่า stock_quantity เป็นค่า quantity ที่ส่งมา (SET operation)
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