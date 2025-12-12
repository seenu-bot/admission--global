"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { db } from "@/firebase/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { getCollegeSlug } from "@/lib/slugify";
import { slugToCourseName } from "@/lib/courses";

type College = {
  id: string;
  slug?: string;
  name: string;
  city: string;
  state: string;
  country: string;
  address: string;
  approvals: string[];
  website?: string;
  streams: string[];
  coursesOffered: string[];
  rating?: number | null;
  totalCourses?: number | string;
  fee?: string | number;
  image?: string;
  type?: string;
  university?: string;
  nirfRanking?: string | number;
  highestPackage?: string | number;
  examsAccepted?: string[];
  establishedYear?: string | number;
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

const DEFAULT_IMAGE = "/build/assets/t-1709039660-chitkara-university-rajpura.jpeg";

// Helper function to validate image URL
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

function CollegesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState<College[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  // Preselect course from query param (?course=...) or default to MBBS
  useEffect(() => {
    const courseParam = searchParams.get("course");
    if (courseParam) {
      const decoded = decodeURIComponent(courseParam);
      const courseName = slugToCourseName[decoded] || decoded;
      
      // Check if this is the excluded long medical course
      const isLongMedicalCourse = 
        courseName.length > 100 &&
        /Anatomy.*Physiology.*Biochemistry.*Pathology/i.test(courseName) &&
        /Forensic Medicine.*Community Medicine/i.test(courseName) &&
        /Otorhinolaryngology/i.test(courseName);
      
      if (!isLongMedicalCourse) {
        setSelectedCourse(courseName);
      } else {
        // If excluded course, default to MBBS
        setSelectedCourse("MBBS");
      }
    } else {
      // No course param - default to MBBS
      setSelectedCourse("MBBS");
    }
  }, [searchParams]);

  useEffect(() => {
    const collegesQ = query(collection(db, "colleges"));
    const unsub = onSnapshot(
      collegesQ,
      (snapshot) => {
        const list: College[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const name = data.collegeName || data.name || data.universityName || data.instituteName || "";
          if (!name) return;

          const city = data.city || data.cityName || data?.location?.city || "";
          const state = data.state || data.stateName || data.province || data?.location?.state || "";
          const country = data.country || data.countryName || data?.location?.country || "India";
          const address = data.address || data.addressLine || data.fullAddress || "";
          const approvals = Array.isArray(data.approvals) 
            ? data.approvals 
            : Array.isArray(data.approval)
            ? data.approval
            : data.approvals 
            ? [data.approvals] 
            : data.approval
            ? [data.approval]
            : [];
          const streams = Array.isArray(data.streams) ? data.streams : data.streams ? [data.streams] : [];
          const coursesOffered = Array.isArray(data.coursesOffered)
            ? data.coursesOffered
            : Array.isArray(data.courses)
            ? data.courses
            : Array.isArray(data.programs)
            ? data.programs
            : data.coursesOffered
            ? [data.coursesOffered]
            : [];
          const ratingRaw = data.rating || data.overallRating || data.score;
          const rating = ratingRaw !== undefined && !Number.isNaN(Number(ratingRaw)) ? Number(ratingRaw) : null;
          const totalCourses = data.totalCourses || data.noOfCourses || data.coursesCount || data.programCount;
          const fee = data.fees || data.fee || data.totalFees || data.avgFee || data.averageFee || data.tuition || data.courseFee;
          const website = data.website || data.url || data.link || data.applyUrl;
          const image = data.image || data.logo || data.banner || data.thumbnail;
          const type = data.type || "";
          const university = data.university || data.universityName || "";
          const nirfRanking = data.nirfRanking || data.nirfRank || data.ranking || "";
          const highestPackage = data.highestPackage || data.highestSalary || data.maxPackage || data.maxSalary || "";
          const examsAccepted = Array.isArray(data.examsAccepted) 
            ? data.examsAccepted 
            : Array.isArray(data.exams)
            ? data.exams
            : data.examsAccepted
            ? [data.examsAccepted]
            : data.exams
            ? [data.exams]
            : [];
          const establishedYear = data.establishedYear || data.established || "";

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

          list.push({
            id: doc.id,
            slug,
            name,
            city,
            state,
            country,
            address,
            approvals,
            website,
            streams,
            coursesOffered,
            rating,
            totalCourses,
            fee,
            image,
            type,
            university,
            nirfRanking,
            highestPackage,
            examsAccepted,
            establishedYear,
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

  const courses = useMemo(() => {
    const allCourses = new Set<string>();
    
    colleges.forEach((college) => {
      if (college.coursesOffered && Array.isArray(college.coursesOffered)) {
        college.coursesOffered.forEach((course) => {
          if (course && typeof course === "string" && course.trim()) {
            const trimmedCourse = course.trim();
            
            // Filter out the long course name - check for key medical terms together
            const isLongMedicalCourse = 
              trimmedCourse.length > 100 && // Very long course name
              /Anatomy.*Physiology.*Biochemistry.*Pathology/i.test(trimmedCourse) &&
              /Forensic Medicine.*Community Medicine/i.test(trimmedCourse) &&
              /Otorhinolaryngology/i.test(trimmedCourse);
            
            // Also filter out if it contains too many medical specialties in sequence
            const medicalTermsCount = (trimmedCourse.match(/\b(Anatomy|Physiology|Biochemistry|Pathology|Pharmacology|Microbiology|Forensic|Community|Medicine|surgery|Obst|Gynae|Paediatrics|Dermatology|Psychiatry|Cardiology|Physical|Neuromedicine|Nephrology|ophthalmology|Otorhinolaryngology)\b/gi) || []).length;
            
            if (!isLongMedicalCourse && medicalTermsCount < 10) {
              allCourses.add(trimmedCourse);
            }
          }
        });
      }
    });
    return Array.from(allCourses).sort((a, b) => a.localeCompare(b));
  }, [colleges]);

  const filteredColleges = useMemo(() => {
    const normSearch = normalize(searchTerm);
    return colleges.filter((college) => {
      if (selectedCourse) {
        const selectedCourseNorm = normalize(selectedCourse);
        const hasCourse = college.coursesOffered && Array.isArray(college.coursesOffered) && 
          college.coursesOffered.some((course) => normalize(course) === selectedCourseNorm);
        if (!hasCourse) return false;
      }

      if (normSearch) {
        const haystack = [
          college.name,
          college.city,
          college.state,
          college.country,
          college.address,
          college.type,
          college.university,
          ...(college.approvals || []),
          ...(college.streams || []),
          ...(college.coursesOffered || []),
        ]
          .filter(Boolean)
          .map((value) => normalize(value));
        if (!haystack.some((value) => value.includes(normSearch))) return false;
      }
      return true;
    });
  }, [colleges, selectedCourse, searchTerm]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const collegesPerPage = 10;

  const paginatedColleges = useMemo(() => {
    const startIndex = (currentPage - 1) * collegesPerPage;
    const endIndex = startIndex + collegesPerPage;
    return filteredColleges.slice(startIndex, endIndex);
  }, [filteredColleges, currentPage]);

  const totalPages = Math.ceil(filteredColleges.length / collegesPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, searchTerm]);

  const handleSelectCourse = (course: string) => {
    // Check if this is the excluded long medical course
    const isLongMedicalCourse = 
      course.length > 100 &&
      /Anatomy.*Physiology.*Biochemistry.*Pathology/i.test(course) &&
      /Forensic Medicine.*Community Medicine/i.test(course) &&
      /Otorhinolaryngology/i.test(course);
    
    // Don't allow selection of excluded course
    if (isLongMedicalCourse) {
      return;
    }
    
    const newCourse = course === selectedCourse ? "" : course;
    setSelectedCourse(newCourse);
    setCurrentPage(1);
  };
  
  // Clear selection if excluded course is currently selected
  useEffect(() => {
    if (selectedCourse) {
      const isLongMedicalCourse = 
        selectedCourse.length > 100 &&
        /Anatomy.*Physiology.*Biochemistry.*Pathology/i.test(selectedCourse) &&
        /Forensic Medicine.*Community Medicine/i.test(selectedCourse) &&
        /Otorhinolaryngology/i.test(selectedCourse);
      
      if (isLongMedicalCourse) {
        setSelectedCourse("");
      }
    }
  }, [selectedCourse]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-10 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">All Colleges</h1>
            <p className="text-gray-600 mt-1">
              Browse all colleges from our database. Use filters to find colleges by course or search by name.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search colleges, courses, location, approvals, streams…"
              className="flex-1 min-w-[220px] border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-red-700"
            />
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCourse("");
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-full border text-sm text-gray-600 hover:border-red-700 hover:text-red-700"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Two Column Layout: Filters Left, Colleges Right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Course Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white border rounded-2xl p-5 shadow-sm sticky top-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Courses Offered</h2>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {courses.length === 0 ? (
                  <span className="text-sm text-gray-400">No courses detected yet.</span>
                ) : (
                  courses.map((course) => (
                    <button
                      key={course}
                      type="button"
                      onClick={() => handleSelectCourse(course)}
                      className={`w-full text-left px-4 py-2 rounded-lg border text-sm transition ${
                        selectedCourse === course
                          ? "bg-red-700 text-white border-red-700"
                          : "border-gray-300 text-gray-700 hover:border-red-700 hover:text-red-700 hover:bg-red-50"
                      }`}
                    >
                      {course}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Colleges Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedCourse
                    ? `Colleges offering ${selectedCourse}`
                    : "All Colleges"}
                </h2>
                <span className="text-sm text-gray-500">
                  {loading ? "Loading…" : `${filteredColleges.length} college(s)`}
                </span>
              </div>

          {loading ? (
            <div className="px-4 md:px-6 py-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border rounded-lg p-4 shadow-sm animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
              ) : filteredColleges.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-600">
                  No colleges match the current filters.
                </div>
              ) : (
                <>
                  <div className="px-4 md:px-6 py-6 grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedColleges.map((college) => {
                  const primaryCourse = college.coursesOffered && college.coursesOffered.length > 0 
                    ? college.coursesOffered[0] 
                    : "—";
                  const location = [college.city, college.state].filter(Boolean).join(", ") || "—";
                  const feeDisplay = college.fee 
                    ? typeof college.fee === "number" 
                      ? `₹${college.fee.toLocaleString()}` 
                      : String(college.fee)
                    : "—";
                  const packageDisplay = college.highestPackage
                    ? typeof college.highestPackage === "number"
                      ? `₹${(college.highestPackage / 100000).toFixed(1)} LPA`
                      : String(college.highestPackage)
                    : "—";
                  
                  return (
                    <div key={college.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      {/* College Image */}
                      <div className="w-full h-32 relative bg-gray-100 rounded-lg mb-4 overflow-hidden">
                        <Image
                          src={college.image && isValidImageUrl(college.image) ? college.image : DEFAULT_IMAGE}
                          alt={college.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 300px"
                        />
                      </div>

                      {/* College Name and Location */}
                      <div className="mb-3">
                        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                          {college.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {location}
                          {college.nirfRanking && (
                            <span className="text-gray-500"> #{college.nirfRanking}/100 (NIRF 2025)</span>
                          )}
                        </p>
                        {college.rating !== undefined && college.rating !== null && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-sm font-semibold text-gray-900">{college.rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({Math.floor(Math.random() * 50) + 1})</span>
                          </div>
                        )}
                      </div>

                      {/* Course Offered */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Course Offered</p>
                        <p className="text-sm font-medium text-gray-900">{primaryCourse}</p>
                      </div>

                      {/* Fees */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Fees</p>
                        <p className="text-sm font-medium text-gray-900">
                          {feeDisplay !== "—" ? `${feeDisplay} (4 Years)` : "—"}
                        </p>
                      </div>

                      {/* Exams Accepted */}
                      {college.examsAccepted && college.examsAccepted.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Exams Accepted</p>
                          <p className="text-sm text-gray-700">
                            {college.examsAccepted.slice(0, 2).join(" , ")}
                            {college.examsAccepted.length > 2 && " ..."}
                          </p>
                        </div>
                      )}

                      {/* Highest Package */}
                      {packageDisplay !== "—" && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Highest Package</p>
                          <p className="text-sm font-medium text-gray-900">{packageDisplay}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Link
                          href={`/colleges/${college.slug || college.id}`}
                          className="flex-1 text-center px-3 py-2 text-sm font-medium text-red-700 border border-red-700 rounded hover:bg-red-50 transition"
                        >
                          View College
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t bg-gray-50 flex justify-center items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  
                  {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 10) {
                      pageNum = i + 1;
                    } else if (currentPage <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 4) {
                      pageNum = totalPages - 9 + i;
                    } else {
                      pageNum = currentPage - 5 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm border rounded ${
                          currentPage === pageNum
                            ? "bg-red-700 text-white border-red-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 10 && currentPage < totalPages - 4 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-2 text-sm border rounded hover:bg-gray-100"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ›
                    </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function CollegesPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-10">
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <Footer />
      </main>
    }>
      <CollegesPageContent />
    </Suspense>
  );
}

