import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import { RowDataPacket } from "mysql2";

// Define interface for the query result
interface SalesDataDB extends RowDataPacket {
  order_date: string;
  product_name: string;
  quantity: number;
}

export async function GET() {
  try {
    const [salesData] = await mysqlPool.query<SalesDataDB[]>(`
      SELECT
        DATE(o.order_date) as order_date,
        p.name as product_name,
        SUM(poi.quantity) as quantity
      FROM pos_orders o
      JOIN pos_order_items poi ON o.id = poi.order_id
      JOIN pos_product p ON poi.product_id = p.id
      GROUP BY DATE(o.order_date), p.name
      ORDER BY order_date ASC
    `);

    // Transform data for the chart component
    const formattedData: Record<string, Record<string, number>> = {};
    salesData.forEach(row => {
      const date = row.order_date;
      const productName = row.product_name;
      const quantity = row.quantity;
      if (!formattedData[date]) {
        formattedData[date] = {};
      }
      formattedData[date][productName] = quantity;
    });

    return NextResponse.json(formattedData);

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales data" },
      { status: 500 }
    );
  }
}