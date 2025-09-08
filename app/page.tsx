import React from "react";
import Products from "./components/Products";

export default function Home() {
  return (
    <section className="min-h-screen bg-white flex flex-col justify-center text-center ">
      <Products />
    </section>
  );
}