"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterLinking from "@/components/FooterLinking";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import CoursesTabs from "@/components/CoursesTabs";
import LatestArticles from "@/components/LatestArticles";
import LatestNews from "@/components/LatestNews";

interface OnlineCourse {
  id: string;
  name: string;
  duration: string;
  type: "PG" | "UG" | "Diploma";
  description?: string;
  image?: string;
  [key: string]: any;
}

interface Review {
  id: string;
  name: string;
  text: string;
  rating?: number;
  avatar?: string;
  course?: string;
  date?: any;
  status?: string;
  [key: string]: any;
}

export default function OnlineCoursesPage() {
  const [activeTab, setActiveTab] = useState<"PG" | "UG" | "Diploma">("PG");
  const [pgPrograms, setPgPrograms] = useState<OnlineCourse[]>([]);
  const [ugPrograms, setUgPrograms] = useState<OnlineCourse[]>([]);
  const [diplomaPrograms, setDiplomaPrograms] = useState<OnlineCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Default programs with images
  const defaultPGPrograms: OnlineCourse[] = [
    { id: "1", name: "Online MBA", duration: "2 Years", type: "PG", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop" },
    { id: "2", name: "Online MCA", duration: "2 Years", type: "PG", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop" },
    { id: "3", name: "Online MA", duration: "2 Years", type: "PG", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop" },
    { id: "4", name: "Online MSc", duration: "2 Years", type: "PG", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop" },
    { id: "5", name: "Online M.Com", duration: "2 Years", type: "PG", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop" },
    { id: "6", name: "Online MA(English)", duration: "2 Years", type: "PG", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop" },
    { id: "7", name: "Online MSc(Mathematics)", duration: "2 Years", type: "PG", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop" },
  ];

  const defaultUGPrograms: OnlineCourse[] = [
    { id: "8", name: "Online BA", duration: "3 Years", type: "UG", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop" },
    { id: "9", name: "Online BCA", duration: "3 Years", type: "UG", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop" },
    { id: "10", name: "Online B.Com", duration: "3 Years", type: "UG", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop" },
    { id: "11", name: "Online BBA", duration: "3 Years", type: "UG", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop" },
  ];

  const defaultDiplomaPrograms: OnlineCourse[] = [
    { id: "12", name: "Online PGDM", duration: "1 years", type: "Diploma", image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop" },
    { id: "13", name: "Online PGDM(Financial Planning)", duration: "upto 2 years", type: "Diploma", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop" },
  ];

  useEffect(() => {
    const fetchOnlineCourses = async () => {
      try {
        const onlineCoursesRef = collection(db, "onlineCourses");
        const querySnapshot = await getDocs(onlineCoursesRef);

        if (!querySnapshot.empty) {
          const courses: OnlineCourse[] = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || data.courseName || "",
              duration: data.duration || "",
              type: data.type || data.courseLevel || "PG",
              description: data.description || "",
              image: data.image || data.imageUrl || "",
              ...data,
            };
          });

          setPgPrograms(courses.filter((c) => c.type === "PG"));
          setUgPrograms(courses.filter((c) => c.type === "UG"));
          setDiplomaPrograms(courses.filter((c) => c.type === "Diploma"));
        } else {
          setPgPrograms(defaultPGPrograms);
          setUgPrograms(defaultUGPrograms);
          setDiplomaPrograms(defaultDiplomaPrograms);
        }
      } catch (error) {
        console.error("Error fetching online courses:", error);
        setPgPrograms(defaultPGPrograms);
        setUgPrograms(defaultUGPrograms);
        setDiplomaPrograms(defaultDiplomaPrograms);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineCourses();
  }, []);


  // Default reviews fallback
  const defaultReviews: Review[] = [
    {
      id: "1",
      name: "Rajat Kumar",
      text: "Great courses, highly recommended!",
      rating: 5,
      avatar: "https://ui-avatars.com/api/?name=Rajat+Kumar&background=random",
    },
    {
      id: "2",
      name: "Sneha Saxena",
      text: "Loved the flexibility and quality of content.",
      rating: 5,
      avatar: "https://ui-avatars.com/api/?name=Sneha+Saxena&background=random",
    },
    {
      id: "3",
      name: "Akaash Shah",
      text: "Great!! The faculty of the digital marketing course is too good.",
      rating: 5,
      avatar: "https://ui-avatars.com/api/?name=Akaash+Shah&background=random",
    },
    {
      id: "4",
      name: "Arnav Sharma",
      text: "I recommend the MBA Online course for the fast paced learners, who want to develop management skills...",
      rating: 5,
      avatar: "https://ui-avatars.com/api/?name=Arnav+Sharma&background=random",
    },
  ];

  // Fetch reviews from Firebase with real-time updates
  useEffect(() => {
    setReviewsLoading(true);
    let unsubscribe: (() => void) | null = null;

    const processReviews = (snapshot: any) => {
      if (!snapshot.empty) {
        const reviewsList: Review[] = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          const name = data.name || data.fullName || data.studentName || "Anonymous";
          // Handle message field from Firebase (as shown in console) and other field variations
          const text = data.message || data.text || data.review || data.comment || data.feedback || "";
          const rating = data.rating || data.stars || 5;
          
          // Generate avatar URL if not provided
          const avatar = data.avatar || data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
          
          return {
            id: doc.id,
            name,
            text,
            rating: Math.min(5, Math.max(1, rating)), // Ensure rating is between 1-5
            avatar,
            course: data.course || data.courseName || "",
            date: data.date || data.createdAt,
            status: data.status || "published",
          };
        });
        
        // Filter out reviews without text and filter by published status if available
        const validReviews = reviewsList.filter((review) => {
          const hasText = review.text && review.text.trim().length > 0;
          const isPublished = !review.status || review.status === "published";
          return hasText && isPublished;
        });
        
        if (validReviews.length > 0) {
          setReviews(validReviews.slice(0, 8)); // Limit to 8 reviews
        } else {
          setReviews(defaultReviews);
        }
      } else {
        setReviews(defaultReviews);
      }
      setReviewsLoading(false);
    };

    // Try "reviews" collection first with real-time listener
    try {
      const reviewsRef = collection(db, "reviews");
      const reviewsQuery = query(reviewsRef, orderBy("date", "desc"), limit(10));
      
      unsubscribe = onSnapshot(
        reviewsQuery,
        (snapshot) => {
          processReviews(snapshot);
        },
        (error) => {
          console.error("Error fetching reviews:", error);
          // Try "testimonials" collection as fallback
          const testimonialsRef = collection(db, "testimonials");
          const testimonialsQuery = query(testimonialsRef, orderBy("date", "desc"), limit(10));
          
          onSnapshot(
            testimonialsQuery,
            (testimonialsSnapshot) => {
              processReviews(testimonialsSnapshot);
            },
            (fallbackError) => {
              console.error("Error fetching testimonials:", fallbackError);
              setReviews(defaultReviews);
              setReviewsLoading(false);
            }
          );
        }
      );
    } catch (error) {
      console.error("Error setting up reviews listener:", error);
      setReviews(defaultReviews);
      setReviewsLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const getCurrentPrograms = () => {
    switch (activeTab) {
      case "PG":
        return pgPrograms;
      case "UG":
        return ugPrograms;
      case "Diploma":
        return diplomaPrograms;
      default:
        return pgPrograms;
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section with Background Image */}
      <section className="relative h-[500px] md:h-[600px] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&h=900&fit=crop')" }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-end pb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Unlock Your <span className="text-orange-500">Full Potential</span>
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl">
            Learn and grow with our diverse range of courses.
          </p>
          <Link
            href="#explore-courses"
            className="inline-block bg-orange-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors w-fit"
          >
            Explore Courses
          </Link>
        </div>
      </section>

      {/* Build Your Career Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              BUILD YOUR CAREER. BUILD YOUR SKILLS.
            </h2>
            <h3 className="text-2xl md:text-3xl font-semibold text-orange-500 mb-6">
              Modern skills for modern careers
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Enroll For Online Mba Program From India'S Best Institute With High Corporate Acceptance. 100% Placements. Best Online M.B.A. Degree Programs. Admissions Open. Apply Now! Admissions Open 2024 for Online programs with top Universities Ranking. NAAC A++ Grade.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">4.6/5</div>
              <div className="text-sm md:text-base text-gray-600">Programs Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">50%</div>
              <div className="text-sm md:text-base text-gray-600">Avg Hike Post program</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">2000+</div>
              <div className="text-sm md:text-base text-gray-600">Hiring Compaines</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">70%</div>
              <div className="text-sm md:text-base text-gray-600">ROI</div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Courses Section */}
      <section id="explore-courses">
        <div id="preferredCourseSection">
          <div className="container" id="Explore_course">
            <h2>Explore Courses</h2>
            <CoursesTabs />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              WHAT OUT STUDENTS SAYS
            </h2>
            <h3 className="text-2xl font-semibold text-gray-700">Testimonials</h3>
          </div>
          {reviewsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                      <Image
                        src={review.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=random`}
                        alt={review.name}
                        width={48}
                        height={48}
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{review.name}</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < (review.rating || 5) ? "text-yellow-400" : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">"{review.text}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No reviews available.</p>
            </div>
          )}
        </div>
      </section>

      {/* Latest Articles and Latest News */}
      <div className="container px-4 sm:px-0">
        <LatestArticles />
        <LatestNews />
      </div>

      {/* Got More Questions Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Got More Questions?</h2>
              <p className="text-lg text-gray-600">
                Talk to our team, our program advisor will reach out to you.
              </p>
            </div>
            <Link
              href="/contact-us"
              className="inline-block bg-orange-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <FooterLinking />
      <Footer />
    </main>
  );
}
