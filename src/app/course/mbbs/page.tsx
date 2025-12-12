"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { db } from "@/firebase/firebase";
import { collection, onSnapshot, query, doc, getDoc, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
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
  approval: string[];
  website?: string;
  streams: string[];
  raw: any;
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

const MBBS_KEYWORDS = [
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

const MEDICAL_COLLEGE_KEYWORDS = [
  "medical college",
  "medical university",
  "medical institute",
  "medical school",
  "college of medicine",
  "school of medicine",
  "institute of medical",
  "medicine",
];

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

function isMbbsCollege(data: any): boolean {
  const textFields = [
    data.course,
    data.stream,
    data.branch,
    data.program,
    data.discipline,
    data.courseType,
    data.category,
    data.collegeCategory,
    data.collegeType,
    data.institutionType,
    data.collegeName,
    data.name,
    data.description,
    data.about,
    data.overview,
    data.admissionEligibility,
    data.eligibility,
    data.admissionProcess,
    data.address,
    data.location,
    ...gatherStrings(data.tags),
    ...gatherStrings(data.courses),
    ...gatherStrings(data.coursesOffered),
    ...gatherStrings(data.programs),
    ...gatherStrings(data.ugPrograms),
    ...gatherStrings(data.pgPrograms),
    ...gatherStrings(data.departments),
    ...gatherStrings(data.offerings),
    ...gatherStrings(data.specializations),
    ...gatherStrings(data.faculties),
    ...gatherStrings(data.medicalCourses),
    ...gatherStrings(data.medicalPrograms),
    ...gatherStrings(data.degreePrograms),
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());

  const hasMbbsKeyword = textFields.some((t) => MBBS_KEYWORDS.some((k) => t.includes(k)));

  const collegeName = String(data.collegeName || data.name || "").toLowerCase();
  const isMedicalCollege = MEDICAL_COLLEGE_KEYWORDS.some((k) => collegeName.includes(k));

  const streamsArray = Array.isArray(data.streams) ? data.streams : [];
  const hasMbbsInStreams = streamsArray.some((s: any) => {
    const str = String(s).toLowerCase();
    return str.includes("mbbs") || str.includes("medicine");
  });

  return hasMbbsKeyword || isMedicalCollege || hasMbbsInStreams;
}

function extractCity(data: any): string {
  return (
    data.city ||
    data.cityName ||
    data?.location?.city ||
    data?.address?.city ||
    data?.addressCity ||
    ""
  );
}

function extractCountry(data: any): string {
  return (
    data.country ||
    data.countryName ||
    data?.location?.country ||
    data?.address?.country ||
    data?.addressCountry ||
    ""
  );
}

export default function MbbsExplorerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MbbsExplorerPageContent />
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

function MbbsExplorerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedTab, setSelectedTab] = useState<"india" | "abroad">("india");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Course details state
  const [course, setCourse] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  
  // Fixed course ID for MBBS course details
  const courseId = "3QqBEAq04KvJYBI3IUC9";

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
    const tab = searchParams.get("scope") as "india" | "abroad" | null;
    const city = searchParams.get("city");
    const country = searchParams.get("country");
    if (tab) setSelectedTab(tab);
    if (city) setSelectedCity(city);
    if (country) setSelectedCountry(country);
  }, [searchParams]);

  // Fetch course details when no query parameters
  useEffect(() => {
    const scope = searchParams.get("scope");
    const city = searchParams.get("city");
    const country = searchParams.get("country");
    if (!scope && !city && !country) {
      fetchCourseDetails();
      fetchComments();
    }
  }, [searchParams]);

  useEffect(() => {
    const collegesRef = collection(db, "colleges");
    const q = query(collegesRef);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: College[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!isMbbsCollege(data)) return;

          const city = extractCity(data);
          const country = extractCountry(data);
          const state = data.state || data?.location?.state || "";
          const address =
            data.addressLine || data.address || data?.location?.address || data?.address?.street || "";
          const approvals = Array.isArray(data.approval)
            ? data.approval
            : data.approval
            ? [data.approval]
            : [];
          const streams = Array.isArray(data.streams) ? data.streams : [];

          const slug = getCollegeSlug({
            id: doc.id,
            name: data.name || data.collegeName || "Unnamed College",
            city,
            state,
            country,
            address,
            approval: approvals,
            streams,
            ...data,
          });

          list.push({
            id: doc.id,
            sourceId: doc.id,
            sourceCollection: "colleges",
            slug,
            name: data.name || data.collegeName || "Unnamed College",
            city,
            state,
            country,
            address,
            approval: approvals,
            website: data.website || data.url || data?.links?.website,
            streams,
            raw: data,
          });
        });
        setColleges(list.sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching colleges:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const cities = useMemo(() => {
    const filtered = colleges.filter((c) => normalize(c.country) === "india");
    return Array.from(
      new Set(filtered.map((c) => c.city).filter(Boolean).sort((a, b) => a.localeCompare(b)))
    );
  }, [colleges]);

  const countries = useMemo(() => {
    const filtered = colleges.filter((c) => normalize(c.country) !== "india" && c.country);
    return Array.from(
      new Set(filtered.map((c) => c.country).filter(Boolean).sort((a, b) => a.localeCompare(b)))
    );
  }, [colleges]);

  const filteredColleges = useMemo(() => {
    const normSearch = normalize(searchTerm);
    return colleges.filter((college) => {
      const isIndia = normalize(college.country) === "india";
      if (selectedTab === "india" && !isIndia) return false;
      if (selectedTab === "abroad" && isIndia) return false;

      if (selectedTab === "india" && selectedCity) {
        const variants = createVariants(selectedCity);
        const collegeCityVariants = createVariants(college.city);
        const matchesCity =
          variants.some((v) => collegeCityVariants.includes(v)) ||
          collegeCityVariants.some((v) => variants.includes(v));
        if (!matchesCity) return false;
      }

      if (selectedTab === "abroad" && selectedCountry) {
        const variants = createVariants(selectedCountry);
        const collegeCountryVariants = createVariants(college.country);
        const matchesCountry =
          variants.some((v) => collegeCountryVariants.includes(v)) ||
          collegeCountryVariants.some((v) => variants.includes(v));
        if (!matchesCountry) return false;
      }

      if (normSearch) {
        const haystack = [
          college.name,
          college.city,
          college.state,
          college.country,
          college.address,
          ...college.approval,
          ...college.streams,
        ]
          .filter(Boolean)
          .map((value) => normalize(value));
        if (!haystack.some((value) => value.includes(normSearch))) return false;
      }

      return true;
    });
  }, [colleges, selectedTab, selectedCity, selectedCountry, searchTerm]);

  const handleSelectCity = (city: string) => {
    const newCity = city === selectedCity ? "" : city;
    setSelectedCity(newCity);
    setSelectedCountry("");
    setSelectedTab("india");
    const params = new URLSearchParams();
    params.set("scope", "india");
    if (newCity) params.set("city", newCity);
    router.replace(`/course/mbbs?${params.toString()}`, { scroll: true });
  };

  const handleSelectCountry = (country: string) => {
    const newCountry = country === selectedCountry ? "" : country;
    setSelectedCountry(newCountry);
    setSelectedCity("");
    setSelectedTab("abroad");
    const params = new URLSearchParams();
    params.set("scope", "abroad");
    if (newCountry) params.set("country", newCountry);
    router.replace(`/course/mbbs?${params.toString()}`, { scroll: true });
  };

  const handleTabChange = (tab: "india" | "abroad") => {
    setSelectedTab(tab);
    setSelectedCity("");
    setSelectedCountry("");
    const params = new URLSearchParams();
    params.set("scope", tab);
    router.replace(`/course/mbbs?${params.toString()}`, { scroll: true });
  };

  // Only show content when query parameters are present
  const hasQueryParams = !!(
    searchParams.get("scope") ||
    searchParams.get("city") ||
    searchParams.get("country")
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {hasQueryParams ? (
        // Show college explorer when query parameters are present
      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">MBBS Colleges Explorer</h1>
            <p className="text-gray-600 mt-1">
              Select a city or country to view MBBS colleges.
            </p>
          </div>
          <div className="flex gap-2 bg-white border rounded-full p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleTabChange("india")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedTab === "india" ? "bg-red-700 text-white" : "text-gray-600 hover:text-red-700"
              }`}
            >
              India (City)
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("abroad")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedTab === "abroad" ? "bg-red-700 text-white" : "text-gray-600 hover:text-red-700"
              }`}
            >
              Abroad (Country)
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search colleges, location, approval, streams…"
              className="flex-1 min-w-[220px] border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-red-700"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCity("");
                  setSelectedCountry("");
                  setSelectedTab("india");
                  router.replace("/course/mbbs?scope=india", { scroll: true });
                }}
                className="px-4 py-2 rounded-full border text-sm text-gray-600 hover:border-red-700 hover:text-red-700"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedTab === "india" ? "Cities in India" : "Countries"}
            </h2>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {selectedTab === "india"
                ? cities.map((city) => (
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
                : countries.map((country) => (
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
                  ))}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedTab === "india"
                ? selectedCity
                  ? `MBBS Colleges in ${selectedCity}`
                  : "MBBS Colleges in India"
                : selectedCountry
                ? `MBBS Colleges in ${selectedCountry}`
                : "MBBS Colleges Abroad"}
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
            <div className="px-4 md:px-6 py-6 space-y-6">
              {filteredColleges.map((college) => {
                const primaryImage =
                  college.raw?.image ||
                  college.raw?.logoUrl ||
                  college.raw?.logo ||
                  "/build/assets/t-1709039660-chitkara-university-rajpura.jpeg";
                const ratingValue = Number(college.raw?.rating ?? college.raw?.overallRating ?? "");
                const rating = Number.isFinite(ratingValue) ? ratingValue : null;
                const totalCourses =
                  college.raw?.totalCourses ||
                  college.raw?.noOfCourses ||
                  college.raw?.coursesCount ||
                  college.raw?.numberOfCourses;
                const packageFee =
                  college.raw?.totalFees ||
                  college.raw?.fee ||
                  college.raw?.fees ||
                  college.raw?.package ||
                  college.raw?.avgFee ||
                  college.raw?.tuition;
                const streamsPreview = college.streams.slice(0, 6);
                return (
                  <div key={college.id} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-64 lg:w-72 h-48 md:h-auto relative bg-gray-100">
                        <Image
                          src={primaryImage}
                          alt={college.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 320px"
                        />
                      </div>
                      <div className="flex-1 p-6 space-y-4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div>
                            <h3 className="text-lg md:text-xl font-semibold text-gray-900">{college.name}</h3>
                            <div className="text-sm text-gray-500">
                              {college.address || `${college.city}${college.state ? `, ${college.state}` : ""}`}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{college.country}</div>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <Link
                              href={
                                college.sourceCollection === "colleges"
                                  ? `/colleges/${college.slug || college.sourceId || college.id}`
                                  : `/course/college/${college.slug || college.sourceId || college.id}`
                              }
                              className="text-sm font-semibold text-red-700 hover:underline whitespace-nowrap"
                            >
                              View College
                            </Link>
                            <div className="flex flex-col items-end text-sm text-gray-600 gap-1">
                              {rating && (
                                <div>
                                  <span className="font-semibold text-gray-900">{rating.toFixed(2)}</span> Rating
                                </div>
                              )}
                              {totalCourses && (
                                <div>{totalCourses} Courses</div>
                              )}
                              {packageFee && (
                                <div className="text-red-700 font-medium">{packageFee}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">Location</p>
                            <p>
                              {[college.city, college.state].filter(Boolean).join(", ")}
                            </p>
                            <p className="text-xs text-gray-500">{college.country}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">Streams / Tags</p>
                            <div className="flex flex-wrap gap-1">
                              {streamsPreview.length > 0 ? (
                                streamsPreview.map((stream, index) => (
                                  <span
                                    key={`${college.id}-stream-${index}`}
                                    className="px-2 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-100 text-xs"
                                  >
                                    {stream}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                              {college.streams.length > streamsPreview.length && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full border border-gray-200 text-xs">
                                  +{college.streams.length - streamsPreview.length} more
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 mb-1">Approvals</p>
                            <p className="text-xs text-gray-600">
                              {college.approval.length > 0 ? college.approval.join(" | ") : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                          <div className="text-xs text-gray-500">
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      ) : (
        // Show course details when no query parameters
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