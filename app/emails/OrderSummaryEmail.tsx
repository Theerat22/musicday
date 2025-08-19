// src/emails/OrderSummaryEmail.tsx
import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
} from "@react-email/components";
import { CartItem } from "../components/Flower/types";

interface OrderSummaryEmailProps {
  firstName: string;
  lastName: string;
  nickname: string;
  grade: string;
  cart: CartItem[];
  totalPrice: number;
}

export const OrderSummaryEmail = ({
  firstName,
  lastName,
  nickname,
  grade,
  cart,
  totalPrice,
}: OrderSummaryEmailProps) => {
  return (
    <Html lang="th">
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>ขอบคุณสำหรับการสั่งซื้อ!</Heading>
          <Text style={paragraph}>สวัสดีคุณ {firstName},</Text>
          <Text style={paragraph}>
            เราได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว รายละเอียดการสั่งซื้อมีดังนี้:
          </Text>

          <Section style={section}>
            <Heading as="h2" style={h2}>
              ข้อมูลลูกค้า
            </Heading>
            <Text style={detailText}>
              <strong style={strong}>ชื่อ-นามสกุล:</strong> {firstName} {lastName}
            </Text>
            <Text style={detailText}>
              <strong style={strong}>ชื่อเล่น:</strong> {nickname}
            </Text>
            <Text style={detailText}>
              <strong style={strong}>ชั้น:</strong> {grade}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={section}>
            <Heading as="h2" style={h2}>
              รายการสินค้า
            </Heading>
            {cart.map((item) => (
              <div key={item.cartId} style={itemContainer}>
                <Text style={itemName}>{item.name}</Text>
                <Text style={itemDetail}>
                  <strong style={strong}>ราคา:</strong> ฿{item.price.toLocaleString()}
                </Text>
                <Text style={itemDetail}>
                  <strong style={strong}>สี:</strong> {item.color}
                </Text>
                <Text style={itemDetail}>
                  <strong style={strong}>กระดาษห่อ:</strong> {item.wrapping}
                </Text>
              </div>
            ))}
          </Section>

          <Hr style={hr} />

          <Section style={section}>
            <Text style={totalPriceText}>
              <strong style={strong}>ยอดรวมทั้งหมด:</strong>{' '}
              <span style={priceHighlight}>
                ฿{totalPrice.toLocaleString('th-TH')}
              </span>
            </Text>
          </Section>

          <Text style={footerText}>
            อย่าลืมมารับดอกไม้ในงานมิวสิคเดย์น้าา
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles for the email template
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#171a1f',
  fontSize: '24px',
  fontWeight: '600',
  textAlign: 'center' as const,
  margin: '30px 0',
  padding: '0 20px',
};

const h2 = {
  color: '#343840',
  fontSize: '18px',
  fontWeight: '600',
  margin: '20px 0 10px',
};

const paragraph = {
  color: '#5b616e',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '10px 0',
  padding: '0 20px',
};

const strong = {
  color: '#171a1f',
  fontWeight: '600',
};

const detailText = {
  color: '#5b616e',
  fontSize: '14px',
  margin: '4px 0',
};

const itemContainer = {
  backgroundColor: '#f7f8f9',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '10px',
};

const itemName = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#171a1f',
  marginBottom: '4px',
};

const itemDetail = {
  fontSize: '14px',
  color: '#5b616e',
  margin: '2px 0',
};

const hr = {
  borderTop: '1px solid #e0e6ed',
  margin: '20px 0',
};

const section = {
  padding: '0 20px',
};

const totalPriceText = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#171a1f',
  margin: '20px 0 0',
};

const priceHighlight = {
  color: '#0066ff',
};

const footerText = {
  color: '#9098a5',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '40px 0 0',
};

export default OrderSummaryEmail;