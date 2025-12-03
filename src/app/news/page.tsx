"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterLinking from "@/components/FooterLinking";
import Link from "next/link";
import { getNewsSlug } from "@/lib/slugify";

interface News {
  id: string;
  title?: string;
  description?: string;
  author?: string;
  category?: string;
  url?: string;
  readTime?: string;
  type?: string;
  date?: any;
  image?: string;
  slug?: string;
  [key: string]: any;
}

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const newsRef = collection(db, "news");
        const querySnapshot = await getDocs(newsRef);

        if (querySnapshot.empty) {
          setNews([]);
          setLoading(false);
          return;
        }

        const newsList: News[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "Untitled News",
            description: data.description || "No description available.",
            author: data.author || "Unknown Author",
            category: data.category || "Uncategorized",
            url: data.url || "#",
            readTime: data.readTime || "",
            type: data.type || "default_news",
            image: data.image || data.imageUrl || "",
            date: data.date
              ? data.date.toDate
                ? data.date.toDate()
                : new Date(data.date)
              : null,
            slug: getNewsSlug({ id: doc.id, ...data }),
          };
        });

        // Sort by date (newest first)
        const sortedNews = newsList.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });

        setNews(sortedNews);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Failed to load news. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Helper to choose color gradient based on news type
  const getGradient = (type: string | undefined) => {
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

  // Get featured news (first/most recent) and trending news (next 3)
  const featuredNews = news.length > 0 ? news[0] : null;
  const trendingNews = news.slice(1, 4);

  // Format date helper
  const formatDate = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "long" });
    const year = d.getFullYear();
    const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
    return `${day}${suffix} ${month}, ${year}`;
  };

  // Get author initial
  const getAuthorInitial = (author: string | undefined) => {
    if (!author) return "A";
    return author.charAt(0).toUpperCase();
  };

  const getNewsHref = (entry: News | null | undefined) => {
    if (!entry) return "#";
    const slug = entry.slug || getNewsSlug(entry);
    return `/news/${slug || entry.id}`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
          News & Updates
        </h1>

        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area - Featured News Skeleton */}
            <div className="lg:col-span-2">
              {/* Featured News Skeleton */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className="relative h-96 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-white/30 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-white/30 rounded animate-pulse"></div>
                        <div className="h-3 w-40 bg-white/30 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-8 w-3/4 bg-white/30 rounded mb-3 animate-pulse"></div>
                    <div className="h-4 w-full bg-white/30 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-2/3 bg-white/30 rounded mb-4 animate-pulse"></div>
                    <div className="h-10 w-40 bg-white/30 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-center gap-2 py-4">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                </div>
              </div>

              {/* Additional News List Skeleton */}
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-6">
                    <div className="h-6 w-3/4 bg-gray-200 rounded mb-3 animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded mb-3 animate-pulse"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar - Trending News Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <div className="h-6 w-40 bg-gray-200 rounded mb-6 animate-pulse"></div>
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                      <div className="h-5 w-full bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-3 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && news.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No news found.</p>
          </div>
        )}

        {!loading && !error && news.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area - Featured News */}
            <div className="lg:col-span-2">
              {featuredNews && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                  <Link
                    href={getNewsHref(featuredNews)}
                    className="block relative"
                  >
                    {/* Featured News Image/Header */}
                    <div
                      className="relative h-96 bg-cover bg-center"
                      style={{
                        backgroundImage: featuredNews.image
                          ? `url(${featuredNews.image})`
                          : `linear-gradient(135deg, ${getGradient(featuredNews.type).includes("blue") ? "#3b82f6" : "#8b5cf6"} 0%, ${getGradient(featuredNews.type).includes("cyan") ? "#06b6d4" : "#a78bfa"} 100%)`,
                      }}
                    >
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/40"></div>
                      
                      {/* Content Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold">
                            {getAuthorInitial(featuredNews.author)}
                          </div>
                          <div>
                            <p className="font-semibold">{featuredNews.author}</p>
                            <p className="text-sm text-gray-200">
                              {formatDate(featuredNews.date)} {featuredNews.readTime && `| ${featuredNews.readTime}`}
                            </p>
                          </div>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-3 line-clamp-2">
                          {featuredNews.title}
                        </h2>
                        <p className="text-gray-200 mb-4 line-clamp-2">
                          {featuredNews.description}
                        </p>
                        <button className="bg-white text-gray-900 px-6 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors">
                          Continue Reading &gt;
                        </button>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Pagination Dots */}
                  <div className="flex justify-center gap-2 py-4">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  </div>
                </div>
              )}

              {/* Additional News List */}
              {news.slice(4).length > 0 && (
                <div className="space-y-6">
                  {news.slice(4).map((item) => {
                    const newsHref = getNewsHref(item);
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                      >
                        <Link href={newsHref}>
                          <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>By - {item.author}</span>
                            <span>
                              {formatDate(item.date)} {item.readTime && `, ${item.readTime}`}
                            </span>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar - Trending News */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Trending News
                </h3>
                <div className="space-y-6">
                  {trendingNews.map((item) => {
                    const newsHref = getNewsHref(item);
                    return (
                      <div key={item.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                        <Link
                          href={newsHref}
                          className="block"
                        >
                          <h4 className="text-base font-semibold text-gray-900 mb-2 hover:text-blue-600 line-clamp-2">
                            {item.title}
                          </h4>
                        </Link>
                        <p className="text-xs text-gray-500 mb-2">
                          By - {item.author}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          {formatDate(item.date)}{item.readTime && `, ${item.readTime}`}
                        </p>
                        <Link
                          href={newsHref}
                          className="text-blue-600 text-sm font-medium hover:underline"
                        >
                          Read More
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <FooterLinking />
      <Footer />
    </main>
  );
}

