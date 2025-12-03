"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, addDoc, serverTimestamp, getDocs, onSnapshot, query } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { getCollegeSlug } from "@/lib/slugify";

type College = {
  id: string;
  sourceId?: string;
  sourceCollection?: "courses" | "colleges";
  slug?: string;
  name: string;
  city: string;
  state: string;
  country: string;
  address: string;
  approvals: string[];
  website?: string;
  streams: string[];
  rating?: number | null;
  totalCourses?: number | string;
  fee?: string | number;
  image?: string;
};

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

const DEFAULT_IMAGE = "/build/assets/t-1709039660-chitkara-university-rajpura.jpeg";

function isValidImageUrl(url: string | undefined): boolean {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return false;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  if (url.startsWith("/")) {
    return true;
  }
  if (url.startsWith("data:")) {
    return true;
  }
  return false;
}

function gatherStrings(val: any, depth = 0): string[] {
  if (!val || depth > 3) return [];
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
    return [String(val)];
  }
  if (Array.isArray(val)) {
    return val.flatMap((v) => gatherStrings(v, depth + 1));
  }
  if (typeof val === "object") {
    return Object.values(val).flatMap((v) => gatherStrings(v, depth + 1));
  }
  return [];
}

function isBtechCourse(data: any): boolean {
  const categoryText = gatherStrings([
    data.category,
    data.categories,
    data.categoryName,
    data.tags,
    data.courseName,
    data.name,
  ])
    .join(" ")
    .toLowerCase();

  const levelText = gatherStrings([
    data.courseLevel,
    data.level,
    data.programLevel,
    data.degreeLevel,
  ])
    .join(" ")
    .toLowerCase();

  const ugIndicators = ["ug", "undergraduate", "bachelor"];
  const isUgLevel = ugIndicators.some((term) => levelText.includes(term)) || (!levelText.includes("pg") && !levelText.includes("postgraduate"));

  const btechKeywords = [
    "b.tech",
    "btech",
    "b.e",
    "be",
    "bachelor of technology",
    "bachelor of engineering",
  ];
  const isBtechKeyword = btechKeywords.some((term) => categoryText.includes(term));

  const excludeKeywords = ["m.tech", "mtech", "m.e", "master", "postgraduate", "pg"];
  const isExcluded = excludeKeywords.some(
    (term) => categoryText.includes(term) || levelText.includes(term)
  );

  return isBtechKeyword && isUgLevel && !isExcluded;
}

function collectCollegeEntries(data: any): any[] {
  const potentialArrays: any[] = [
    data.topColleges,
    data.relatedColleges,
    data.colleges,
    data.collegeList,
    data.popularColleges,
    data.featuredColleges,
    data.campuses,
    data.locations,
    data.centers,
    data.centres,
  ];
  const entries: any[] = [];
  potentialArrays.forEach((arr) => {
    if (Array.isArray(arr)) {
      arr.forEach((entry) => {
        if (entry && typeof entry === "object") entries.push(entry);
      });
    }
  });
  if (entries.length === 0) {
    entries.push(data);
  }
  return entries;
}

function extractField(entry: any, doc: any, keys: string[]): any {
  for (const key of keys) {
    if (entry && entry[key] !== undefined && entry[key] !== null && entry[key] !== "") {
      return entry[key];
    }
    if (doc && doc[key] !== undefined && doc[key] !== null && doc[key] !== "") {
      return doc[key];
    }
    if (entry?.location && entry.location[key] !== undefined) return entry.location[key];
    if (doc?.location && doc.location[key] !== undefined) return doc.location[key];
    if (entry?.address && entry.address[key] !== undefined) return entry.address[key];
    if (doc?.address && doc.address[key] !== undefined) return doc.address[key];
  }
  return undefined;
}

function combineApprovals(entry: any, doc: any): string[] {
  const approvals = new Set<string>();
  const raw = [entry?.approvals, entry?.approval, doc?.approvals, doc?.approval];
  raw.forEach((item) => {
    if (!item) return;
    if (Array.isArray(item)) {
      item.forEach((value) => approvals.add(String(value)));
    } else {
      gatherStrings(item).forEach((value) => approvals.add(value));
    }
  });
  return Array.from(approvals).filter(Boolean);
}

function combineStreams(entry: any, doc: any): string[] {
  const streams = new Set<string>();
  const raw = [entry?.streams, entry?.courses, entry?.disciplines, entry?.specialisations, doc?.streams, doc?.courses];
  raw.forEach((item) => {
    if (!item) return;
    gatherStrings(item).forEach((value) => streams.add(value));
  });
  return Array.from(streams).filter(Boolean);
}

export default function EngineeringCoursePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EngineeringCoursePageContent />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <Footer />
    </main>
  );
}

function EngineeringCoursePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = "7CPsdG67AXjbm6i7Ij2b";

  const [course, setCourse] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState<boolean>(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  
  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchCourseDetails = async () => {
    try {
      const docRef = doc(db, "courses", courseId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCourse({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setCourseLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "courses", courseId, "comments"));
      const list = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComments(list);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addDoc(collection(db, "courses", courseId, "comments"), {
        text: newComment,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
      fetchComments();
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  useEffect(() => {
    const city = searchParams.get("city");
    if (city) setSelectedCity(city);
  }, [searchParams]);

  useEffect(() => {
    const city = searchParams.get("city");
    if (!city) {
    fetchCourseDetails();
    fetchComments();
    }
  }, [searchParams]);

  const offersBtech = (data: any): boolean => {
    if (isBtechCourse(data)) return true;
    
    const coursesOffered = gatherStrings([
      data.coursesOffered,
      data.courses,
      data.programs,
      data.programmes,
      data.offeredCourses,
      data.availableCourses,
    ]).join(" ").toLowerCase();
    
    const btechKeywords = [
      "b.tech",
      "btech",
      "b.e",
      "be",
      "bachelor of technology",
      "bachelor of engineering",
    ];
    
    const hasBtechInCourses = btechKeywords.some((term) => {
      if (term === "be" || term === "b.e") {
        const regex = new RegExp(`\\b${term.replace(".", "\\.")}\\b`, "i");
        return regex.test(coursesOffered);
      }
      return coursesOffered.includes(term);
    });
    
    if (coursesOffered && coursesOffered.trim()) {
      if (!hasBtechInCourses) {
        return false;
      }
      return true;
    }
    
    if (!coursesOffered || !coursesOffered.trim()) {
      return isBtechCourse(data);
    }
    
    return hasBtechInCourses;
  };

  useEffect(() => {
    const map = new Map<string, College>();
    
    const updateCollegesList = () => {
      const list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
      setColleges(list);
      setLoading(false);
    };

    const coursesQ = query(collection(db, "courses"));
    const coursesUnsub = onSnapshot(
      coursesQ,
      (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!isBtechCourse(data)) return;

          const entries = collectCollegeEntries(data);
          entries.forEach((entry, idx) => {
            // Skip if this entry is the course document itself (not a college entry)
            // Check if entry is the same as data (meaning collectCollegeEntries returned the data itself)
            if (entry === data && (!entry.topColleges && !entry.relatedColleges && !entry.colleges && !entry.collegeList)) {
              return; // Skip course documents that don't have college arrays
            }
            
            // Only use college-specific fields, never use courseName
            const name = entry?.name || entry?.collegeName || entry?.college || entry?.institute || entry?.university || entry?.title || data?.instituteName || data?.universityName || data?.collegeName || data?.courseProvider || "";
            
            if (!name) return;
            
            // Exclude if name looks like a course name (contains "Bachelor of Technology", "B.Tech", etc.)
            const nameLower = name.toLowerCase();
            const courseNamePatterns = [
              "bachelor of technology",
              "bachelor of engineering",
              "in computer science",
              "in mechanical",
              "in civil",
              "in electrical",
              "in electronics",
            ];
            const isCourseName = courseNamePatterns.some((pattern) => nameLower.includes(pattern));
            
            // If it looks like a course name, check if it has college identifiers
            const hasCollegeIdentifiers = !!(entry?.collegeName || entry?.name || entry?.college || entry?.institute || entry?.university || data?.collegeName || data?.instituteName || data?.universityName);
            
            if (isCourseName && !hasCollegeIdentifiers) {
              return; // Skip if it looks like a course name and doesn't have college identifiers
            }
            
            const key = name.trim().toLowerCase();
            const city = extractField(entry, data, ["city", "cityName"]) || extractField(entry.location, data.location, ["city"]);
            const state = extractField(entry, data, ["state", "stateName", "province"]) || extractField(entry.location, data.location, ["state"]);
            const country = extractField(entry, data, ["country", "countryName", "nation"]) || extractField(entry.location, data.location, ["country"]);
            const address = extractField(entry, data, ["address", "addressLine", "streetAddress", "fullAddress", "location"]) || "";
            const approvals = combineApprovals(entry, data);
            const streams = combineStreams(entry, data);
            const ratingRaw = extractField(entry, data, ["rating", "overallRating", "score"]);
            const rating = ratingRaw !== undefined && !Number.isNaN(Number(ratingRaw)) ? Number(ratingRaw) : null;
            const totalCourses = extractField(entry, data, ["totalCourses", "noOfCourses", "coursesCount", "programCount", "count"]);
            const fee = extractField(entry, data, ["totalFees", "fee", "fees", "package", "avgFee", "averageFee", "tuition", "courseFee"]);
            const rawWebsite = extractField(entry, data, ["website", "url", "link", "applyUrl"]);
            const website = Array.isArray(rawWebsite) ? rawWebsite.map((w) => String(w)).find((w) => w.trim()) : typeof rawWebsite === "string" ? rawWebsite.trim() : undefined;
            const image = extractField(entry, data, ["image", "logo", "banner", "thumbnail"]);

            const existing = map.get(key);
            const slug = getCollegeSlug({
              id: doc.id,
              name,
              city,
              state,
              country,
              address,
              approvals,
              streams,
              ...data,
              ...(entry && typeof entry === "object" ? entry : {}),
            });
            const merged: College = {
              id: `${doc.id}-${idx}`,
              sourceId: doc.id,
              sourceCollection: "courses",
              slug: slug || existing?.slug,
              name,
              city: city ? String(city) : existing?.city || "",
              state: state ? String(state) : existing?.state || "",
              country: country ? String(country) : existing?.country || "India",
              address: address ? String(address) : existing?.address || "",
              approvals: approvals.length > 0 ? approvals : existing?.approvals || [],
              website: website || existing?.website,
              streams: streams.length > 0 ? streams : existing?.streams || [],
              rating: rating !== null ? rating : existing?.rating,
              totalCourses: totalCourses || existing?.totalCourses,
              fee: fee || existing?.fee,
              image: image || existing?.image,
            };

            map.set(key, merged);
          });
        });
        
        updateCollegesList();
      },
      (error) => {
        console.error("Error fetching B.Tech colleges from courses:", error);
      }
    );

    const collegesQ = query(collection(db, "colleges"));
    const collegesUnsub = onSnapshot(
      collegesQ,
      (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!offersBtech(data)) return;

          const name =
            data.name ||
            data.collegeName ||
            data.instituteName ||
            data.universityName ||
            data.title ||
            "";

          if (!name) return;
          
          // Exclude if name looks like a course name (contains "Bachelor of Technology", "B.Tech", etc.)
          const nameLower = name.toLowerCase();
          const courseNamePatterns = [
            "bachelor of technology",
            "b.tech",
            "btech",
            "bachelor of engineering",
            "b.e",
            "in computer science",
            "in mechanical",
            "in civil",
            "in electrical",
          ];
          const isCourseName = courseNamePatterns.some((pattern) => nameLower.includes(pattern));
          if (isCourseName && !data.collegeName && !data.name && !data.instituteName && !data.universityName) {
            return; // Skip if it looks like a course name and doesn't have college identifiers
          }

          const key = name.trim().toLowerCase();
          const city = extractField(data, data, ["city", "cityName"]) ||
            extractField(data.location, data.location, ["city"]);
          const state = extractField(data, data, ["state", "stateName", "province"]) ||
            extractField(data.location, data.location, ["state"]);
          let country = extractField(data, data, ["country", "countryName", "nation"]) ||
            extractField(data.location, data.location, ["country"]) ||
            "India";
          
          const countryNorm = normalize(country);
          if (countryNorm === "" || countryNorm === "india" || countryNorm === "indian") {
            country = "India";
          }
          const address = extractField(data, data, ["address", "addressLine", "streetAddress", "fullAddress"]) || "";
          const approvals = combineApprovals(data, data);
          const streams = combineStreams(data, data);
          const ratingRaw = extractField(data, data, ["rating", "overallRating", "score"]);
          const rating = ratingRaw !== undefined && !Number.isNaN(Number(ratingRaw)) ? Number(ratingRaw) : null;
          const totalCourses = extractField(data, data, ["totalCourses", "noOfCourses", "coursesCount", "programCount"]);
          const fee = extractField(data, data, ["totalFees", "fee", "fees", "package", "avgFee", "averageFee"]);
          const rawWebsite = extractField(data, data, ["website", "url", "link", "applyUrl"]);
          const website = Array.isArray(rawWebsite) ? rawWebsite.map((w) => String(w)).find((w) => w.trim()) : typeof rawWebsite === "string" ? rawWebsite.trim() : undefined;
          const image = extractField(data, data, ["image", "logo", "banner", "thumbnail"]);

          const existing = map.get(key);
          const slug = getCollegeSlug({
            id: doc.id,
            name,
            city,
            state,
            country,
            address,
            approvals,
            streams,
            ...data,
          });
          const merged: College = {
            id: doc.id,
            sourceId: doc.id,
            sourceCollection: "colleges",
            slug: slug || existing?.slug,
            name,
            city: city ? String(city) : existing?.city || "",
            state: state ? String(state) : existing?.state || "",
            country: country ? String(country) : existing?.country || "India",
            address: address ? String(address) : existing?.address || "",
            approvals: approvals.length > 0 ? approvals : existing?.approvals || [],
            website: website || existing?.website,
            streams: streams.length > 0 ? streams : existing?.streams || [],
            rating: rating !== null ? rating : existing?.rating,
            totalCourses: totalCourses || existing?.totalCourses,
            fee: fee || existing?.fee,
            image: image || existing?.image,
          };

          map.set(key, merged);
        });

        updateCollegesList();
      },
      (error) => {
        console.error("Error fetching B.Tech colleges from colleges collection:", error);
      }
    );

    return () => {
      coursesUnsub();
      collegesUnsub();
    };
  }, []);

  const cities = useMemo(() => {
    const filtered = colleges.filter((c) => normalize(c.country) === "india" && c.city);
    return Array.from(new Set(filtered.map((c) => c.city).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [colleges]);

  const filteredColleges = useMemo(() => {
    const normSearch = normalize(searchTerm);
    
    return colleges.filter((college) => {
      const isIndia = normalize(college.country) === "india";
      if (selectedCity) {
        const selectedCityNorm = normalize(selectedCity);
        const collegeCityNorm = normalize(college.city || "");
        
        if (collegeCityNorm === selectedCityNorm) {
          if (!isIndia) return false;
          return true;
        }
        
        const variants = createVariants(selectedCity);
        const collegeCityVariants = createVariants(college.city || "");
        const match =
          variants.some((v) => collegeCityVariants.includes(v)) ||
          collegeCityVariants.some((v) => variants.includes(v)) ||
          collegeCityNorm.includes(selectedCityNorm) ||
          selectedCityNorm.includes(collegeCityNorm);
        
        if (!match) return false;
        if (!isIndia) return false;
      }

      if (normSearch) {
        const haystack = [
          college.name,
          college.city,
          college.state,
          college.country,
          college.address,
          ...(college.approvals || []),
          ...(college.streams || []),
        ]
          .filter(Boolean)
          .map((value) => normalize(value));
        if (!haystack.some((value) => value.includes(normSearch))) return false;
      }

      return true;
    });
  }, [colleges, selectedCity, searchTerm]);

  const groupedByCity = useMemo(() => {
    const map = new Map<string, { city: string; state: string; country: string; colleges: College[] }>();
    filteredColleges.forEach((college) => {
      const cityKey = college.city || "Unknown";
      const stateLabel = college.state || "";
      const countryLabel = college.country || "India";
      if (!map.has(cityKey)) {
        map.set(cityKey, { city: cityKey, state: stateLabel, country: countryLabel, colleges: [] });
      }
      map.get(cityKey)!.colleges.push(college);
    });
    return Array.from(map.values()).sort((a, b) => a.city.localeCompare(b.city));
  }, [filteredColleges]);

  const handleSelectCity = (city: string) => {
    const newCity = city === selectedCity ? "" : city;
    setSelectedCity(newCity);
    const params = new URLSearchParams();
    if (newCity) params.set("city", newCity);
    const queryString = params.toString();
    router.replace(`/course/engineering${queryString ? `?${queryString}` : ""}`, { scroll: true });
  };

  const hasCityParam = !!searchParams.get("city");
  
  if (hasCityParam) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />

        <div className="container mx-auto px-4 py-10 space-y-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">B.Tech / B.E. Colleges Explorer</h1>
              <p className="text-gray-600 mt-1">
                Pick a city to explore B.Tech colleges. The list updates automatically from your Firestore courses collection.
              </p>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search colleges, location, approvals, streams…"
                className="flex-1 min-w-[220px] border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-red-700"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCity("");
                  router.replace("/course/engineering", { scroll: true });
                }}
                className="px-4 py-2 rounded-full border text-sm text-gray-600 hover:border-red-700 hover:text-red-700"
              >
                Reset Filters
              </button>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Cities in India</h2>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {cities.length === 0 ? (
                  <span className="text-sm text-gray-400">No cities detected yet.</span>
                ) : (
                  cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`px-4 py-2 rounded-full border text-sm transition ${
                        selectedCity === city
                          ? "bg-red-700 text-white border-red-700"
                          : "border-gray-300 text-gray-700 hover:border-red-700 hover:text-red-700"
                      }`}
                    >
                      {city}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedCity
                  ? `B.Tech Colleges in ${selectedCity}`
                  : "All B.Tech Colleges"}
              </h2>
              <span className="text-sm text-gray-500">
                {loading ? "Loading…" : `${filteredColleges.length} college(s)`}
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredColleges.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-600">
                {selectedCity
                  ? `No B.Tech colleges found in ${selectedCity}.`
                  : "No colleges match the current filters."}
              </div>
            ) : (
              <div className="px-4 md:px-6 py-6 space-y-8">
                {groupedByCity.map((group) => (
                  <div key={`${group.city}-${group.state}`} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{group.city}</h3>
                        <p className="text-xs text-gray-500">{group.state} • {group.country}</p>
                      </div>
                      <span className="text-xs text-gray-400">{group.colleges.length} college(s)</span>
                    </div>
                    <div className="divide-y">
                      {group.colleges.map((college, idx) => (
                        <div key={`${college.id}-${idx}`} className="flex flex-col md:flex-row">
                          <div className="md:w-56 lg:w-64 h-40 md:h-auto relative bg-gray-100">
                            <Image
                              src={college.image || DEFAULT_IMAGE}
                              alt={college.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 280px"
                              unoptimized={college.image?.startsWith("http://") || college.image?.startsWith("https://")}
                            />
                          </div>
                          <div className="flex-1 p-5 space-y-3">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                              <div>
                                <h4 className="text-base md:text-lg font-semibold text-gray-900">
                                  {college.name}
                                </h4>
                                <div className="text-sm text-gray-500">
                                  {college.address ||
                                    [college.city, college.state].filter(Boolean).join(", ") ||
                                    "—"}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">{college.country}</div>
                              </div>
                              <div className="flex flex-col items-start text-xs text-gray-600 gap-1">
                                {college.rating !== undefined && college.rating !== null && (
                                  <div>
                                    <span className="font-semibold text-gray-900">{college.rating.toFixed(2)}</span>{" "}
                                    Rating
                                  </div>
                                )}
                                {college.totalCourses && <div>{college.totalCourses} Courses</div>}
                                {college.fee && (
                                  <div className="text-red-700 font-medium text-sm">
                                    {typeof college.fee === "number" ? `₹${college.fee}` : String(college.fee)}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 text-xs md:text-sm text-gray-700">
                              <div>
                                <p className="font-semibold text-gray-900 mb-1">Location</p>
                                <p>{[college.city, college.state].filter(Boolean).join(", ") || "—"}</p>
                                <p className="text-xs text-gray-500">{college.country}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 mb-1">Streams / Tags</p>
                                <div className="flex flex-wrap gap-1">
                                  {college.streams.length > 0 ? (
                                    college.streams.slice(0, 6).map((stream, streamIdx) => (
                                      <span
                                        key={streamIdx}
                                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                                      >
                                        {stream}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 mb-1">Approvals</p>
                                <div className="flex flex-wrap gap-1">
                                  {college.approvals.length > 0 ? (
                                    college.approvals.slice(0, 4).map((approval, appIdx) => (
                                      <span
                                        key={appIdx}
                                        className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
                                      >
                                        {approval}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="pt-2">
                              <Link
                                href={
                                  college.sourceCollection === "colleges"
                                    ? `/colleges/${college.slug || college.sourceId || college.id}`
                                    : `/course/college/${college.slug || college.sourceId || college.id}`
                                }
                                className="inline-flex items-center text-red-700 hover:underline text-sm font-medium"
                              >
                                View College →
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Footer />
      </main>
    );
  }

  // Show course details when no city parameter
  if (courseLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center">
        <h1 className="text-2xl font-semibold text-gray-800">Course Not Found</h1>
        <a href="/courses" className="text-red-700 hover:underline mt-3">
          Go back to courses
        </a>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-10">
        <nav className="text-sm mb-4 text-gray-500">
          <a href="/" className="hover:underline text-red-700">Home</a> /{" "}
          <a href="/courses" className="hover:underline text-red-700">Courses</a> /{" "}
          <span>{course.courseName}</span>
        </nav>

        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 mb-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{course.courseName}</h1>
              <p className="text-gray-600 mt-1">
                {course.courseLevel || "N/A"} • Duration: {course.duration || "N/A"}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Last Updated:{" "}
                {course.lastUpdated
                  ? new Date(course.lastUpdated.seconds * 1000).toLocaleDateString()
                  : course.publishDate}
              </p>
            </div>
            {course.media?.images?.[0] && isValidImageUrl(course.media.images[0]) && (
              <div className="w-40 h-28 relative mt-4 md:mt-0">
                <Image
                  src={course.media.images[0]}
                  alt={course.courseName || "Course Image"}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 200px"
                  priority={false}
                  unoptimized={course.media.images[0]?.startsWith("http://") || course.media.images[0]?.startsWith("https://")}
                />
              </div>
            )}
          </div>
        </div>

        {course.highlights && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Course Highlights</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {course.highlights.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Overview</h2>
            <p className="text-gray-600 leading-relaxed">{course.notes}</p>
            <div className="mt-5 space-y-2 text-gray-700">
              <p><strong>Eligibility:</strong> {course.eligibility}</p>
              <p><strong>Average Fee:</strong> {course.averageFee}</p>
              <p><strong>Average Salary:</strong> {course.averageSalary}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Admission & Scholarships</h2>
            <p className="text-gray-600 mb-3">{course.admissionProcess}</p>
            <h3 className="font-medium text-gray-800 mb-2">Scholarships Available:</h3>
            <ul className="list-disc pl-5 text-gray-700">
              {course.scholarships?.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </section>

        {course.syllabus && (
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Semester-wise Syllabus</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Object.entries(course.syllabus).map(([sem, subjects]: [string, any]) => (
              <div key={sem} className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-medium text-gray-800 mb-2 capitalize">{sem}</h3>
                <ul className="list-disc pl-4 text-gray-700 text-sm space-y-1">
                  {(subjects as string[]).map((sub: string, i: number) => (
                    <li key={i}>{sub}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
        )}

        {course.jobProfiles && (
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Top Job Profiles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {course.jobProfiles.map((job: any, i: number) => (
              <div key={i} className="bg-white p-5 rounded-lg shadow-sm border">
                <h3 className="font-medium text-gray-800">{job.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                <p className="text-red-700 mt-2 font-semibold">{job.avgSalary}</p>
              </div>
            ))}
          </div>
        </section>
        )}

        {course.topRecruiters && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Top Recruiters</h2>
            <div className="flex flex-wrap gap-3">
              {course.topRecruiters.map((r: string, i: number) => (
                <span
                  key={i}
                  className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-full text-sm text-gray-700"
                >
                  {r}
                </span>
              ))}
            </div>
          </section>
        )}

        {course.media?.videos?.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Videos</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {course.media.videos.map((video: string, i: number) => (
                <iframe
                  key={i}
                  src={video.replace("watch?v=", "embed/")}
                  className="w-full h-64 rounded-xl border border-gray-200"
                  allowFullScreen
                ></iframe>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white border rounded-2xl shadow-sm p-6 mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Comments</h2>

          {comments.length > 0 ? (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="border-b pb-2 text-gray-700 text-sm flex justify-between"
                >
                  <span>{c.text}</span>
                  <span className="text-gray-400 text-xs">
                    {c.createdAt?.seconds
                      ? new Date(c.createdAt.seconds * 1000).toLocaleString()
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No comments yet.</p>
          )}

          <form onSubmit={addComment} className="mt-6 flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your comment..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-700"
            />
            <button
              type="submit"
              className="bg-red-700 text-white px-5 py-2 rounded-lg hover:bg-red-800 transition"
            >
              Post
            </button>
          </form>
        </section>

        <div className="flex justify-end gap-4 mt-8">
          <a
            href={course.exploreLink || "#"}
            target="_blank"
            className="bg-red-700 text-white px-5 py-2 rounded-lg hover:bg-red-800 transition"
          >
            Explore Colleges
          </a>
          <a
            href="/course"
            className="border border-red-700 text-red-700 px-5 py-2 rounded-lg hover:bg-red-700 hover:text-white transition"
          >
            Back to Courses
          </a>
        </div>
      </div>

      <Footer />
    </main>
  );
}
