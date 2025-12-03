"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { getCollegeSlug, getExamSlug, getScholarshipSlug, getInternshipSlug, getJobSlug, getArticleSlug, getNewsSlug } from "@/lib/slugify";

interface HomeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface College {
  id: string;
  name: string;
  city?: string;
  state?: string;
  coursesOffered?: string | string[];
  [key: string]: any;
}

interface Course {
  id: string;
  courseName: string;
  shortForm: string;
  description?: string;
  [key: string]: any;
}

interface Exam {
  id: string;
  examName?: string;
  name?: string;
  course?: string;
  description?: string;
  [key: string]: any;
}

interface Article {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  slug?: string;
  [key: string]: any;
}

interface News {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  slug?: string;
  [key: string]: any;
}

interface Scholarship {
  id: string;
  title?: string;
  name?: string;
  organization?: string;
  description?: string;
  [key: string]: any;
}

interface Job {
  id: string;
  title?: string;
  name?: string;
  position?: string;
  company?: string;
  description?: string;
  location?: string;
  [key: string]: any;
}

interface Internship {
  id: string;
  title?: string;
  name?: string;
  company?: string;
  description?: string;
  location?: string;
  [key: string]: any;
}

// Helper function to get short form of course name (same as in page.tsx)
function getShortForm(courseName: string): string {
  if (!courseName) return "";
  
  const name = courseName.trim();
  
  // Common short form patterns - matching the patterns from page.tsx
  const shortFormPatterns = [
    { pattern: /\b(B\.?Tech|B\.?E\.?|Bachelor of Technology|Bachelor of Engineering)\b/i, short: "B.Tech" },
    { pattern: /\b(B\.?Sc|Bachelor of Science)\b/i, short: "B.Sc" },
    { pattern: /\b(B\.?Com|Bachelor of Commerce)\b/i, short: "B.Com" },
    { pattern: /\b(BBA|Bachelor of Business Administration)\b/i, short: "BBA" },
    { pattern: /\b(BCA|Bachelor of Computer Applications)\b/i, short: "BCA" },
    { pattern: /\b(BA|Bachelor of Arts)\b/i, short: "BA" },
    { pattern: /\b(MBA|Master of Business Administration)\b/i, short: "MBA" },
    { pattern: /\b(LLB|Bachelor of Laws)\b/i, short: "LLB" },
    { pattern: /\b(MCA|Master of Computer Applications)\b/i, short: "MCA" },
    { pattern: /\b(B\.?Pharm|Bachelor of Pharmacy)\b/i, short: "B.Pharm" },
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
  
  // Fallback: return first 10 characters if name is too long
  if (name.length > 15) {
    return name.substring(0, 15) + "...";
  }
  
  return name;
}

function HomeSearchModal({ isOpen, onClose }: HomeSearchModalProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Array<{ label: string; url: string; id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [colleges, setColleges] = useState<College[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Desired course list - normalize short forms for matching
  const desiredCourses = [
    { label: "B.tech", url: "/course/engineering", shortForm: "B.Tech" },
    { label: "B.Sc", url: "/course/bsc-colleges-india.html", shortForm: "B.Sc" },
    { label: "B.com", url: "/course/commerce-colleges-india.html", shortForm: "B.Com" },
    { label: "BBA", url: "/course/bba", shortForm: "BBA" },
    { label: "BCA", url: "/course/bca-colleges-india.html", shortForm: "BCA" },
    { label: "BA", url: "/course/arts-colleges-india.html", shortForm: "BA" },
    { label: "MBA", url: "/course/mba", shortForm: "MBA" },
    { label: "LLB", url: "/course/law-colleges-india.html", shortForm: "LLB" },
    { label: "MCA", url: "/course/mca-colleges-india.html", shortForm: "MCA" },
    { label: "B.Pharm", url: "/course/bpharm-colleges-india.html", shortForm: "B.Pharm" },
  ];

  // Normalize text for searching (remove accents, lowercase, etc.)
  const normalizeText = (text: string): string => {
    if (!text) return "";
    return String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Extract all searchable text from a college
  const getCollegeSearchText = (college: College): string => {
    const parts: string[] = [];
    
    // College name
    if (college.name) parts.push(college.name);
    if (college.collegeName) parts.push(college.collegeName);
    if (college.instituteName) parts.push(college.instituteName);
    
    // Location
    if (college.city) parts.push(college.city);
    if (college.cityName) parts.push(college.cityName);
    if (college.state) parts.push(college.state);
    if (college.stateName) parts.push(college.stateName);
    if (college.country) parts.push(college.country);
    
    // Courses offered
    if (college.coursesOffered) {
      if (Array.isArray(college.coursesOffered)) {
        parts.push(...college.coursesOffered);
      } else {
        parts.push(String(college.coursesOffered));
      }
    }
    if (college.courses) {
      if (Array.isArray(college.courses)) {
        parts.push(...college.courses);
      } else {
        parts.push(String(college.courses));
      }
    }
    
    // Location object
    if (college.location) {
      if (college.location.city) parts.push(college.location.city);
      if (college.location.state) parts.push(college.location.state);
      if (college.location.country) parts.push(college.location.country);
    }
    
    return parts.join(" ");
  };

  // Extract all searchable text from a course
  const getCourseSearchText = (course: Course): string => {
    const parts: string[] = [];
    
    if (course.courseName) parts.push(course.courseName);
    if (course.name) parts.push(course.name);
    if (course.shortForm) parts.push(course.shortForm);
    if (course.description) parts.push(course.description);
    
    return parts.join(" ");
  };

  // Extract all searchable text from an exam
  const getExamSearchText = (exam: Exam): string => {
    const parts: string[] = [];
    
    if (exam.examName) parts.push(exam.examName);
    if (exam.name) parts.push(exam.name);
    if (exam.course) parts.push(exam.course);
    if (exam.description) parts.push(exam.description);
    
    return parts.join(" ");
  };

  // Extract all searchable text from an article
  const getArticleSearchText = (article: Article): string => {
    const parts: string[] = [];
    
    if (article.title) parts.push(article.title);
    if (article.name) parts.push(article.name);
    if (article.description) parts.push(article.description);
    if (article.category) parts.push(article.category);
    
    return parts.join(" ");
  };

  // Extract all searchable text from news
  const getNewsSearchText = (newsItem: News): string => {
    const parts: string[] = [];
    
    if (newsItem.title) parts.push(newsItem.title);
    if (newsItem.name) parts.push(newsItem.name);
    if (newsItem.description) parts.push(newsItem.description);
    if (newsItem.category) parts.push(newsItem.category);
    
    return parts.join(" ");
  };

  // Extract all searchable text from a scholarship
  const getScholarshipSearchText = (scholarship: Scholarship): string => {
    const parts: string[] = [];
    
    if (scholarship.title) parts.push(scholarship.title);
    if (scholarship.name) parts.push(scholarship.name);
    if (scholarship.organization) parts.push(scholarship.organization);
    if (scholarship.description) parts.push(scholarship.description);
    
    return parts.join(" ");
  };

  // Extract all searchable text from a job
  const getJobSearchText = (job: Job): string => {
    const parts: string[] = [];
    
    if (job.title) parts.push(job.title);
    if (job.name) parts.push(job.name);
    if (job.position) parts.push(job.position);
    if (job.company) parts.push(job.company);
    if (job.location) parts.push(job.location);
    if (job.description) parts.push(job.description);
    
    return parts.join(" ");
  };

  // Extract all searchable text from an internship
  const getInternshipSearchText = (internship: Internship): string => {
    const parts: string[] = [];
    
    if (internship.title) parts.push(internship.title);
    if (internship.name) parts.push(internship.name);
    if (internship.company) parts.push(internship.company);
    if (internship.location) parts.push(internship.location);
    if (internship.description) parts.push(internship.description);
    
    return parts.join(" ");
  };

  // Multi-word search function - matches every word/letter in the query
  // Supports both full word matching and partial letter matching
  // Works for every letter typed and every word in the query
  const matchesSearch = (searchText: string, query: string): boolean => {
    if (!query.trim()) return true;
    
    const normalizedSearchText = normalizeText(searchText);
    const normalizedQuery = normalizeText(query);
    
    // Split query into words (handles multi-word search)
    const queryWords = normalizedQuery
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    // Every word in the query must be found in the search text
    // This supports partial matching - e.g., "tech" matches "technology", "btech" matches "b.tech"
    // Works for every letter as user types
    return queryWords.every(word => normalizedSearchText.includes(word));
  };

  // Fetch all content for search (colleges, courses, exams, articles, news, scholarships, jobs, internships)
  useEffect(() => {
    const fetchSearchData = async () => {
      if (!isOpen) return;
      
      try {
        setDataLoading(true);
        
        // Fetch colleges
        try {
          const collegesQ = query(collection(db, "colleges"), limit(500));
          const collegesSnapshot = await getDocs(collegesQ);
          const collegesData: College[] = [];
          
          collegesSnapshot.docs.forEach((doc) => {
            collegesData.push({
              id: doc.id,
              ...doc.data(),
            } as College);
          });
          
          setColleges(collegesData);
        } catch (error) {
          console.error("Error fetching colleges:", error);
        }
        
        // Fetch courses
        try {
          const coursesQ = query(
            collection(db, "courses"),
            orderBy("courseName"),
            limit(200)
          );
          const coursesSnapshot = await getDocs(coursesQ);
          const coursesData: Course[] = [];
          
          coursesSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const courseName = data.courseName || data.name || "";
            
            if (!courseName || !courseName.trim()) return;
            
            coursesData.push({
              id: doc.id,
              courseName: courseName,
              shortForm: getShortForm(courseName),
              description: data.description || "",
              ...data,
            } as Course);
          });
          
          setCourses(coursesData);
        } catch (error) {
          console.error("Error fetching courses:", error);
        }

        // Fetch exams from both collections
        try {
          const examsData: Exam[] = [];
          
          // Fetch from "exams" collection
          try {
            const examsQ = query(collection(db, "exams"), limit(200));
            const examsSnapshot = await getDocs(examsQ);
            
            examsSnapshot.docs.forEach((doc) => {
              const data = doc.data();
              examsData.push({
                id: doc.id,
                examName: data.title || data.examName || data.name,
                name: data.title || data.examName || data.name,
                course: data.course,
                description: data.description,
                ...data,
              } as Exam);
            });
          } catch (error) {
            console.error("Error fetching exams from 'exams' collection:", error);
          }
          
          // Fetch from "keamExams" collection
          try {
            const keamExamsQ = query(collection(db, "keamExams"), limit(200));
            const keamExamsSnapshot = await getDocs(keamExamsQ);
            
            keamExamsSnapshot.docs.forEach((doc) => {
              const data = doc.data();
              examsData.push({
                id: doc.id,
                examName: data.examName || data.title || data.name,
                name: data.examName || data.title || data.name,
                course: data.course || data.examOverview?.coursesOffered?.[0],
                description: data.description,
                ...data,
              } as Exam);
            });
          } catch (error) {
            console.error("Error fetching exams from 'keamExams' collection:", error);
          }
          
          setExams(examsData);
        } catch (error) {
          console.error("Error fetching exams:", error);
        }

        // Fetch articles
        try {
          const articlesQ = query(collection(db, "articles"), limit(200));
          const articlesSnapshot = await getDocs(articlesQ);
          const articlesData: Article[] = [];
          
          articlesSnapshot.docs.forEach((doc) => {
            articlesData.push({
              id: doc.id,
              ...doc.data(),
            } as Article);
          });
          
          setArticles(articlesData);
        } catch (error) {
          console.error("Error fetching articles:", error);
        }

        // Fetch news
        try {
          const newsQ = query(collection(db, "news"), limit(200));
          const newsSnapshot = await getDocs(newsQ);
          const newsData: News[] = [];
          
          newsSnapshot.docs.forEach((doc) => {
            newsData.push({
              id: doc.id,
              ...doc.data(),
            } as News);
          });
          
          setNews(newsData);
        } catch (error) {
          console.error("Error fetching news:", error);
        }

        // Fetch scholarships
        try {
          const scholarshipsQ = query(collection(db, "scholarships"), limit(200));
          const scholarshipsSnapshot = await getDocs(scholarshipsQ);
          const scholarshipsData: Scholarship[] = [];
          
          scholarshipsSnapshot.docs.forEach((doc) => {
            scholarshipsData.push({
              id: doc.id,
              ...doc.data(),
            } as Scholarship);
          });
          
          setScholarships(scholarshipsData);
        } catch (error) {
          console.error("Error fetching scholarships:", error);
        }

        // Fetch jobs
        try {
          const jobsQ = query(collection(db, "jobs"), limit(200));
          const jobsSnapshot = await getDocs(jobsQ);
          const jobsData: Job[] = [];
          
          jobsSnapshot.docs.forEach((doc) => {
            jobsData.push({
              id: doc.id,
              ...doc.data(),
            } as Job);
          });
          
          setJobs(jobsData);
        } catch (error) {
          console.error("Error fetching jobs:", error);
        }

        // Fetch internships
        try {
          const internshipsQ = query(collection(db, "internships"), limit(200));
          const internshipsSnapshot = await getDocs(internshipsQ);
          const internshipsData: Internship[] = [];
          
          internshipsSnapshot.docs.forEach((doc) => {
            internshipsData.push({
              id: doc.id,
              ...doc.data(),
            } as Internship);
          });
          
          setInternships(internshipsData);
        } catch (error) {
          console.error("Error fetching internships:", error);
        }
      } catch (error) {
        console.error("Error fetching search data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchSearchData();
  }, [isOpen]);

  // Fetch courses from Firebase and filter to only show courses that exist
  useEffect(() => {
    const fetchCourses = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        const coursesQ = query(
          collection(db, "courses"),
          orderBy("courseName"),
          limit(100)
        );
        
        const snapshot = await getDocs(coursesQ);
        const coursesMap = new Map<string, string>(); // shortForm -> courseId
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const courseName = data.courseName || data.name || "";
          
          if (!courseName || !courseName.trim()) return;
          
          const shortForm = getShortForm(courseName);
          if (shortForm && !coursesMap.has(shortForm)) {
            coursesMap.set(shortForm, doc.id);
          }
        });

        // Filter desired courses to only include those that exist in Firebase
        // Use case-insensitive matching and map to include id
        const filteredCourses = desiredCourses
          .filter((desiredCourse) => {
            const desiredShortForm = desiredCourse.shortForm.toLowerCase();
            for (const [shortForm] of coursesMap.entries()) {
              if (shortForm.toLowerCase() === desiredShortForm) {
                return true;
              }
            }
            return false;
          })
          .map((desiredCourse) => {
            const desiredShortForm = desiredCourse.shortForm.toLowerCase();
            let courseId = "";
            for (const [shortForm, id] of coursesMap.entries()) {
              if (shortForm.toLowerCase() === desiredShortForm) {
                courseId = id;
                break;
              }
            }
            return {
              label: desiredCourse.label,
              url: desiredCourse.url,
              id: courseId,
            };
          });

        setAvailableCourses(filteredCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
        // On error, show all desired courses as fallback
        setAvailableCourses(desiredCourses.map((course) => ({
          label: course.label,
          url: course.url,
          id: "", // Empty id as fallback
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [isOpen]);

  // Filter all content types based on search query
  const filteredColleges = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return colleges.filter((college) => {
      const searchText = getCollegeSearchText(college);
      return matchesSearch(searchText, searchQuery);
    }).slice(0, 10); // Limit to 10 results
  }, [colleges, searchQuery]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return courses.filter((course) => {
      const searchText = getCourseSearchText(course);
      return matchesSearch(searchText, searchQuery);
    }).slice(0, 10); // Limit to 10 results
  }, [courses, searchQuery]);

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return exams.filter((exam) => {
      const searchText = getExamSearchText(exam);
      return matchesSearch(searchText, searchQuery);
    }).slice(0, 10);
  }, [exams, searchQuery]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return articles.filter((article) => {
      const searchText = getArticleSearchText(article);
      return matchesSearch(searchText, searchQuery);
    }).slice(0, 10);
  }, [articles, searchQuery]);

  const filteredNews = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return news.filter((newsItem) => {
      const searchText = getNewsSearchText(newsItem);
      return matchesSearch(searchText, searchQuery);
    }).slice(0, 10);
  }, [news, searchQuery]);

  const filteredScholarships = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return scholarships.filter((scholarship) => {
      const searchText = getScholarshipSearchText(scholarship);
      return matchesSearch(searchText, searchQuery);
    }).slice(0, 10);
  }, [scholarships, searchQuery]);

  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return jobs.filter((job) => {
      const searchText = getJobSearchText(job);
      return matchesSearch(searchText, searchQuery);
    }).slice(0, 10);
  }, [jobs, searchQuery]);

  const filteredInternships = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return internships.filter((internship) => {
      const searchText = getInternshipSearchText(internship);
      return matchesSearch(searchText, searchQuery);
    }).slice(0, 10);
  }, [internships, searchQuery]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        id="homeSearchBackdrop"
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      ></div>

      {/* Search Modal */}
      <div
        id="homeSearchModal"
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
            <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-3 bg-white shadow-sm">
              <span className="text-gray-500 flex-shrink-0" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search College and University"
                className="flex-1 border-none outline-none text-base font-medium text-gray-900 bg-transparent placeholder:text-gray-400"
                id="homeSearchInput"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 font-semibold text-xl leading-none px-2 py-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Close search"
              >
                ×
              </button>
            </div>
          </div>

          {/* Search Content */}
          <div className="p-6">
            {searchQuery.trim() ? (
              // Show search results
              <div className="space-y-6">
                {dataLoading ? (
                  <div className="space-y-3">
                    <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                ) : (
                  <>
                    {/* Colleges Results */}
                    {filteredColleges.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Colleges ({filteredColleges.length})
                        </h3>
                        <div className="space-y-2">
                          {filteredColleges.map((college) => {
                            const collegeName = college.name || college.collegeName || college.instituteName || "Unnamed College";
                            const city = college.city || college.cityName || college.location?.city || "";
                            const state = college.state || college.stateName || college.location?.state || "";
                            const location = [city, state].filter(Boolean).join(", ");
                            const collegeSlug = getCollegeSlug(college);
                            
                            return (
                              <Link
                                key={college.id}
                                href={`/colleges/${collegeSlug || college.id}`}
                                className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                                onClick={onClose}
                              >
                                <div className="font-semibold text-gray-900">{collegeName}</div>
                                {location && (
                                  <div className="text-sm text-gray-600 mt-1">{location}</div>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Courses Results */}
                    {filteredCourses.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Courses ({filteredCourses.length})
                        </h3>
                        <div className="space-y-2">
                          {filteredCourses.map((course) => (
                            <Link
                              key={course.id}
                              href={`/course/${course.id}`}
                              className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                              onClick={onClose}
                            >
                              <div className="font-semibold text-gray-900">{course.courseName}</div>
                              {course.shortForm && (
                                <div className="text-sm text-gray-600 mt-1">{course.shortForm}</div>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exams Results */}
                    {filteredExams.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Exams ({filteredExams.length})
                        </h3>
                        <div className="space-y-2">
                          {filteredExams.map((exam) => {
                            const examSlug = getExamSlug(exam);
                            return (
                            <Link
                              key={exam.id}
                                href={`/exam/${examSlug || exam.id}`}
                              className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                              onClick={onClose}
                            >
                              <div className="font-semibold text-gray-900">{exam.examName || exam.name || "Unnamed Exam"}</div>
                              {exam.course && (
                                <div className="text-sm text-gray-600 mt-1">{exam.course}</div>
                              )}
                            </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Articles Results */}
                    {filteredArticles.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Articles ({filteredArticles.length})
                        </h3>
                        <div className="space-y-2">
                          {filteredArticles.map((article) => {
                            const articleSlug = getArticleSlug(article);
                            return (
                            <Link
                              key={article.id}
                                href={`/articles/${articleSlug || article.id}`}
                              className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                              onClick={onClose}
                            >
                              <div className="font-semibold text-gray-900">{article.title || article.name || "Untitled Article"}</div>
                              {article.category && (
                                <div className="text-sm text-gray-600 mt-1">{article.category}</div>
                              )}
                            </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* News Results */}
                    {filteredNews.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          News ({filteredNews.length})
                        </h3>
                        <div className="space-y-2">
                          {filteredNews.map((newsItem) => {
                            const newsSlug = getNewsSlug(newsItem);
                            return (
                            <Link
                              key={newsItem.id}
                                href={`/news/${newsSlug || newsItem.id}`}
                              className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                              onClick={onClose}
                            >
                              <div className="font-semibold text-gray-900">{newsItem.title || newsItem.name || "Untitled News"}</div>
                              {newsItem.category && (
                                <div className="text-sm text-gray-600 mt-1">{newsItem.category}</div>
                              )}
                            </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Scholarships Results */}
                    {filteredScholarships.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Scholarships ({filteredScholarships.length})
                        </h3>
                        <div className="space-y-2">
                    {filteredScholarships.map((scholarship) => {
                      const scholarshipSlug = getScholarshipSlug(scholarship);
                      return (
                            <Link
                              key={scholarship.id}
                          href={`/scholarship/${scholarshipSlug || scholarship.id}`}
                              className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                              onClick={onClose}
                            >
                              <div className="font-semibold text-gray-900">{scholarship.title || scholarship.name || "Unnamed Scholarship"}</div>
                              {scholarship.organization && (
                                <div className="text-sm text-gray-600 mt-1">{scholarship.organization}</div>
                              )}
                            </Link>
                      );
                    })}
                        </div>
                      </div>
                    )}

                    {/* Jobs Results */}
                    {filteredJobs.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Jobs ({filteredJobs.length})
                        </h3>
                        <div className="space-y-2">
                          {filteredJobs.map((job) => {
                            const jobSlug = getJobSlug(job);
                            return (
                            <Link
                              key={job.id}
                                href={`/job/${jobSlug || job.id}`}
                              className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                              onClick={onClose}
                            >
                              <div className="font-semibold text-gray-900">{job.title || job.name || job.position || "Unnamed Job"}</div>
                              {(job.company || job.location) && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {[job.company, job.location].filter(Boolean).join(" • ")}
                                </div>
                              )}
                            </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Internships Results */}
                    {filteredInternships.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Internships ({filteredInternships.length})
                        </h3>
                        <div className="space-y-2">
                          {filteredInternships.map((internship) => {
                            const internshipSlug = getInternshipSlug(internship);
                            return (
                            <Link
                              key={internship.id}
                                href={`/internship/${internshipSlug || internship.id}`}
                              className="block p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                              onClick={onClose}
                            >
                              <div className="font-semibold text-gray-900">{internship.title || internship.name || "Unnamed Internship"}</div>
                              {(internship.company || internship.location) && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {[internship.company, internship.location].filter(Boolean).join(" • ")}
                                </div>
                              )}
                            </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* No Results */}
                    {filteredColleges.length === 0 && 
                     filteredCourses.length === 0 && 
                     filteredExams.length === 0 && 
                     filteredArticles.length === 0 && 
                     filteredNews.length === 0 && 
                     filteredScholarships.length === 0 && 
                     filteredJobs.length === 0 && 
                     filteredInternships.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-lg">No results found for "{searchQuery}"</p>
                        <p className="text-gray-400 text-sm mt-2">Try searching with different keywords</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              // Show popular courses when no search query
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Colleges by Courses:</h3>
              {loading ? (
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="px-4 py-2 bg-gray-200 rounded-lg animate-pulse h-9 w-20"
                    ></div>
                  ))}
                </div>
              ) : availableCourses.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {availableCourses.map((course, idx) => (
                    <Link
                      key={course.id || idx}
                      href={course.url}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
                      onClick={onClose}
                    >
                      {course.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No courses available.</p>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default HomeSearchModal;

