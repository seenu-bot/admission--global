"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterLinking from "@/components/FooterLinking";
import ApplyNowModal from "@/components/ApplyNowModal";
import FollowModal from "@/components/FollowModal";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { getJobSlug } from "@/lib/slugify";

// Helper function to convert Firestore Timestamp to string
const formatTimestamp = (value: any): string => {
  if (!value) return "—";
  
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
  category?: string;
  salary?: string | number;
  salaryRange?: string;
  amount?: string | number;
  experience?: string;
  experienceRequired?: string;
  deadline?: string;
  applicationDeadline?: string;
  lastDate?: string;
  applyBy?: string;
  location?: string;
  state?: string;
  city?: string;
  jobType?: string;
  type?: string;
  workingHours?: string;
  description?: string;
  eligibility?: string;
  applicationProcess?: string;
  website?: string;
  slug?: string;
  [key: string]: any;
};

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedWorkingHours, setSelectedWorkingHours] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Get filter values from URL params
  useEffect(() => {
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";
    const workingHours = searchParams.get("working_hours") || "";
    
    setSelectedCategory(category);
    setSelectedLocation(location);
    setSelectedWorkingHours(workingHours);
  }, [searchParams]);

  // Fetch jobs from Firestore
  useEffect(() => {
    setLoading(true);
    let unsubscribe: (() => void) | null = null;
    
    const processSnapshot = (snapshot: any) => {
      const data: Job[] = snapshot.docs.map((doc: any) => {
        const docData = doc.data();
        
        const processedData: any = {
          id: doc.id,
          ...docData,
        };
        
        if (processedData.deadline) {
          processedData.deadline = formatTimestamp(processedData.deadline);
        }
        if (processedData.applicationDeadline) {
          processedData.applicationDeadline = formatTimestamp(processedData.applicationDeadline);
        }
        if (processedData.lastDate) {
          processedData.lastDate = formatTimestamp(processedData.lastDate);
        }
        if (processedData.applyBy) {
          processedData.applyBy = formatTimestamp(processedData.applyBy);
        }
        
        return processedData;
      });
      
      data.sort((a, b) => {
        const aTitle = (a.title || a.name || a.position || "").toLowerCase();
        const bTitle = (b.title || b.name || b.position || "").toLowerCase();
        return aTitle.localeCompare(bTitle);
      });
      
      setJobs(data);
      setLoading(false);
    };
    
    const jobsRef = collection(db, "jobs");
    
    unsubscribe = onSnapshot(
      jobsRef,
      (snapshot) => {
        if (snapshot.size === 0) {
          const jobRef = collection(db, "job");
          onSnapshot(
            jobRef,
            (snapshot2) => {
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
        const jobRef = collection(db, "job");
        onSnapshot(
          jobRef,
          (snapshot) => {
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

  // Extract unique categories, locations, and working hours from jobs
  const categories = useMemo(() => {
    const cats = new Set<string>();
    jobs.forEach((job) => {
      if (job.category) {
        cats.add(job.category);
      }
    });
    return Array.from(cats).sort();
  }, [jobs]);

  const locations = useMemo(() => {
    const locs = new Set<string>();
    jobs.forEach((job) => {
      const loc = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : job.city || job.state);
      if (loc) {
        locs.add(loc);
      }
    });
    return Array.from(locs).sort();
  }, [jobs]);

  // Filter jobs based on selected filters
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (selectedCategory && job.category !== selectedCategory) {
        return false;
      }
      
      const jobLocation = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : job.city || job.state);
      if (selectedLocation && jobLocation !== selectedLocation) {
        return false;
      }
      
      const workingHours = (job.workingHours || job.jobType || job.type || "").toLowerCase();
      if (selectedWorkingHours) {
        const selectedLower = selectedWorkingHours.toLowerCase();
        if (selectedLower === "part time" && !workingHours.includes("part")) {
          return false;
        }
        if (selectedLower === "full time" && !workingHours.includes("full")) {
          return false;
        }
      }
      
      return true;
    });
  }, [jobs, selectedCategory, selectedLocation, selectedWorkingHours]);

  // Update URL when filters change
  const updateUrl = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedLocation) params.set("location", selectedLocation);
    if (selectedWorkingHours) params.set("working_hours", selectedWorkingHours);
    
    const queryString = params.toString();
    router.push(`/jobs${queryString ? `?${queryString}` : ""}`);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("category", e.target.value);
    } else {
      params.delete("category");
    }
    router.push(`/jobs${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location === selectedLocation ? "" : location);
    const params = new URLSearchParams(searchParams.toString());
    if (location !== selectedLocation) {
      params.set("location", location);
    } else {
      params.delete("location");
    }
    router.push(`/jobs${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleWorkingHoursChange = (hours: string) => {
    setSelectedWorkingHours(hours === selectedWorkingHours ? "" : hours);
    const params = new URLSearchParams(searchParams.toString());
    if (hours !== selectedWorkingHours) {
      params.set("working_hours", hours);
    } else {
      params.delete("working_hours");
    }
    router.push(`/jobs${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const clearFilters = () => {
    router.push("/jobs");
  };

  // Helper to format salary
  const formatSalary = (salary: string | number | undefined): string => {
    if (!salary) return "N/A";
    const salaryStr = String(salary);
    if (salaryStr.includes("₹") || salaryStr.includes("INR") || salaryStr.includes("Rs") || salaryStr.includes("LPA") || salaryStr.includes("Lakh") || salaryStr.includes("/year")) {
      return salaryStr;
    }
    if (!isNaN(Number(salary))) {
      return `INR ${Number(salary).toLocaleString("en-IN")} /year`;
    }
    return salaryStr;
  };

  // Filter locations based on search
  const filteredLocations = useMemo(() => {
    if (!locationSearch) return locations;
    const searchLower = locationSearch.toLowerCase();
    return locations.filter((loc) => loc.toLowerCase().includes(searchLower));
  }, [locations, locationSearch]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container common_listing_wrapper" id="internship_listing_wrapper">
        {/* Breadcrumb */}
        <nav className="text-base mb-6 text-gray-500 py-2 pt-6">
          <Link href="/" className="hover:underline text-gray-900 font-medium">Home</Link>
          <span aria-hidden="true" className="mx-2">›</span>
          <Link href="/jobs" className="text-red-600 hover:text-red-600 font-medium">Jobs</Link>
        </nav>

        <h1>Find the Right Job for Your Career Goals</h1>
        <article className="sanitize_content">
          <p>
            Explore curated job opportunities from top companies, startups, and organizations—designed specifically
            for college students. Whether you're looking to gain real-world experience, build your resume, or
            discover your passion, our job listings connect you with roles that match your skills, interests, and
            career aspirations.
          </p>
        </article>

        <div className="main_listing_wrapper" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', marginTop: '16px' }}>
          {/* Left Sidebar - Filters */}
          <div id="listing_filter_wrapper">
            <div className="fileter_closer">
              <span>Filters</span>
              <span className="close_filter"></span>
            </div>
            <div className="listing_filter_parent">
              {/* Popular Categories Filter */}
              <div className="listing_filter_div">
                <p className="filter_type">Popular Categories</p>
                <select 
                  name="category" 
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div className="listing_filter_div">
                <p className="filter_type">Location</p>
                <div className="search_box accordion_wrap">
                  <div className={`accordion_div ${isLocationExpanded ? "active" : ""}`}>
                    <p 
                      className="accordion flex items-center justify-between cursor-pointer"
                      onClick={() => setIsLocationExpanded(!isLocationExpanded)}
                    >
                      Select or Search location
                      <span className="text-red-500 text-sm">▼</span>
                    </p>
                    {isLocationExpanded && (
                      <div className="panel">
                        <div className="search_wrapper">
                          <input
                            type="text"
                            placeholder="Search"
                            className="filterSearchText w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            value={locationSearch}
                            onChange={(e) => setLocationSearch(e.target.value)}
                          />
                          <div className="search_data max-h-72 overflow-y-auto">
                            <div className="filterUrlDiv examFilterUrl search_list">
                              {filteredLocations.map((loc) => (
                                <div key={loc} className="radio_input">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="joblocation"
                                      checked={selectedLocation === loc}
                                      onChange={() => handleLocationChange(loc)}
                                    />
                                    <span>{loc}</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                    </div>
                  </div>
                  </div>
                    )}
                  </div>
                  </div>
                  </div>

              {/* Working Hours Filter */}
              <div className="listing_filter_div">
                <p className="filter_type">Working Hours</p>
                <div className="filterUrlDiv">
                  <div className="radio_input">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="working_hours"
                        checked={selectedWorkingHours === "Part time"}
                        onChange={() => handleWorkingHoursChange("Part time")}
                      />
                      <span>PART TIME</span>
                    </label>
                  </div>
                  <div className="radio_input">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="working_hours"
                        checked={selectedWorkingHours === "full time"}
                        onChange={() => handleWorkingHoursChange("full time")}
                      />
                      <span>FULL TIME</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Job Listings */}
          <div id="listing_data_wrapper">
            <div className="filter_and_clear_wrapper">
              {(selectedCategory || selectedLocation || selectedWorkingHours) && (
                <Link href="/jobs" className="clear_filter">
                  Clear All Filters
                </Link>
              )}
              <span id="mobileFilter">Filters</span>
            </div>

            <div className="listing_data_parent" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="listing_data_card">
                    <div className="logo_and_info">
                      <div className="listing_card_info">
                        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="w-16 h-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="listing_second_info">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="info_and_cta">
                          <div className="h-4 w-20 bg-gray-200 rounded mb-1 animate-pulse"></div>
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                    <div className="listing_third_info">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="info_and_cta">
                          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : filteredJobs.length === 0 ? (
                <div className="listing_data_card" style={{ textAlign: "center", padding: "40px" }}>
                  <p className="text-gray-600">No jobs found matching your criteria.</p>
            </div>
          ) : (
                filteredJobs.map((job) => {
                  const jobTitle = job.title || job.name || job.position || "Job";
                  const organization = job.company || job.organization || "—";
                  const salary = formatSalary(job.salary || job.salaryRange || job.amount);
                  const applyBy = job.applyBy || job.deadline || job.applicationDeadline || job.lastDate || "—";
                  const experience = job.experience || job.experienceRequired || "Fresher";
                  const workingHours = (job.workingHours || job.jobType || job.type || "full time").toLowerCase();
                  const slug = getJobSlug(job);
                  const detailsHref = `/job/${slug || job.id}`;

                  return (
                    <div key={job.id} className="listing_data_card">
                      <Link href={detailsHref} className="logo_and_info">
                        <div className="listing_card_info">
                          <h3>{jobTitle}</h3>
                          <strong className="shortform">{organization}</strong>
                        </div>
                        {job.logo ? (
                            <Image
                              src={job.logo}
                              alt={jobTitle}
                            width={64}
                            height={64}
                              className="object-contain"
                              priority={false}
                            />
                        ) : (
                          <img
                            src="https://www.CollegeSearch.in/build/assets/default-logo-for-internship-wYvCSDzC.png"
                            alt={jobTitle}
                            loading="lazy"
                            className="w-16 h-16 object-contain"
                          />
                        )}
                      </Link>

                      <div className="listing_second_info">
                        <div className="info_and_cta">
                          <div>
                            <span>Salary</span>
                            <p>{salary}</p>
                          </div>
                        </div>

                        <div className="info_and_cta">
                          <div>
                            <span>Apply By</span>
                            <p>{applyBy}</p>
                          </div>
                        </div>

                        <div className="info_and_cta">
                          <div>
                            <span>Experience</span>
                            <p>{experience}</p>
                        </div>
                      </div>

                        <div className="info_and_cta">
                          <div>
                            <span>Working</span>
                            <p>{workingHours}</p>
                          </div>
                        </div>
                      </div>

                      <div className="listing_third_info">
                        <div className="info_and_cta">
                          <Link href={detailsHref}>More Details</Link>
                        </div>
                        <div className="info_and_cta">
                          <a
                            href="javascript:void(0)"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedJob(job);
                              setIsFollowModalOpen(true);
                            }}
                            className="open-modal trackCTA"
                          >
                            Follow
                          </a>
                        </div>
                        <div className="info_and_cta">
                          <a
                            href="javascript:void(0)"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedJob(job);
                              setIsApplyModalOpen(true);
                            }}
                            className="open-modal trackCTA"
                          >
                            Apply Now
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              </div>
          </div>
          </div>
      </div>

      <FooterLinking />
      <Footer />

      {/* Apply Now Modal */}
      <ApplyNowModal
        isOpen={isApplyModalOpen}
        onClose={() => {
          setIsApplyModalOpen(false);
          setSelectedJob(null);
        }}
        jobTitle={selectedJob?.title || selectedJob?.name || selectedJob?.position || ""}
        companyName={selectedJob?.company || selectedJob?.organization || ""}
        jobId={selectedJob?.id || ""}
        type="job"
      />

      {/* Follow Modal */}
      <FollowModal
        isOpen={isFollowModalOpen}
        onClose={() => {
          setIsFollowModalOpen(false);
          setSelectedJob(null);
        }}
        jobTitle={selectedJob?.title || selectedJob?.name || selectedJob?.position || ""}
        companyName={selectedJob?.company || selectedJob?.organization || ""}
        jobId={selectedJob?.id || ""}
        type="job"
      />
    </main>
  );
}

export default function JobsPage() {
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
      <JobsPageContent />
    </Suspense>
  );
}
