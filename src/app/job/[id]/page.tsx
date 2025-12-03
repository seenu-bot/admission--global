"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { getJobSlug } from "@/lib/slugify";

// Helper function to convert Firestore Timestamp to string
const formatTimestamp = (value: any): string => {
  if (!value) return "—";
  
  // If it's a Firestore Timestamp object
  if (value && typeof value === "object" && "seconds" in value && "nanoseconds" in value) {
    try {
      const date = value.toDate ? value.toDate() : new Date(value.seconds * 1000);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return String(value);
    }
  }
  
  // If it's already a string or number
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  
  return "—";
};

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

type JobDetail = {
  id: string;
  title?: string;
  name?: string;
  position?: string;
  company?: string;
  organization?: string;
  logo?: string;
  eligibleCourses?: string | string[];
  skills?: string | string[];
  salary?: string | number;
  salaryRange?: string;
  amount?: string | number;
  experience?: string;
  experienceRequired?: string;
  deadline?: string;
  applicationDeadline?: string;
  lastDate?: string;
  location?: string;
  state?: string;
  city?: string;
  jobType?: string;
  type?: string;
  description?: string;
  about?: string;
  eligibility?: string;
  eligibilityCriteria?: string | string[];
  applicationProcess?: string | string[];
  responsibilities?: string | string[];
  requirements?: string | string[];
  qualifications?: string | string[];
  benefits?: string | string[];
  documentsRequired?: string | string[];
  selectionProcess?: string | string[];
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

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        // Try "jobs" collection by ID
        const jobRef = doc(db, "jobs", id);
        const jobSnap = await getDoc(jobRef);

        if (jobSnap.exists()) {
          const jobData = jobSnap.data();
          // Convert Timestamp objects to strings
          const processedData: any = { id: jobSnap.id, ...jobData };
          if (processedData.deadline) processedData.deadline = formatTimestamp(processedData.deadline);
          if (processedData.applicationDeadline) processedData.applicationDeadline = formatTimestamp(processedData.applicationDeadline);
          if (processedData.lastDate) processedData.lastDate = formatTimestamp(processedData.lastDate);
          setJob(processedData as JobDetail);
          setLoading(false);
          return;
        }

        // If not found by ID, try to find by slug in "jobs" collection
        try {
          const jobsQuery = query(
            collection(db, "jobs"),
            where("slug", "==", id),
            limit(1)
          );
          const jobsSnapshot = await getDocs(jobsQuery);

          if (!jobsSnapshot.empty) {
            const jobDoc = jobsSnapshot.docs[0];
            const jobData = jobDoc.data();
            // Convert Timestamp objects to strings
            const processedData: any = { id: jobDoc.id, ...jobData };
            if (processedData.deadline) processedData.deadline = formatTimestamp(processedData.deadline);
            if (processedData.applicationDeadline) processedData.applicationDeadline = formatTimestamp(processedData.applicationDeadline);
            if (processedData.lastDate) processedData.lastDate = formatTimestamp(processedData.lastDate);
            setJob(processedData as JobDetail);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.log("Slug query failed for 'jobs' collection, trying 'job' collection...");
        }

        // Try "job" collection (singular) by ID
        const jobSingularRef = doc(db, "job", id);
        const jobSingularSnap = await getDoc(jobSingularRef);

        if (jobSingularSnap.exists()) {
          const jobData = jobSingularSnap.data();
          // Convert Timestamp objects to strings
          const processedData: any = { id: jobSingularSnap.id, ...jobData };
          if (processedData.deadline) processedData.deadline = formatTimestamp(processedData.deadline);
          if (processedData.applicationDeadline) processedData.applicationDeadline = formatTimestamp(processedData.applicationDeadline);
          if (processedData.lastDate) processedData.lastDate = formatTimestamp(processedData.lastDate);
          setJob(processedData as JobDetail);
          setLoading(false);
          return;
        }

        // Try to find by slug in "job" collection
        try {
          const jobQuery = query(
            collection(db, "job"),
            where("slug", "==", id),
            limit(1)
          );
          const jobSnapshot = await getDocs(jobQuery);

          if (!jobSnapshot.empty) {
            const jobDoc = jobSnapshot.docs[0];
            const jobData = jobDoc.data();
            // Convert Timestamp objects to strings
            const processedData: any = { id: jobDoc.id, ...jobData };
            if (processedData.deadline) processedData.deadline = formatTimestamp(processedData.deadline);
            if (processedData.applicationDeadline) processedData.applicationDeadline = formatTimestamp(processedData.applicationDeadline);
            if (processedData.lastDate) processedData.lastDate = formatTimestamp(processedData.lastDate);
            setJob(processedData as JobDetail);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.log("Slug query failed for 'job' collection");
        }

        const tryGeneratedSlug = async (collectionName: string) => {
          try {
            const snapshot = await getDocs(collection(db, collectionName));
            for (const docSnap of snapshot.docs) {
              const docData = docSnap.data();
              const generatedSlug = getJobSlug({ id: docSnap.id, ...docData });
              if (generatedSlug && generatedSlug === id) {
                const processedData: any = { id: docSnap.id, ...docData };
                if (processedData.deadline) processedData.deadline = formatTimestamp(processedData.deadline);
                if (processedData.applicationDeadline) processedData.applicationDeadline = formatTimestamp(processedData.applicationDeadline);
                if (processedData.lastDate) processedData.lastDate = formatTimestamp(processedData.lastDate);
                setJob(processedData as JobDetail);
                setLoading(false);
                return true;
              }
            }
          } catch (error) {
            console.log(`Generated slug scan failed for ${collectionName}`, error);
          }
          return false;
        };

        if (await tryGeneratedSlug("jobs")) return;
        if (await tryGeneratedSlug("job")) return;

        console.warn("Job not found");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching job:", error);
        setLoading(false);
      }
    };

    if (id) {
      fetchJobDetails();
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

  if (!job) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="min-h-screen flex flex-col justify-center items-center text-center">
          <h1 className="text-2xl font-semibold text-gray-800">Job Not Found</h1>
          <Link href="/jobs" className="text-red-700 hover:underline mt-3">
            Go back to jobs
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const displayTitle = job.title || job.name || job.position || "Job Details";
  const organization = job.company || job.organization || "—";
  const website = job.website || job.officialWebsite || job.contactInfo?.website;
  const location = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : job.city || job.state || "—");

  // Helper to format salary
  const formatSalary = (salary: string | number | undefined): string => {
    if (!salary) return "N/A";
    const salaryStr = String(salary);
    if (salaryStr.includes("₹") || salaryStr.includes("INR") || salaryStr.includes("Rs") || salaryStr.includes("LPA") || salaryStr.includes("Lakh")) {
      return salaryStr;
    }
    if (!isNaN(Number(salary))) {
      return `₹ ${Number(salary).toLocaleString("en-IN")}`;
    }
    return salaryStr;
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
          <Link href="/jobs" className="hover:underline text-red-700">Jobs</Link> /{" "}
          <span>{displayTitle}</span>
        </nav>

        {/* Header Section */}
        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 mb-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="flex items-center gap-4">
              {job.logo && isValidImageUrl(job.logo) ? (
                <div className="w-20 h-20 relative flex-shrink-0">
                  <Image
                    src={job.logo}
                    alt={`${displayTitle} Logo`}
                    fill
                    className="object-contain rounded-lg"
                    sizes="80px"
                    priority={false}
                    unoptimized={job.logo.startsWith("http://") || job.logo.startsWith("https://")}
                  />
                </div>
              ) : (
                <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <span className="text-xl font-bold text-gray-400">
                    {(displayTitle || "JOB").slice(0, 3).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{displayTitle}</h1>
                <p className="text-gray-600 mt-1">Company: {organization}</p>
                {location !== "—" && (
                  <p className="text-gray-500 text-sm mt-1">Location: {location}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview/Description */}
            {(job.description || job.about) && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Job Description</h2>
                {renderContent(job.description || job.about)}
              </section>
            )}

            {/* Eligibility Criteria */}
            {(job.eligibility || job.eligibilityCriteria) && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Eligibility Criteria</h2>
                {renderContent(job.eligibility || job.eligibilityCriteria)}
              </section>
            )}

            {/* Qualifications */}
            {job.qualifications && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Qualifications</h2>
                {renderContent(job.qualifications)}
              </section>
            )}

            {/* Responsibilities */}
            {job.responsibilities && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Responsibilities</h2>
                {renderContent(job.responsibilities)}
              </section>
            )}

            {/* Requirements */}
            {job.requirements && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Requirements</h2>
                {renderContent(job.requirements)}
              </section>
            )}

            {/* Benefits */}
            {job.benefits && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Benefits</h2>
                {renderContent(job.benefits)}
              </section>
            )}

            {/* Application Process */}
            {job.applicationProcess && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Application Process</h2>
                {renderContent(job.applicationProcess)}
              </section>
            )}

            {/* Documents Required */}
            {job.documentsRequired && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Documents Required</h2>
                {renderContent(job.documentsRequired)}
              </section>
            )}

            {/* Selection Process */}
            {job.selectionProcess && (
              <section className="bg-white p-6 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Selection Process</h2>
                {renderContent(job.selectionProcess)}
              </section>
            )}
          </div>

          {/* Sidebar / Quick Information */}
          <div className="lg:col-span-1 space-y-8">
            {/* Quick Information */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Quick Information</h3>
              <ul className="space-y-3 text-gray-700">
                {job.salary || job.salaryRange || job.amount ? (
                  <li>
                    <strong>Salary:</strong>{" "}
                    {formatSalary(job.salary || job.salaryRange || job.amount)}
                  </li>
                ) : null}
                {job.experience || job.experienceRequired ? (
                  <li>
                    <strong>Experience Required:</strong> {job.experience || job.experienceRequired}
                  </li>
                ) : null}
                {job.deadline || job.applicationDeadline || job.lastDate ? (
                  <li>
                    <strong>Deadline:</strong>{" "}
                    {job.deadline || job.applicationDeadline || job.lastDate}
                  </li>
                ) : null}
                {job.jobType || job.type ? (
                  <li>
                    <strong>Job Type:</strong> {job.jobType || job.type}
                  </li>
                ) : null}
                {location !== "—" && (
                  <li>
                    <strong>Location:</strong> {location}
                  </li>
                )}
                {(job.eligibleCourses || job.skills) && (
                  <li>
                    <strong>Required Skills / Courses:</strong>{" "}
                    {(() => {
                      const value = job.eligibleCourses || job.skills;
                      return Array.isArray(value)
                        ? value.join(", ")
                        : String(value);
                    })()}
                  </li>
                )}
              </ul>
            </div>

            {/* Contact Information */}
            {(job.contactInfo || website) && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Contact Information</h3>
                <ul className="space-y-3 text-gray-700">
                  {job.contactInfo?.email && (
                    <li>
                      <strong>Email:</strong>{" "}
                      <a href={`mailto:${job.contactInfo.email}`} className="text-red-700 hover:underline">
                        {job.contactInfo.email}
                      </a>
                    </li>
                  )}
                  {job.contactInfo?.phone && (
                    <li>
                      <strong>Phone:</strong>{" "}
                      <a href={`tel:${job.contactInfo.phone}`} className="text-red-700 hover:underline">
                        {job.contactInfo.phone}
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

            {/* Apply Now Button */}
            {website && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                <Link
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition text-lg font-semibold"
                >
                  Apply Now
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

