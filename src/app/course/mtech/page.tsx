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

// ✅ M.Tech detection logic
function isMtechCourse(data: any): boolean {
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
  ];

  const isPgLevel = pgIndicators.some((term) => levelText.includes(term));

  // M.Tech keywords
  const mtechKeywords = [
    "m.tech",
    "mtech",
    "m.e",
    "me",
    "master of technology",
    "master of engineering",
  ];
  const isMtechKeyword = mtechKeywords.some((term) => categoryText.includes(term));

  // Exclude UG/B.Tech
  const excludeKeywords = ["b.tech", "btech", "bachelor", "undergraduate", "ug"];
  const isExcluded = excludeKeywords.some(
    (term) => categoryText.includes(term) || levelText.includes(term)
  );

  return isMtechKeyword && isPgLevel && !isExcluded;
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

export default function MTechExplorerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MTechExplorerPageContent />
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

function MTechExplorerPageContent() {
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
  
  // Fixed course ID for M.Tech course details
  const courseId = "G5QQwPeEHojoSE7QQyLj";

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
    if (state) setSelectedState(state);
    if (country) setSelectedCountry(country);
    if (!state && !country) {
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

  // Helper to check if college offers M.Tech
  const offersMtech = (data: any): boolean => {
    // For colleges collection, we must check coursesOffered field explicitly
    // Check coursesOffered field - must have M.Tech keywords
    const coursesOffered = gatherStrings([
      data.coursesOffered,
      data.courses,
      data.programs,
      data.programmes,
      data.offeredCourses,
      data.availableCourses,
    ]).join(" ").toLowerCase();
    
    const mtechKeywords = [
      "m.tech",
      "mtech",
      "m.e",
      "me",
      "master of technology",
      "master of engineering",
    ];
    
    // Must have M.Tech in coursesOffered field
    // Use word boundary matching to avoid false positives (e.g., "MSc" shouldn't match "me")
    const hasMtechInCourses = mtechKeywords.some((term) => {
      // For single letter terms like "me", check for word boundaries
      if (term === "me" || term === "m.e") {
        // Check for "m.e" or "m.e." or "me" as a standalone word (not part of "msc", "mba", etc.)
        const regex = new RegExp(`\\b${term.replace(".", "\\.")}\\b`, "i");
        return regex.test(coursesOffered);
      }
      // For longer terms, simple includes is fine
      return coursesOffered.includes(term);
    });
    
    // If coursesOffered field exists and has content, it MUST have M.Tech keywords
    if (coursesOffered && coursesOffered.trim()) {
      if (!hasMtechInCourses) {
        // Debug logging for excluded colleges
        if (process.env.NODE_ENV === "development") {
          const country = data.country || data.countryName || "";
          if (normalize(country) === "mexico" || normalize(country) === "spain") {
            const name = data.name || data.collegeName || "";
            console.log(`[offersMtech] Excluding college "${name}" (${country}): coursesOffered doesn't contain M.Tech keywords`);
            console.log(`[offersMtech] Courses offered:`, coursesOffered);
          }
        }
        return false;
      }
      return true;
    }
    
    // If coursesOffered is empty, check if it's an M.Tech course document (for courses collection)
    if (!coursesOffered || !coursesOffered.trim()) {
      return isMtechCourse(data);
    }
    
    return hasMtechInCourses;
  };

  useEffect(() => {
        const map = new Map<string, College>();
    
    const updateCollegesList = () => {
      const list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
      
      // Debug logging
      if (process.env.NODE_ENV === "development") {
        console.log("M.Tech colleges fetched:", list.length);
        console.log("Colleges by state:", 
          Array.from(new Set(list.filter(c => c.state).map(c => c.state))).sort()
        );
        list.forEach(c => {
          if (c.state) {
            console.log(`College: ${c.name}, State: ${c.state}, Country: ${c.country}`);
          }
        });
      }
      
      setColleges(list);
      setLoading(false);
    };
    
    // Fetch from courses collection
    const coursesQ = query(collection(db, "courses"));
    const coursesUnsub = onSnapshot(
      coursesQ,
      (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!isMtechCourse(data)) return;

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
            
            // Debug logging for state extraction
            if (process.env.NODE_ENV === "development" && !state && entry) {
              console.log("No state found for college:", name);
              console.log("Entry keys:", Object.keys(entry));
              console.log("Entry state fields:", {
                state: entry.state,
                stateName: entry.stateName,
                province: entry.province,
                location: entry.location,
              });
              console.log("Data state fields:", {
                state: data.state,
                stateName: data.stateName,
                province: data.province,
                location: data.location,
              });
            }
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
        
        // Update colleges list
        updateCollegesList();
      },
      (error) => {
        console.error("Error fetching M.Tech colleges from courses:", error);
      }
    );

    // Also fetch from colleges collection
    const collegesQ = query(collection(db, "colleges"));
    const collegesUnsub = onSnapshot(
      collegesQ,
      (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          if (!offersMtech(data)) {
            if (process.env.NODE_ENV === "development") {
              // Debug: log colleges that don't offer M.Tech, especially Mexico and Spain
              const name = data.name || data.collegeName || doc.id;
              const countryCheck = data.country || data.countryName || "";
              const countryNormCheck = normalize(countryCheck);
              if (countryNormCheck === "mexico" || countryNormCheck === "spain") {
                const coursesOffered = gatherStrings([
                  data.coursesOffered,
                  data.courses,
                  data.programs,
                ]).join(" ").toLowerCase();
                console.log("College excluded (no M.Tech in coursesOffered):", name, "Country:", countryCheck, "CoursesOffered:", coursesOffered);
              }
            }
            return;
          }

          // Extract college information directly
          const name =
            data.name ||
            data.collegeName ||
            data.instituteName ||
            data.universityName ||
            data.title ||
            "";

          if (!name) return;

          const key = name.trim().toLowerCase();
          const city = extractField(data, data, ["city", "cityName"]) ||
            extractField(data.location, data.location, ["city"]);
          const state = extractField(data, data, ["state", "stateName", "province"]) ||
            extractField(data.location, data.location, ["state"]);
          let country = extractField(data, data, ["country", "countryName", "nation"]) ||
            extractField(data.location, data.location, ["country"]) ||
            "India";
          
          // Normalize country - if it's not clearly India, keep it as is
          const countryNorm = normalize(country);
          if (countryNorm === "" || countryNorm === "india" || countryNorm === "indian") {
            country = "India";
          }
          
          // Additional check: if country is Mexico or Spain, ensure M.Tech is in coursesOffered
          if (countryNorm === "mexico" || countryNorm === "spain") {
            const coursesOffered = gatherStrings([
              data.coursesOffered,
              data.courses,
              data.programs,
              data.programmes,
              data.offeredCourses,
              data.availableCourses,
            ]).join(" ").toLowerCase();
            
            const mtechKeywords = ["m.tech", "mtech", "m.e", "me", "master of technology", "master of engineering"];
            const hasMtech = mtechKeywords.some((term) => coursesOffered.includes(term));
            
            if (!hasMtech) {
              if (process.env.NODE_ENV === "development") {
                console.log("College excluded (Mexico/Spain without M.Tech):", name, "CoursesOffered:", coursesOffered);
              }
              return;
            }
          }
          const address = extractField(data, data, ["address", "addressLine", "streetAddress", "fullAddress"]) || "";
          const approvals = combineApprovals(data, data);
          const streams = combineStreams(data, data);
          const ratingRaw = extractField(data, data, ["rating", "overallRating", "score"]);
          const rating = ratingRaw !== undefined && !Number.isNaN(Number(ratingRaw)) ? Number(ratingRaw) : null;
          const totalCourses = extractField(data, data, ["totalCourses", "noOfCourses", "coursesCount", "programCount"]);
          const fee = extractField(data, data, ["totalFees", "fee", "fees", "package", "avgFee", "averageFee"]);
          const rawWebsite = extractField(data, data, ["website", "url", "link", "applyUrl"]);
          const website = Array.isArray(rawWebsite)
            ? rawWebsite.map((w) => String(w)).find((w) => w.trim())
            : typeof rawWebsite === "string"
            ? rawWebsite.trim()
            : undefined;
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
        
        // Update colleges list
        updateCollegesList();
      },
      (error) => {
        console.error("Error fetching M.Tech colleges from colleges collection:", error);
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
    // Only show countries that have at least one M.Tech college
    const filtered = colleges.filter((c) => {
      const countryNorm = normalize(c.country || "");
      const isNotIndia = countryNorm !== "india" && countryNorm !== "indian";
      return isNotIndia && countryNorm !== "" && c.country;
    });
    
    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("Countries with M.Tech colleges:", filtered.map(c => ({ name: c.name, country: c.country })));
    }
    
    const countrySet = new Set<string>();
    filtered.forEach((c) => {
      if (c.country) {
        const countryNorm = normalize(c.country);
        // Only add if it's not India
        if (countryNorm !== "india" && countryNorm !== "indian") {
          countrySet.add(c.country);
        }
      }
    });
    return Array.from(countrySet).sort((a, b) => a.localeCompare(b));
  }, [colleges]);

  const filteredColleges = useMemo(() => {
    const normSearch = normalize(searchTerm);
    
    // Debug logging
    if (selectedState && process.env.NODE_ENV === "development") {
      console.log("Filtering M.Tech colleges by state:", selectedState);
      console.log("Total colleges:", colleges.length);
      console.log("Colleges with states:", colleges.filter(c => c.state).map(c => ({ name: c.name, state: c.state })));
    }
    
    return colleges.filter((college) => {
      const isIndia = normalize(college.country) === "india";
      if (selectedCountry) {
        const variants = createVariants(selectedCountry);
        const collegeCountryVariants = createVariants(college.country);
        const match =
          variants.some((v) => collegeCountryVariants.includes(v)) ||
          collegeCountryVariants.some((v) => variants.includes(v));
        if (!match) return false;
      }
      if (selectedState) {
        // More flexible state matching
        const selectedStateNorm = normalize(selectedState);
        const collegeStateNorm = normalize(college.state || "");
        
        // Direct match
        if (collegeStateNorm === selectedStateNorm) {
          if (process.env.NODE_ENV === "development") {
            console.log("Direct match found:", college.name, "State:", college.state);
          }
          if (!isIndia) return false;
          return true;
        }
        
        // Variant matching
        const variants = createVariants(selectedState);
        const collegeStateVariants = createVariants(college.state || "");
        const match =
          variants.some((v) => collegeStateVariants.includes(v)) ||
          collegeStateVariants.some((v) => variants.includes(v)) ||
          collegeStateNorm.includes(selectedStateNorm) ||
          selectedStateNorm.includes(collegeStateNorm);
        
        if (!match) {
          if (process.env.NODE_ENV === "development") {
            console.log("No match for:", college.name, "State:", college.state, "Selected:", selectedState);
          }
          return false;
        }
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
    const queryString = params.toString();
    router.replace(`/course/mtech${queryString ? `?${queryString}` : ""}`, { scroll: true });
  };

  const handleSelectCountry = (country: string) => {
    const newCountry = country === selectedCountry ? "" : country;
    setSelectedCountry(newCountry);
    setSelectedState("");
    const params = new URLSearchParams();
    if (newCountry) params.set("country", newCountry);
    const queryString = params.toString();
    router.replace(`/course/mtech${queryString ? `?${queryString}` : ""}`, { scroll: true });
  };

  // --- RENDER ---
  const hasStateParam = !!searchParams.get("state");
  const hasCountryParam = !!searchParams.get("country");
  const showCollegeExplorer = hasStateParam || hasCountryParam;
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {showCollegeExplorer ? (
        // Show college explorer when state or country parameter is present
      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">M.Tech / M.E. Colleges Explorer</h1>
            <p className="text-gray-600 mt-1">
              Pick a state or country to explore M.Tech colleges.
            </p>
          </div>
        </div>

        {/* Popular Courses */}
        <div className="popularCollegeSearch" style={{ marginTop: '24px' }}>
          <p style={{ fontSize: '12px', fontWeight: 400, marginBottom: '8px' }}>Popular Courses</p>
          <div className="pop_clg_link" style={{ display: 'flex', gap: '5px 20px', flexWrap: 'wrap' }}>
            <a href="/course/mbbs" style={{ fontSize: '12px', fontWeight: 700, color: '#A03318' }}>MBBS</a>
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
                router.replace("/course/mtech", { scroll: true });
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
                ? `M.Tech Colleges in ${selectedState}`
                : selectedCountry
                ? `M.Tech Colleges in ${selectedCountry}`
                : "All M.Tech Colleges"}
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
              {selectedCountry
                ? `No M.Tech colleges found in ${selectedCountry}.`
                : selectedState
                ? `No M.Tech colleges found in ${selectedState}.`
                : "No colleges match the current filters."}
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