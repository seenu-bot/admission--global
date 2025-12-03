"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CourseScholarshipsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to scholarships page
    router.replace("/scholarships");
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Redirecting to scholarships...</p>
          <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

