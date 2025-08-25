// app/api/admin/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import { ResultSetHeader } from "mysql2";

type OrderStatus = "pending" | "confirmed" | "completed" | "delivered" | "cancelled";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = (await request.json()) as { status: OrderStatus };
    const { id: orderId } = await context.params;

    const validStatuses: OrderStatus[] = [
      "pending",
      "confirmed",
      "completed",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [result] = await mysqlPool.query<ResultSetHeader>(
      "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, orderId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Order status updated successfully",
      status: status,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}