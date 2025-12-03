"use client";

import { useEffect, useState } from "react";
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Boards() {
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    // Fetch the HTML file from the public folder
    fetch("/html/boards.html")
      .then((res) => res.text())
      .then((data) => setHtmlContent(data))
      .catch((err) => console.error("Error loading HTML:", err));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Render HTML once loaded */}
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />

      <Footer />
    </main>
  );
}
