// app/api/fetchPreservedFlowers/route.ts
import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import { RowDataPacket } from "mysql2";

interface PreservedFlowerRow extends RowDataPacket {
  id: number;
  name: string;
  price: number;
}

export async function GET() {
  try {
    const query = `
      SELECT 
        id,
        name,
        price
      FROM preserved_flowers
      ORDER BY id
    `;
    
    const [rows] = await mysqlPool.query<PreservedFlowerRow[]>(query);
    
    // สำหรับดอกไม้กัมมะหยี่ ไม่มีการเลือกสีตามตัวอย่าง
    // แต่ถ้าต้องการเพิ่มสีก็สามารถทำได้เหมือนดอกไม้สด
    const result = rows.map((row: PreservedFlowerRow) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      colors: ['ธรรมชาติ'] // สีเริ่มต้นสำหรับดอกไม้กัมมะหยี่
    }));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preserved flowers data" },
      { status: 500 }
    );
  }
}