// app/api/fetchFreshFlowers/route.ts
import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import { RowDataPacket } from "mysql2";

interface FlowerRow extends RowDataPacket {
  id: number;
  name: string;
  price: number;
  colors: string | null;
}

export async function GET() {
  try {
    const query = `
      SELECT 
        f.id,
        f.name,
        f.price,
        GROUP_CONCAT(fc.color) as colors
      FROM fresh_flowers f
      LEFT JOIN fresh_flower_colors fc ON f.id = fc.fresh_flower_id
      GROUP BY f.id, f.name, f.price
      ORDER BY f.id
    `;
    
    const [rows] = await mysqlPool.query<FlowerRow[]>(query);
    
    // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
    const result = rows.map((row: FlowerRow) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      colors: row.colors ? row.colors.split(',') : []
    }));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fresh flowers data" },
      { status: 500 }
    );
  }
}