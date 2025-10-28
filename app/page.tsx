import React from "react";
import Products from "./components/Product_56";

export default function Home() {
  return (
    <section className="min-h-screen bg-white flex flex-col justify-center text-center ">
      <Products />
      <footer className="bg-gray-900 text-white p-4">
        <p>&copy; CHITRALADA 2025</p>
      </footer>
        
    </section>
  );
}