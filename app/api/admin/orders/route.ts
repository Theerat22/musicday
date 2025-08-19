// app/api/admin/orders/route.ts
import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import { RowDataPacket } from "mysql2";

// กำหนด Interface สำหรับข้อมูลที่ดึงจากตาราง order_bouquet_items
interface BouquetItem extends RowDataPacket {
  order_item_cart_id: string;
  flower_id: number;
  flower_name: string;
  flower_color: string;
  flower_price: number;
  quantity: number;
}

// กำหนด Interface สำหรับข้อมูลที่ดึงจากตาราง order_items
interface OrderItemDB extends RowDataPacket {
  order_id: number;
  id: number;
  product_id: number | null;
  product_name: string;
  price: number;
  color: string;
  wrapping: string;
  cart_id: string;
}

// กำหนด Interface สำหรับข้อมูลที่ดึงจากตาราง orders
interface OrderDB extends RowDataPacket {
  id: number;
  order_number: string;
  first_name: string;
  last_name: string;
  nickname: string;
  grade: string;
  total_price: number;
  slip_image_url: string | null;
  order_date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const [ordersResult] = await mysqlPool.query<OrderDB[]>(`
      SELECT 
        id, 
        order_number, 
        first_name, 
        last_name, 
        nickname, 
        grade, 
        total_price, 
        slip_image_url, 
        order_date, 
        status, 
        created_at, 
        updated_at
      FROM orders
      ORDER BY order_date DESC
    `);

    const [itemsResult] = await mysqlPool.query<OrderItemDB[]>(`
      SELECT 
        order_id,
        id,
        product_id,
        product_name,
        price,
        color,
        wrapping,
        cart_id
      FROM order_items
    `);

    const [bouquetItemsResult] = await mysqlPool.query<BouquetItem[]>(`
      SELECT 
        order_item_cart_id,
        flower_id,
        flower_name,
        flower_color,
        flower_price,
        quantity
      FROM order_bouquet_items
    `);

    // สร้าง Map เพื่อจัดกลุ่มข้อมูลตาม cart_id เพื่อความเร็วในการค้นหา
    const bouquetMap = new Map<string, BouquetItem[]>();
    bouquetItemsResult.forEach(item => {
      if (!bouquetMap.has(item.order_item_cart_id)) {
        bouquetMap.set(item.order_item_cart_id, []);
      }
      bouquetMap.get(item.order_item_cart_id)!.push(item);
    });

    // สร้าง Map เพื่อจัดกลุ่มรายการสินค้าตาม order_id
    const itemsMap = new Map<number, OrderItemDB[]>();
    itemsResult.forEach(item => {
      // รวมข้อมูล bouquet เข้ากับ item หลัก
      const bouquetDetails = bouquetMap.get(item.cart_id) || [];
      const orderItem = { ...item, bouquet_details: bouquetDetails };
      
      if (!itemsMap.has(item.order_id)) {
        itemsMap.set(item.order_id, []);
      }
      itemsMap.get(item.order_id)!.push(orderItem);
    });

    // รวมข้อมูลทั้งหมดเข้าด้วยกัน
    const ordersWithItems = ordersResult.map(order => {
      const items = itemsMap.get(order.id) || [];
      return { ...order, items: items };
    });

    return NextResponse.json(ordersWithItems);

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}