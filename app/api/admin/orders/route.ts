import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import type { RowDataPacket, PoolConnection } from "mysql2/promise";

// Interface ที่ใช้ใน Backend (ตรงกับที่ SELECT มา)
interface OrderRow extends RowDataPacket {
  order_id: string; // "MD..."
  customer_name: string;
  customer_contact: string;
  total_price: number; // (aliased from total_amount)
  slip_image_url: string | null;
  order_date: string;
  status: OrderStatus; // (aliased from order_status)

  product_id: number | null;
  product_name: string | null;
  item_price: number | null;
  quantity: number | null;
  product_option: string | null;
}

// Interface ที่จะส่งกลับ (Frontend)
type OrderStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "delivered"
  | "cancelled";

// --- 🟨 FIX: ลบ id ---
interface OrderItem {
  product_id: number | null;
  product_name: string;
  item_price: number;
  quantity: number;
  product_option: string | null;
}

interface Order {
  order_id: string; // "MD..."
  customer_name: string;
  customer_contact: string;
  total_price: number;
  slip_image_url: string | null;
  order_date: string;
  status: OrderStatus;
  items: OrderItem[];
}

export async function GET() {
  let connection: PoolConnection | undefined;
  try {
    connection = await mysqlPool.getConnection();
    
    // --- 🟨 FIX: ลบ oi.id as item_id ออกจาก SELECT ---
    const [rows] = await connection.query<OrderRow[]>(`
      SELECT 
        o.order_id, 
        o.customer_name, 
        o.customer_contact,
        o.total_amount as total_price,
        o.slip_image_url,
        o.order_date,
        o.order_status as status,
        
        oi.product_id,
        oi.product_name,
        oi.item_price,
        oi.quantity,
        oi.product_option
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      ORDER BY o.order_date DESC;
    `);

    connection.release();

    // --- Logic การจัดกลุ่ม (Grouping) ---
    const ordersMap = new Map<string, Order>();

    for (const row of rows) {
      // 1. ตรวจสอบว่ามี Order นี้ใน Map หรือยัง (ใช้ order_id)
      if (!ordersMap.has(row.order_id)) {
        // 2. ถ้ายังไม่มี ให้สร้าง Order object ใหม่
        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          customer_name: row.customer_name,
          customer_contact: row.customer_contact,
          total_price: row.total_price,
          slip_image_url: row.slip_image_url,
          order_date: row.order_date,
          status: row.status,
          items: [], // เริ่มต้นด้วย items ว่างๆ
        });
      }

      // 3. ดึง Order ที่มีอยู่ออกจาก Map (ใช้ order_id)
      const currentOrder = ordersMap.get(row.order_id)!;

      // --- 🟨 FIX: ตรวจสอบด้วย product_name (แทน item_id) ---
      // 4. ตรวจสอบว่าแถวนี้มีข้อมูล item (product_name จะเป็น NULL ถ้า LEFT JOIN ไม่เจอ)
      if (row.product_name) {
        currentOrder.items.push({
          // --- 🟨 FIX: ลบ id ---
          product_id: row.product_id,
          product_name: row.product_name,
          item_price: row.item_price!,
          quantity: row.quantity!,
          product_option: row.product_option,
        });
      }
    }

    // 5. แปลงค่าจาก Map กลับเป็น Array
    const groupedOrders = Array.from(ordersMap.values());

    return NextResponse.json(groupedOrders);

  } catch (error) {
    console.error("Failed to fetch orders:", error);
    if (connection) connection.release();
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

