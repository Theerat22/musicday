import { NextResponse } from "next/server";
import { mysqlPool } from "@/utils/db";

// Define the interface for the second argument (context) separately
// This is done to ensure the function signature remains clean and standard.
interface RouteContext {
  params: {
    id: string;
  };
}

export async function PATCH(
  request: Request,
  // Use the defined interface for the context object. 
  // This structure (Request, ContextObject) is the standard App Router pattern.
  context: RouteContext 
) {
  const productId = context.params.id;
  let quantity: number;
  let action: string;

  // Robustly handle the request body parsing
  try {
    const body = await request.json();
    quantity = body.quantity;
    action = body.action;
  } catch (e) {
    // Corrected the console log to use the variable `e` instead of 'e'
    // This addresses the "Warning: 'e' is defined but never used" in the build output
    console.error("Error parsing request body:", e);
    return NextResponse.json(
      { error: "Invalid or missing JSON body" },
      { status: 400 }
    );
  }

  // Type check the required fields
  if (!productId || typeof quantity === 'undefined' || typeof quantity !== 'number' || !action) {
    return NextResponse.json(
      { error: "Missing or invalid required fields: productId, quantity, or action" },
      { status: 400 }
    );
  }

  try {
    const conn = await mysqlPool.getConnection();
    await conn.beginTransaction();

    try {
      // Database logic
      await conn.query(
        `INSERT INTO pos_product_stock (product_id, stock_quantity)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE stock_quantity = ?`,
        [productId, quantity, quantity]
      );
      
      await conn.commit();
      conn.release();

      return NextResponse.json(
        { message: "Stock updated successfully" },
        { status: 200 }
      );
    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}