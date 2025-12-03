"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterLinking from "@/components/FooterLinking";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { getArticleSlug, getNewsSlug } from "@/lib/slugify";

interface OnlineCourse {
  id: string;
  name: string;
  duration: string;
  type: "PG" | "UG" | "Diploma";
  description?: string;
  image?: string;
  [key: string]: any;
}

export default function OnlineCoursesPage() {
  const [activeTab, setActiveTab] = useState<"PG" | "UG" | "Diploma">("PG");
  const [pgPrograms, setPgPrograms] = useState<OnlineCourse[]>([]);
  const [ugPrograms, setUgPrograms] = useState<OnlineCourse[]>([]);
  const [diplomaPrograms, setDiplomaPrograms] = useState<OnlineCourse[]>([]);
  const [latestArticles, setLatestArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(true);

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

  // Fetch latest articles and news
  useEffect(() => {
    const fetchLatestContent = async () => {
      try {
        const articles: any[] = [];
        
        try {
          const articlesRef = collection(db, "articles");
          const articlesQuery = query(articlesRef, orderBy("date", "desc"), limit(5));
          const articlesSnapshot = await getDocs(articlesQuery);
          articlesSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            articles.push({
              id: doc.id,
              title: data.title || "",
              description: data.description || "",
              date: data.date,
              type: "article",
              slug: getArticleSlug({ id: doc.id, ...data }),
            });
          });
        } catch (err) {
          console.error("Error fetching articles:", err);
        }

        try {
          const newsRef = collection(db, "news");
          const newsQuery = query(newsRef, orderBy("date", "desc"), limit(5));
          const newsSnapshot = await getDocs(newsQuery);
          newsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            articles.push({
              id: doc.id,
              title: data.title || "",
              description: data.description || "",
              date: data.date,
              type: "news",
              slug: getNewsSlug({ id: doc.id, ...data }),
            });
          });
        } catch (err) {
          console.error("Error fetching news:", err);
        }

        const sortedArticles = articles
          .sort((a, b) => {
            const dateA = a.date ? (a.date.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime()) : 0;
            const dateB = b.date ? (b.date.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime()) : 0;
            return dateB - dateA;
          })
          .slice(0, 10);

        setLatestArticles(sortedArticles);
      } catch (error) {
        console.error("Error fetching latest content:", error);
      } finally {
        setArticlesLoading(false);
      }
    };

    fetchLatestContent();
  }, []);

  const testimonials = [
    {
      name: "Rajat Kumar",
      text: "Great courses, highly recommended!",
      avatar: "https://ui-avatars.com/api/?name=Rajat+Kumar&background=random",
    },
    {
      name: "Sneha Saxena",
      text: "Loved the flexibility and quality of content.",
      avatar: "https://ui-avatars.com/api/?name=Sneha+Saxena&background=random",
    },
    {
      name: "Akaash Shah",
      text: "Great!! The faculty of the digital marketing course is too good.",
      avatar: "https://ui-avatars.com/api/?name=Akaash+Shah&background=random",
    },
    {
      name: "Arnav Sharma",
      text: "I recommend the MBA Online course for the fast paced learners, who want to develop management skills...",
      avatar: "https://ui-avatars.com/api/?name=Arnav+Sharma&background=random",
    },
  ];

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
      <section id="explore-courses" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              EXPLORE OUR COURSES
            </h2>
            <h3 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-2">
              Programs for the Future
            </h3>
            <p className="text-lg text-gray-600">Choose your ideal</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab("PG")}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === "PG"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-800 border border-gray-300"
              }`}
            >
              Online PG Programmes
            </button>
            <button
              onClick={() => setActiveTab("UG")}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === "UG"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-800 border border-gray-300"
              }`}
            >
              Online UG Programmes
            </button>
            <button
              onClick={() => setActiveTab("Diploma")}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === "Diploma"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-800 border border-gray-300"
              }`}
            >
              Online Diploma Programmes
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-6 min-w-max">
                {getCurrentPrograms().map((program) => (
                  <div
                    key={program.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow min-w-[280px] max-w-[280px] flex-shrink-0"
                  >
                    {program.image && (
                      <div className="relative w-full h-48">
                        <Image
                          src={program.image}
                          alt={program.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h4 className="text-xl font-semibold text-gray-800 mb-2">{program.name}</h4>
                      <p className="text-gray-600 mb-4">
                        Duration <br />
                        <span className="font-semibold">{program.duration}</span>
                      </p>
                      <button className="w-full bg-red-600 text-white font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors">
                        Apply Now &gt;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Our Partners Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Our <span className="line-through opacity-50">Partners</span>
            </h2>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {/* Placeholder for partner logos - can be replaced with actual logos */}
            <div className="w-32 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
              Partner Logo
            </div>
            <div className="w-32 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
              Partner Logo
            </div>
            <div className="w-32 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
              Partner Logo
            </div>
            <div className="w-32 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
              Partner Logo
            </div>
            <div className="w-32 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
              Partner Logo
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{testimonial.name}</p>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-4 h-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News and Articles Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Latest News and Articles
            </h2>
            <p className="text-lg text-gray-600">Stay updated with our informative content</p>
          </div>
          {articlesLoading ? (
            <div className="flex gap-6 overflow-x-auto pb-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-lg p-4 animate-pulse min-w-[300px] flex-shrink-0"
                >
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : latestArticles.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-4">
              {latestArticles.map((item) => {
                const isNews = item.type === "news";
                const slug = isNews
                  ? item.slug || getNewsSlug(item)
                  : item.slug || getArticleSlug(item);
                const href = isNews ? `/news/${slug || item.id}` : `/articles/${slug || item.id}`;

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer block min-w-[300px] flex-shrink-0"
                  >
                    <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No articles found.</p>
            </div>
          )}
        </div>
      </section>

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
              href="/counselling"
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
