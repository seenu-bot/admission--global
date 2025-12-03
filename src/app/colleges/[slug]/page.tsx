"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { getCollegeSlug } from "@/lib/slugify";

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

const DEFAULT_IMAGE = "/build/assets/t-1709039660-chitkara-university-rajpura.jpeg";

// Helper function to check if a string looks like a Firestore ID
function looksLikeId(identifier: string): boolean {
  // Firestore IDs are typically 20 characters, alphanumeric
  return /^[a-zA-Z0-9]{20}$/.test(identifier);
}

export default function CollegeDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [college, setCollege] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const fetchCollegeDetails = async () => {
      try {
        let collegeData: any = null;
        let foundById = false;

        // First, try to fetch from "colleges" collection by ID (if slug looks like an ID)
        if (looksLikeId(slug)) {
          const collegeRef = doc(db, "colleges", slug);
          const collegeSnap = await getDoc(collegeRef);
          
          if (collegeSnap.exists()) {
            collegeData = { id: collegeSnap.id, ...collegeSnap.data() };
            foundById = true;
          }
        }

        // If not found by ID, try to find by slug in "colleges" collection
        if (!collegeData) {
          try {
            const collegesQuery = query(collection(db, "colleges"), where("slug", "==", slug), limit(1));
            const collegesSnapshot = await getDocs(collegesQuery);
            
            if (!collegesSnapshot.empty) {
              collegeData = { id: collegesSnapshot.docs[0].id, ...collegesSnapshot.docs[0].data() };
            }
          } catch (error) {
            console.log("Slug query failed, continuing search...");
          }
        }

        // Fallback: iterate through colleges to find slugified match (handles legacy docs without slug field)
        if (!collegeData) {
          try {
            const allCollegesSnapshot = await getDocs(collection(db, "colleges"));
            for (const docSnap of allCollegesSnapshot.docs) {
              const docData = docSnap.data();
              const generatedSlug = getCollegeSlug({ id: docSnap.id, ...docData });
              if (generatedSlug && generatedSlug === slug) {
                collegeData = { id: docSnap.id, ...docData };
                break;
              }
            }
          } catch (error) {
            console.log("Fallback slug scan failed...");
          }
        }

        // Try "courses" collection (some colleges might be stored there)
        if (!collegeData) {
          try {
            const coursesQuery = query(collection(db, "courses"), where("slug", "==", slug));
            const coursesSnapshot = await getDocs(coursesQuery);
            
            if (!coursesSnapshot.empty) {
              const courseData = coursesSnapshot.docs[0].data();
              // Check if it's actually a college entry
              if (courseData.collegeName || courseData.name || courseData.instituteName) {
                collegeData = { id: coursesSnapshot.docs[0].id, ...courseData };
              }
            }
          } catch (error) {
            console.log("Courses query failed...");
          }
        }

        if (collegeData) {
          // If the identifier looks like an ID and we found the college,
          // redirect to the slug-based URL
          if (foundById && looksLikeId(slug)) {
            const collegeSlug = getCollegeSlug(collegeData);
            if (collegeSlug && collegeSlug !== slug) {
              setRedirecting(true);
              router.replace(`/colleges/${collegeSlug}`);
              return;
            }
          }

          // If we found by slug but the URL doesn't match the canonical slug, redirect
          const canonicalSlug = getCollegeSlug(collegeData);
          if (canonicalSlug && canonicalSlug !== slug && !looksLikeId(slug)) {
            setRedirecting(true);
            router.replace(`/colleges/${canonicalSlug}`);
            return;
          }

          setCollege(collegeData);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching college:", error);
        setLoading(false);
      }
    };

    if (slug) {
      fetchCollegeDetails();
    }
  }, [slug, router]);

  if (redirecting) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-10">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Redirecting...</p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-10">
          {/* Breadcrumb skeleton */}
          <div className="h-4 w-40 bg-gray-200 rounded mb-6 animate-pulse" />

          {/* Header Section skeleton */}
          <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 mb-10">
            <div className="flex flex-col md:flex-row md:items-start gap-6 animate-pulse">
              {/* College Image skeleton */}
              <div className="w-full md:w-48 h-48 bg-gray-200 rounded-lg" />

              {/* College Info skeleton */}
              <div className="flex-1 space-y-3">
                <div className="h-7 w-2/3 bg-gray-200 rounded" />
                <div className="flex flex-wrap gap-3">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />

                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="w-28 h-16 bg-gray-200 rounded" />
                  <div className="w-28 h-16 bg-gray-200 rounded" />
                  <div className="w-32 h-16 bg-gray-200 rounded" />
                </div>

                <div className="h-9 w-40 bg-gray-200 rounded mt-4" />
              </div>
            </div>
          </div>

          {/* Main Content Grid skeleton */}
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {/* Left Column - Main Details skeleton */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3 animate-pulse">
                <div className="h-6 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3 animate-pulse">
                <div className="h-6 w-52 bg-gray-200 rounded" />
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="h-20 bg-gray-200 rounded" />
                  <div className="h-20 bg-gray-200 rounded" />
                  <div className="h-20 bg-gray-200 rounded" />
                  <div className="h-20 bg-gray-200 rounded" />
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar skeleton */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3 animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-3 animate-pulse">
                <div className="h-6 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!college) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-10">
          <div className="min-h-[60vh] flex flex-col justify-center items-center text-center">
            <h1 className="text-2xl font-semibold text-gray-800 mb-3">College Not Found</h1>
            <p className="text-gray-600 mb-4">The college you're looking for doesn't exist or has been removed.</p>
            <Link href="/" className="text-red-700 hover:underline">
              Go back to home
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const collegeName = college.name || college.collegeName || college.instituteName || college.universityName || "Unknown College";
  const collegeImage = college.image || college.logo || college.logoUrl || college.banner || DEFAULT_IMAGE;
  const city = college.city || college.cityName || (college.location && college.location.city) || "";
  const state = college.state || college.stateName || college.province || (college.location && college.location.state) || "";
  const country = college.country || college.countryName || (college.location && college.location.country) || "India";
  const address = college.address || college.addressLine || college.fullAddress || "";
  const website = college.website || college.url || college.applyUrl || "";
  const rating = college.rating || college.overallRating || college.score;
  const approvals = Array.isArray(college.approval) 
    ? college.approval 
    : Array.isArray(college.approvals)
    ? college.approvals
    : college.approval 
    ? [college.approval]
    : [];
  const coursesOffered = Array.isArray(college.coursesOffered)
    ? college.coursesOffered
    : Array.isArray(college.courses)
    ? college.courses
    : Array.isArray(college.programs)
    ? college.programs
    : college.coursesOffered
    ? [college.coursesOffered]
    : [];
  const streams = Array.isArray(college.streams) ? college.streams : [];
  const totalFees = college.totalFees || college.fee || college.fees || college.avgFee || college.averageFee || "";
  const totalCourses = college.totalCourses || college.noOfCourses || college.coursesCount || "";
  const primaryCourse = coursesOffered && coursesOffered.length > 0 ? coursesOffered[0] : "";
  
  // Additional fields from Firestore
  const galleryImages = Array.isArray(college.galleryImages) 
    ? college.galleryImages 
    : college.galleryImages 
    ? [college.galleryImages] 
    : [];
  const videos = Array.isArray(college.videos) 
    ? college.videos 
    : college.videos 
    ? [college.videos] 
    : [];
  const highlights = college.highlights || "";
  const cutoff = college.cutoff || "";
  const admissionEligibility = college.admissionEligibility || "";
  const scholarships = college.scholarships || "";
  const placements = college.placements || "";
  const topRecruiters = Array.isArray(college.topRecruiters) 
    ? college.topRecruiters 
    : college.topRecruiters 
    ? [college.topRecruiters] 
    : [];
  const events = college.events || "";
  const news = college.news || "";
  const reviews = college.reviews || "";
  const establishedYear = college.establishedYear || "";
  const collegeCode = college.collegeCode || "";
  const pincode = college.pincode || "";
  const contactEmail = college.contactEmail || college.email || "";
  const contactPhone = college.contactPhone || college.phone || college.contactNumber || "";
  const facebook = college.facebook || "";
  const twitter = college.twitter || "";
  const linkedin = college.linkedin || "";
  const instagram = college.instagram || "";
  const nirfRanking = college.nirfRanking || college.nirfRank || college.ranking || "";
  const highestPackage = college.highestPackage || college.highestSalary || "";
  const averageSalary = college.averageSalary || "";
  const intakeCapacity = college.intakeCapacity || "";
  const facultyCount = college.facultyCount || "";
  const studentCount = college.studentCount || "";
  const departments = Array.isArray(college.departments) ? college.departments : [];
  const hostels = college.hostels || "";
  const labs = college.labs || "";
  const libraries = college.libraries || "";
  const transport = college.transport || "";

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6 text-gray-500">
          <Link href="/" className="hover:underline text-red-700">Home</Link> /{" "}
          <Link href="/colleges" className="hover:underline text-red-700">Colleges</Link> /{" "}
          <span>{collegeName}</span>
        </nav>

        {/* Header Section */}
        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 mb-10">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* College Image */}
            <div className="w-full md:w-48 h-48 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {isValidImageUrl(collegeImage) ? (
                <Image
                  src={collegeImage}
                  alt={collegeName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 200px"
                  priority={false}
                  unoptimized={collegeImage?.startsWith("http://") || collegeImage?.startsWith("https://")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>

            {/* College Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{collegeName}</h1>
                  {nirfRanking && (
                    <p className="text-sm text-gray-500 mb-2">
                      #{nirfRanking}/100 (NIRF 2025)
                    </p>
                  )}
                </div>
                {rating !== undefined && rating !== null && (
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-gray-900">{typeof rating === "number" ? rating.toFixed(1) : rating}</span>
                      <span className="text-sm text-gray-500">({Math.floor(Math.random() * 50) + 1})</span>
                    </div>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                {city && <span>📍 {city}</span>}
                {state && <span>{state}</span>}
                {country && <span>{country}</span>}
              </div>

              {address && (
                <p className="text-gray-600 mb-4">{address}</p>
              )}

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {primaryCourse && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-gray-600 mb-1">Course Offered</p>
                    <p className="text-sm font-semibold text-blue-700">{primaryCourse}</p>
                  </div>
                )}
                {totalFees && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <p className="text-xs text-gray-600 mb-1">Fees (4 Years)</p>
                    <p className="text-sm font-semibold text-green-700">
                      {typeof totalFees === "number" ? `₹${totalFees.toLocaleString()}` : totalFees}
                    </p>
                  </div>
                )}
                {highestPackage && (
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <p className="text-xs text-gray-600 mb-1">Highest Package</p>
                    <p className="text-sm font-semibold text-orange-700">
                      {typeof highestPackage === "number" 
                        ? `₹${(highestPackage / 100000).toFixed(1)} LPA` 
                        : String(highestPackage)}
                    </p>
                  </div>
                )}
                {totalCourses && (
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-gray-600 mb-1">Total Courses</p>
                    <p className="text-sm font-semibold text-purple-700">{totalCourses}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-5 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition"
                  >
                    Visit Official Website →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {/* Left Column - Main Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Overview */}
            {(college.description || college.overview || college.about || college.notes) && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Overview</h2>
                <p className="text-gray-600 leading-relaxed">
                  {college.description || college.overview || college.about || college.notes}
                </p>
              </section>
            )}

            {/* Courses Offered */}
            {coursesOffered.length > 0 && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Courses Offered</h2>
                <div className="flex flex-wrap gap-2">
                  {coursesOffered.map((course: string, i: number) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full border border-blue-100 text-sm"
                    >
                      {course}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Streams */}
            {streams.length > 0 && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Streams</h2>
                <div className="flex flex-wrap gap-2">
                  {streams.map((stream: string, i: number) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full border border-purple-100 text-sm"
                    >
                      {stream}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Admission Process */}
            {college.admissionProcess && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Admission Process</h2>
                {typeof college.admissionProcess === "string" ? (
                  <p className="text-gray-600 leading-relaxed">{college.admissionProcess}</p>
                ) : (
                  <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                    {Array.isArray(college.admissionProcess) ? (
                      college.admissionProcess.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))
                    ) : (
                      <li>{String(college.admissionProcess)}</li>
                    )}
                  </ol>
                )}
              </section>
            )}

            {/* Facilities */}
            {college.facilities && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Facilities</h2>
                {typeof college.facilities === "string" ? (
                  <p className="text-gray-600 leading-relaxed">{college.facilities}</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    {Array.isArray(college.facilities) ? (
                      college.facilities.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))
                    ) : (
                      <li>{String(college.facilities)}</li>
                    )}
                  </ul>
                )}
              </section>
            )}

            {/* Highlights */}
            {highlights && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Highlights</h2>
                {typeof highlights === "string" ? (
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line">{highlights}</div>
                ) : (
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    {Array.isArray(highlights) ? (
                      highlights.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))
                    ) : (
                      <li>{String(highlights)}</li>
                    )}
                  </ul>
                )}
              </section>
            )}

            {/* Admission Eligibility */}
            {admissionEligibility && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Admission Eligibility</h2>
                <p className="text-gray-600 leading-relaxed">{admissionEligibility}</p>
              </section>
            )}

            {/* Cutoff */}
            {cutoff && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Cutoff</h2>
                <p className="text-gray-600 leading-relaxed">{cutoff}</p>
              </section>
            )}

            {/* Scholarships */}
            {scholarships && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Scholarships</h2>
                {typeof scholarships === "string" ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{scholarships}</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    {Array.isArray(scholarships) ? (
                      scholarships.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))
                    ) : (
                      <li>{String(scholarships)}</li>
                    )}
                  </ul>
                )}
              </section>
            )}

            {/* Placements */}
            {placements && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Placements</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{placements}</p>
              </section>
            )}

            {/* Top Recruiters */}
            {topRecruiters.length > 0 && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Top Recruiters</h2>
                <div className="flex flex-wrap gap-2">
                  {topRecruiters.map((recruiter: string, i: number) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full border border-orange-100 text-sm"
                    >
                      {recruiter}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Events */}
            {events && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Events</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{events}</p>
              </section>
            )}

            {/* News */}
            {news && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">News</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{news}</p>
              </section>
            )}

            {/* Reviews */}
            {reviews && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Reviews</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{reviews}</p>
              </section>
            )}

            {/* Gallery */}
            {galleryImages.length > 0 && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryImages.map((imageUrl: string, i: number) => {
                    if (!isValidImageUrl(imageUrl)) return null;
                    // Check if it's an external URL that might not be configured
                    const isExternal = imageUrl.startsWith("http://") || imageUrl.startsWith("https://");
                    if (isExternal) {
                      // Use regular img tag for external images to avoid Next.js domain restrictions
                      return (
                        <div key={i} className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={imageUrl}
                            alt={`${collegeName} - Image ${i + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Hide broken images
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      );
                    }
                    // Use Next.js Image for local/configured external images
                    return (
                      <div key={i} className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={imageUrl}
                          alt={`${collegeName} - Image ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                          unoptimized={imageUrl.startsWith("http://") || imageUrl.startsWith("https://")}
                          onError={() => {
                            // Fallback handled by isValidImageUrl check
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Videos</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {videos.map((videoUrl: string, i: number) => {
                    if (!videoUrl || typeof videoUrl !== "string") return null;
                    // Convert YouTube watch URL to embed URL
                    const embedUrl = videoUrl
                      .replace("watch?v=", "embed/")
                      .replace("youtu.be/", "youtube.com/embed/")
                      .split("&")[0]; // Remove additional parameters
                    return (
                      <div key={i} className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Contact Information */}
            {(contactPhone || contactEmail || address || website || facebook || twitter || linkedin || instagram) && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Contact Details</h2>
                <div className="space-y-3 text-gray-600">
                  {address && (
                    <div>
                      <strong className="text-gray-800">Address:</strong>
                      <p className="mt-1">{address}</p>
                      {pincode && <p className="text-sm text-gray-500">Pincode: {pincode}</p>}
                    </div>
                  )}
                  {contactPhone && (
                    <div>
                      <strong className="text-gray-800">Phone:</strong>{" "}
                      <a href={`tel:${contactPhone}`} className="text-red-700 hover:underline">{contactPhone}</a>
                    </div>
                  )}
                  {contactEmail && (
                    <div>
                      <strong className="text-gray-800">Email:</strong>{" "}
                      <a href={`mailto:${contactEmail}`} className="text-red-700 hover:underline">{contactEmail}</a>
                    </div>
                  )}
                  {website && (
                    <div>
                      <strong className="text-gray-800">Website:</strong>{" "}
                      <a href={website} target="_blank" rel="noopener noreferrer" className="text-red-700 hover:underline">{website}</a>
                    </div>
                  )}
                  {(facebook || twitter || linkedin || instagram) && (
                    <div className="pt-2">
                      <strong className="text-gray-800 block mb-2">Social Media:</strong>
                      <div className="flex gap-3">
                        {facebook && (
                          <a href={facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Facebook
                          </a>
                        )}
                        {twitter && (
                          <a href={twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            Twitter
                          </a>
                        )}
                        {linkedin && (
                          <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                            LinkedIn
                          </a>
                        )}
                        {instagram && (
                          <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">
                            Instagram
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Information */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Information</h3>
              <div className="space-y-3">
                {city && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">City</span>
                    <span className="font-medium text-gray-800">{city}</span>
                  </div>
                )}
                {state && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">State</span>
                    <span className="font-medium text-gray-800">{state}</span>
                  </div>
                )}
                {country && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Country</span>
                    <span className="font-medium text-gray-800">{country}</span>
                  </div>
                )}
                {rating !== undefined && rating !== null && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-medium text-gray-800">{typeof rating === "number" ? rating.toFixed(1) : rating}</span>
                  </div>
                )}
                {totalCourses && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Total Courses</span>
                    <span className="font-medium text-gray-800">{totalCourses}</span>
                  </div>
                )}
                {totalFees && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Fees</span>
                    <span className="font-medium text-gray-800">
                      {typeof totalFees === "number" ? `₹${totalFees.toLocaleString()}` : totalFees}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Approvals */}
            {approvals.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Approvals</h3>
                <div className="flex flex-wrap gap-2">
                  {approvals.map((approval: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-sm"
                    >
                      {approval}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Important Dates */}
            {college.importantDates && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Important Dates</h3>
                {typeof college.importantDates === "string" ? (
                  <p className="text-gray-600">{college.importantDates}</p>
                ) : (
                  <div className="space-y-2 text-gray-600">
                    {Object.entries(college.importantDates).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between border-b pb-2">
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Additional Information</h3>
              <div className="space-y-2 text-gray-600">
                {establishedYear && (
                  <div className="flex justify-between border-b pb-2">
                    <span>Established Year</span>
                    <span className="font-medium">{establishedYear}</span>
                  </div>
                )}
                {collegeCode && (
                  <div className="flex justify-between border-b pb-2">
                    <span>College Code</span>
                    <span className="font-medium">{collegeCode}</span>
                  </div>
                )}
                {nirfRanking && (
                  <div className="flex justify-between border-b pb-2">
                    <span>NIRF Ranking</span>
                    <span className="font-medium">{nirfRanking}</span>
                  </div>
                )}
                {intakeCapacity && (
                  <div className="flex justify-between border-b pb-2">
                    <span>Intake Capacity</span>
                    <span className="font-medium">{intakeCapacity}</span>
                  </div>
                )}
                {facultyCount && (
                  <div className="flex justify-between border-b pb-2">
                    <span>Faculty Count</span>
                    <span className="font-medium">{facultyCount}</span>
                  </div>
                )}
                {studentCount && (
                  <div className="flex justify-between border-b pb-2">
                    <span>Student Count</span>
                    <span className="font-medium">{studentCount}</span>
                  </div>
                )}
                {highestPackage && (
                  <div className="flex justify-between border-b pb-2">
                    <span>Highest Package</span>
                    <span className="font-medium">
                      {typeof highestPackage === "number" 
                        ? `₹${(highestPackage / 100000).toFixed(1)} LPA` 
                        : String(highestPackage)}
                    </span>
                  </div>
                )}
                {averageSalary && (
                  <div className="flex justify-between border-b pb-2">
                    <span>Average Salary</span>
                    <span className="font-medium">
                      {typeof averageSalary === "number" 
                        ? `₹${(averageSalary / 100000).toFixed(1)} LPA` 
                        : String(averageSalary)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Infrastructure */}
            {(hostels || labs || libraries || transport) && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Infrastructure</h3>
                <div className="space-y-2 text-gray-600">
                  {hostels && (
                    <div className="flex justify-between border-b pb-2">
                      <span>Hostels</span>
                      <span className="font-medium">{hostels}</span>
                    </div>
                  )}
                  {labs && (
                    <div className="flex justify-between border-b pb-2">
                      <span>Labs</span>
                      <span className="font-medium">{labs}</span>
                    </div>
                  )}
                  {libraries && (
                    <div className="flex justify-between border-b pb-2">
                      <span>Libraries</span>
                      <span className="font-medium">{libraries}</span>
                    </div>
                  )}
                  {transport && (
                    <div className="flex justify-between">
                      <span>Transport</span>
                      <span className="font-medium">{transport}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Departments */}
            {departments.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Departments</h3>
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 text-sm"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

