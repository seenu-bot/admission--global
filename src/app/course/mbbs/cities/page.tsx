"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { db } from "@/firebase/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

function normalize(value?: string): string {
  if (!value) return "";
  return value
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSlugCity(city: string): string {
  return `colleges-${normalize(city).replace(/\s+/g, "-")}.html`;
}

export default function MbbsCitiesIndexPage() {
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const collegesRef = collection(db, "colleges");
        const snap = await getDocs(query(collegesRef, limit(5000)));
        const citySet = new Set<string>();

        snap.docs.forEach((d) => {
          const data = d.data() as any;
          // very light MBBS filter to avoid listing non-medical cities
          const maybeMbbs =
            JSON.stringify(data).toLowerCase().includes("mbbs") ||
            (Array.isArray(data?.streams) && data.streams.some((s: any) => String(s).toLowerCase().includes("mbbs")));
          if (!maybeMbbs) return;

          const city =
            data.city ||
            data.cityName ||
            data?.location?.city ||
            data?.address?.city ||
            data?.addressCity ||
            "";
          const norm = normalize(city);
          if (norm) citySet.add(city);
        });

        setCities(Array.from(citySet).sort((a, b) => a.localeCompare(b)));
      } catch (e) {
        console.error("Error generating MBBS cities:", e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">MBBS Colleges by City (India)</h1>
        <p className="text-gray-600 mb-6">
          This list is generated dynamically from your database. Click any city to view MBBS colleges.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : cities.length === 0 ? (
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <p className="text-gray-600">No cities found.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {cities.map((city) => (
              <a
                key={city}
                href={`/course/mbbs/${toSlugCity(city)}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-red-700 hover:text-red-700 shadow-sm text-sm"
                title={`MBBS Colleges in ${city}`}
              >
                {city}
              </a>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}



