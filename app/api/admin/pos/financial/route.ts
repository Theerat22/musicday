import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import { RowDataPacket } from "mysql2";

// Define interface for the result
interface FinancialDataDB extends RowDataPacket {
  product_id: number;
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
}

export async function GET() {
  try {
    // Use JOIN and GROUP BY to calculate total quantity and revenue per product
    const [financialData] = await mysqlPool.query<FinancialDataDB[]>(`
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        SUM(poi.quantity) AS total_quantity_sold,
        SUM(poi.subtotal) AS total_revenue
      FROM pos_product p
      JOIN pos_order_items poi ON p.id = poi.product_id
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
    `);

    return NextResponse.json(financialData);

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial data" },
      { status: 500 }
    );
  }
}