'use client';
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { getCollegeSlug, getExamSlug } from "@/lib/slugify";

interface FooterLink {
  name: string;
  url: string;
  target?: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

function normalize(str: string): string {
  if (!str) return "";
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

export default function FooterLinking() {
  const [footerData, setFooterData] = useState<FooterSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sections: FooterSection[] = [];
    let loadedCount = 0;
    const totalSections = 4;

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount === totalSections) {
        setFooterData(sections);
        setLoading(false);
      }
    };

    // Fetch Popular Colleges (5 from India)
    const collegesRef = collection(db, "colleges");
    const collegesUnsub = onSnapshot(
      query(collegesRef, limit(50)),
      (snapshot) => {
        const colleges: FooterLink[] = [];
        snapshot.forEach((doc) => {
          if (colleges.length >= 5) return;
          const data = doc.data();
          const country = normalize(data.country || data.countryName || (data.location && data.location.country) || "India");
          if (country === "india" || country === "indian" || country === "") {
            const name = data.name || data.collegeName || data.instituteName || data.universityName || "";
            if (name) {
              const slug = data.slug || getCollegeSlug({ id: doc.id, ...data }) || doc.id;
              colleges.push({
                name: name,
                url: `/colleges/${slug}`,
              });
            }
          }
        });
        sections[0] = { title: "Popular Colleges", links: colleges.slice(0, 5) };
        checkComplete();
      },
      (error) => {
        console.error("Error fetching colleges:", error);
        sections[0] = { title: "Popular Colleges", links: [] };
        checkComplete();
      }
    );

    // Fetch Courses (5)
    const coursesRef = collection(db, "courses");
    const coursesUnsub = onSnapshot(
      query(coursesRef, limit(50)),
      (snapshot) => {
        const courses: FooterLink[] = [];
        snapshot.forEach((doc) => {
          if (courses.length >= 5) return;
          const data = doc.data();
          const name = data.courseName || data.name || "";
          if (name) {
            courses.push({
              name: name,
              url: `course/${doc.id}`,
            });
          }
        });
        sections[1] = { title: "Courses", links: courses.slice(0, 5) };
        checkComplete();
      },
      (error) => {
        console.error("Error fetching courses:", error);
        sections[1] = { title: "Courses", links: [] };
        checkComplete();
      }
    );

    // Fetch Entrance Exams (5)
    const examsRef = collection(db, "exams");
    const keamExamsRef = collection(db, "keamExams");
    let examsLoaded = 0;
    const exams: FooterLink[] = [];

    const processExams = () => {
      examsLoaded++;
      if (examsLoaded === 2) {
        sections[2] = { title: "Entrance Exams", links: exams.slice(0, 5) };
        checkComplete();
      }
    };

    const examsUnsub = onSnapshot(
      query(examsRef, limit(50)),
      (snapshot) => {
        snapshot.forEach((doc) => {
          if (exams.length >= 5) return;
          const data = doc.data();
          const name = data.examName || data.name || data.title || "";
          if (name) {
            const slug = getExamSlug({ id: doc.id, ...data }) || doc.id;
            exams.push({
              name: name,
              url: `/exam/${slug}`,
            });
          }
        });
        processExams();
      },
      (error) => {
        console.error("Error fetching exams:", error);
        processExams();
      }
    );

    const keamExamsUnsub = onSnapshot(
      query(keamExamsRef, limit(50)),
      (snapshot) => {
        snapshot.forEach((doc) => {
          if (exams.length >= 5) return;
          const data = doc.data();
          const name = data.examName || data.name || data.title || "";
          if (name) {
            const slug = getExamSlug({ id: doc.id, ...data }) || doc.id;
            exams.push({
              name: name,
              url: `/exam/${slug}`,
            });
          }
        });
        processExams();
      },
      (error) => {
        console.error("Error fetching keamExams:", error);
        processExams();
      }
    );

    // Fetch Abroad Colleges (5 - non-India)
    const abroadCollegesRef = collection(db, "colleges");
    const abroadCollegesUnsub = onSnapshot(
      query(abroadCollegesRef, limit(100)),
      (snapshot) => {
        const abroadColleges: FooterLink[] = [];
        snapshot.forEach((doc) => {
          if (abroadColleges.length >= 5) return;
          const data = doc.data();
          const country = normalize(data.country || data.countryName || (data.location && data.location.country) || "India");
          if (country !== "india" && country !== "indian" && country !== "") {
            const name = data.name || data.collegeName || data.instituteName || data.universityName || "";
            if (name) {
              const slug = data.slug || getCollegeSlug({ id: doc.id, ...data }) || doc.id;
              abroadColleges.push({
                name: name,
                url: `/colleges/${slug}`,
              });
            }
          }
        });
        sections[3] = { title: "Abroad Colleges", links: abroadColleges.slice(0, 5) };
        checkComplete();
      },
      (error) => {
        console.error("Error fetching abroad colleges:", error);
        sections[3] = { title: "Abroad Colleges", links: [] };
        checkComplete();
      }
    );

    return () => {
      collegesUnsub();
      coursesUnsub();
      examsUnsub();
      keamExamsUnsub();
      abroadCollegesUnsub();
    };
  }, []);

  return (
    <div id="footer_linking">
      <div className="container">
        <span>Popular Searches</span>
        {loading ? (
          <div id="desktop_footer_linking">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="accordion_div">
                <div className="h-6 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
                <div className="panel">
                  {Array.from({ length: 5 }).map((_, linkIdx) => (
                    <div key={linkIdx} className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div id="desktop_footer_linking">
            {footerData.map((section, idx) => (
              <div key={idx} className="accordion_div">
                <p className="accordion">{section.title}</p>
                <div className="panel">
                  {section.links.length > 0 ? (
                    section.links.map((link, linkIdx) => (
                      <a key={linkIdx} href={link.url} target={link.target || "_self"}>
                        {link.name}
                      </a>
                    ))
                  ) : (
                    <span style={{ color: "#999", fontSize: "14px" }}>No data available</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
