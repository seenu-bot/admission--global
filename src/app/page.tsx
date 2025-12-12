"use client";

import { useEffect, useState } from "react";
import Header from '@/components/Header'
import CoursesTabs from '@/components/CoursesTabs'
import UpcomingExams from '@/components/UpcomingExams'
import LatestArticles from '@/components/LatestArticles'
import LatestNews from '@/components/LatestNews'
import FooterLinking from '@/components/FooterLinking'
import Footer from '@/components/Footer'
import HomeSearchModal from '@/components/HomeSearchModal'
import Image from "next/image";
import { db } from "@/firebase/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

function slugifyCourseName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/\./g, "");
}

function getShortForm(courseName: string): string {
  if (!courseName) return "";
  
  const name = courseName.trim();
  
  // Common short form patterns
  const shortFormPatterns = [
    { pattern: /\b(B\.?Tech|B\.?E\.?|Bachelor of Technology|Bachelor of Engineering)\b/i, short: "B.Tech" },
    { pattern: /\b(M\.?Tech|M\.?E\.?|Master of Technology|Master of Engineering)\b/i, short: "M.Tech" },
    { pattern: /\b(MBA|Master of Business Administration)\b/i, short: "MBA" },
    { pattern: /\b(BBA|Bachelor of Business Administration)\b/i, short: "BBA" },
    { pattern: /\b(BCA|Bachelor of Computer Applications)\b/i, short: "Bachelor of Computer Applications" },
    { pattern: /\b(MCA|Master of Computer Applications)\b/i, short: "MCA" },
    { pattern: /\b(MBBS|Bachelor of Medicine.*Bachelor of Surgery)\b/i, short: "MBBS" },
    { pattern: /\b(B\.?Sc|Bachelor of Science)\b/i, short: "B.Sc" },
    { pattern: /\b(M\.?Sc|Master of Science)\b/i, short: "M.Sc" },
    { pattern: /\b(B\.?Com|Bachelor of Commerce)\b/i, short: "B.Com" },
    { pattern: /\b(M\.?Com|Master of Commerce)\b/i, short: "M.Com" },
    { pattern: /\b(BA|Bachelor of Arts)\b/i, short: "BA" },
    { pattern: /\b(MA|Master of Arts)\b/i, short: "MA" },
    { pattern: /\b(LLB|Bachelor of Laws)\b/i, short: "LLB" },
    { pattern: /\b(LLM|Master of Laws)\b/i, short: "LLM" },
    { pattern: /\b(B\.?Pharm|Bachelor of Pharmacy)\b/i, short: "B.Pharm" },
    { pattern: /\b(M\.?Pharm|Master of Pharmacy)\b/i, short: "M.Pharm" },
    { pattern: /\b(B\.?Arch|Bachelor of Architecture)\b/i, short: "B.Arch" },
    { pattern: /\b(M\.?Arch|Master of Architecture)\b/i, short: "M.Arch" },
    { pattern: /\b(BDS|Bachelor of Dental Surgery)\b/i, short: "BDS" },
    { pattern: /\b(BHM|Bachelor of Hotel Management)\b/i, short: "BHM" },
  ];
  
  // Try to match patterns
  for (const { pattern, short } of shortFormPatterns) {
    if (pattern.test(name)) {
      return short;
    }
  }
  
  // If no pattern matches, try to extract common abbreviations
  const abbrevMatch = name.match(/\b([A-Z]{2,5})\b/);
  if (abbrevMatch && abbrevMatch[1].length >= 2 && abbrevMatch[1].length <= 5) {
    return abbrevMatch[1];
  }
  
  // If the name starts with "Bachelor of" or "Master of" and we didn't find a match,
  // return empty string to filter it out
  if (/^(Bachelor|Master) of /i.test(name)) {
    return "";
  }
  
  // If name is already short (10 chars or less), return it as is
  if (name.length <= 10) {
  return name;
  }
  
  // Otherwise, return empty string to filter out long names
  return "";
}

export default function Home() {
const [popularCourses, setPopularCourses] = useState<
  Array<{ name: string; shortForm: string; id: string; slug: string }>
>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    // Fetch courses from Firestore
    const coursesQ = query(
      collection(db, "courses"),
      orderBy("courseName"),
      limit(50) // Get more courses to filter duplicates
    );
    
    const unsubscribe = onSnapshot(
      coursesQ,
      (snapshot) => {
        const coursesMap = new Map<
          string,
          { name: string; shortForm: string; id: string; slug: string }
        >();
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const courseName = data.courseName || data.name || "";
          
          if (!courseName || !courseName.trim()) return;
          
          const shortForm = getShortForm(courseName);
          
          // Filter out courses without valid short forms
          if (!shortForm || shortForm.trim() === "") return;
          
          const slug =
            (typeof data.slug === "string" && data.slug.trim()) || slugifyCourseName(courseName);
          
          // Additional validation: short forms should be:
          // - Max 10 characters (to catch "B.Pharm", "M.Pharm", etc.)
          // - No ellipsis (...)
          // - Not the same as the original course name (unless it's already short)
          const isShortForm = 
            shortForm.length <= 10 &&
            !shortForm.includes("...") &&
            (shortForm.length < courseName.length || courseName.length <= 10);
          
          if (!isShortForm) return;
          
          // Use short form as key to remove duplicates
          if (!coursesMap.has(shortForm)) {
            coursesMap.set(shortForm, {
              id: doc.id,
              name: courseName,
              shortForm: shortForm,
              slug,
            });
          }
        });

        // Convert to array, sort by short form, and limit to 10
        const uniqueCourses = Array.from(coursesMap.values())
          .sort((a, b) => a.shortForm.localeCompare(b.shortForm))
          .slice(0, 10);

        setPopularCourses(uniqueCourses);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching courses:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const mobileHomeSearch = document.getElementById('mobileHomeSearch');
    const handleSearchClick = () => {
      setIsSearchModalOpen(true);
    };

    mobileHomeSearch?.addEventListener('click', handleSearchClick);

    return () => {
      mobileHomeSearch?.removeEventListener('click', handleSearchClick);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Modal Backdrop */}
      <div id="modalBackdrop"></div>

      {/* Home Search Modal */}
      <HomeSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Hero Section */}
      <section id="HomePageSection">
        <div className="header_banner container">
          <div className="wrap_of_input">
            <div className="CS_tagline">
              <h1>
                Discover and Find the <br />
                <s>Best</s> <p>Right</p> College
              </h1>
            </div>

            {/* Search bar snippet */}
            <div id="HomeSearchbarSnippet">
              <div id="mobileHomeSearch">Search by Course, Location...</div>
            </div>

            {/* Popular Courses */}
            <div className="popularCollegeSearch">
              <p>Popular Colleges by Courses:</p>
              <div className="pop_clg_link">
                {loading ? (
                  <span className="text-gray-500">Loading courses...</span>
                ) : popularCourses.length > 0 ? (
                  popularCourses.map((course) => {
                    const short = (course.shortForm || "").toLowerCase();
                    const isBtech = short === "b.tech";
                    const isBsc = short === "b.sc";
                    const isMtech = short === "m.tech";
                    const isBba = short === "bba";
                    const isMba = short === "mba";
                    const isMbbs = short === "mbbs";
                    const courseParam = isBtech
                      ? encodeURIComponent("B.Tech in Computer Science and Engineering")
                      : isBsc
                      ? encodeURIComponent("B.Sc Nursing")
                      : isMtech
                      ? encodeURIComponent("M.Tech")
                      : isBba
                      ? encodeURIComponent("BBA")
                      : isMba
                      ? encodeURIComponent("MBA")
                      : isMbbs
                      ? encodeURIComponent("MBBS")
                      : encodeURIComponent(course.shortForm || course.name || course.slug || "");
                    const courseHref = `/colleges?course=${courseParam}`;
                    return (
                      <a key={course.id} href={courseHref} title={course.name}>
                        {course.shortForm}
                      </a>
                    );
                  })
                ) : (
                  // Fallback to default courses if no data
                  ['B.Tech','B.Sc','B.Com','BBA','BCA','BA','MBA','LLB','MCA','B.Pharm','M.Tech'].map((course, idx) => {
                    const lower = course.toLowerCase();
                    const isBtech = lower === "b.tech";
                    const isBsc = lower === "b.sc";
                    const isMtech = lower === "m.tech";
                    const isBba = lower === "bba";
                    const isMba = lower === "mba";
                    const isMbbs = lower === "mbbs";
                    const courseParam = isBtech
                      ? encodeURIComponent("B.Tech in Computer Science and Engineering")
                      : isBsc
                      ? encodeURIComponent("B.Sc Nursing")
                      : isMtech
                      ? encodeURIComponent("M.Tech")
                      : isBba
                      ? encodeURIComponent("BBA")
                      : isMba
                      ? encodeURIComponent("MBA")
                      : isMbbs
                      ? encodeURIComponent("MBBS")
                      : encodeURIComponent(course);
                    return (
                      <a key={idx} href={`/colleges?course=${courseParam}`}>
                    {course}
                  </a>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Explore Courses */}
        <div id="preferredCourseSection">
          <div className="container" id="Explore_course">
            <h2>Explore Courses</h2>
            <CoursesTabs />
          </div>
        </div>

        {/* Upcoming Exams, Latest Articles, Latest News */}
        <div className="container px-4 sm:px-0">
          <section id="upcomingExamWrapper">
            <h2 className="tech_h2">Upcoming Exams</h2>
            <UpcomingExams />
          </section>

          <LatestArticles />
          <LatestNews />
        </div>
      </section>

      {/* Footer Sections */}
      <FooterLinking />
      <Footer />

      {/* Success Modal */}
      <div id="successModal" className="modal reloadWindow">
        <div className="modal-content">
          <div className="modal-header">
            <p className="modal-title" id="modal_clg_logo"></p>
            <span className="close">&times;</span>
          </div>
          <div className="modal-body">
            <p className="successIcon"></p>
            <p className="successHeading">Registered Successfully</p>
            <p className="successText">
              Now you can download brochures, get expert counseling and submit applications hassle-free. Your
              college hunt journey begins now!
            </p>
            <p className="successcourseText"></p>

            <div className="redirect-wrap" id="redirectWrap">
              <p className="redirectText">
                Redirecting in <span id="countdown">10</span> seconds… <span className="loader"></span>
              </p>
            </div>

            <div className="applynow_btn_wrap" id="admitQuest">
      <a
        href="#"
        target="_blank"
        id="applyNowLink"
        className="btn applynow_btn flex items-center gap-2"
      >
        Apply Now via{" "}
        <Image
          src="/build/assets/admitquestLogo-C9IGcvDE.png"
          alt="AdmitQuest Logo"
          width={100}
          height={30}
          priority
        />
      </a>

      <a href="#" className="btn closenow_btn" id="closebtn">
        Close
      </a>
    </div>
          </div>
        </div>
      </div>
    </main>
  )
}
