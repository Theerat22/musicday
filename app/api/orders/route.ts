import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mysqlPool } from "@/utils/db";
import { writeFile } from "fs/promises";
import { mkdir } from "fs/promises";
import path from "path";
import type { ResultSetHeader } from "mysql2";

interface CartItem {
  id: number;
  name: string;
  price: number | string;
  color: string;
  wrapping: string;
  cartId: string;
}

// รูปแบบสั้นกว่า (12 หลัก)
function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");  
  return `MD${year}${month}${day}${hours}${minutes}`;
}

async function saveFile(file: File): Promise<string> {
  const uploadDir = process.env.NODE_ENV === 'production' 
    ? "/tmp" 
    : path.join(process.cwd(), "public", "uploads", "slips");

  try {
    // สร้างโฟลเดอร์ถ้ายังไม่มี (สำหรับ development)
    if (process.env.NODE_ENV !== 'production') {
      await mkdir(uploadDir, { recursive: true });
    }

    // สร้างชื่อไฟล์ใหม่
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);

    // แปลง File เป็น Buffer และบันทึก
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return different paths based on environment
    return process.env.NODE_ENV === 'production' 
      ? filePath  // Full path for production
      : `/uploads/slips/${fileName}`; // Relative path for development

  } catch (error) {
    console.error('File save error:', error);
    throw new Error('Failed to save file');
  }
}

export async function POST(req: NextRequest) {
  try {
    // รับ FormData จาก request
    const formData = await req.formData();

    // ดึงข้อมูลจาก FormData
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const nickname = formData.get('nickname') as string;
    const grade = formData.get('grade') as string;
    const cartData = formData.get('cart') as string;
    const totalPriceStr = formData.get('totalPrice') as string;
    const slipImage = formData.get('slipImage') as File;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!firstName || !lastName || !nickname || !grade || !cartData || !totalPriceStr || !slipImage) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // แปลง cart data
    const cart: CartItem[] = JSON.parse(cartData);

    // บันทึกไฟล์สลิป
    const slipImagePath = await saveFile(slipImage);

    // สร้างเลขที่ออเดอร์
    const orderNumber = generateOrderNumber();

    // เชื่อมต่อฐานข้อมูล
    const connection = await mysqlPool.getConnection();
    await connection.beginTransaction();

    try {
      // บันทึกข้อมูลออเดอร์
      const [orderResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO orders 
         (order_number, first_name, last_name, nickname, grade, total_price, slip_image_path, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          orderNumber,
          firstName,
          lastName,
          nickname,
          grade,
          parseFloat(totalPriceStr),
          slipImagePath,
        ]
      );

      const orderId = orderResult.insertId;

      // บันทึกรายการสินค้า
      for (const item of cart) {
        await connection.execute(
          `INSERT INTO order_items 
           (order_id, product_id, product_name, price, color, wrapping, cart_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.id,
            item.name,
            typeof item.price === "string" ? parseFloat(item.price) : item.price,
            item.color,
            item.wrapping,
            item.cartId,
          ]
        );
      }

      await connection.commit();
      connection.release();

      console.log('Order created successfully:', {
        orderNumber,
        orderId,
        customerName: `${firstName} ${lastName}`,
        totalPrice: totalPriceStr,
        itemsCount: cart.length
      });

      return NextResponse.json({
        success: true,
        message: "Order created successfully",
        orderNumber,
        orderId,
      });

    } catch (dbError) {
      await connection.rollback();
      connection.release();
      console.error("Database error:", dbError);
      throw dbError;
    }

  } catch (error) {
    console.error("Order creation error:", error);
    
    return NextResponse.json({ 
      error: "Failed to create order",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}