// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

export async function GET() {
  try {
    const [rows] = await mysqlPool.query(`
      SELECT 
        o.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'price', oi.price,
            'color', oi.color,
            'wrapping', oi.wrapping,
            'cart_id', oi.cart_id
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.order_date DESC
    `);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}