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
  category?: string;
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

function InternshipsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);

  // Get filter values from URL params
  useEffect(() => {
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";
    const type = searchParams.get("type") || "";
    
    setSelectedCategory(category);
    setSelectedLocation(location);
    setSelectedType(type);
  }, [searchParams]);

  // Fetch internships from Firestore
  useEffect(() => {
    setLoading(true);
    let unsubscribe: (() => void) | null = null;
    
    const processSnapshot = (snapshot: any) => {
      const data: Internship[] = snapshot.docs.map((doc: any) => {
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
      
      setInternships(data);
      setLoading(false);
    };
    
    const internshipsRef = collection(db, "internships");
    
    unsubscribe = onSnapshot(
      internshipsRef,
      (snapshot) => {
        if (snapshot.size === 0) {
          const internshipRef = collection(db, "internship");
          onSnapshot(
            internshipRef,
            (snapshot2) => {
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
        const internshipRef = collection(db, "internship");
        onSnapshot(
          internshipRef,
          (snapshot) => {
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

  // Extract unique categories, locations, and types
  const categories = useMemo(() => {
    const cats = new Set<string>();
    internships.forEach((internship) => {
      if (internship.category) {
        cats.add(internship.category);
      }
    });
    return Array.from(cats).sort();
  }, [internships]);

  const locations = useMemo(() => {
    const locs = new Set<string>();
    internships.forEach((internship) => {
      const loc = internship.location || (internship.city && internship.state ? `${internship.city}, ${internship.state}` : internship.city || internship.state);
      if (loc) {
        locs.add(loc);
      }
    });
    return Array.from(locs).sort();
  }, [internships]);

  const types = useMemo(() => {
    const typeSet = new Set<string>();
    internships.forEach((internship) => {
      if (internship.type) {
        typeSet.add(internship.type);
      }
    });
    return Array.from(typeSet).sort();
  }, [internships]);

  // Filter internships
  const filteredInternships = useMemo(() => {
    return internships.filter((internship) => {
      if (selectedCategory && internship.category !== selectedCategory) {
        return false;
      }
      
      const internshipLocation = internship.location || (internship.city && internship.state ? `${internship.city}, ${internship.state}` : internship.city || internship.state);
      if (selectedLocation && internshipLocation !== selectedLocation) {
        return false;
      }
      
      if (selectedType && internship.type !== selectedType) {
        return false;
      }
      
      return true;
    });
  }, [internships, selectedCategory, selectedLocation, selectedType]);

  // Update URL when filters change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("category", e.target.value);
    } else {
      params.delete("category");
    }
    router.push(`/internships${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location === selectedLocation ? "" : location);
    const params = new URLSearchParams(searchParams.toString());
    if (location !== selectedLocation) {
      params.set("location", location);
    } else {
      params.delete("location");
    }
    router.push(`/internships${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type === selectedType ? "" : type);
    const params = new URLSearchParams(searchParams.toString());
    if (type !== selectedType) {
      params.set("type", type);
    } else {
      params.delete("type");
    }
    router.push(`/internships${params.toString() ? `?${params.toString()}` : ""}`);
  };

  // Helper to format amount/stipend
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
          <Link href="/internships" className="text-red-600 hover:text-red-600 font-medium">Internships</Link>
        </nav>

        <h1>Find the Right Internship for Your Career Goals</h1>
        <article className="sanitize_content">
          <p>
            Explore curated internship opportunities from top companies, startups, and organizations—designed specifically
            for college students. Whether you're looking to gain real-world experience, build your resume, or
            discover your passion, our internship listings connect you with roles that match your skills, interests, and
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
                                      name="internshiplocation"
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

              {/* Type Filter */}
              <div className="listing_filter_div">
                <p className="filter_type">Type</p>
                <div className="filterUrlDiv">
                  {types.map((type) => (
                    <div key={type} className="radio_input">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="internship_type"
                          checked={selectedType === type}
                          onChange={() => handleTypeChange(type)}
                        />
                        <span>{type.toUpperCase()}</span>
                      </label>
                </div>
              ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Internship Listings */}
          <div id="listing_data_wrapper">
            <div className="filter_and_clear_wrapper">
              {(selectedCategory || selectedLocation || selectedType) && (
                <Link href="/internships" className="clear_filter">
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
              ) : filteredInternships.length === 0 ? (
                <div className="listing_data_card" style={{ textAlign: "center", padding: "40px" }}>
                  <p className="text-gray-600">No internships found matching your criteria.</p>
            </div>
          ) : (
                filteredInternships.map((internship) => {
                  const internshipTitle = internship.title || internship.name || "Internship";
                  const organization = internship.company || internship.organization || "—";
                  const stipend = formatAmount(internship.stipend || internship.salary || internship.amount);
                  const deadline = internship.deadline || internship.applicationDeadline || internship.lastDate || "—";
                  const location = internship.location || (internship.city && internship.state ? `${internship.city}, ${internship.state}` : internship.city || internship.state || "—");
                  const duration = internship.duration || "—";
                  const type = internship.type || "—";
                  const slug = getInternshipSlug(internship);
                  const detailsHref = `/internship/${slug || internship.id}`;

                  return (
                    <div key={internship.id} className="listing_data_card">
                      <Link href={detailsHref} className="logo_and_info">
                        <div className="listing_card_info">
                          <h3>{internshipTitle}</h3>
                          <strong className="shortform">{organization}</strong>
                        </div>
                        {internship.logo ? (
                            <Image
                              src={internship.logo}
                              alt={internshipTitle}
                            width={64}
                            height={64}
                              className="object-contain"
                              priority={false}
                            />
                        ) : (
                          <img
                            src="https://www.CollegeSearch.in/build/assets/default-logo-for-internship-wYvCSDzC.png"
                            alt={internshipTitle}
                            loading="lazy"
                            className="w-16 h-16 object-contain"
                          />
                        )}
                      </Link>

                      <div className="listing_second_info">
                        <div className="info_and_cta">
                          <div>
                            <span>Stipend</span>
                            <p>{stipend}</p>
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
                            <span>Duration</span>
                            <p>{duration}</p>
                          </div>
                        </div>

                        <div className="info_and_cta">
                          <div>
                            <span>Type</span>
                            <p>{type}</p>
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
                              setSelectedInternship(internship);
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
                              setSelectedInternship(internship);
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
          setSelectedInternship(null);
        }}
        jobTitle={selectedInternship?.title || selectedInternship?.name || ""}
        companyName={selectedInternship?.company || selectedInternship?.organization || ""}
        jobId={selectedInternship?.id || ""}
        type="internship"
      />

      {/* Follow Modal */}
      <FollowModal
        isOpen={isFollowModalOpen}
        onClose={() => {
          setIsFollowModalOpen(false);
          setSelectedInternship(null);
        }}
        jobTitle={selectedInternship?.title || selectedInternship?.name || ""}
        companyName={selectedInternship?.company || selectedInternship?.organization || ""}
        jobId={selectedInternship?.id || ""}
        type="internship"
      />
    </main>
  );
}

export default function InternshipsPage() {
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
      <InternshipsPageContent />
    </Suspense>
  );
}
