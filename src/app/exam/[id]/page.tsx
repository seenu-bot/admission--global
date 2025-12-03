"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { getExamSlug } from "@/lib/slugify";

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

export default function ExamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        // First, try to fetch from "exams" collection by ID
        const examRef = doc(db, "exams", id);
        const examSnap = await getDoc(examRef);
        
        if (examSnap.exists()) {
          setExam({ id: examSnap.id, ...examSnap.data() });
          setLoading(false);
          return;
        }

        // If not found by ID, try to find by slug in "exams" collection
        try {
          const examsQuery = query(collection(db, "exams"), where("slug", "==", id), limit(1));
          const examsSnapshot = await getDocs(examsQuery);
          
          if (!examsSnapshot.empty) {
            const examData = examsSnapshot.docs[0];
            setExam({ id: examData.id, ...examData.data() });
            setLoading(false);
            return;
          }
        } catch (error) {
          // Query might fail if slug field doesn't exist or no index
          console.log("Slug query failed, continuing search...");
        }

        // Try "keamExams" collection by ID
        const keamRef = doc(db, "keamExams", id);
        const keamSnap = await getDoc(keamRef);
        
        if (keamSnap.exists()) {
          const keamData = keamSnap.data();
          // Transform keamExam data to match exam structure
          setExam({
            id: keamSnap.id,
            title: keamData.examName || keamData.title,
            shortName: keamData.shortName || keamData.examName,
            course: keamData.course || keamData.examOverview?.coursesOffered?.[0],
            examDate: keamData.examDate,
            logo: keamData.logo,
            slug: keamData.slug || id,
            ...keamData,
          });
          setLoading(false);
          return;
        }

        // Try to find by slug in "keamExams" collection
        try {
          const keamQuery = query(collection(db, "keamExams"), where("slug", "==", id), limit(1));
          const keamSnapshot = await getDocs(keamQuery);
          
          if (!keamSnapshot.empty) {
            const keamData = keamSnapshot.docs[0].data();
            setExam({
              id: keamSnapshot.docs[0].id,
              title: keamData.examName || keamData.title,
              shortName: keamData.shortName || keamData.examName,
              course: keamData.course || keamData.examOverview?.coursesOffered?.[0],
              examDate: keamData.examDate,
              logo: keamData.logo,
              slug: keamData.slug || id,
              ...keamData,
            });
            setLoading(false);
            return;
          }
        } catch (error) {
          // Query might fail if slug field doesn't exist or no index
          console.log("Keam slug query failed, continuing search...");
        }

        const tryGeneratedSlug = async (collectionName: string) => {
          try {
            const snapshot = await getDocs(collection(db, collectionName));
            for (const docSnap of snapshot.docs) {
              const docData = docSnap.data();
              const generatedSlug = getExamSlug({ id: docSnap.id, ...docData });
              if (generatedSlug && generatedSlug === id) {
                setExam({ id: docSnap.id, ...docData });
                setLoading(false);
                return true;
              }
            }
          } catch (error) {
            console.log(`Generated slug scan failed for ${collectionName}`, error);
          }
          return false;
        };

        if (await tryGeneratedSlug("exams")) return;
        if (await tryGeneratedSlug("keamExams")) return;

        console.warn("Exam not found");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching exam:", error);
        setLoading(false);
      }
    };

    if (id) {
      fetchExamDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-10">
          {/* Breadcrumb Skeleton */}
          <div className="h-4 w-64 bg-gray-200 rounded mb-4 animate-pulse"></div>

          {/* Header Skeleton */}
          <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 mb-10">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100 w-40 h-24 animate-pulse"></div>
            </div>
          </div>

          {/* Main Content Grid Skeleton */}
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {/* Left Column Skeleton */}
            <div className="md:col-span-2 space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <section key={i} className="bg-white p-6 rounded-2xl shadow-sm border">
                  <div className="h-7 w-48 bg-gray-200 rounded mb-4 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </section>
              ))}
            </div>

            {/* Right Sidebar Skeleton */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse"></div>
                <ul className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!exam) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="min-h-[60vh] flex flex-col justify-center items-center text-center">
          <h1 className="text-2xl font-semibold text-gray-800">Exam Not Found</h1>
          <Link href="/exams" className="text-red-700 hover:underline mt-3">
            Go back to exams
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const examTitle = exam.title || exam.examName || exam.shortName || "Exam";
  const examYear = new Date().getFullYear();
  const displayTitle = examTitle.includes("- 2025") || examTitle.includes("- 2024")
    ? examTitle
    : `${examTitle} - ${examYear}`;

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm mb-4 text-gray-500">
          <Link href="/" className="hover:underline text-red-700">Home</Link> /{" "}
          <Link href="/exams" className="hover:underline text-red-700">Exams</Link> /{" "}
          <span>{displayTitle}</span>
        </nav>

        {/* Header */}
        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 mb-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
            <div className="flex items-center gap-6">
              {exam.logo && isValidImageUrl(exam.logo) && (
                <div className="w-24 h-24 relative flex-shrink-0">
                  <Image
                    src={exam.logo}
                    alt={displayTitle}
                    fill
                    className="object-contain"
                    sizes="96px"
                    priority={false}
                    unoptimized={exam.logo?.startsWith("http://") || exam.logo?.startsWith("https://")}
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{displayTitle}</h1>
                {exam.shortName && exam.shortName !== examTitle && (
                  <p className="text-gray-600 mt-1 text-lg">{exam.shortName}</p>
                )}
                {exam.course && (
                  <p className="text-gray-500 mt-1">
                    Course: <span className="font-semibold">{exam.course}</span>
                  </p>
                )}
              </div>
            </div>
            {exam.examDate && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <p className="text-sm text-gray-600 mb-1">Exam Date</p>
                <p className="text-lg font-bold text-red-700">{exam.examDate}</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {/* Left Column - Main Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Overview */}
            {exam.examOverview && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Overview</h2>
                {exam.examOverview.description && (
                  <p className="text-gray-600 leading-relaxed mb-4">{exam.examOverview.description}</p>
                )}
                {exam.examOverview.about && (
                  <p className="text-gray-600 leading-relaxed">{exam.examOverview.about}</p>
                )}
                {exam.notes && (
                  <p className="text-gray-600 leading-relaxed">{exam.notes}</p>
                )}
              </section>
            )}

            {/* Eligibility */}
            {exam.eligibility && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Eligibility Criteria</h2>
                {typeof exam.eligibility === "string" ? (
                  <p className="text-gray-600 leading-relaxed">{exam.eligibility}</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    {Array.isArray(exam.eligibility) ? (
                      exam.eligibility.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))
                    ) : (
                      <li>{String(exam.eligibility)}</li>
                    )}
                  </ul>
                )}
              </section>
            )}

            {/* Exam Pattern */}
            {exam.examPattern && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Exam Pattern</h2>
                {typeof exam.examPattern === "string" ? (
                  <p className="text-gray-600 leading-relaxed">{exam.examPattern}</p>
                ) : Array.isArray(exam.examPattern) ? (
                  <div className="space-y-4">
                    {exam.examPattern.map((pattern: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        {typeof pattern === "string" ? (
                          <p className="text-gray-600">{pattern}</p>
                        ) : typeof pattern === "object" && pattern !== null ? (
                          <div className="space-y-2">
                            {Object.entries(pattern).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1">
                                <strong className="text-gray-800 min-w-[120px] capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}:
                                </strong>
                                <span className="text-gray-600">
                                  {typeof value === "object" && value !== null
                                    ? Array.isArray(value)
                                      ? value.join(", ")
                                      : JSON.stringify(value, null, 2)
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600">{String(pattern)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : typeof exam.examPattern === "object" && exam.examPattern !== null ? (
                  <div className="space-y-3">
                    {Object.entries(exam.examPattern).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 border-b pb-2 last:border-0">
                        <strong className="text-gray-800 min-w-[120px] capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </strong>
                        <span className="text-gray-600">
                          {typeof value === "object" && value !== null
                            ? Array.isArray(value)
                              ? value.join(", ")
                              : JSON.stringify(value, null, 2)
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">{String(exam.examPattern)}</p>
                )}
              </section>
            )}

            {/* Syllabus */}
            {exam.syllabus && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Syllabus</h2>
                {typeof exam.syllabus === "string" ? (
                  <p className="text-gray-600 leading-relaxed">{exam.syllabus}</p>
                ) : (
                  <div className="text-gray-600">
                    {Object.entries(exam.syllabus).map(([key, value]: [string, any]) => (
                      <div key={key} className="mb-4">
                        <h3 className="font-semibold text-gray-800 mb-2">{key}</h3>
                        {Array.isArray(value) ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {value.map((item: string, i: number) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{String(value)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Application Process */}
            {exam.applicationProcess && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Application Process</h2>
                {typeof exam.applicationProcess === "string" ? (
                  <p className="text-gray-600 leading-relaxed">{exam.applicationProcess}</p>
                ) : (
                  <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                    {Array.isArray(exam.applicationProcess) ? (
                      exam.applicationProcess.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))
                    ) : (
                      <li>{String(exam.applicationProcess)}</li>
                    )}
                  </ol>
                )}
              </section>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Information</h2>
              <div className="space-y-3">
                {exam.examDate && (
                  <div>
                    <p className="text-sm text-gray-500">Exam Date</p>
                    <p className="font-semibold text-gray-800">{exam.examDate}</p>
                  </div>
                )}
                {exam.registrationDate && (
                  <div>
                    <p className="text-sm text-gray-500">Registration Date</p>
                    <p className="font-semibold text-gray-800">{exam.registrationDate}</p>
                  </div>
                )}
                {exam.resultDate && (
                  <div>
                    <p className="text-sm text-gray-500">Result Date</p>
                    <p className="font-semibold text-gray-800">{exam.resultDate}</p>
                  </div>
                )}
                {exam.course && (
                  <div>
                    <p className="text-sm text-gray-500">Course</p>
                    <p className="font-semibold text-gray-800">{exam.course}</p>
                  </div>
                )}
                {exam.examOverview?.coursesOffered && exam.examOverview.coursesOffered.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Courses Offered</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {exam.examOverview.coursesOffered.map((course: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {exam.fee && (
                  <div>
                    <p className="text-sm text-gray-500">Application Fee</p>
                    <p className="font-semibold text-gray-800">{exam.fee}</p>
                  </div>
                )}
                {exam.duration && (
                  <div>
                    <p className="text-sm text-gray-500">Exam Duration</p>
                    <p className="font-semibold text-gray-800">{exam.duration}</p>
                  </div>
                )}
                {exam.mode && (
                  <div>
                    <p className="text-sm text-gray-500">Mode</p>
                    <p className="font-semibold text-gray-800">{exam.mode}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Important Dates */}
            {(exam.importantDates || exam.dates) && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Important Dates</h2>
                <div className="space-y-3">
                  {(() => {
                    const dates = exam.importantDates || exam.dates || [];
                    if (!Array.isArray(dates)) {
                      // If it's an object, convert to array
                      if (typeof dates === "object" && dates !== null) {
                        return Object.entries(dates).map(([key, value]: [string, any], i: number) => (
                          <div key={i} className="border-b pb-2 last:border-0">
                            <p className="font-semibold text-gray-800 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {typeof value === "object" && value !== null
                                ? Array.isArray(value)
                                  ? value.join(", ")
                                  : JSON.stringify(value)
                                : String(value)}
                            </p>
                          </div>
                        ));
                      }
                      return null;
                    }
                    return dates.map((dateItem: any, i: number) => (
                      <div key={i} className="border-b pb-2 last:border-0">
                        {typeof dateItem === "string" ? (
                          <p className="text-sm text-gray-600">{dateItem}</p>
                        ) : typeof dateItem === "object" && dateItem !== null ? (
                          <>
                            <p className="font-semibold text-gray-800">
                              {dateItem.event || dateItem.title || dateItem.name || "Date"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {dateItem.date || dateItem.value || JSON.stringify(dateItem)}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-600">{String(dateItem)}</p>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Official Website */}
            {exam.website && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Official Website</h2>
                <a
                  href={exam.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-700 hover:underline font-medium break-all"
                >
                  {exam.website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-end gap-4 mt-8">
          <Link
            href="/exams"
            className="border border-red-700 text-red-700 px-5 py-2 rounded-lg hover:bg-red-700 hover:text-white transition"
          >
            Back to Exams
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}

