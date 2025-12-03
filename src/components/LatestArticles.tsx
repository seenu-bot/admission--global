'use client';
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getArticleSlug } from "@/lib/slugify";

export default function LatestArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
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

  useEffect(() => {
    setIsClient(true);

    const fetchArticles = async () => {
      setLoading(true);
      setError(null);

      try {
        const querySnapshot = await getDocs(collection(db, "articles"));

        if (querySnapshot.empty) {
          setArticles([]);
          return;
        }

        const articlesList = querySnapshot.docs.map((doc) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            title: data.title || "Untitled Article",
            description: data.description || "No description available.",
            author: data.author || "Unknown Author",
            category: data.category || "Uncategorized",
            url: data.url || "#",
            readTime: data.readTime || "",
            type: data.type || "default_article",
            date: data.date
              ? data.date.toDate
                ? data.date.toDate()
                : new Date(data.date)
              : null,
            slug: getArticleSlug({ id: doc.id, ...data }),
          };
        });

        const sortedArticles = articlesList.sort((a, b) => {
          const dateA: any = a.date ? new Date(a.date) : 0;
          const dateB: any = b.date ? new Date(b.date) : 0;
          return dateB - dateA;
        });

        setArticles(sortedArticles);
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError("Failed to load articles. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
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
  }, [articles]);

  if (!isClient) return null;

  if (error) return <p className="text-center text-red-600 font-medium">{error}</p>;

  if (loading) {
    return (
      <div className="mx-auto px-1 py-10">
        <h3 className="text-xl font-bold text-start text-gray-800 mb-4">
          Latest Articles
        </h3>
        <div className="flex gap-6 overflow-x-auto pb-4 px-4 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-start content-start items-stretch hide-scrollbar">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md flex flex-col overflow-hidden flex-shrink-0 sm:flex-shrink"
              style={{ width: '250px', minWidth: '250px', height: '280px', maxHeight: '280px' }}
            >
              <div className="h-32 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
              <div className="flex flex-col gap-1.5 p-3 flex-grow overflow-hidden">
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) return <p className="text-center text-gray-600">No articles found.</p>;

  // Helper to choose color gradient based on article type
  const getGradient = (type: any) => {
    switch (type) {
      case "tech":
        return "from-blue-600 to-cyan-400";
      case "lifestyle":
        return "from-amber-500 to-yellow-300";
      case "business":
        return "from-emerald-500 to-green-300";
      default:
        return "from-indigo-500 to-purple-500";
    }
  };

  return (
    <div className="mx-auto px-1 py-4">
      <h3 className="text-xl font-bold text-start text-gray-800 mb-4 px-4 sm:px-0">
        Latest Articles
      </h3>

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

        <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto pb-4 px-4 sm:px-0 justify-start items-stretch hide-scrollbar">
          {articles.map((article) => {
            const articleSlug = article.slug || getArticleSlug(article);
            return (
              <div
                key={article.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all flex flex-col overflow-hidden flex-shrink-0 sm:flex-shrink h-full"
                style={{ width: '250px', minWidth: '250px' }}
              >
                <Link href={`/articles/${articleSlug || article.id}`}>
                  <div
                    className={`h-32 flex items-end justify-between p-3 text-white bg-gradient-to-br ${getGradient(
                      article.type
                    )}`}
                  >
                    <div>
                      <span className="bg-black/30 backdrop-blur-sm text-xs px-2 py-1 rounded-md">
                        {article.category}
                      </span>
                      <p className="text-sm mt-2 text-gray-100">
                        {article.date
                          ? new Date(article.date).toLocaleDateString()
                          : "No date"}
                        {article.readTime && (
                          <b className="font-semibold">, {article.readTime}</b>
                        )}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="flex flex-col gap-1.5 p-3 flex-grow justify-between">
                  <Link
                    href={`/articles/${articleSlug || article.id}`}
                    className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-all duration-300 ease-in-out line-clamp-2 leading-tight hover:underline"
                  >
                    {article.title}
                  </Link>

                  <span className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                    {article.description}
                  </span>
                  <div className="flex flex-col gap-0">
                    <b className="text-xs text-gray-500">By - {article.author}</b>

                    <Link
                      href={`/articles/${articleSlug || article.id}`}
                      className="text-blue-600 font-medium text-xs hover:underline"
                    >
                      Read More &gt;
                    </Link>
                  </div>
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
    </div>
  );
}
