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
  streams?: string[];
  totalFees?: string | number;
  rating?: number;
  logoUrl?: string;
  addressLine?: string;
  website?: string;
};

function parseCountryFromSlug(countrySlug: string): string {
  const noExt = countrySlug.replace(/\.html$/i, "");
  return noExt
    .split("-")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
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

function getCountryVariants(country: string): string[] {
  if (!country) return [];
  const variants = new Set<string>();
  createVariants(country).forEach((v) => variants.add(v));
  const normalized = normalize(country);
  const cleaned = normalized
    .replace(/\b(republic|federation|kingdom|state|people's|people|democratic|arab|socialist)\b/g, "")
    .trim();
  if (cleaned && cleaned !== normalized) {
    createVariants(cleaned).forEach((v) => variants.add(v));
  }
  return Array.from(variants).filter(Boolean);
}

export default function MbbsCollegesByCountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: countrySlug } = use(params);
  const country = useMemo(() => parseCountryFromSlug(countrySlug), [countrySlug]);

  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState<College[]>([]);

  useEffect(() => {
    const fetchColleges = async () => {
      if (!country) {
        setLoading(false);
        return;
      }
      try {
        const collegesRef = collection(db, "colleges");
        const countryVariants = getCountryVariants(country);
        const countryFields = ["country", "countryName", "location.country"];
        const queries = countryVariants.flatMap((countryVariant) =>
          countryFields.map((field) => query(collegesRef, where(field as any, "==", countryVariant), limit(500)))
        );

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
            // Client-side filter for MBBS
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
              "medicine",
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

        // Always run fallback to catch colleges that might not match exact country field queries
        // This ensures we get all MBBS colleges for the country, even if country field is in different format
        const broadSnap = await getDocs(query(collegesRef, limit(2000)));
        const wantedCountries = getCountryVariants(country).map((c) => normalize(c));
        const countrySlugNormalized = normalize(country);
        
        broadSnap.docs.forEach((d) => {
          // Skip if already added
          if (byId.has(d.id)) return;
          
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
            // Address and location (might contain country)
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
            "medicine",
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

          // Flexible country matching - check multiple fields and partial matches
          const docCountry = normalize(row.country || "");
          const docCountryName = normalize(data.countryName || "");
          const docLocationCountry = normalize(data?.location?.country || "");
          const docAddress = normalize(String(data.address || data.location || ""));
          
          // Check if country matches in any field or if address contains country name
          const countryMatches = 
            wantedCountries.includes(docCountry) ||
            wantedCountries.includes(docCountryName) ||
            wantedCountries.includes(docLocationCountry) ||
            docCountry.includes(countrySlugNormalized) ||
            countrySlugNormalized.includes(docCountry) ||
            docCountryName.includes(countrySlugNormalized) ||
            docLocationCountry.includes(countrySlugNormalized) ||
            docAddress.includes(countrySlugNormalized) ||
            wantedCountries.some((wc) => docAddress.includes(wc) || docCountry.includes(wc) || docCountryName.includes(wc) || docLocationCountry.includes(wc));
          
          if (isMbbs && countryMatches) {
            byId.set(d.id, row);
          }
        });

        const rows = Array.from(byId.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setColleges(rows);
      } catch (err) {
        console.error("Error fetching MBBS colleges by country:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchColleges();
  }, [country]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-4 text-gray-500">
          <a href="/" className="hover:underline text-red-700">Home</a> /{" "}
          <a href="/course" className="hover:underline text-red-700">Courses</a> /{" "}
          <a href="/course/mbbs" className="hover:underline text-red-700">MBBS</a> /{" "}
          <span>MBBS Colleges in {country || "Country"}</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold mb-1">
          MBBS Colleges in {country || "Country"}
        </h1>
        <p className="text-gray-600 mb-6">
          Explore MBBS colleges in {country || "the selected country"}. Data is fetched from your database in real time.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : colleges.length === 0 ? (
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <p className="text-gray-600">
              No MBBS colleges found in {country || "this country"}.
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

