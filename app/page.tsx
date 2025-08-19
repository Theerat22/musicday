import React from "react";
// import Products from "./components/Products";
import Products from "./components/Test";

export default function Home() {
  return (
    <section className="min-h-screen bg-white mt-4">
      <Products />
      <footer className="bg-blue-950 p-1">
        <p className="text-center text-sm p-3 text-white">
          &copy; CD Student Council 2025 x ชุมนุมจัดดอกไม้ x ชุมนุม Do It Yourself
        </p>
      </footer>
    </section>
  );
}