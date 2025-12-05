"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterLinking from "@/components/FooterLinking";
import Link from "next/link";
import { getNewsSlug } from "@/lib/slugify";
import Image from "next/image";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import StudyAbroadModal from "@/components/StudyAbroadModal";

export default function StudyAbroadPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    formType: string;
    title: string;
    description: string;
  }>({
    formType: "general",
    title: "Get in Touch",
    description: "Fill out the form below and our team will get back to you.",
  });

  const openModal = (formType: string, title: string, description: string) => {
    setModalConfig({ formType, title, description });
    setModalOpen(true);
  };

  // Default news for study abroad
  const defaultNews = [
    {
      id: "1",
      title: "Ace the Duolingo Test",
      readTime: "22 min Read",
      bgColor: "bg-blue-100",
      bgPattern: "cubes",
    },
    {
      id: "2",
      title: "Navigating the IELTS",
      readTime: "6 min Read",
      bgColor: "bg-green-100",
      bgPattern: "person",
    },
    {
      id: "3",
      title: "IELTS Costs Uncovered",
      readTime: "5 min Read",
      bgColor: "bg-pink-100",
      bgPattern: "city",
    },
    {
      id: "4",
      title: "Conquering the SAT",
      readTime: "12 min Read",
      bgColor: "bg-green-100",
      bgPattern: "cubes",
    },
    {
      id: "5",
      title: "PTE Fee Guide",
      readTime: "4 min Read",
      bgColor: "bg-pink-100",
      bgPattern: "person",
    },
    {
      id: "6",
      title: "IELTS Scoring Demystified",
      readTime: "5 min Read",
      bgColor: "bg-green-100",
      bgPattern: "city",
    },
    {
      id: "7",
      title: "GMAT Syllabus Decoded",
      readTime: "11 min Read",
      bgColor: "bg-green-100",
      bgPattern: "cubes",
    },
    {
      id: "8",
      title: "Understanding PTE Results",
      readTime: "5 min Read",
      bgColor: "bg-green-100",
      bgPattern: "person",
    },
    {
      id: "9",
      title: "TOEFL Fee Insights",
      readTime: "5 min Read",
      bgColor: "bg-pink-100",
      bgPattern: "city",
    },
    {
      id: "10",
      title: "GMAT Fees Explained",
      readTime: "5 min Read",
      bgColor: "bg-green-100",
      bgPattern: "cubes",
    },
  ];

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Try to fetch study abroad related news from Firebase
        const newsRef = collection(db, "news");
        // Fetch all news and filter client-side for study abroad related content
        const newsQuery = query(newsRef, orderBy("date", "desc"), limit(20));
        
        try {
          const newsSnapshot = await getDocs(newsQuery);
          if (!newsSnapshot.empty) {
            const studyAbroadKeywords = ["study abroad", "ielts", "toefl", "gmat", "pte", "duolingo", "sat", "gre", "exam", "visa", "scholarship"];
            const patterns = ["cubes", "person", "city"];
            const colors = ["bg-blue-100", "bg-green-100", "bg-pink-100"];
            let newsIndex = 0;
            
            const newsList = newsSnapshot.docs
              .map((doc) => {
                const data = doc.data();
                const title = (data.title || "").toLowerCase();
                const category = (data.category || "").toLowerCase();
                const description = (data.description || "").toLowerCase();
                
                // Check if news is related to study abroad
                const isRelated = studyAbroadKeywords.some(
                  (keyword) => title.includes(keyword) || category.includes(keyword) || description.includes(keyword)
                );
                
                if (isRelated) {
                  const index = newsIndex % 3;
                  newsIndex++;
                  return {
                    id: doc.id,
                    title: data.title || "",
                    readTime: data.readTime || "5 min Read",
                    description: data.description || "",
                    bgColor: colors[index],
                    bgPattern: patterns[index],
                  };
                }
                return null;
              })
              .filter((newsItem) => newsItem !== null)
              .slice(0, 10);
            
            if (newsList.length > 0) {
              setNews(newsList);
            } else {
              setNews(defaultNews);
            }
          } else {
            setNews(defaultNews);
          }
        } catch (err) {
          console.error("Error fetching news:", err);
          // If query fails, use default news
          setNews(defaultNews);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
        setNews(defaultNews);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Study Abroad
          </h1>
          <p className="text-xl md:text-2xl text-gray-800 mb-2">
            by seeking guidance
          </p>
          <p className="text-lg md:text-xl text-orange-500 mb-8">
            from experts
          </p>
          <button
            onClick={() => openModal("find_university", "Find the Right University", "Fill out the form below and our experts will help you find the perfect university for your studies abroad.")}
            className="inline-flex items-center gap-2 bg-orange-500 text-white font-semibold px-8 py-4 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Click here to find the right university
            <span className="text-xl">&gt;</span>
          </button>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">4k</div>
              <div className="text-gray-600">universities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">3k</div>
              <div className="text-gray-600">mentors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">40</div>
              <div className="text-gray-600">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">90K +</div>
              <div className="text-gray-600">Sucess Stories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Cards Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Find Your Perfect University After 12th */}
            <div className="bg-pink-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                Find Your Perfect University After 12th!
              </h2>
              <p className="text-gray-700 mb-6 text-base">
                Explore top universities worldwide with our Wishlist tool. Tailored for 12th graders, it simplifies finding your ideal undergraduate program. Dream big and discover more!
              </p>
              <button
                onClick={() => openModal("wishlist_ug", "Explore Universities After 12th", "Fill out the form below and our experts will help you explore top universities worldwide for your undergraduate program.")}
                className="inline-flex items-center gap-2 text-purple-700 font-semibold hover:text-purple-800 transition-colors"
              >
                Explore Universities Now &gt;
              </button>
            </div>

            {/* Your Postgrad Journey Starts Here */}
            <div className="bg-blue-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                Your Postgrad Journey Starts Here!
              </h2>
              <p className="text-gray-700 mb-6 text-base">
                Graduates, elevate your education globally! Our Wishlist tool guides you to prestigious master's and Ph.D. programs. Start shaping your advanced academic path today!
              </p>
              <button
                onClick={() => openModal("wishlist_pg", "Start Your Postgrad Journey", "Fill out the form below and our experts will guide you to prestigious master's and Ph.D. programs worldwide.")}
                className="inline-flex items-center gap-2 text-purple-700 font-semibold hover:text-purple-800 transition-colors"
              >
                Start Your Journey - for graduate &gt;
              </button>
            </div>
          </div>

          {/* 2x2 Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Wishlist Universities */}
            <div className="bg-pink-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Wishlist Universities
              </h2>
              <p className="text-gray-700 mb-6 text-base">
                Our latest course finder will help you find the right university
              </p>
              <button
                onClick={() => openModal("wishlist", "Wishlist Universities", "Fill out the form below and our course finder will help you find the right university for your studies abroad.")}
                className="inline-flex items-center gap-2 bg-pink-100 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-pink-200 transition-colors"
              >
                Find the right university &gt;
              </button>
            </div>

            {/* Exams you can take */}
            <div className="bg-blue-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Exams you can take
              </h2>
              <p className="text-gray-700 mb-6 text-base">
                IELTS, TOEFL, Duolingo English Test, GMAT, GRE
              </p>
              <button
                onClick={() => openModal("exams", "Know More About Exams", "Fill out the form below to get detailed information about IELTS, TOEFL, Duolingo English Test, GMAT, GRE and other exams.")}
                className="inline-flex items-center gap-2 bg-blue-100 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Know more &gt;
              </button>
            </div>

            {/* Apply for Education Loan */}
            <div className="bg-green-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Apply for Education Loan
              </h2>
              <p className="text-gray-700 mb-6 text-base">
                Take financial assistance to make your dream of studying abroad come true.
              </p>
              <button
                onClick={() => openModal("education_loan", "Apply for Education Loan", "Fill out the form below and our loan experts will help you get financial assistance to make your dream of studying abroad come true.")}
                className="inline-flex items-center gap-2 bg-green-100 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-green-200 transition-colors"
              >
                Talk to loan expert &gt;
              </button>
            </div>

            {/* Check Scholarships */}
            <div className="bg-red-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Check Scholarships
              </h2>
              <p className="text-gray-700 mb-6 text-base">
                Go for the best Scholarships available for you
              </p>
              <button
                onClick={() => openModal("scholarship", "Find Scholarships", "Fill out the form below and our experts will help you find the best scholarships available for your studies abroad.")}
                className="inline-flex items-center gap-2 bg-red-100 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-red-200 transition-colors"
              >
                Find Scholarship &gt;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Visa Application Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-blue-100 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Visa Application
            </h2>
            <p className="text-base text-gray-700 mb-6">
              Get in touch with our experts for Visa related queries
            </p>
            <button
              onClick={() => openModal("visa", "Apply for Visa", "Fill out the form below and our visa experts will help you with all your visa-related queries and applications.")}
              className="inline-flex items-center gap-2 bg-purple-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-purple-600 transition-colors shadow-md"
            >
              Apply for Visa
              <span className="text-xl">&gt;</span>
            </button>
          </div>
        </div>
      </section>

      {/* Course Finder Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-orange-500 mb-6">
                  Course Finder
                </h2>
                <p className="text-base text-gray-700 mb-8 leading-relaxed">
                  Check if you are<br />
                  eligible for<br />
                  admission to<br />
                  the shortlisted<br />
                  university
                </p>
                <button
                  onClick={() => openModal("eligibility", "Check Eligibility", "Fill out the form below and our experts will check if you are eligible for admission to your shortlisted university.")}
                  className="inline-flex items-center gap-2 bg-orange-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Check Eligibility
                  <span className="text-xl">&gt;</span>
                </button>
              </div>
              <div className="bg-purple-50 rounded-xl p-8 h-full flex items-center justify-center">
                {/* Illustration placeholder - you can add an actual illustration here */}
                <div className="text-center text-gray-400">
                  <svg className="w-64 h-64 mx-auto" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Books */}
                    <rect x="60" y="80" width="30" height="40" fill="#10b981" rx="4"/>
                    <rect x="95" y="70" width="30" height="50" fill="#f59e0b" rx="4"/>
                    <rect x="130" y="75" width="30" height="45" fill="#3b82f6" rx="4"/>
                    {/* Graduation Cap */}
                    <path d="M85 60 L115 60 L100 50 Z" fill="#1e40af"/>
                    <rect x="85" y="60" width="30" height="8" fill="#1e40af"/>
                    {/* Calendar */}
                    <rect x="140" y="50" width="40" height="35" fill="#ef4444" rx="4"/>
                    <line x1="150" y1="60" x2="170" y2="60" stroke="white" strokeWidth="2"/>
                    {/* Students */}
                    <circle cx="50" cy="140" r="15" fill="#fbbf24"/>
                    <rect x="40" y="155" width="20" height="25" fill="#ec4899" rx="10"/>
                    <circle cx="160" cy="150" r="12" fill="#60a5fa"/>
                    <rect x="152" y="162" width="16" height="20" fill="#1e40af" rx="8"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12">News</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl p-6 h-64 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((newsItem) => {
                const newsSlug = getNewsSlug(newsItem);
                return (
                  <Link
                    key={newsItem.id}
                    href={`/news/${newsSlug || newsItem.id}`}
                    className={`${newsItem.bgColor} rounded-2xl p-6 hover:shadow-lg transition-all relative overflow-hidden group cursor-pointer`}
                  >
                  {/* Read Time */}
                  <div className="absolute top-4 left-4 text-xs font-medium text-gray-700 bg-white/80 px-2 py-1 rounded">
                    {newsItem.readTime}
                  </div>
                  
                  {/* Arrow Icon */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-gray-600">&gt;</span>
                  </div>

                  {/* Title */}
                  <div className="mt-12">
                    <h3 className="text-base md:text-lg font-bold text-purple-900 mb-4">
                      {newsItem.title}
                    </h3>
                  </div>

                  {/* Background Pattern */}
                  <div className="absolute bottom-0 right-0 w-32 h-32 opacity-20">
                    {newsItem.bgPattern === "cubes" && (
                      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="10" y="10" width="20" height="20" fill="#7c3aed" rx="2"/>
                        <rect x="35" y="15" width="20" height="20" fill="#a855f7" rx="2"/>
                        <rect x="60" y="20" width="20" height="20" fill="#c084fc" rx="2"/>
                        <rect x="20" y="40" width="20" height="20" fill="#7c3aed" rx="2"/>
                        <rect x="45" y="45" width="20" height="20" fill="#a855f7" rx="2"/>
                        <rect x="70" y="50" width="20" height="20" fill="#c084fc" rx="2"/>
                      </svg>
                    )}
                    {newsItem.bgPattern === "person" && (
                      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="30" r="15" fill="#059669"/>
                        <path d="M30 70 Q50 50 70 70" stroke="#059669" strokeWidth="4" fill="none"/>
                        <rect x="40" y="70" width="20" height="25" fill="#059669" rx="10"/>
                      </svg>
                    )}
                    {newsItem.bgPattern === "city" && (
                      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="10" y="50" width="15" height="40" fill="#ec4899" rx="2"/>
                        <rect x="30" y="40" width="15" height="50" fill="#f472b6" rx="2"/>
                        <rect x="50" y="30" width="15" height="60" fill="#ec4899" rx="2"/>
                        <rect x="70" y="45" width="15" height="45" fill="#f472b6" rx="2"/>
                      </svg>
                    )}
                  </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <FooterLinking />
      <Footer />

      {/* Study Abroad Modal */}
      <StudyAbroadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        formType={modalConfig.formType}
        title={modalConfig.title}
        description={modalConfig.description}
      />
    </main>
  );
}

