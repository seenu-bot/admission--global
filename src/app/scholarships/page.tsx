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
import { getScholarshipSlug } from "@/lib/slugify";

type Scholarship = {
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
  city?: string;
  location?: string;
  academicLevel?: string;
  level?: string;
  category?: string;
  description?: string;
  eligibility?: string;
  applicationProcess?: string;
  website?: string;
  slug?: string;
  [key: string]: any;
};

function ScholarshipsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);

  // Get filter values from URL params
  useEffect(() => {
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";
    const level = searchParams.get("level") || "";
    
    setSelectedCategory(category);
    setSelectedLocation(location);
    setSelectedLevel(level);
  }, [searchParams]);

  // Fetch scholarships from Firestore
  useEffect(() => {
    setLoading(true);
    let unsubscribe: (() => void) | null = null;
    
    const processSnapshot = (snapshot: any) => {
      const data: Scholarship[] = snapshot.docs.map((doc: any) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
        };
      });
      
      data.sort((a, b) => {
        const aTitle = (a.title || a.name || "").toLowerCase();
        const bTitle = (b.title || b.name || "").toLowerCase();
        return aTitle.localeCompare(bTitle);
      });
      
      setScholarships(data);
      setLoading(false);
    };
    
    const scholarshipsRef = collection(db, "scholarships");
    
    unsubscribe = onSnapshot(
      scholarshipsRef,
      (snapshot) => {
        if (snapshot.size === 0) {
          const scholarshipRef = collection(db, "scholarship");
          onSnapshot(
            scholarshipRef,
            (snapshot2) => {
              processSnapshot(snapshot2);
            },
            (err) => {
              console.error("Error fetching from 'scholarship':", err);
              setLoading(false);
            }
          );
          return;
        }
        
        processSnapshot(snapshot);
      },
      (err) => {
        console.error("Error fetching from 'scholarships':", err);
        const scholarshipRef = collection(db, "scholarship");
        onSnapshot(
          scholarshipRef,
          (snapshot) => {
            processSnapshot(snapshot);
          },
          (err2) => {
            console.error("Error fetching from 'scholarship':", err2);
            setLoading(false);
          }
        );
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Extract unique categories, locations, and levels
  const categories = useMemo(() => {
    const cats = new Set<string>();
    scholarships.forEach((scholarship) => {
      if (scholarship.category) {
        cats.add(scholarship.category);
      }
    });
    return Array.from(cats).sort();
  }, [scholarships]);

  const locations = useMemo(() => {
    const locs = new Set<string>();
    scholarships.forEach((scholarship) => {
      const loc = scholarship.location || (scholarship.city && scholarship.state ? `${scholarship.city}, ${scholarship.state}` : scholarship.city || scholarship.state);
      if (loc) {
        locs.add(loc);
      }
    });
    return Array.from(locs).sort();
  }, [scholarships]);

  const levels = useMemo(() => {
    const levelSet = new Set<string>();
    scholarships.forEach((scholarship) => {
      const level = scholarship.academicLevel || scholarship.level;
      if (level) {
        levelSet.add(level);
      }
    });
    return Array.from(levelSet).sort();
  }, [scholarships]);

  // Filter scholarships
  const filteredScholarships = useMemo(() => {
    return scholarships.filter((scholarship) => {
      if (selectedCategory && scholarship.category !== selectedCategory) {
        return false;
      }
      
      const scholarshipLocation = scholarship.location || (scholarship.city && scholarship.state ? `${scholarship.city}, ${scholarship.state}` : scholarship.city || scholarship.state);
      if (selectedLocation && scholarshipLocation !== selectedLocation) {
        return false;
      }
      
      const level = scholarship.academicLevel || scholarship.level;
      if (selectedLevel && level !== selectedLevel) {
        return false;
      }
      
      return true;
    });
  }, [scholarships, selectedCategory, selectedLocation, selectedLevel]);

  // Update URL when filters change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("category", e.target.value);
    } else {
      params.delete("category");
    }
    router.push(`/scholarships${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location === selectedLocation ? "" : location);
    const params = new URLSearchParams(searchParams.toString());
    if (location !== selectedLocation) {
      params.set("location", location);
    } else {
      params.delete("location");
    }
    router.push(`/scholarships${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level === selectedLevel ? "" : level);
    const params = new URLSearchParams(searchParams.toString());
    if (level !== selectedLevel) {
      params.set("level", level);
    } else {
      params.delete("level");
    }
    router.push(`/scholarships${params.toString() ? `?${params.toString()}` : ""}`);
  };

  // Helper to format amount
  const formatAmount = (amount: string | number | undefined): string => {
    if (!amount) return "N/A";
    const amountStr = String(amount);
    if (amountStr.includes("₹") || amountStr.includes("INR") || amountStr.includes("Rs") || amountStr.includes("LPA") || amountStr.includes("Lakh") || amountStr.includes("/year")) {
      return amountStr;
    }
    if (!isNaN(Number(amount))) {
      return `INR ${Number(amount).toLocaleString("en-IN")} /year`;
    }
    return amountStr;
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
          <Link href="/scholarships" className="text-red-600 hover:text-red-600 font-medium">Scholarships</Link>
        </nav>

        <h1>Find the Right Scholarship for Your Career Goals</h1>
        <article className="sanitize_content">
          <p>
            Explore curated scholarship opportunities from top organizations and institutions—designed specifically
            for college students. Whether you're looking for financial support, merit-based awards, or need-based assistance,
            our scholarship listings connect you with opportunities that match your academic achievements, interests, and
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
                                      name="scholarshiplocation"
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

              {/* Academic Level Filter */}
              <div className="listing_filter_div">
                <p className="filter_type">Academic Level</p>
                <div className="filterUrlDiv">
                  {levels.map((level) => (
                    <div key={level} className="radio_input">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="scholarship_level"
                          checked={selectedLevel === level}
                          onChange={() => handleLevelChange(level)}
                        />
                        <span>{level.toUpperCase()}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Scholarship Listings */}
          <div id="listing_data_wrapper">
            <div className="filter_and_clear_wrapper">
              {(selectedCategory || selectedLocation || selectedLevel) && (
                <Link href="/scholarships" className="clear_filter">
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
              ) : filteredScholarships.length === 0 ? (
                <div className="listing_data_card" style={{ textAlign: "center", padding: "40px" }}>
                  <p className="text-gray-600">No scholarships found matching your criteria.</p>
                </div>
              ) : (
                filteredScholarships.map((scholarship) => {
                  const scholarshipTitle = scholarship.title || scholarship.name || "Scholarship";
                  const organization = scholarship.organization || "—";
                  const amount = formatAmount(scholarship.scholarshipAmount || scholarship.amount);
                  const deadline = scholarship.deadline || "—";
                  const level = scholarship.academicLevel || scholarship.level || "—";
                  const eligibleCourses = Array.isArray(scholarship.eligibleCourses) 
                    ? scholarship.eligibleCourses.join(", ") 
                    : (scholarship.eligibleCourses || "—");
                  const slug = getScholarshipSlug(scholarship);
                  const detailsHref = `/scholarship/${slug || scholarship.id}`;

                  return (
                    <div key={scholarship.id} className="listing_data_card">
                      <Link href={detailsHref} className="logo_and_info">
                        <div className="listing_card_info">
                          <h3>{scholarshipTitle}</h3>
                          <strong className="shortform">{organization}</strong>
                        </div>
                        {scholarship.logo ? (
                          <Image
                            src={scholarship.logo}
                            alt={scholarshipTitle}
                            width={64}
                            height={64}
                            className="object-contain"
                            priority={false}
                          />
                        ) : (
                          <img
                            src="https://www.CollegeSearch.in/build/assets/default-logo-for-internship-wYvCSDzC.png"
                            alt={scholarshipTitle}
                            loading="lazy"
                            className="w-16 h-16 object-contain"
                          />
                        )}
                      </Link>

                      <div className="listing_second_info">
                        <div className="info_and_cta">
                          <div>
                            <span>Amount</span>
                            <p>{amount}</p>
                          </div>
                        </div>

                        <div className="info_and_cta">
                          <div>
                            <span>Deadline</span>
                            <p>{deadline}</p>
                          </div>
                        </div>

                        <div className="info_and_cta">
                          <div>
                            <span>Level</span>
                            <p>{level}</p>
                          </div>
                        </div>

                        <div className="info_and_cta">
                          <div>
                            <span>Eligible</span>
                            <p style={{ 
                              fontSize: eligibleCourses.length > 30 ? '0.75rem' : 'inherit',
                              lineHeight: eligibleCourses.length > 30 ? '1.2' : 'inherit'
                            }}>{eligibleCourses}</p>
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
                              setSelectedScholarship(scholarship);
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
                              setSelectedScholarship(scholarship);
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
          setSelectedScholarship(null);
        }}
        jobTitle={selectedScholarship?.title || selectedScholarship?.name || ""}
        companyName={selectedScholarship?.organization || ""}
        jobId={selectedScholarship?.id || ""}
        type="job"
      />

      {/* Follow Modal */}
      <FollowModal
        isOpen={isFollowModalOpen}
        onClose={() => {
          setIsFollowModalOpen(false);
          setSelectedScholarship(null);
        }}
        jobTitle={selectedScholarship?.title || selectedScholarship?.name || ""}
        companyName={selectedScholarship?.organization || ""}
        jobId={selectedScholarship?.id || ""}
        type="job"
      />
    </main>
  );
}

export default function ScholarshipsPage() {
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
      <ScholarshipsPageContent />
    </Suspense>
  );
}
