import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";
import { RowDataPacket, OkPacket } from "mysql2";

// Define interfaces for incoming data and database operations
interface IncomingCartItem {
  id: number;
  price: number;
  cart_quantity: number;
}

export async function POST(request: Request) {
  const { cart, payment_method } = await request.json();

  if (!cart || cart.length === 0 || !payment_method) {
    return NextResponse.json(
      { error: "Cart is empty or payment method is missing" },
      { status: 400 }
    );
  }

  const conn = await mysqlPool.getConnection();
  await conn.beginTransaction();

  try {
    const totalAmount = cart.reduce(
      (sum: number, item: IncomingCartItem) =>
        sum + item.price * item.cart_quantity,
      0
    );

    // Step 1: Check if there is enough stock for all items
    for (const item of cart) {
      const [stockResult] = await conn.query<RowDataPacket[]>(
        `SELECT stock_quantity FROM pos_product_stock WHERE product_id = ? FOR UPDATE`,
        [item.id]
      );

      const currentStock = stockResult[0]?.stock_quantity || 0;
      if (currentStock < item.cart_quantity) {
        await conn.rollback();
        conn.release();
        return NextResponse.json(
          { error: `Stock for product ID ${item.id} is insufficient.` },
          { status: 400 }
        );
      }
    }

    // Step 2: Create a new order (transaction)
    const [orderResult] = await conn.query<OkPacket>(
      `INSERT INTO pos_orders (total_amount, payment_method) VALUES (?, ?)`,
      [totalAmount, payment_method]
    );
    const orderId = orderResult.insertId;

    // Step 3: Insert each item into pos_order_items and decrease stock
    for (const item of cart) {
      const subtotal = item.price * item.cart_quantity;

      // Insert item into pos_order_items
      await conn.query(
        `INSERT INTO pos_order_items (order_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.id, item.cart_quantity, item.price, subtotal]
      );

      // Decrease stock quantity
      await conn.query(
        `UPDATE pos_product_stock SET stock_quantity = stock_quantity - ? WHERE product_id = ?`,
        [item.cart_quantity, item.id]
      );
    }

    // Step 4: Commit the transaction
    await conn.commit();
    conn.release();

    return NextResponse.json(
      { message: "Transaction completed successfully", orderId },
      { status: 200 }
    );
  } catch (error) {
    // If any step fails, roll back the transaction
    await conn.rollback();
    conn.release();
    console.error("Transaction failed:", error);
    return NextResponse.json(
      { error: "Failed to process transaction" },
      { status: 500 }
    );
  }
}