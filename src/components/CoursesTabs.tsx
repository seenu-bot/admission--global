"use client";

import { useState, useEffect, useRef } from "react";
import { collection, getDocs, DocumentData } from "firebase/firestore";
import { db } from "@/firebase/firebase";

// ✅ Define the shape of each course item
interface CourseItem {
  id: string;
  name?: string;
  duration?: string;
  colleges: number;
  exams: number;
}

// ✅ Define the degree-level object structure
interface DegreeCourses {
  degree_1: CourseItem[]; // UG
  degree_2: CourseItem[]; // PG
  degree_3: CourseItem[]; // Diploma
}

export default function CoursesTabs() {
  const [activeTab, setActiveTab] = useState<"degree_1" | "degree_2" | "degree_3">("degree_1");
  const [degreeCourses, setDegreeCourses] = useState<DegreeCourses>({
    degree_1: [],
    degree_2: [],
    degree_3: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [showLeftArrow, setShowLeftArrow] = useState<boolean>(false);
  const [showRightArrow, setShowRightArrow] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTabClick = (tabId: "degree_1" | "degree_2" | "degree_3") => {
    setActiveTab(tabId);
    // Reset scroll position when switching tabs
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
      updateArrowVisibility();
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: "smooth" });
      setTimeout(updateArrowVisibility, 300);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: "smooth" });
      setTimeout(updateArrowVisibility, 300);
    }
  };

  const updateArrowVisibility = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      updateArrowVisibility();
      container.addEventListener("scroll", updateArrowVisibility);
      window.addEventListener("resize", updateArrowVisibility);
      return () => {
        container.removeEventListener("scroll", updateArrowVisibility);
        window.removeEventListener("resize", updateArrowVisibility);
      };
    }
  }, [activeTab, degreeCourses]);

  // ✅ Fetch course data dynamically
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        const ug: CourseItem[] = [];
        const pg: CourseItem[] = [];
        const diploma: CourseItem[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;

          const courseBase = {
            id: doc.id,
            name: data.courseName || "",
            duration: data.duration || "",
            colleges: data.topColleges?.length || 0,
            exams: data.entranceExams?.length || 0,
          };

          // ✅ Categorize by courseLevel
          if (data.courseLevel === "UG") ug.push(courseBase);
          else if (data.courseLevel === "PG") pg.push(courseBase);
          else if (data.courseLevel === "Diploma") diploma.push(courseBase);
        });

        setDegreeCourses({
          degree_1: ug,
          degree_2: pg,
          degree_3: diploma,
        });
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <>
        <div className="tabs_btn_wrap" role="tablist">
          {[1, 2, 3].map((i) => (
            <div key={i} className="tab-button">
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="tabs_content_wrapper">
          <div className="tab-content active">
            <div className="explore_course_wrap" style={{ overflowX: "auto" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="explore_course_div">
                  <div className="course_logo bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="course_data_div">
                    <div className="h-16 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-16 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-16 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mt-4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ✅ Tabs Header */}
      <div className="tabs_btn_wrap" role="tablist">
        {[
          { id: "degree_1", label: "UG" },
          { id: "degree_2", label: "PG" },
          { id: "degree_3", label: "Diploma" },
        ].map(({ id, label }) => (
          <div
            key={id}
            className={`tab-button ${activeTab === id ? "active_tab" : ""}`}
            onClick={() => handleTabClick(id as "degree_1" | "degree_2" | "degree_3")}
            role="tab"
            aria-selected={activeTab === id}
          >
            {label}
          </div>
        ))}
      </div>

      {/* ✅ Tabs Content */}
      <div className="tabs_content_wrapper">
        {Object.entries(degreeCourses).map(([degreeId, courses]) => (
          <div
            key={degreeId}
            className={`tab-content ${activeTab === degreeId ? "active" : "hidden"}`}
            id={degreeId}
            role="tabpanel"
            aria-hidden={activeTab !== degreeId}
          >
            <div className="relative">
              {/* Left Arrow */}
              {showLeftArrow && activeTab === degreeId && (
                <button
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all hidden md:block"
                  aria-label="Scroll left"
                  style={{ marginLeft: "-20px" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Scrollable Container */}
              <div
                ref={activeTab === degreeId ? scrollContainerRef : null}
                className="explore_course_wrap"
                style={{ overflowX: "auto", scrollBehavior: "smooth", scrollbarWidth: "thin" }}
              >
              {courses.length > 0 ? (
                courses.map((course: any) => (
                  <div key={course.id} className="explore_course_div">
                    <p className="course_logo"></p>

                    <a href={`/course/${course.id}`} className="course_name">
                      {course.name}
                    </a>

                    <div className="course_data_div">
                      <p>
                        <span>Duration</span>
                        <br />
                        {course.duration || "N/A"}
                      </p>
                      <p>
                        <span>Colleges</span>
                        <br />
                        {course.colleges}
                      </p>
                      <p>
                        <span>Related Exams</span>
                        <br />
                        {course.exams}
                      </p>
                    </div>

                    <a href={`/course/${course.id}`} className="view_link">
                      View Course Overview &gt;
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No courses available.</p>
                )}
              </div>

              {/* Right Arrow */}
              {showRightArrow && activeTab === degreeId && (
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all hidden md:block"
                  aria-label="Scroll right"
                  style={{ marginRight: "-20px" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
