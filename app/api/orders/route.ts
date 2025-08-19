/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mysqlPool } from "@/utils/db";
import { v2 as cloudinary } from 'cloudinary';
import type { ResultSetHeader } from "mysql2";
import fs from 'fs';
import path from "path";

// ปรับปรุง CartItem Interface ให้ถูกต้องและสมบูรณ์
interface FlowerSelection {
  flowerId: number;
  name: string;
  color: string;
  price: number | string;
  quantity: number;
}

interface CartItem {
  id: number | null;
  name: string;
  price: number | string;
  image: string;
  cartId: string;
  type?: "single" | "fresh_bouquet" | "preserved_bouquet";
  flowers?: FlowerSelection[];
  arrangementFee?: number;
  color: string;
  wrapping: string;
}

// ตรวจสอบและตั้งค่า Cloudinary โดยใช้ CLOUDINARY_URL
if (!process.env.CLOUDINARY_URL) {
  console.error('Missing CLOUDINARY_URL environment variable');
}
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

async function testCloudinaryConnection(): Promise<boolean> {
  try {
    await cloudinary.api.ping();
    return true;
  } catch (error) {
    console.error('Cloudinary connection test failed:', error);
    return false;
  }
}

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `MD${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function uploadToCloudinary(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!process.env.CLOUDINARY_URL) {
        reject(new Error('CLOUDINARY_URL is not set in environment variables'));
        return;
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'order-slips',
          public_id: `slip_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          resource_type: 'auto',
          transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
          invalidate: true,
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error(`Failed to upload to Cloudinary: ${error.message}`));
          } else if (result) {
            console.log('Cloudinary upload success:', result.secure_url);
            resolve(result.secure_url);
          } else {
            reject(new Error('No result from Cloudinary upload'));
          }
        }
      );
      uploadStream.end(buffer);
    } catch (error) {
      console.error('Upload preparation error:', error);
      reject(error);
    }
  });
}

async function uploadToLocalStorage(file: File): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `slip_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
    const uploadDir = './public/uploads/slips';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/slips/${fileName}`;
  } catch (error) {
    console.error('Local upload error:', error);
    throw new Error('Failed to upload file locally');
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const nickname = formData.get('nickname') as string;
    const grade = formData.get('grade') as string;
    const cartData = formData.get('cart') as string;
    const totalPriceStr = formData.get('totalPrice') as string;
    const slipImage = formData.get('slipImage') as File;

    if (!firstName || !lastName || !nickname || !grade || !cartData || !totalPriceStr) {
      return NextResponse.json({ error: "Missing required fields", details: "firstName, lastName, nickname, grade, cartData, totalPrice are required" }, { status: 400 });
    }
    if (!slipImage || slipImage.size === 0) {
      return NextResponse.json({ error: "No slip image provided" }, { status: 400 });
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(slipImage.type)) {
      return NextResponse.json({ error: "Invalid file type", details: "Only JPEG, PNG, and WebP are allowed" }, { status: 400 });
    }
    if (slipImage.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size too large", details: "Maximum 10MB allowed" }, { status: 400 });
    }

    let cart: CartItem[];
    try {
      cart = JSON.parse(cartData);
    } catch (error) {
      return NextResponse.json({ error: "Invalid cart data format" }, { status: 400 });
    }

    let slipImageUrl: string;
    try {
      if (await testCloudinaryConnection()) {
        slipImageUrl = await uploadToCloudinary(slipImage);
      } else {
        throw new Error('Cloudinary not available');
      }
    } catch (cloudinaryError) {
      console.error('Cloudinary upload failed, trying local storage:', cloudinaryError);
      try {
        slipImageUrl = await uploadToLocalStorage(slipImage);
        console.log('Using local storage fallback:', slipImageUrl);
      } catch (localError) {
        console.error('All upload methods failed:', localError);
        return NextResponse.json({ error: "Failed to upload slip image", details: "Both Cloudinary and local storage failed" }, { status: 500 });
      }
    }

    const orderNumber = generateOrderNumber();
    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();

      const [orderResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO orders (order_number, first_name, last_name, nickname, grade, total_price, slip_image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [orderNumber, firstName, lastName, nickname, grade, parseFloat(totalPriceStr), slipImageUrl]
      );
      const orderId = orderResult.insertId;

      // บันทึกรายการสินค้าแต่ละประเภท
      for (const item of cart) {
        // บันทึกรายการหลักลงใน order_items
        await connection.execute(
          `INSERT INTO order_items (order_id, product_id, product_name, price, color, wrapping, cart_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            // ใช้ null ถ้าเป็นช่อดอกไม้ หรือใช้ item.id ถ้าเป็นดอกไม้เดี่ยว
            item.type === "single" ? item.id : null,
            item.name,
            typeof item.price === "string" ? parseFloat(item.price) : item.price,
            item.color || '',
            item.wrapping || '',
            item.cartId,
          ]
        );
        
        // ถ้าเป็นช่อดอกไม้ ให้บันทึกรายละเอียดดอกไม้ลงในตารางใหม่
        if (item.type === "fresh_bouquet" || item.type === "preserved_bouquet") {
          if (item.flowers && item.flowers.length > 0) {
            for (const flower of item.flowers) {
              await connection.execute(
                `INSERT INTO order_bouquet_items (order_item_cart_id, flower_id, flower_name, flower_color, flower_price, quantity) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  item.cartId,
                  flower.flowerId,
                  flower.name,
                  flower.color,
                  typeof flower.price === "string" ? parseFloat(flower.price) : flower.price,
                  flower.quantity,
                ]
              );
            }
          }
        }
      }

      await connection.commit();
      console.log('Order created successfully:', {
        orderNumber,
        orderId,
        customerName: `${firstName} ${lastName}`,
        totalPrice: totalPriceStr,
        itemsCount: cart.length,
        slipImageUrl,
      });

      return NextResponse.json({
        success: true,
        message: "Order created successfully",
        orderNumber,
        orderId,
        slipImageUrl,
      });
    } catch (dbError) {
      await connection.rollback();
      console.error("Database error:", dbError);
      return NextResponse.json({
        error: "Failed to create order in database",
        details: dbError instanceof Error ? dbError.message : "Unknown database error",
      }, { status: 500 });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({
      error: "Failed to create order",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}