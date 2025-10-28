/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mysqlPool } from "@/utils/db";
import { v2 as cloudinary } from "cloudinary";
import type { ResultSetHeader, PoolConnection } from "mysql2/promise";
import fs from "fs";
import path from "path";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
  option: string;
  quantity: number;
  cartId: string;
  category: "bag" | "keychain" | "shirt" | "other";
}

if (!process.env.CLOUDINARY_URL) {
  console.error("Missing CLOUDINARY_URL environment variable");
}
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

async function testCloudinaryConnection(): Promise<boolean> {
  try {
    await cloudinary.api.ping();
    return true;
  } catch (error) {
    console.error("Cloudinary connection test failed:", error);
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
  const ms = now.getMilliseconds().toString().padStart(3, "0");
  // --- FIX 1: Add random suffix for uniqueness ---
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `MD${year}${month}${day}${hours}${minutes}${seconds}${ms}${randomSuffix.toUpperCase()}`;
}

async function uploadToCloudinary(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!process.env.CLOUDINARY_URL) {
        reject(new Error("CLOUDINARY_URL is not set in environment variables"));
        return;
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "order-slips",
          public_id: `slip_${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}`,
          resource_type: "auto",
          transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
          invalidate: true,
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(
              new Error(`Failed to upload to Cloudinary: ${error.message}`)
            );
          } else if (result) {
            console.log("Cloudinary upload success:", result.secure_url);
            resolve(result.secure_url);
          } else {
            reject(new Error("No result from Cloudinary upload"));
          }
        }
      );
      uploadStream.end(buffer);
    } catch (error) {
      console.error("Upload preparation error:", error);
      reject(error);
    }
  });
}

async function uploadToLocalStorage(file: File): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `slip_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.${file.name.split(".").pop()}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "slips");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/slips/${fileName}`; // คืนค่า URL ที่เข้าถึงได้
  } catch (error) {
    console.error("Local upload error:", error);
    throw new Error("Failed to upload file locally");
  }
}

// --- POST Handler (Merged) ---

export async function POST(req: NextRequest) {
  let connection: PoolConnection | undefined;

  try {
    // 1. FormData Parsing & Validation
    const formData = await req.formData();
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const nickname = formData.get("nickname") as string;
    const grade = formData.get("grade") as string;
    const number = formData.get("number") as string;
    const cartData = formData.get("cart") as string;
    const totalPriceStr = formData.get("totalPrice") as string;
    const slipImage = formData.get("slipImage") as File;

    if (
      !firstName ||
      !lastName ||
      !nickname ||
      !grade ||
      !number ||
      !cartData ||
      !totalPriceStr
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details:
            "firstName, lastName, nickname, grade, number, cartData, totalPrice are required",
        },
        { status: 400 }
      );
    }
    if (!slipImage || slipImage.size === 0) {
      return NextResponse.json(
        { error: "No slip image provided" },
        { status: 400 }
      );
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(slipImage.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type",
          details: "Only JPEG, PNG, and WebP are allowed",
        },
        { status: 400 }
      );
    }
    if (slipImage.size > 10 * 1024 * 1024) {
      // 10MB limit
      return NextResponse.json(
        { error: "File size too large", details: "Maximum 10MB allowed" },
        { status: 400 }
      );
    }

    let cart: CartItem[];
    try {
      cart = JSON.parse(cartData);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid cart data format" },
        { status: 400 }
      );
    }

    let slipImageUrl: string = "";

    // --- FIX 2: Stop order if all upload methods fail ---
    try {
      if (await testCloudinaryConnection()) {
        console.log("Attempting Cloudinary upload...");
        slipImageUrl = await uploadToCloudinary(slipImage);
      } else {
        throw new Error("Cloudinary connection test failed. Trying local storage.");
      }
    } catch (cloudinaryError) {
      console.error(
        "Cloudinary upload failed, trying local storage:",
        cloudinaryError
      );
      try {
        console.log("Attempting local storage upload...");
        slipImageUrl = await uploadToLocalStorage(slipImage);
        console.log("Using local storage fallback:", slipImageUrl);
      } catch (localError) {
        console.error("All upload methods failed:", localError);
        // All methods failed. Throw error to stop the process.
        throw new Error("Failed to upload slip image using all methods.");
      }
    }

    // 3. Prepare Order Data
    const orderId = generateOrderNumber();
    const customerName = `${firstName} ${lastName} (${nickname})`;
    const customerContact = `Class: ${grade}, ID: ${number}`;
    const totalPrice = parseFloat(totalPriceStr);

    connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();

      // This is correct (using execute for single insert)
      const [orderResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO orders (order_id, customer_name, customer_contact, total_amount, slip_image_url, order_status, order_date) 
         VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
        [orderId, customerName, customerContact, totalPrice, slipImageUrl]
      );

      const orderItemsData = cart.map((item) => {
        const itemPrice =
          typeof item.price === "string" ? parseFloat(item.price) : item.price;
        return [
          orderId,
          item.id,
          item.name,
          itemPrice,
          item.quantity,
          item.option || null,
        ];
      });

      // --- FIX 3: Change .execute to .query for Bulk Insert ---
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, item_price, quantity, product_option) 
         VALUES ?`,
        [orderItemsData]
      );

      await connection.commit();
      console.log("Order created successfully:", {
        orderId,
        customerName,
        customerContact,
        totalPrice: totalPriceStr,
        itemsCount: cart.length,
        slipImageUrl,
      });

      return NextResponse.json({
        success: true,
        message: "Order created successfully",
        orderId,
        slipImageUrl,
      });
    } catch (dbError) {
      await connection.rollback();
      console.error("Database error:", dbError);
      return NextResponse.json(
        {
          error: "Failed to create order in database",
          details:
            dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

