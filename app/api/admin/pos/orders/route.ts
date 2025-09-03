import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import { RowDataPacket } from "mysql2";

// Define interfaces for API data
export interface OrderItem {
  product_name: string;
  quantity: number;
}

export interface Order extends RowDataPacket {
  id: number;
  order_date: string;
  total_amount: number;
  payment_method: "cash" | "transfer" | "credit";
  note: string | null;
  product_names: string;
  quantities: string;
}

export async function GET() {
  try {
    const [orders] = await mysqlPool.query<Order[]>(`
      SELECT
        o.id,
        o.order_date,
        o.total_amount,
        o.payment_method,
        o.note,
        GROUP_CONCAT(p.name SEPARATOR ', ') AS product_names,
        GROUP_CONCAT(poi.quantity SEPARATOR ', ') AS quantities
      FROM pos_orders o
      JOIN pos_order_items poi ON o.id = poi.order_id
      JOIN pos_product p ON poi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.order_date DESC
      LIMIT 20
    `);

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, total_amount, payment_method, note } = await request.json();

    if (!id || !total_amount || !payment_method) {
      return NextResponse.json({ error: "Required fields are missing" }, { status: 400 });
    }

    await mysqlPool.query(
      "UPDATE pos_orders SET total_amount = ?, payment_method = ?, note = ? WHERE id = ?",
      [total_amount, payment_method, note, id]
    );

    return NextResponse.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    await mysqlPool.query("DELETE FROM pos_orders WHERE id = ?", [id]);

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}