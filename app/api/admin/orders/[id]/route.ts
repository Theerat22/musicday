import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mysqlPool } from "@/utils/db";
import type { ResultSetHeader, PoolConnection } from "mysql2/promise";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "delivered"
  | "cancelled";

// รายการสถานะที่อนุญาตให้อัปเดต
const ALLOWED_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "delivered",
  "cancelled",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } } // "id" ในที่นี้คือ order_id (string "MD...")
) {
  const { id: orderId } = params; // เปลี่ยนชื่อตัวแปรเพื่อความชัดเจน
  let connection: PoolConnection | undefined;

  try {
    const { status } = (await req.json()) as { status: OrderStatus };

    // Validation 1: ตรวจสอบ Status ที่ส่งมา
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status provided" },
        { status: 400 }
      );
    }

    // Validation 2: (ลบการตรวจสอบ parseInt)
    // 'orderId' คือ string (เช่น "MD...") ที่มาจาก URL
    if (!orderId) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    connection = await mysqlPool.getConnection();
    
    // --- 🟨 FIX ---
    // เปลี่ยน WHERE id = ? (ตัวเลข)
    // เป็น WHERE order_id = ? (ข้อความ)
    const [result] = await connection.execute<ResultSetHeader>(
      "UPDATE orders SET order_status = ? WHERE order_id = ?",
      [status, orderId] // ใช้ orderId (string)
    );

    if (result.affectedRows === 0) {
      // ไม่พบ Order ID นี้ในระบบ
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} updated to ${status}`, // ใช้ orderId (string)
    });
  } catch (error) {
    console.error("Failed to update order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

