"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { getInternshipSlug } from "@/lib/slugify";

type Internship = {
  id: string;
  title?: string;
  name?: string;
  company?: string;
  organization?: string;
  logo?: string;
  eligibleCourses?: string | string[];
  skills?: string | string[];
  stipend?: string | number;
  salary?: string | number;
  amount?: string | number;
  deadline?: string;
  applicationDeadline?: string;
  lastDate?: string;
  location?: string;
  state?: string;
  city?: string;
  duration?: string;
  type?: string; // Full-time, Part-time, Remote, etc.
  description?: string;
  eligibility?: string;
  applicationProcess?: string;
  website?: string;
  slug?: string;
  [key: string]: any;
};

export default function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch internships from Firestore
  useEffect(() => {
    setLoading(true);
    let unsubscribe: (() => void) | null = null;
    
    // Helper function to process snapshot data
    const processSnapshot = (snapshot: any) => {
      const data: Internship[] = snapshot.docs.map((doc: any) => {
        const docData = doc.data();
        console.log("Internship document:", doc.id, docData);
        return {
          id: doc.id,
          ...docData,
        };
      });
      
      // Sort manually by title or name
      data.sort((a, b) => {
        const aTitle = (a.title || a.name || "").toLowerCase();
        const bTitle = (b.title || b.name || "").toLowerCase();
        return aTitle.localeCompare(bTitle);
      });
      
      console.log("Total internships fetched:", data.length);
      console.log("Internships data:", data);
      setInternships(data);
      setLoading(false);
    };
    
    // Try "internships" collection first
    const internshipsRef = collection(db, "internships");
    
    unsubscribe = onSnapshot(
      internshipsRef,
      (snapshot) => {
        console.log("Fetched from 'internships':", snapshot.size, "documents");
        
        if (snapshot.size === 0) {
          console.warn("No documents found in 'internships' collection. Trying 'internship' collection...");
          // Try singular form
          const internshipRef = collection(db, "internship");
          onSnapshot(
            internshipRef,
            (snapshot2) => {
              console.log("Fetched from 'internship':", snapshot2.size, "documents");
              processSnapshot(snapshot2);
            },
            (err) => {
              console.error("Error fetching from 'internship':", err);
              setLoading(false);
            }
          );
          return;
        }
        
        processSnapshot(snapshot);
      },
      (err) => {
        console.error("Error fetching from 'internships':", err);
        // Try singular form as fallback
        console.log("Trying 'internship' collection instead...");
        const internshipRef = collection(db, "internship");
        onSnapshot(
          internshipRef,
          (snapshot) => {
            console.log("Fetched from 'internship':", snapshot.size, "documents");
            processSnapshot(snapshot);
          },
          (err2) => {
            console.error("Error fetching from 'internship':", err2);
            setLoading(false);
          }
        );
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Helper to format amount/stipend
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
          <span>Internships</span>
        </nav>

        <h1>List of Internships - 2025</h1>

        <article className="sanitize_content">
          <p>
            There are various recognised Boards and Councils in India that are responsible for regulating and
            overseeing different aspects of education in the country.
          </p>
        </article>

        {/* Internship Cards */}
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
                  <div className="flex gap-3 mt-4">
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : internships.length === 0 ? (
            <div className="listing_data_card" style={{ textAlign: "center", padding: "40px" }}>
              <p className="text-gray-600 mb-2">No internships found in the database.</p>
              <p className="text-sm text-gray-500">
                Total internships fetched: {internships.length}
              </p>
              {process.env.NODE_ENV === "development" && (
                <p className="text-xs text-gray-400 mt-2">
                  Check browser console for debugging information.
                </p>
              )}
            </div>
          ) : (
            <div className="listing_data_parent">
              {internships.map((internship) => {
                  const internshipTitle = internship.title || internship.name || "Internship";
                  const organization = internship.company || internship.organization || "—";
                  const eligibleCourses = getEligibleCourses(internship.eligibleCourses || internship.skills);
                  const stipend = formatAmount(internship.stipend || internship.salary || internship.amount);
                  const deadline = internship.deadline || internship.applicationDeadline || internship.lastDate || "—";
                  const location = internship.location || (internship.city && internship.state ? `${internship.city}, ${internship.state}` : internship.city || internship.state || "—");
                  const slug = getInternshipSlug(internship);
                  const detailsHref = `/internship/${slug || internship.id}`;

                  return (
                    <div key={internship.id} className="listing_data_card scholarship_card">
                      {/* Logo and Title */}
                      <div className="logo_and_info">
                        {internship.logo ? (
                          <div className="flex-shrink-0">
                            <Image
                              src={internship.logo}
                              alt={internshipTitle}
                              width={60}
                              height={60}
                              className="object-contain"
                              priority={false}
                            />
                          </div>
                        ) : (
                          <div className="w-15 h-15 bg-gray-100 rounded flex items-center justify-center flex-shrink-0" style={{ width: '60px', height: '60px' }}>
                            <span className="text-xs font-bold text-gray-400">
                              {(internshipTitle || "INT").slice(0, 3).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="listing_card_info flex-1">
                          <h3>{internshipTitle}</h3>
                          <div className="span_info">
                            <span>{organization}</span>
                          </div>
                        </div>
                      </div>

                      {/* Eligible Courses/Skills */}
                      <div className="scholarship_info_item">
                        <span className="info_label">Eligible Courses / Skills</span>
                        <p className="info_value">{eligibleCourses}</p>
                      </div>

                      {/* Stipend/Salary */}
                      <div className="scholarship_info_item">
                        <span className="info_label">Stipend / Salary</span>
                        <p className="info_value font-bold text-red-700">{stipend}</p>
                      </div>

                      {/* Location */}
                      {location !== "—" && (
                        <div className="scholarship_info_item">
                          <span className="info_label">Location</span>
                          <p className="info_value">{location}</p>
                        </div>
                      )}

                      {/* Duration */}
                      {internship.duration && (
                        <div className="scholarship_info_item">
                          <span className="info_label">Duration</span>
                          <p className="info_value">{internship.duration}</p>
                        </div>
                      )}

                      {/* Type */}
                      {internship.type && (
                        <div className="scholarship_info_item">
                          <span className="info_label">Type</span>
                          <p className="info_value">{internship.type}</p>
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
