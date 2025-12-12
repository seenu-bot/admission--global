'use client';

import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import Image from "next/image";
import { getExamSlug } from "@/lib/slugify";

// Helper to derive short course labels like "MBBS", "B.Tech", "MBA"
function getCourseShortForm(name?: string): string {
  if (!name) return "";
  const n = name.trim();

  const patterns: { pattern: RegExp; short: string }[] = [
    { pattern: /\bMBBS\b|Bachelor of Medicine.*Bachelor of Surgery/i, short: "MBBS" },
    { pattern: /\bB\.?Tech\b|B\.?E\.?\b|Bachelor of Technology|Bachelor of Engineering/i, short: "B.Tech" },
    { pattern: /\bM\.?Tech\b|M\.?E\.?\b|Master of Technology|Master of Engineering/i, short: "M.Tech" },
    { pattern: /\bMBA\b|Master of Business Administration/i, short: "MBA" },
    { pattern: /\bBBA\b|Bachelor of Business Administration/i, short: "BBA" },
    { pattern: /\bB\.?Sc\b|Bachelor of Science/i, short: "B.Sc" },
    { pattern: /\bM\.?Sc\b|Master of Science/i, short: "M.Sc" },
    { pattern: /\bB\.?Com\b|Bachelor of Commerce/i, short: "B.Com" },
    { pattern: /\bM\.?Com\b|Master of Commerce/i, short: "M.Com" },
    { pattern: /\bBCA\b|Bachelor of Computer Applications?/i, short: "Bachelor of Computer Applications" },
    { pattern: /\bMCA\b|Master of Computer Applications?/i, short: "MCA" },
    { pattern: /\bBDS\b|Bachelor of Dental Surgery/i, short: "BDS" },
  ];

  for (const { pattern, short } of patterns) {
    if (pattern.test(n)) return short;
  }

  // Fallback: if a clear abbreviation exists in caps (e.g., "LLB")
  const abbrev = n.match(/\b([A-Z]{2,5})\b/);
  if (abbrev) return abbrev[1];

  // Return full name without truncation - font size will be adjusted via CSS if needed
  return n;
}

interface Exam {
  id: string;
  examName?: string;
  logo?: string;
  course?: string;
  examDate?: string;
  examOverview?: {
    coursesOffered?: string[];
  };
}

export default function UpcomingExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const fetchExams = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "keamExams"));
      const data: any[] = querySnapshot.docs.map((doc: any) => {
        const docData = doc.data() as Exam;
        const { id: _ignoredId, ...rest } = docData || {};
        return { ...rest, id: doc.id };
      });
      setExams(data);
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

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
  }, [exams]);

  if (loading) {
    return (
      <div className="upcomingExamWrapperClass scrollable-element">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="upcomingExamWrapperDiv exam_card_new bg-white rounded-xl border border-gray-200"
          >
            <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse mx-auto"></div>
            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mx-auto"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mx-auto"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex gap-2 mt-2">
              <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Left Arrow */}
      {showLeftArrow && (
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

      <div ref={scrollContainerRef} className="upcomingExamWrapperClass scrollable-element">
        {exams.map((exam) => {
          const examName = exam.examName || "Exam Name";
          const examYear = new Date().getFullYear();
          const displayTitle = examName.includes(`- ${examYear}`) || examName.includes(`- ${examYear - 1}`)
            ? examName
            : `${examName} - ${examYear}`;
          const shortName = examName.split(' ')[0] || examName;
          const examSlug = getExamSlug({ ...exam, name: examName });
          const detailsHref = `/exam/${examSlug || exam.id}`;
          const courseText = exam.examOverview?.coursesOffered?.length
            ? exam.examOverview.coursesOffered.map((c) => getCourseShortForm(c)).join(" / ")
            : getCourseShortForm(exam.course || "N/A");
          const examDate = exam.examDate || "N/A";

          return (
            <div key={exam.id} className="upcomingExamWrapperDiv exam_card_new">
              {/* Logo and Title Container */}
              <div className="exam_card_header">
              {/* Logo */}
              <div className="exam_card_logo">
                {exam.logo ? (
                  <Image
                    src={exam.logo}
                    alt={`${shortName} Logo`}
                    width={80}
                    height={80}
                    className="object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="exam_card_logo_placeholder">
                    <span className="text-2xl font-bold text-gray-400">
                      {shortName.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

                {/* Exam Title */}
              <div className="exam_card_title">
                <h3>{displayTitle}</h3>
                <p className="exam_card_subtitle">{shortName}</p>
                </div>
              </div>

              {/* Horizontal Separator */}
              <div className="exam_card_separator"></div>

              {/* Course */}
              <div className="exam_card_course">
                <span className="exam_card_label">Course</span>
                <span className="exam_card_value">{courseText}</span>
              </div>

              {/* Exam Date */}
              <div className="exam_card_date">
                <span className="exam_card_label">Exam Date</span>
                <span className="exam_card_value">{examDate}</span>
              </div>

              {/* Buttons - Stacked Vertically */}
              <div className="exam_card_buttons">
                <button className="exam_btn_get_updates">
                  Get Updates
                </button>
                <a href={detailsHref} className="exam_btn_more_details">
                  More Details
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
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
  );
}
