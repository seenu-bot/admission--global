"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";
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

type Job = {
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
  jobType?: string; // Full-time, Part-time, Contract, etc.
  type?: string;
  description?: string;
  eligibility?: string;
  applicationProcess?: string;
  website?: string;
  slug?: string;
  [key: string]: any;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch jobs from Firestore
  useEffect(() => {
    setLoading(true);
    let unsubscribe: (() => void) | null = null;
    
    // Helper function to process snapshot data
    const processSnapshot = (snapshot: any) => {
      const data: Job[] = snapshot.docs.map((doc: any) => {
        const docData = doc.data();
        console.log("Job document:", doc.id, docData);
        
        // Convert Timestamp objects to strings
        const processedData: any = {
          id: doc.id,
          ...docData,
        };
        
        // Convert date fields from Timestamp to string
        if (processedData.deadline) {
          processedData.deadline = formatTimestamp(processedData.deadline);
        }
        if (processedData.applicationDeadline) {
          processedData.applicationDeadline = formatTimestamp(processedData.applicationDeadline);
        }
        if (processedData.lastDate) {
          processedData.lastDate = formatTimestamp(processedData.lastDate);
        }
        
        return processedData;
      });
      
      // Sort manually by title or name
      data.sort((a, b) => {
        const aTitle = (a.title || a.name || a.position || "").toLowerCase();
        const bTitle = (b.title || b.name || b.position || "").toLowerCase();
        return aTitle.localeCompare(bTitle);
      });
      
      console.log("Total jobs fetched:", data.length);
      console.log("Jobs data:", data);
      setJobs(data);
      setLoading(false);
    };
    
    // Try "jobs" collection first
    const jobsRef = collection(db, "jobs");
    
    unsubscribe = onSnapshot(
      jobsRef,
      (snapshot) => {
        console.log("Fetched from 'jobs':", snapshot.size, "documents");
        
        if (snapshot.size === 0) {
          console.warn("No documents found in 'jobs' collection. Trying 'job' collection...");
          // Try singular form
          const jobRef = collection(db, "job");
          onSnapshot(
            jobRef,
            (snapshot2) => {
              console.log("Fetched from 'job':", snapshot2.size, "documents");
              processSnapshot(snapshot2);
            },
            (err) => {
              console.error("Error fetching from 'job':", err);
              setLoading(false);
            }
          );
          return;
        }
        
        processSnapshot(snapshot);
      },
      (err) => {
        console.error("Error fetching from 'jobs':", err);
        // Try singular form as fallback
        console.log("Trying 'job' collection instead...");
        const jobRef = collection(db, "job");
        onSnapshot(
          jobRef,
          (snapshot) => {
            console.log("Fetched from 'job':", snapshot.size, "documents");
            processSnapshot(snapshot);
          },
          (err2) => {
            console.error("Error fetching from 'job':", err2);
            setLoading(false);
          }
        );
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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

  // Helper to get eligible courses/skills display
  const getEligibleCourses = (courses: string | string[] | undefined): string => {
    if (!courses) return "—";
    if (Array.isArray(courses)) {
      return courses.join(", ");
    }
    return String(courses);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container common_listing_wrapper" id="exam_listing_wrapper">
        {/* Breadcrumb */}
        <nav className="text-sm mb-4 text-gray-500">
          <Link href="/" className="hover:underline text-red-700">Home</Link> /{" "}
          <span>Jobs</span>
        </nav>

        <h1>List of Jobs - 2025</h1>

        <article className="sanitize_content">
          <p>
            There are various recognised Boards and Councils in India that are responsible for regulating and
            overseeing different aspects of education in the country.
          </p>
        </article>

        {/* Job Cards */}
        <div>
          {loading ? (
            <div className="listing_data_parent">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="listing_data_card scholarship_card">
                  <div className="logo_and_info">
                    <div className="w-15 h-15 bg-gray-200 rounded flex-shrink-0 animate-pulse" style={{ width: '60px', height: '60px' }}></div>
                    <div className="listing_card_info flex-1">
                      <div className="h-6 w-3/4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="scholarship_info_item">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="scholarship_info_item">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="scholarship_info_item">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="scholarship_info_item">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="scholarship_info_item">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="listing_data_card" style={{ textAlign: "center", padding: "40px" }}>
              <p className="text-gray-600 mb-2">No jobs found in the database.</p>
              <p className="text-sm text-gray-500">
                Total jobs fetched: {jobs.length}
              </p>
              {process.env.NODE_ENV === "development" && (
                <p className="text-xs text-gray-400 mt-2">
                  Check browser console for debugging information.
                </p>
              )}
            </div>
          ) : (
            <div className="listing_data_parent">
              {jobs.map((job) => {
                  const jobTitle = job.title || job.name || job.position || "Job";
                  const organization = job.company || job.organization || "—";
                  const eligibleCourses = getEligibleCourses(job.eligibleCourses || job.skills);
                  const salary = formatSalary(job.salary || job.salaryRange || job.amount);
                  const deadline = job.deadline || job.applicationDeadline || job.lastDate || "—";
                  const location = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : job.city || job.state || "—");
                  const experience = job.experience || job.experienceRequired || "—";
                  const jobType = job.jobType || job.type || "—";
                  const slug = getJobSlug(job);
                  const detailsHref = `/job/${slug || job.id}`;

                  return (
                    <div key={job.id} className="listing_data_card scholarship_card">
                      {/* Logo and Title */}
                      <div className="logo_and_info">
                        {job.logo ? (
                          <div className="flex-shrink-0">
                            <Image
                              src={job.logo}
                              alt={jobTitle}
                              width={60}
                              height={60}
                              className="object-contain"
                              priority={false}
                            />
                          </div>
                        ) : (
                          <div className="w-15 h-15 bg-gray-100 rounded flex items-center justify-center flex-shrink-0" style={{ width: '60px', height: '60px' }}>
                            <span className="text-xs font-bold text-gray-400">
                              {(jobTitle || "JOB").slice(0, 3).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="listing_card_info flex-1">
                          <h3>{jobTitle}</h3>
                          <div className="span_info">
                            <span>{organization}</span>
                          </div>
                        </div>
                      </div>

                      {/* Eligible Courses/Skills */}
                      {eligibleCourses !== "—" && (
                        <div className="scholarship_info_item">
                          <span className="info_label">Required Skills / Courses</span>
                          <p className="info_value">{eligibleCourses}</p>
                        </div>
                      )}

                      {/* Salary */}
                      <div className="scholarship_info_item">
                        <span className="info_label">Salary</span>
                        <p className="info_value font-bold text-red-700">{salary}</p>
                      </div>

                      {/* Experience */}
                      {experience !== "—" && (
                        <div className="scholarship_info_item">
                          <span className="info_label">Experience Required</span>
                          <p className="info_value">{experience}</p>
                        </div>
                      )}

                      {/* Location */}
                      {location !== "—" && (
                        <div className="scholarship_info_item">
                          <span className="info_label">Location</span>
                          <p className="info_value">{location}</p>
                        </div>
                      )}

                      {/* Job Type */}
                      {jobType !== "—" && (
                        <div className="scholarship_info_item">
                          <span className="info_label">Job Type</span>
                          <p className="info_value">{jobType}</p>
                        </div>
                      )}

                      {/* Deadline */}
                      <div className="scholarship_info_item">
                        <span className="info_label">Deadline</span>
                        <p className="info_value">{deadline}</p>
                      </div>

                      {/* Buttons */}
                      <div className="scholarship_buttons">
                        <button className="scholarship_btn_follow">
                          Follow Program
                        </button>
                        <Link href={detailsHref} className="scholarship_btn_details">
                          More Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
      </div>

      <Footer />
    </main>
  );
}
