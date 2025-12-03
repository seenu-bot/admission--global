"use client";

import { use, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { db } from "@/firebase/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";

type College = {
  id: string;
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  approval?: string | string[];
  streams?: string[]; // e.g., ["Engineering","MBBS"]
  totalFees?: string | number;
  rating?: number;
  logoUrl?: string;
  addressLine?: string;
  website?: string;
};

type FilterType = "city" | "country";

function parseSlug(slug: string | string[]): { type: FilterType; value: string } {
  // Handle both string and array (for catch-all routes)
  const slugStr = Array.isArray(slug) ? slug.join("/") : slug;
  const noExt = slugStr.replace(/\.html$/i, "");
  
  // Check if it's an abroad/country page: "abroad/bangladesh" or ["abroad", "bangladesh"] → country
  if (noExt.startsWith("abroad/") || (Array.isArray(slug) && slug[0] === "abroad")) {
    const countryPart = Array.isArray(slug) && slug.length > 1 
      ? slug[1].replace(/\.html$/i, "")
      : noExt.replace(/^abroad\//i, "").trim();
    if (countryPart) {
      return {
        type: "country",
        value: countryPart
          .split("-")
          .filter(Boolean)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
          .join(" "),
      };
    }
  }
  
  // Otherwise it's a city page: "colleges-bangalore" → city
  const cityPart = noExt.replace(/^colleges-?/i, "").trim();
  if (cityPart) {
    return {
      type: "city",
      value: cityPart
        .split("-")
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
        .join(" "),
    };
  }
  
  return { type: "city", value: "" };
}

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

function createVariants(value: string): string[] {
  const normalized = normalize(value);
  if (!normalized) return [];
  const words = normalized.split(" ");
  const title = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const upper = words.map((w) => w.toUpperCase()).join(" ");
  const hyphen = words.join("-");
  const underscore = words.join("_");
  const compact = words.join("");
  const variants = new Set<string>([
    value.trim(),
    normalized,
    title,
    upper,
    hyphen,
    underscore,
    compact,
  ]);
  return Array.from(variants).filter(Boolean);
}

const CITY_SYNONYMS: Record<string, string[]> = {
  "bangalore": ["Bengaluru", "Bangalore Urban"],
  "bengaluru": ["Bangalore"],
  "delhi ncr": ["Delhi", "New Delhi", "NCR Delhi", "National Capital Region"],
  "delhi": ["Delhi NCR", "New Delhi", "NCR Delhi"],
};

function getCityVariants(city: string): string[] {
  if (!city) return [];
  const variants = new Set<string>();
  createVariants(city).forEach((v) => variants.add(v));
  const normalizedCity = normalize(city);
  const synonyms = CITY_SYNONYMS[normalizedCity];
  if (synonyms) {
    synonyms.forEach((syn) => {
      createVariants(syn).forEach((v) => variants.add(v));
    });
  }
  return Array.from(variants).filter(Boolean);
}

function getCountryVariants(value: string): string[] {
  if (!value) return [];
  const variants = new Set<string>();
  createVariants(value).forEach((v) => variants.add(v));
  const normalizedValue = normalize(value);
  const cleaned = normalizedValue
    .replace(/\b(republic|federation|kingdom|state|people's|people|democratic|arab|socialist)\b/g, "")
    .trim();
  if (cleaned && cleaned !== normalizedValue) {
    createVariants(cleaned).forEach((v) => variants.add(v));
  }
  return Array.from(variants).filter(Boolean);
}

export default function MbbsCollegesByCityPage({
  params,
}: {
  params: Promise<{ slug: string | string[] }>;
}) {
  const { slug } = use(params);
  const parsed = useMemo(() => parseSlug(slug), [slug]);
  const { type: filterType, value: filterValue } = parsed;
  const filterValueNormalized = useMemo(() => normalize(filterValue), [filterValue]);

  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState<College[]>([]);

  useEffect(() => {
    const fetchColleges = async () => {
      if (!filterValue) {
        setLoading(false);
        return;
      }
      try {
        const collegesRef = collection(db, "colleges");
        let queries: any[] = [];

        if (filterType === "city") {
          // Build queries for city filtering
          const cityVariants = getCityVariants(filterValue);
          const cityFields = ["city", "cityName", "location.city"];
          queries = cityVariants.flatMap((cityVariant) =>
            cityFields.map((field) => query(collegesRef, where(field as any, "==", cityVariant), limit(500)))
          );
        } else if (filterType === "country") {
          // Build queries for country filtering
          const countryVariants = getCountryVariants(filterValue);
          const countryFields = ["country", "countryName", "location.country"];
          queries = countryVariants.flatMap((countryVariant) =>
            countryFields.map((field) => query(collegesRef, where(field as any, "==", countryVariant), limit(500)))
          );
        }

        let snaps = await Promise.all(queries.map((q) => getDocs(q)));

        const byId = new Map<string, College>();
        for (const snap of snaps) {
          snap.docs.forEach((d) => {
            const data = d.data() as any;
            const row: College = {
              id: d.id,
              name: data.name || data.collegeName || "Unnamed College",
              city: data.city || data.cityName,
              state: data.state,
              country: data.country || data.countryName,
              approval: data.approval || data.approvedBy,
              streams: data.streams || [],
              totalFees: data.totalFees || data.fee || data.fees,
              rating: data.rating || data.overallRating,
              logoUrl: data.logoUrl || data.logo || data.image,
              addressLine: data.address || data.location,
              website: data.website || data.url,
            };
            // Client-side filter for MBBS (covers multiple schema variants)
            const raw = d.data() as any;
            const gather = (val: any, depth = 0): string[] => {
              if (!val || depth > 3) return [];
              if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
                return [String(val)];
              }
              if (Array.isArray(val)) {
                return val.flatMap((v) => gather(v, depth + 1));
              }
              if (typeof val === "object") {
                return Object.values(val).flatMap((v) => gather(v, depth + 1));
              }
              return [];
            };
            
            // Collect all possible text fields that might contain MBBS information
            const textFields = [
              // Course/Stream fields
              raw.course,
              raw.stream,
              raw.branch,
              raw.program,
              raw.discipline,
              raw.courseType,
              raw.category,
              raw.collegeCategory,
              raw.collegeType,
              raw.institutionType,
              // College name and description
              raw.collegeName,
              raw.name,
              raw.description,
              raw.about,
              raw.overview,
              // Admission and eligibility
              raw.admissionEligibility,
              raw.eligibility,
              raw.admissionProcess,
              // Address and location
              raw.address,
              raw.location,
              // Arrays and nested data
              ...(gather(raw.tags)),
              ...(gather(raw.courses)),
              ...(gather(raw.coursesOffered)),
              ...(gather(raw.programs)),
              ...(gather(raw.ugPrograms)),
              ...(gather(raw.pgPrograms)),
              ...(gather(raw.departments)),
              ...(gather(raw.offerings)),
              ...(gather(raw.specializations)),
              ...(gather(raw.faculties)),
              ...(Array.isArray(row.streams) ? row.streams : []),
              // Additional fields
              raw.medicalCourses,
              raw.medicalPrograms,
              raw.degreePrograms,
            ]
              .filter(Boolean)
              .flat()
              .map((v: any) => String(v).toLowerCase());
            
            // Comprehensive MBBS keywords and variations
            const mbbsKeywords = [
              "mbbs",
              "m.b.b.s",
              "m.b.b.s.",
              "bachelor of medicine",
              "bachelor of surgery",
              "medicine and surgery",
              "bachelor of medicine and bachelor of surgery",
              "medical degree",
              "medical course",
              "medical program",
            ];
            
            // Medical college indicators
            const medicalCollegeKeywords = [
              "medical college",
              "medical university",
              "medical institute",
              "medical school",
              "college of medicine",
              "school of medicine",
              "institute of medical",
            ];
            
            // Check if any text field contains MBBS keywords
            const hasMbbsKeyword = textFields.some((t: string) => 
              mbbsKeywords.some((k) => t.includes(k))
            );
            
            // Check if college name suggests it's a medical college
            const collegeName = String(raw.collegeName || raw.name || "").toLowerCase();
            const isMedicalCollege = medicalCollegeKeywords.some((keyword) => 
              collegeName.includes(keyword)
            );
            
            // Also check if streams array explicitly contains MBBS (case-insensitive)
            const streamsArray = Array.isArray(raw.streams) ? raw.streams : [];
            const hasMbbsInStreams = streamsArray.some((s: any) => 
              String(s).toLowerCase().includes("mbbs") || 
              String(s).toLowerCase().includes("medicine")
            );
            
            const isMbbs = hasMbbsKeyword || isMedicalCollege || hasMbbsInStreams;
            if (isMbbs) {
              byId.set(d.id, row);
            }
          });
        }

        // Fallback: if still empty, fetch broader set and filter client-side
        if (byId.size === 0) {
          const broadSnap = await getDocs(query(collegesRef, limit(1000)));
          let wantedValues: string[] = [];
          
          if (filterType === "city") {
            wantedValues = getCityVariants(filterValue).map((c) => normalize(c));
          } else if (filterType === "country") {
            wantedValues = getCountryVariants(filterValue).map((c) => normalize(c));
          }
          
          broadSnap.docs.forEach((d) => {
            const data = d.data() as any;
            const row: College = {
              id: d.id,
              name: data.name || data.collegeName || "Unnamed College",
              city: data.city || data.cityName || data?.location?.city,
              state: data.state || data?.location?.state,
              country: data.country || data.countryName || data?.location?.country,
              approval: data.approval || data.approvedBy,
              streams: data.streams || [],
              totalFees: data.totalFees || data.fee || data.fees,
              rating: data.rating || data.overallRating,
              logoUrl: data.logoUrl || data.logo || data.image,
              addressLine: data.address || data.location,
              website: data.website || data.url,
            };

            const raw = data;
            const gather = (val: any, depth = 0): string[] => {
              if (!val || depth > 3) return [];
              if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
                return [String(val)];
              }
              if (Array.isArray(val)) {
                return val.flatMap((v) => gather(v, depth + 1));
              }
              if (typeof val === "object") {
                return Object.values(val).flatMap((v) => gather(v, depth + 1));
              }
              return [];
            };
            
            // Collect all possible text fields that might contain MBBS information
            const textFields = [
              // Course/Stream fields
              raw.course,
              raw.stream,
              raw.branch,
              raw.program,
              raw.discipline,
              raw.courseType,
              raw.category,
              raw.collegeCategory,
              raw.collegeType,
              raw.institutionType,
              // College name and description
              raw.collegeName,
              raw.name,
              raw.description,
              raw.about,
              raw.overview,
              // Admission and eligibility
              raw.admissionEligibility,
              raw.eligibility,
              raw.admissionProcess,
              // Address and location
              raw.address,
              raw.location,
              // Arrays and nested data
              ...(gather(raw.tags)),
              ...(gather(raw.courses)),
              ...(gather(raw.coursesOffered)),
              ...(gather(raw.programs)),
              ...(gather(raw.ugPrograms)),
              ...(gather(raw.pgPrograms)),
              ...(gather(raw.departments)),
              ...(gather(raw.offerings)),
              ...(gather(raw.specializations)),
              ...(gather(raw.faculties)),
              ...(Array.isArray(row.streams) ? row.streams : []),
              // Additional fields
              raw.medicalCourses,
              raw.medicalPrograms,
              raw.degreePrograms,
            ]
              .filter(Boolean)
              .flat()
              .map((v: any) => String(v).toLowerCase());
            
            // Comprehensive MBBS keywords and variations
            const mbbsKeywords = [
              "mbbs",
              "m.b.b.s",
              "m.b.b.s.",
              "bachelor of medicine",
              "bachelor of surgery",
              "medicine and surgery",
              "bachelor of medicine and bachelor of surgery",
              "medical degree",
              "medical course",
              "medical program",
            ];
            
            // Medical college indicators
            const medicalCollegeKeywords = [
              "medical college",
              "medical university",
              "medical institute",
              "medical school",
              "college of medicine",
              "school of medicine",
              "institute of medical",
            ];
            
            // Check if any text field contains MBBS keywords
            const hasMbbsKeyword = textFields.some((t: string) => 
              mbbsKeywords.some((k) => t.includes(k))
            );
            
            // Check if college name suggests it's a medical college
            const collegeName = String(raw.collegeName || raw.name || "").toLowerCase();
            const isMedicalCollege = medicalCollegeKeywords.some((keyword) => 
              collegeName.includes(keyword)
            );
            
            // Also check if streams array explicitly contains MBBS (case-insensitive)
            const streamsArray = Array.isArray(raw.streams) ? raw.streams : [];
            const hasMbbsInStreams = streamsArray.some((s: any) => 
              String(s).toLowerCase().includes("mbbs") || 
              String(s).toLowerCase().includes("medicine")
            );
            
            const isMbbs = hasMbbsKeyword || isMedicalCollege || hasMbbsInStreams;

            let matchesFilter = false;
            if (filterType === "city") {
              const docCity = normalize(row.city || "");
              const docLocationCity = normalize(data?.location?.city || "");
              const docAddress = normalize(String(data.address || data.location || ""));
              matchesFilter =
                wantedValues.includes(docCity) ||
                wantedValues.includes(docLocationCity) ||
                docCity.includes(filterValueNormalized) ||
                filterValueNormalized.includes(docCity) ||
                docLocationCity.includes(filterValueNormalized) ||
                docAddress.includes(filterValueNormalized) ||
                wantedValues.some((val) => docAddress.includes(val));
            } else if (filterType === "country") {
              const docCountry = normalize(row.country || "");
              const docCountryName = normalize(data.countryName || "");
              const docLocationCountry = normalize(data?.location?.country || "");
              const docAddress = normalize(String(data.address || data.location || ""));
              matchesFilter =
                wantedValues.includes(docCountry) ||
                wantedValues.includes(docCountryName) ||
                wantedValues.includes(docLocationCountry) ||
                docCountry.includes(filterValueNormalized) ||
                filterValueNormalized.includes(docCountry) ||
                docCountryName.includes(filterValueNormalized) ||
                docLocationCountry.includes(filterValueNormalized) ||
                docAddress.includes(filterValueNormalized) ||
                wantedValues.some((val) => docAddress.includes(val));
            }

            if (isMbbs && matchesFilter) {
              byId.set(d.id, row);
            }
          });
        }

        const rows = Array.from(byId.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setColleges(rows);
      } catch (err) {
        console.error("Error fetching MBBS colleges:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchColleges();
  }, [filterType, filterValue]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-4 text-gray-500">
          <a href="/" className="hover:underline text-red-700">Home</a> /{" "}
          <a href="/course" className="hover:underline text-red-700">Courses</a> /{" "}
          <a href="/course/mbbs" className="hover:underline text-red-700">MBBS</a> /{" "}
          <span>
            MBBS Colleges in {filterValue || (filterType === "country" ? "Country" : "City")}
          </span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">
          MBBS Colleges in {filterValue || (filterType === "country" ? "Country" : "City")}
        </h1>
        <p className="text-gray-600 mb-6">
          Explore MBBS colleges in {filterValue || (filterType === "country" ? "the selected country" : "the selected city")}. Data is fetched from your database in real time.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : colleges.length === 0 ? (
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <p className="text-gray-600">
              No MBBS colleges found in {filterValue || (filterType === "country" ? "this country" : "this city")}.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {colleges.map((c) => (
              <div key={c.id} className="bg-white border rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{c.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {c.city ? `${c.city}${c.state ? `, ${c.state}` : ""}` : ""}
                      {c.country ? (c.city ? `, ${c.country}` : c.country) : ""}
                      {c.addressLine ? ` • ${c.addressLine}` : ""}
                    </p>
                    {c.approval && (
                      <p className="text-xs text-gray-500 mt-1">
                        Approved By: {Array.isArray(c.approval) ? c.approval.join(", ") : c.approval}
                      </p>
                    )}
                  </div>
                  {c.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={c.name || "College"}
                      src={c.logoUrl}
                      className="w-16 h-16 rounded-md object-cover border"
                    />
                  )}
                </div>
                <div className="flex gap-4 mt-4 text-sm">
                  {c.totalFees !== undefined && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                      Fees: {c.totalFees}
                    </span>
                  )}
                  {typeof c.rating === "number" && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                      Rating: {c.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-5">
                  {c.website && (
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg"
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}


