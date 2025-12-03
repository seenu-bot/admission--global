"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const DEFAULT_IMAGE = "/build/assets/t-1709039660-chitkara-university-rajpura.jpeg";

type CollegeRecord = {
  id: string;
  name?: string;
  collegeName?: string;
  instituteName?: string;
  universityName?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  description?: string;
  overview?: string;
  about?: string;
  notes?: string;
  image?: string;
  logo?: string;
  banner?: string;
  website?: string;
  url?: string;
  applyUrl?: string;
  avgFee?: string | number;
  averageFee?: string | number;
  totalFees?: string | number;
  fees?: string | number;
  rating?: number;
  approvals?: string[] | string;
  streams?: string[];
  coursesOffered?: string[] | string;
  courses?: string[] | string;
  programs?: string[] | string;
  facilities?: string[] | string;
  admissionProcess?: string[] | string;
  examsAccepted?: string[] | string;
  exams?: string[] | string;
  contactNumber?: string;
  phone?: string;
  email?: string;
  contact?: {
    phone?: string;
    email?: string;
  };
};

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

async function getDocById(collectionName: string, id: string) {
  try {
    const ref = doc(db, collectionName, id);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
  } catch (error) {
    console.warn(`Failed to fetch ${collectionName}/${id}`, error);
  }

  // Handle composite IDs created as `${doc.id}-${idx}` in listing pages
  const lastDash = id.lastIndexOf("-");
  if (lastDash > 0) {
    const baseId = id.slice(0, lastDash);
    const suffix = id.slice(lastDash + 1);
    if (baseId && suffix && !Number.isNaN(Number(suffix))) {
      try {
        const ref = doc(db, collectionName, baseId);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() };
        }
      } catch (error) {
        console.warn(`Failed to fetch composite base id ${collectionName}/${baseId}`, error);
      }
    }
  }

  return null;
}

async function getDocBySlug(collectionName: string, slug: string) {
  try {
    const slugQuery = query(
      collection(db, collectionName),
      where("slug", "==", slug),
      limit(1)
    );
    const slugSnapshot = await getDocs(slugQuery);
    if (!slugSnapshot.empty) {
      const docSnap = slugSnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (error) {
    console.warn(`Failed slug lookup in ${collectionName}`, error);
  }
  return null;
}

async function resolveCollege(identifier: string) {
  const collections = ["colleges", "courses"];
  for (const collectionName of collections) {
    const byId = await getDocById(collectionName, identifier);
    if (byId) return byId;
  }

  for (const collectionName of collections) {
    const bySlug = await getDocBySlug(collectionName, identifier);
    if (bySlug) return bySlug;
  }

  return null;
}

export default function BangaloreCollegeRedirect({
  params,
}: {
  params: Promise<{ collegeId: string }>;
}) {
  const { collegeId } = use(params);
  const [college, setCollege] = useState<CollegeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCollege = async () => {
      if (!collegeId) return;
      setLoading(true);
      try {
        const data = await resolveCollege(collegeId);
        if (isMounted) {
          setCollege(data as CollegeRecord | null);
        }
      } catch (error) {
        console.error("Error loading Bangalore college redirect page:", error);
        if (isMounted) {
          setCollege(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchCollege();
    return () => {
      isMounted = false;
    };
  }, [collegeId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="bg-white p-6 rounded-2xl shadow-sm border animate-pulse space-y-4">
            <div className="h-8 w-1/3 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
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
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">College Not Found</h1>
          <p className="text-gray-600">
            We could not find the requested B.Tech college in Bangalore. It might have been removed or renamed.
          </p>
          <Link
            href="/course/engineering?city=Bangalore"
            className="inline-flex items-center px-4 py-2 rounded-full border border-red-700 text-red-700 hover:bg-red-50 transition"
          >
            Back to Bangalore B.Tech Colleges
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const collegeName =
    college.name ||
    college.collegeName ||
    college.instituteName ||
    college.universityName ||
    "Unnamed College";
  const city = college.city || "Bangalore";
  const state = college.state || "Karnataka";
  const country = college.country || "India";
  const address = college.address;
  const website = college.website || college.url || college.applyUrl || "";
  const averageFees =
    college.avgFee || college.averageFee || college.totalFees || college.fees || "NA";
  const rating =
    typeof college.rating === "number" ? college.rating.toFixed(1) : college.rating;
  const approvalsArray = Array.isArray(college.approvals)
    ? college.approvals
    : college.approvals
    ? [college.approvals]
    : [];
  const streamsArray = Array.isArray(college.streams) ? college.streams : [];
  const coursesArray = Array.isArray(college.coursesOffered)
    ? college.coursesOffered
    : Array.isArray(college.courses)
    ? college.courses
    : Array.isArray(college.programs)
    ? college.programs
    : college.coursesOffered
    ? [college.coursesOffered]
    : [];
  const facilitiesArray = Array.isArray(college.facilities)
    ? college.facilities
    : college.facilities
    ? [college.facilities]
    : [];
  const admissionProcessArray = Array.isArray(college.admissionProcess)
    ? college.admissionProcess
    : college.admissionProcess
    ? [college.admissionProcess]
    : [];
  const examsArray = Array.isArray(college.examsAccepted)
    ? college.examsAccepted
    : Array.isArray(college.exams)
    ? college.exams
    : college.examsAccepted
    ? [college.examsAccepted]
    : [];
  const description =
    college.description || college.overview || college.about || college.notes || "";
  const heroImage = college.image || college.banner || college.logo || DEFAULT_IMAGE;
  const contactPhone = college.phone || college.contactNumber || college.contact?.phone;
  const contactEmail = college.email || college.contact?.email;

  const quickFacts = [
    { label: "City", value: city },
    { label: "State", value: state },
    { label: "Country", value: country },
    { label: "Average Fees", value: averageFees },
    { label: "Rating", value: rating },
    { label: "Contact", value: contactPhone },
    { label: "Email", value: contactEmail },
  ].filter((fact) => fact.value);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-10 space-y-8">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline text-red-700">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/course/engineering" className="hover:underline text-red-700">
            B.Tech
          </Link>{" "}
          /{" "}
          <Link href="/course/engineering?city=Bangalore" className="hover:underline text-red-700">
            Bangalore
          </Link>{" "}
          / <span>{collegeName}</span>
        </nav>

        <section className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="grid md:grid-cols-[2fr_1fr]">
            <div className="p-6 md:p-10">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="relative w-full max-w-xs mx-auto lg:mx-0 aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  {isValidImageUrl(heroImage) ? (
                    <Image
                      src={heroImage}
                      alt={collegeName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 320px"
                      unoptimized={heroImage.startsWith("http://") || heroImage.startsWith("https://")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-semibold">
                      {collegeName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-red-600 font-semibold mb-1">
                      Featured Bangalore College
                    </p>
                    <h1 className="text-3xl font-bold text-gray-900">{collegeName}</h1>
                    <p className="text-gray-600 text-sm mt-2">
                      {address || [city, state, country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                      <p className="text-xs uppercase text-red-600 tracking-wide">Average Fees</p>
                      <p className="text-2xl font-bold text-red-800 mt-1">
                        {typeof averageFees === "number" ? `₹${averageFees}` : averageFees}
                      </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                      <p className="text-xs uppercase text-emerald-600 tracking-wide">Streams</p>
                      <p className="text-2xl font-bold text-emerald-800 mt-1">
                        {streamsArray.length > 0 ? streamsArray.length : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {approvalsArray.slice(0, 4).map((approval, idx) => (
                      <span
                        key={`${approval}-${idx}`}
                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                      >
                        {approval}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-5 py-2 rounded-full bg-red-700 text-white text-sm font-semibold shadow hover:bg-red-800 transition"
                      >
                        Continue to Official Website
                      </a>
                    )}
                    <Link
                      href={`/colleges/${college.id}`}
                      className="inline-flex items-center px-5 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold hover:border-red-700 hover:text-red-700 transition"
                    >
                      View Full College Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <aside className="bg-gray-50 border-l border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Information</h2>
              <div className="space-y-3">
                {quickFacts.map((fact) => (
                  <div key={fact.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{fact.label}</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[160px]">
                      {fact.value}
                    </span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {description && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Overview</h3>
                <p className="text-gray-600 leading-relaxed">{description}</p>
              </div>
            )}

            {coursesArray.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Popular Courses</h3>
                <div className="flex flex-wrap gap-2">
                  {coursesArray.slice(0, 12).map((course, idx) => (
                    <span
                      key={`${course}-${idx}`}
                      className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium"
                    >
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {admissionProcessArray.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Admission Process</h3>
                <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                  {admissionProcessArray.map((step, idx) => (
                    <li key={`${step}-${idx}`}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {examsArray.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Exams Accepted</h3>
                <div className="flex flex-wrap gap-2">
                  {examsArray.map((exam, idx) => (
                    <span
                      key={`${exam}-${idx}`}
                      className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold"
                    >
                      {exam}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {facilitiesArray.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Facilities</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  {facilitiesArray.slice(0, 10).map((facility, idx) => (
                    <li key={`${facility}-${idx}`} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                      <span>{facility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Looking for more options?</h3>
              <p className="text-gray-600">
                Browse all B.Tech colleges in Bangalore curated directly from your Firestore data.
              </p>
            </div>
            <Link
              href="/course/engineering?city=Bangalore"
              className="inline-flex items-center px-5 py-2 rounded-full border border-red-700 text-red-700 font-semibold hover:bg-red-50 transition"
            >
              Back to Bangalore Colleges
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}


