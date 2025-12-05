"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { db } from "@/firebase/firebase";
import { collection, onSnapshot, query, doc, getDoc, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
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

// Helper function to validate image URL
function isValidImageUrl(url: string | undefined): boolean {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return false;
  }
  // Check if it's a valid absolute URL (http/https)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  // Check if it's a valid relative path (starts with /)
  if (url.startsWith("/")) {
    return true;
  }
  // If it's a data URL
  if (url.startsWith("data:")) {
    return true;
  }
  return false;
}

// Helper: Gather strings recursively
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

// ✅ Improved BBA detection logic
function isBbaCourse(data: any): boolean {
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

  // PG indicators
  const pgIndicators = [
    "pg",
    "postgraduate",
    "post graduate",
    "masters",
    "master",
    "pgdm",
    "m.b.a",
    "mba",
  ];

  const isPgLevel = pgIndicators.some((term) => levelText.includes(term));

  // BBA keywords
  const bbaKeywords = [
    "bba",
    "bbm",
    "bachelor of business administration",
    "business administration",
  ];
  const isBbaKeyword = bbaKeywords.some((term) => categoryText.includes(term));

  // UG indicators
  const ugIndicators = ["ug", "undergraduate", "bachelor", "graduate"];
  const isUgLevel = ugIndicators.some((term) => levelText.includes(term)) || (!levelText.includes("pg") && !levelText.includes("postgraduate"));

  // Exclude PG/MBA
  const excludeKeywords = ["mba", "pgdm", "pg", "postgraduate", "master", "pgp"];
  const isExcluded = excludeKeywords.some(
    (term) => categoryText.includes(term) || levelText.includes(term)
  );

  return isBbaKeyword && isUgLevel && !isExcluded;
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

export default function BBAExplorerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BBAExplorerPageContent />
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

function BBAExplorerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Course details state
  const [course, setCourse] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  
  // Fixed course ID for BBA course details
  const courseId = "WKMqwNPRCsMQqUwAEzoC";

  // Fetch course details
  const fetchCourseDetails = async () => {
    try {
      const docRef = doc(db, "courses", courseId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCourse({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.warn("Course not found");
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setCourseLoading(false);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "courses", courseId, "comments"));
      const list = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComments(list);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  // Add comment
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
    const scope = searchParams.get("scope");
    const state = searchParams.get("state");
    const country = searchParams.get("country");
    
    // Clear both first, then set only one
    setSelectedState("");
    setSelectedCountry("");
    
    if (country) {
      // When country is selected, only set country (state should be empty)
      setSelectedCountry(country);
    } else if (state) {
      // When state is selected, only set state (country should be empty)
      setSelectedState(state);
    } else {
      // No filters - handle scope if present
      if (scope === "india") {
        setSelectedCountry("");
      } else if (scope === "abroad") {
        setSelectedState("");
      }
    }
  }, [searchParams]);

  // Fetch course details when no state or country parameter
  useEffect(() => {
    const state = searchParams.get("state");
    const country = searchParams.get("country");
    if (!state && !country) {
      fetchCourseDetails();
      fetchComments();
    }
  }, [searchParams]);

  // Helper function to detect BBA colleges from colleges collection
  const isBbaCollegeDoc = (data: any): boolean => {
    const coursesOffered = gatherStrings([
      data.coursesOffered,
      data.courses,
      data.programs,
      data.programmes,
      data.departments,
      data.streams,
      data.tags,
      data.description,
      data.about,
      data.overview
    ]).join(' ').toLowerCase();
    const bbaKeywords = ['bba', 'bbm', 'bachelor of business administration', 'business administration'];
    return bbaKeywords.some((keyword) => coursesOffered.includes(keyword));
  };

  useEffect(() => {
    const map = new Map<string, College>();
    let coursesLoaded = false;
    let collegesLoaded = false;

    const updateColleges = () => {
      if (coursesLoaded && collegesLoaded) {
        const list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
        setColleges(list);
        setLoading(false);
      }
    };

    // Fetch from courses collection
    const coursesQ = query(collection(db, "courses"));
    const coursesUnsub = onSnapshot(
      coursesQ,
      (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!isBbaCourse(data)) return;

          const entries = collectCollegeEntries(data);
          entries.forEach((entry, idx) => {
            const name =
              entry?.name ||
              entry?.collegeName ||
              entry?.college ||
              entry?.institute ||
              entry?.university ||
              entry?.title ||
              data?.instituteName ||
              data?.universityName ||
              data?.collegeName ||
              data?.courseProvider ||
              data?.courseName ||
              "";

            if (!name) return;

            const key = name.trim().toLowerCase();
            const city =
              extractField(entry, data, ["city", "cityName"]) ||
              extractField(entry.location, data.location, ["city"]);
            const state =
              extractField(entry, data, ["state", "stateName", "province"]) ||
              extractField(entry.location, data.location, ["state"]);
            const country =
              extractField(entry, data, ["country", "countryName", "nation"]) ||
              extractField(entry.location, data.location, ["country"]);
            const address =
              extractField(entry, data, ["address", "addressLine", "streetAddress", "fullAddress", "location"]) || "";
            const approvals = combineApprovals(entry, data);
            const streams = combineStreams(entry, data);
            const ratingRaw = extractField(entry, data, ["rating", "overallRating", "score"]);
            const rating = ratingRaw !== undefined && !Number.isNaN(Number(ratingRaw)) ? Number(ratingRaw) : null;
            const totalCourses =
              extractField(entry, data, ["totalCourses", "noOfCourses", "coursesCount", "programCount", "count"]);
            const fee =
              extractField(entry, data, [
                "totalFees",
                "fee",
                "fees",
                "package",
                "avgFee",
                "averageFee",
                "tuition",
                "courseFee",
              ]);
            const rawWebsite = extractField(entry, data, ["website", "url", "link", "applyUrl"]);
            const website = Array.isArray(rawWebsite)
              ? rawWebsite.map((w) => String(w)).find((w) => w.trim())
              : typeof rawWebsite === "string"
              ? rawWebsite.trim()
              : undefined;
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
        coursesLoaded = true;
        updateColleges();
      },
      (error) => {
        console.error("Error fetching BBA colleges from courses:", error);
        coursesLoaded = true;
        updateColleges();
      }
    );

    // Fetch from colleges collection
    const collegesQ = query(collection(db, "colleges"));
    const collegesUnsub = onSnapshot(
      collegesQ,
      (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!isBbaCollegeDoc(data)) return;

          const name = data.collegeName || data.name || data.universityName || data.instituteName || "";
          if (!name) return;

          const key = name.trim().toLowerCase();
          const city = data.city || data.cityName || data?.location?.city || "";
          const state = data.state || data.stateName || data.province || data?.location?.state || "";
          const country = data.country || data.countryName || data?.location?.country || "India";
          const address = data.address || data.addressLine || data.fullAddress || "";
          const approvals = Array.isArray(data.approvals) ? data.approvals : data.approvals ? [data.approvals] : [];
          const streams = Array.isArray(data.streams) ? data.streams : data.streams ? [data.streams] : [];
          const ratingRaw = data.rating || data.overallRating || data.score;
          const rating = ratingRaw !== undefined && !Number.isNaN(Number(ratingRaw)) ? Number(ratingRaw) : null;
          const totalCourses = data.totalCourses || data.noOfCourses || data.coursesCount || data.programCount;
          const fee = data.fees || data.fee || data.totalFees || data.avgFee || data.averageFee || data.tuition || data.courseFee;
          const website = data.website || data.url || data.link || data.applyUrl;
          const image = data.image || data.logo || data.banner || data.thumbnail;

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
        collegesLoaded = true;
        updateColleges();
      },
      (error) => {
        console.error("Error fetching BBA colleges from colleges:", error);
        collegesLoaded = true;
        updateColleges();
      }
    );

    return () => {
      coursesUnsub();
      collegesUnsub();
    };
  }, []);

  // --- UI Filtering Logic ---
  const states = useMemo(() => {
    const filtered = colleges.filter((c) => normalize(c.country) === "india" && c.state);
    return Array.from(new Set(filtered.map((c) => c.state).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [colleges]);

  const countries = useMemo(() => {
    const filtered = colleges.filter((c) => normalize(c.country) !== "india" && c.country);
    return Array.from(new Set(filtered.map((c) => c.country).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [colleges]);

  const filteredColleges = useMemo(() => {
    const normSearch = normalize(searchTerm);
    return colleges.filter((college) => {
      const isIndia = normalize(college.country) === "india";
      
      // Country filter takes precedence - if country is selected, only filter by country
      if (selectedCountry) {
        const variants = createVariants(selectedCountry);
        const collegeCountryVariants = createVariants(college.country);
        const match =
          variants.some((v) => collegeCountryVariants.includes(v)) ||
          collegeCountryVariants.some((v) => variants.includes(v));
        if (!match) return false;
        // Don't apply state filter when filtering by country
      } else if (selectedState) {
        // State filter only applies when no country is selected
        const variants = createVariants(selectedState);
        const collegeStateVariants = createVariants(college.state);
        const match =
          variants.some((v) => collegeStateVariants.includes(v)) ||
          collegeStateVariants.some((v) => variants.includes(v));
        if (!match) return false;
        // State filter only applies to Indian colleges
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
  }, [colleges, selectedState, selectedCountry, searchTerm]);

  const groupedByState = useMemo(() => {
    const map = new Map<string, { state: string; country: string; colleges: College[] }>();
    filteredColleges.forEach((college) => {
      const stateKey = college.state || (normalize(college.country) === "india" ? "Unknown" : college.country) || "Other";
      const countryLabel = college.country || "India";
      if (!map.has(stateKey)) {
        map.set(stateKey, { state: stateKey, country: countryLabel, colleges: [] });
      }
      map.get(stateKey)!.colleges.push(college);
    });
    return Array.from(map.values()).sort((a, b) => a.state.localeCompare(b.state));
  }, [filteredColleges]);

  const handleSelectState = (state: string) => {
    const newState = state === selectedState ? "" : state;
    setSelectedState(newState);
    setSelectedCountry("");
    const params = new URLSearchParams();
    if (newState) params.set("state", newState);
    router.replace(`/course/bba${params.toString() ? `?${params.toString()}` : ""}`, { scroll: true });
  };

  const handleSelectCountry = (country: string) => {
    const newCountry = country === selectedCountry ? "" : country;
    setSelectedCountry(newCountry);
    setSelectedState("");
    const params = new URLSearchParams();
    if (newCountry) params.set("country", newCountry);
    router.replace(`/course/bba${params.toString() ? `?${params.toString()}` : ""}`, { scroll: true });
  };

  // --- RENDER ---
  const hasStateParam = !!searchParams.get("state");
  const hasCountryParam = !!searchParams.get("country");
  const hasScopeParam = !!searchParams.get("scope");
  const showCollegeExplorer = hasStateParam || hasCountryParam || hasScopeParam;
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {showCollegeExplorer ? (
        // Show college explorer when state or country parameter is present
      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">BBA Colleges Explorer</h1>
            <p className="text-gray-600 mt-1">
              Pick a state or country to explore BBA colleges. The list updates automatically from your
              Firestore courses collection.
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
                setSelectedState("");
                setSelectedCountry("");
                router.replace("/course/bba", { scroll: true });
              }}
              className="px-4 py-2 rounded-full border text-sm text-gray-600 hover:border-red-700 hover:text-red-700"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">States in India</h2>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {states.length === 0 ? (
                  <span className="text-sm text-gray-400">No states detected yet.</span>
                ) : (
                  states.map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => handleSelectState(state)}
                      className={`px-4 py-2 rounded-full border text-sm transition ${
                        selectedState === state
                          ? "bg-red-700 text-white border-red-700"
                          : "border-gray-300 text-gray-700 hover:border-red-700 hover:text-red-700"
                      }`}
                    >
                      {state}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Countries</h2>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {countries.length === 0 ? (
                  <span className="text-sm text-gray-400">No countries detected.</span>
                ) : (
                  countries.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => handleSelectCountry(country)}
                      className={`px-4 py-2 rounded-full border text-sm transition ${
                        selectedCountry === country
                          ? "bg-red-700 text-white border-red-700"
                          : "border-gray-300 text-gray-700 hover:border-red-700 hover:text-red-700"
                      }`}
                    >
                      {country}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedState
                ? `BBA Colleges in ${selectedState}`
                : selectedCountry
                ? `BBA Colleges in ${selectedCountry}`
                : "All BBA Colleges"}
            </h2>
            <span className="text-sm text-gray-500">
              {loading ? "Loading…" : `${filteredColleges.length} college(s)`}
            </span>
          </div>

          {loading ? (
            <div className="px-4 md:px-6 py-6 space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border rounded-lg p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-24 h-24 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex gap-4 mt-4">
                        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredColleges.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-600">
              No colleges match the current filters.
            </div>
          ) : (
            <div className="px-4 md:px-6 py-6 space-y-8">
              {groupedByState.map((group) => (
                <div key={`${group.state}-${group.country}`} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{group.state}</h3>
                      <p className="text-xs text-gray-500">{group.country}</p>
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
                                      key={`${college.id}-stream-${streamIdx}`}
                                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 text-xs"
                                    >
                                      {stream}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                                {college.streams.length > 6 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full border border-gray-200 text-xs">
                                    +{college.streams.length - 6} more
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Approvals</p>
                              <p className="text-xs text-gray-600">
                                {college.approvals.length > 0 ? college.approvals.join(" | ") : "—"}
                              </p>
                            </div>
                          </div>

                            <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                              <div className="text-xs text-gray-500">
                                Data sourced in real time from your Firestore courses.
                              </div>
                              <Link
                                href={
                                  college.sourceCollection === "colleges"
                                    ? `/colleges/${college.slug || college.sourceId || college.id}`
                                    : `/course/college/${college.slug || college.sourceId || college.id}`
                                }
                                className="text-sm font-semibold text-red-700 hover:underline"
                              >
                                View College
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
      ) : (
        // Show course details when no state parameter
        <div className="container mx-auto px-4 py-10">
          {courseLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : course ? (
            <>
              {/* Breadcrumb */}
              <nav className="text-sm mb-4 text-gray-500">
                <a href="/" className="hover:underline text-red-700">Home</a> /{" "}
                <a href="/courses" className="hover:underline text-red-700">Courses</a> /{" "}
                <span>{course.courseName}</span>
              </nav>

              {/* Header */}
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

              {/* Highlights */}
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

              {/* Overview */}
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

                {/* Admission & Scholarships */}
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

              {/* Syllabus */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Semester-wise Syllabus</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {Object.entries(course.syllabus || {}).map(([sem, subjects]: [string, any]) => (
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

              {/* Job Profiles */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Top Job Profiles</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {course.jobProfiles?.map((job: any, i: number) => (
                    <div key={i} className="bg-white p-5 rounded-lg shadow-sm border">
                      <h3 className="font-medium text-gray-800">{job.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                      <p className="text-red-700 mt-2 font-semibold">{job.avgSalary}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Top Recruiters */}
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

              {/* Media Section */}
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

              {/* Comment Section */}
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

              {/* CTA */}
              <div className="flex justify-end gap-4 mt-8">
                <a
                  href="/colleges"
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
            </>
          ) : (
            <div className="min-h-screen flex flex-col justify-center items-center text-center">
              <h1 className="text-2xl font-semibold text-gray-800">Course Not Found</h1>
              <a href="/courses" className="text-red-700 hover:underline mt-3">
                Go back to courses
              </a>
            </div>
          )}
        </div>
      )}
      <Footer />
    </main>
  );
}
