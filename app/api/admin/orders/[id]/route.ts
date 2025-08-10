// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import { ResultSetHeader } from "mysql2";

interface UpdateOrderRequest {
  status: string;
}

type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status }: UpdateOrderRequest = await request.json();
    const resolvedParams = await params; // Resolve the Promise
    const orderId = resolvedParams.id;

    // Validate status
    const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status as OrderStatus)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const [result] = await mysqlPool.query<ResultSetHeader>(
      "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, orderId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Order status updated successfully",
      status: status 
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}