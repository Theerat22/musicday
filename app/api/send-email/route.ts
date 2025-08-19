// app/api/send-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import OrderSummaryEmail from '../../emails/OrderSummaryEmail';

// ตั้งค่า Resend API Key ใน Environment Variable
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  // อ่านข้อมูลจาก body ของ request โดยใช้ await req.json()
  const { firstName, lastName, nickname, grade, cart, totalPrice, number } = await req.json();

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!nickname || !firstName || !cart || totalPrice === undefined || !number) {
    return NextResponse.json({ message: 'Missing required data' }, { status: 400 });
  }

  // สร้างอีเมลของผู้รับ
  const toEmail = `0${number}@cds.ac.th`;

  try {
    const data = await resend.emails.send({
      from: 'CDSC <cdsc@cdsc-2025.online>',
      to: toEmail,
      subject: 'รายการสั่งซื้อของคุณ - CDSC',
      react: OrderSummaryEmail({
        firstName,
        lastName,
        nickname,
        grade,
        cart,
        totalPrice,
      }),
    });

    console.log(data);
    return NextResponse.json({ message: 'Email sent successfully', data }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ message: 'Failed to send email', error: (error as Error).message }, { status: 500 });
  }
}