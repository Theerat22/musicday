/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
// ========== แก้ไข Cloudinary Configuration ==========
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mysqlPool } from "@/utils/db";
import { v2 as cloudinary } from 'cloudinary';
import type { ResultSetHeader } from "mysql2";
import fs from 'fs';
import path from "path";

interface CartItem {
  id: number;
  name: string;
  price: number | string;
  color: string;
  wrapping: string;
  cartId: string;
}

// ตรวจสอบและตั้งค่า Cloudinary โดยใช้ CLOUDINARY_URL
if (!process.env.CLOUDINARY_URL) {
  console.error('Missing CLOUDINARY_URL environment variable');
}

// Config โดยใช้ CLOUDINARY_URL
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

// ตรวจสอบการเชื่อมต่อ Cloudinary
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

// อัพโหลดไฟล์ไป Cloudinary (แก้ไขแล้ว)
async function uploadToCloudinary(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // ตรวจสอบ configuration ก่อน
      if (!process.env.CLOUDINARY_URL) {
        reject(new Error('CLOUDINARY_URL is not set in environment variables'));
        return;
      }

      console.log('Cloudinary config check:', {
        cloudinary_url: process.env.CLOUDINARY_URL ? 'Set' : 'Not Set',
        url_preview: process.env.CLOUDINARY_URL ? 
          process.env.CLOUDINARY_URL.replace(/(cloudinary:\/\/[^:]*:[^@]*)@/, 'cloudinary://***:***@') : 'Not Set'
      });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'order-slips',
          public_id: `slip_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          resource_type: 'auto',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
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

// ฟังก์ชัน fallback สำหรับกรณี Cloudinary ไม่พร้อมใช้งาน
async function uploadToLocalStorage(file: File): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // สร้างชื่อไฟล์
    const fileName = `slip_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
    const uploadDir = './public/uploads/slips';
    
    const fs = require('fs');
    const path = require('path');
    
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
    if (!firstName || !lastName || !nickname || !grade || !cartData || !totalPriceStr) {
      return NextResponse.json({ 
        error: "Missing required fields",
        details: "firstName, lastName, nickname, grade, cartData, totalPrice are required"
      }, { status: 400 });
    }

    if (!slipImage || slipImage.size === 0) {
      return NextResponse.json({ 
        error: "No slip image provided" 
      }, { status: 400 });
    }

    // ตรวจสอบชนิดไฟล์
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(slipImage.type)) {
      return NextResponse.json({ 
        error: "Invalid file type",
        details: "Only JPEG, PNG, and WebP are allowed"
      }, { status: 400 });
    }

    // ตรวจสอบขนาดไฟล์ (10MB)
    if (slipImage.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: "File size too large",
        details: "Maximum 10MB allowed"
      }, { status: 400 });
    }

    console.log('Processing order with slip image:', {
      fileName: slipImage.name,
      fileSize: slipImage.size,
      fileType: slipImage.type
    });

    // แปลง cart data
    let cart: CartItem[];
    try {
      cart = JSON.parse(cartData);
    } catch (error) {
      return NextResponse.json({ 
        error: "Invalid cart data format" 
      }, { status: 400 });
    }

    // อัพโหลดรูปสลิป (ลองหลายวิธี)
    let slipImageUrl: string;
    
    try {
      // ลอง Cloudinary ก่อน
      if (await testCloudinaryConnection()) {
        slipImageUrl = await uploadToCloudinary(slipImage);
      } else {
        throw new Error('Cloudinary not available');
      }
    } catch (cloudinaryError) {
      console.error('Cloudinary upload failed, trying local storage:', cloudinaryError);
      
      try {
        // ถ้า Cloudinary ไม่ได้ ใช้ local storage
        slipImageUrl = await uploadToLocalStorage(slipImage);
        console.log('Using local storage fallback:', slipImageUrl);
      } catch (localError) {
        console.error('All upload methods failed:', localError);
        return NextResponse.json({ 
          error: "Failed to upload slip image",
          details: "Both Cloudinary and local storage failed"
        }, { status: 500 });
      }
    }

    // สร้างเลขที่ออเดอร์
    const orderNumber = generateOrderNumber();

    // เชื่อมต่อฐานข้อมูล
    const connection = await mysqlPool.getConnection();
    
    try {
      await connection.beginTransaction();

      // บันทึกข้อมูลออเดอร์
      const [orderResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO orders 
         (order_number, first_name, last_name, nickname, grade, total_price, slip_image_url, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          orderNumber,
          firstName,
          lastName,
          nickname,
          grade,
          parseFloat(totalPriceStr),
          slipImageUrl,
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

      console.log('Order created successfully:', {
        orderNumber,
        orderId,
        customerName: `${firstName} ${lastName}`,
        totalPrice: totalPriceStr,
        itemsCount: cart.length,
        slipImageUrl
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
      throw dbError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Order creation error:", error);
    
    return NextResponse.json({ 
      error: "Failed to create order",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}