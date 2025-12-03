"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { getScholarshipSlug } from "@/lib/slugify";

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

type ScholarshipDetail = {
  id: string;
  title?: string;
  name?: string;
  organization?: string;
  logo?: string;
  eligibleCourses?: string | string[];
  scholarshipAmount?: string | number;
  amount?: string | number;
  deadline?: string;
  state?: string;
  academicLevel?: string;
  level?: string;
  description?: string;
  about?: string;
  eligibility?: string;
  eligibilityCriteria?: string | string[];
  applicationProcess?: string | string[];
  importantDates?: {
    applicationStart?: string;
    applicationEnd?: string;
    deadline?: string;
    resultDate?: string;
  };
  benefits?: string | string[];
  documentsRequired?: string | string[];
  selectionProcess?: string | string[];
  renewalCriteria?: string | string[];
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  website?: string;
  officialWebsite?: string;
  slug?: string;
  [key: string]: any;
};

export default function ScholarshipDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scholarship, setScholarship] = useState<ScholarshipDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScholarshipDetails = async () => {
      try {
        // Try "scholarships" collection by ID
        const scholarshipRef = doc(db, "scholarships", id);
        const scholarshipSnap = await getDoc(scholarshipRef);

        if (scholarshipSnap.exists()) {
          setScholarship({ id: scholarshipSnap.id, ...scholarshipSnap.data() } as ScholarshipDetail);
          setLoading(false);
          return;
        }

        // If not found by ID, try to find by slug in "scholarships" collection
        try {
          const scholarshipsQuery = query(
            collection(db, "scholarships"),
            where("slug", "==", id),
            limit(1)
          );
          const scholarshipsSnapshot = await getDocs(scholarshipsQuery);

          if (!scholarshipsSnapshot.empty) {
            const scholarshipData = scholarshipsSnapshot.docs[0];
            setScholarship({ id: scholarshipData.id, ...scholarshipData.data() } as ScholarshipDetail);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.log("Slug query failed for 'scholarships' collection, trying 'scholarship' collection...");
        }

        // Try "scholarship" collection (singular) by ID
        const scholarshipSingularRef = doc(db, "scholarship", id);
        const scholarshipSingularSnap = await getDoc(scholarshipSingularRef);

        if (scholarshipSingularSnap.exists()) {
          setScholarship({ id: scholarshipSingularSnap.id, ...scholarshipSingularSnap.data() } as ScholarshipDetail);
          setLoading(false);
          return;
        }

        // Try to find by slug in "scholarship" collection
        try {
          const scholarshipQuery = query(
            collection(db, "scholarship"),
            where("slug", "==", id),
            limit(1)
          );
          const scholarshipSnapshot = await getDocs(scholarshipQuery);

          if (!scholarshipSnapshot.empty) {
            const scholarshipData = scholarshipSnapshot.docs[0];
            setScholarship({ id: scholarshipData.id, ...scholarshipData.data() } as ScholarshipDetail);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.log("Slug query failed for 'scholarship' collection");
        }

        const tryGeneratedSlug = async (collectionName: string) => {
          try {
            const snapshot = await getDocs(collection(db, collectionName));
            for (const docSnap of snapshot.docs) {
              const docData = docSnap.data();
              const generatedSlug = getScholarshipSlug({ id: docSnap.id, ...docData });
              if (generatedSlug && generatedSlug === id) {
                setScholarship({ id: docSnap.id, ...docData } as ScholarshipDetail);
                setLoading(false);
                return true;
              }
            }
          } catch (error) {
            console.log(`Generated slug scan failed for ${collectionName}`, error);
          }
          return false;
        };

        if (await tryGeneratedSlug("scholarships")) return;
        if (await tryGeneratedSlug("scholarship")) return;

        console.warn("Scholarship not found");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching scholarship:", error);
        setLoading(false);
      }
    };

    if (id) {
      fetchScholarshipDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-10">
          {/* Breadcrumb Skeleton */}
          <div className="h-4 w-64 bg-gray-200 rounded mb-4 animate-pulse"></div>

          {/* Header Section Skeleton */}
          <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area Skeleton */}
            <div className="lg:col-span-2 space-y-8">
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

            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse"></div>
                <ul className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
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

  if (!scholarship) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="min-h-screen flex flex-col justify-center items-center text-center">
          <h1 className="text-2xl font-semibold text-gray-800">Scholarship Not Found</h1>
          <Link href="/scholarships" className="text-red-700 hover:underline mt-3">
            Go back to scholarships
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const displayTitle = scholarship.title || scholarship.name || "Scholarship Details";
  const organization = scholarship.organization || "—";
  const website = scholarship.website || scholarship.officialWebsite || scholarship.contactInfo?.website;

  // Helper to format amount
  const formatAmount = (amount: string | number | undefined): string => {
    if (!amount) return "N/A";
    const amountStr = String(amount);
    if (amountStr.includes("₹") || amountStr.includes("INR") || amountStr.includes("Rs")) {
      return amountStr;
    }
    if (!isNaN(Number(amount))) {
      return `₹ ${Number(amount).toLocaleString("en-IN")}`;
    }
    return amountStr;
  };

  // Helper to render content (string, array, or object)
  const renderContent = (content: string | string[] | object | undefined) => {
    if (!content) return <p className="text-gray-600">—</p>;
    if (typeof content === "string") {
      return <p className="text-gray-600 leading-relaxed whitespace-pre-line">{content}</p>;
    }
    if (Array.isArray(content)) {
      return (
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          {content.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    if (typeof content === "object") {
      return (
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          {Object.entries(content).map(([key, value], i) => (
            <li key={i}>
              <strong className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</strong>{" "}
              {typeof value === "object" && value !== null
                ? Array.isArray(value)
                  ? value.join(", ")
                  : JSON.stringify(value, null, 2)
                : String(value)}
            </li>
          ))}
        </ul>
      );
    }
    return <p className="text-gray-600">{String(content)}</p>;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm mb-4 text-gray-500">
          <Link href="/" className="hover:underline text-red-700">Home</Link> /{" "}
          <Link href="/scholarships" className="hover:underline text-red-700">Scholarships</Link> /{" "}
          <span>{displayTitle}</span>
        </nav>

        {/* Header Section */}
        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 mb-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="flex items-center gap-4">
              {scholarship.logo && isValidImageUrl(scholarship.logo) ? (
                <div className="w-20 h-20 relative flex-shrink-0">
                  <Image
                    src={scholarship.logo}
                    alt={`${displayTitle} Logo`}
                    fill
                    className="object-contain rounded-lg"
                    sizes="80px"
                    priority={false}
                    unoptimized={scholarship.logo.startsWith("http://") || scholarship.logo.startsWith("https://")}
                  />
                </div>
              ) : (
                <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <span className="text-xl font-bold text-gray-400">
                    {(displayTitle || "SCH").slice(0, 3).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{displayTitle}</h1>
                <p className="text-gray-600 mt-1">Organization: {organization}</p>
                {scholarship.state && (
                  <p className="text-gray-500 text-sm mt-1">State: {scholarship.state}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview/Description */}
            {(scholarship.description || scholarship.about) && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Overview</h2>
                {renderContent(scholarship.description || scholarship.about)}
              </section>
            )}

            {/* Eligibility Criteria */}
            {(scholarship.eligibility || scholarship.eligibilityCriteria) && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Eligibility Criteria</h2>
                {renderContent(scholarship.eligibility || scholarship.eligibilityCriteria)}
              </section>
            )}

            {/* Benefits */}
            {scholarship.benefits && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Benefits</h2>
                {renderContent(scholarship.benefits)}
              </section>
            )}

            {/* Application Process */}
            {scholarship.applicationProcess && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Application Process</h2>
                {renderContent(scholarship.applicationProcess)}
              </section>
            )}

            {/* Documents Required */}
            {scholarship.documentsRequired && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Documents Required</h2>
                {renderContent(scholarship.documentsRequired)}
              </section>
            )}

            {/* Selection Process */}
            {scholarship.selectionProcess && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Selection Process</h2>
                {renderContent(scholarship.selectionProcess)}
              </section>
            )}

            {/* Renewal Criteria */}
            {scholarship.renewalCriteria && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Renewal Criteria</h2>
                {renderContent(scholarship.renewalCriteria)}
              </section>
            )}
          </div>

          {/* Sidebar / Quick Information */}
          <div className="lg:col-span-1 space-y-8">
            {/* Quick Information */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Information</h3>
              <ul className="space-y-3 text-gray-700">
                {scholarship.scholarshipAmount || scholarship.amount ? (
                  <li>
                    <strong>Scholarship Amount:</strong>{" "}
                    {formatAmount(scholarship.scholarshipAmount || scholarship.amount)}
                  </li>
                ) : null}
                {scholarship.deadline && (
                  <li>
                    <strong>Deadline:</strong> {scholarship.deadline}
                  </li>
                )}
                {scholarship.academicLevel || scholarship.level ? (
                  <li>
                    <strong>Academic Level:</strong> {scholarship.academicLevel || scholarship.level}
                  </li>
                ) : null}
                {scholarship.eligibleCourses && (
                  <li>
                    <strong>Eligible Courses:</strong>{" "}
                    {Array.isArray(scholarship.eligibleCourses)
                      ? scholarship.eligibleCourses.join(", ")
                      : String(scholarship.eligibleCourses)}
                  </li>
                )}
                {scholarship.state && (
                  <li>
                    <strong>State:</strong> {scholarship.state}
                  </li>
                )}
              </ul>
            </div>

            {/* Important Dates */}
            {scholarship.importantDates && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Important Dates</h3>
                <ul className="space-y-3 text-gray-700">
                  {scholarship.importantDates.applicationStart && (
                    <li>
                      <strong>Application Start:</strong> {scholarship.importantDates.applicationStart}
                    </li>
                  )}
                  {scholarship.importantDates.applicationEnd && (
                    <li>
                      <strong>Application End:</strong> {scholarship.importantDates.applicationEnd}
                    </li>
                  )}
                  {scholarship.importantDates.deadline && (
                    <li>
                      <strong>Deadline:</strong> {scholarship.importantDates.deadline}
                    </li>
                  )}
                  {scholarship.importantDates.resultDate && (
                    <li>
                      <strong>Result Date:</strong> {scholarship.importantDates.resultDate}
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Contact Information */}
            {(scholarship.contactInfo || website) && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Contact Information</h3>
                <ul className="space-y-3 text-gray-700">
                  {scholarship.contactInfo?.email && (
                    <li>
                      <strong>Email:</strong>{" "}
                      <a href={`mailto:${scholarship.contactInfo.email}`} className="text-red-700 hover:underline">
                        {scholarship.contactInfo.email}
                      </a>
                    </li>
                  )}
                  {scholarship.contactInfo?.phone && (
                    <li>
                      <strong>Phone:</strong>{" "}
                      <a href={`tel:${scholarship.contactInfo.phone}`} className="text-red-700 hover:underline">
                        {scholarship.contactInfo.phone}
                      </a>
                    </li>
                  )}
                  {website && (
                    <li>
                      <strong>Website:</strong>{" "}
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-700 hover:underline break-all"
                      >
                        {website}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Official Website Button */}
            {website && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                <Link
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition text-lg font-semibold"
                >
                  Visit Official Website
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

