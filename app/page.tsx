import React from "react";
import Products from "./components/Products";

export default function Home() {
  return (
    <section className="min-h-screen bg-white mt-4">
      <Products />
      <footer className="bg-blue-950 p-1">
        <p className="text-center p-3 text-white">
          &copy; 2025 Music Day. สิทธาทำเว็ปเองจ้า
        </p>
      </footer>
    </section>
  );
}