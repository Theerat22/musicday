// app/api/send-email/route.ts
import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import nodemailer from 'nodemailer';
import OrderSummaryEmail from '../../emails/OrderSummaryEmail';

// ตั้งค่า SMTP Transporter (ใช้ Gmail หรือ SMTP provider อื่นๆ)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // เช่น smtp.gmail.com
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER, // email ของคุณ
    pass: process.env.SMTP_PASSWORD, // app password หรือรหัสผ่าน
  },
});

export async function POST(req: Request) {
  // อ่านข้อมูลจาก body ของ request โดยใช้ await req.json()
  const { firstName, lastName, nickname, grade, cart, totalPrice, number } = await req.json();

  if (!nickname || !firstName || !cart || totalPrice === undefined || !number) {
    return NextResponse.json({ message: 'Missing required data' }, { status: 400 });
  }

  // สร้างอีเมลของผู้รับ
  const toEmail = `0${number}@cds.ac.th`;

  try {
    // Render React component เป็น HTML string
    const emailHtml = await render(
      OrderSummaryEmail({
        firstName,
        lastName,
        nickname,
        grade,
        cart,
        totalPrice,
      })
    );

    // Render เป็น plain text version (optional)
    const emailText = await render(
      OrderSummaryEmail({
        firstName,
        lastName,
        nickname,
        grade,
        cart,
        totalPrice,
      }),
      { plainText: true }
    );

    // ส่งอีเมลผ่าน nodemailer
    const info = await transporter.sendMail({
      from: '"CDSC" <cdsc@cdsc-2025.online>', // sender address
      to: toEmail, // list of receivers
      subject: 'รายการสั่งซื้อของคุณ - musicday2025', // Subject line
      text: emailText, // plain text body
      html: emailHtml, // html body
    });

    console.log('Email sent successfully');
    console.log(cart);
    return NextResponse.json({ 
      message: 'Email sent successfully',
      response: info.response 
    }, { status: 200 });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ 
      message: 'Failed to send email', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}