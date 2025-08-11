import { NextResponse } from "next/server";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

export async function POST(req: Request) {
  try {
    // แก้ไขให้รับ totalPrice แทน amount
    const { totalPrice } = await req.json();
    const phoneNumber = '004999219455663';
    
    if (!phoneNumber || !totalPrice) {
      return NextResponse.json(
        { error: "กรุณาระบุ phoneNumber และ totalPrice" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า totalPrice เป็นตัวเลขและมากกว่า 0
    if (typeof totalPrice !== 'number' || totalPrice <= 0) {
      return NextResponse.json(
        { error: "totalPrice ต้องเป็นตัวเลขที่มากกว่า 0" },
        { status: 400 }
      );
    }

    console.log('Generating QR for amount:', totalPrice);
    console.log('Phone number:', phoneNumber);

    // สร้าง payload สำหรับ PromptPay
    const payload = generatePayload(phoneNumber, { amount: totalPrice });
    
    // แปลง payload เป็น QR code (Data URL)
    const qrCodeDataUrl = await QRCode.toDataURL(payload);
    
    return NextResponse.json({ qrCodeDataUrl });
    
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้าง QR code:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้าง QR Code ได้" }, 
      { status: 500 }
    );
  }
}