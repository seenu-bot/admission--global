"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterLinking from "@/components/FooterLinking";
import Link from "next/link";
import { getArticleSlug } from "@/lib/slugify";

interface Article {
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

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No need for complex history manipulation here
    // The exams page already replaces its entry with home before redirecting
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);

      try {
        const articlesRef = collection(db, "articles");
        const querySnapshot = await getDocs(articlesRef);

        if (querySnapshot.empty) {
          setArticles([]);
          setLoading(false);
          return;
        }

        const articlesList: Article[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "Untitled Article",
            description: data.description || "No description available.",
            author: data.author || "Unknown Author",
            category: data.category || "Uncategorized",
            url: data.url || "#",
            readTime: data.readTime || "",
            type: data.type || "default_article",
            image: data.image || data.imageUrl || "",
            date: data.date
              ? data.date.toDate
                ? data.date.toDate()
                : new Date(data.date)
              : null,
            slug: getArticleSlug({ id: doc.id, ...data }),
          };
        });

        // Sort by date (newest first)
        const sortedArticles = articlesList.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
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

  // Helper to choose color gradient based on article type
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

  // Get featured article (first/most recent) and trending articles (next 3)
  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const trendingArticles = articles.slice(1, 4);

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

  const getArticleHref = (entry: Article | null | undefined) => {
    if (!entry) return "#";
    const slug = entry.slug || getArticleSlug(entry);
    return `/articles/${slug || entry.id}`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
          Articles
        </h1>

        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area - Featured Article Skeleton */}
            <div className="lg:col-span-2">
              {/* Featured Article Skeleton */}
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

              {/* Additional Articles List Skeleton */}
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

            {/* Sidebar - Trending Articles Skeleton */}
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

        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No articles found.</p>
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area - Featured Article */}
            <div className="lg:col-span-2">
              {featuredArticle && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                  <Link
                    href={getArticleHref(featuredArticle)}
                    className="block relative"
                  >
                    {/* Featured Article Image/Header */}
                    <div
                      className="relative h-96 bg-cover bg-center"
                      style={{
                        backgroundImage: featuredArticle.image
                          ? `url(${featuredArticle.image})`
                          : `linear-gradient(135deg, ${getGradient(featuredArticle.type).includes("blue") ? "#3b82f6" : "#8b5cf6"} 0%, ${getGradient(featuredArticle.type).includes("cyan") ? "#06b6d4" : "#a78bfa"} 100%)`,
                      }}
                    >
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/40"></div>
                      
                      {/* Content Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold">
                            {getAuthorInitial(featuredArticle.author)}
                          </div>
                          <div>
                            <p className="font-semibold">{featuredArticle.author}</p>
                            <p className="text-sm text-gray-200">
                              {formatDate(featuredArticle.date)} {featuredArticle.readTime && `| ${featuredArticle.readTime}`}
                            </p>
                          </div>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-3 line-clamp-2">
                          {featuredArticle.title}
                        </h2>
                        <p className="text-gray-200 mb-4 line-clamp-2">
                          {featuredArticle.description}
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

              {/* Additional Articles List */}
              {articles.slice(4).length > 0 && (
                <div className="space-y-6">
                  {articles.slice(4).map((article) => {
                    const articleHref = getArticleHref(article);
                    return (
                      <div
                        key={article.id}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                      >
                        <Link href={articleHref}>
                          <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600">
                            {article.title}
                          </h3>
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {article.description}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>By - {article.author}</span>
                            <span>
                              {formatDate(article.date)} {article.readTime && `, ${article.readTime}`}
                            </span>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar - Trending Articles */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Trending Articles
                </h3>
                <div className="space-y-6">
                  {trendingArticles.map((article) => {
                    const articleHref = getArticleHref(article);
                    return (
                      <div key={article.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                        <Link
                          href={articleHref}
                          className="block"
                        >
                          <h4 className="text-base font-semibold text-gray-900 mb-2 hover:text-blue-600 line-clamp-2">
                            {article.title}
                          </h4>
                        </Link>
                        <p className="text-xs text-gray-500 mb-2">
                          By - {article.author}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          {formatDate(article.date)}{article.readTime && `, ${article.readTime}`}
                        </p>
                        <Link
                          href={articleHref}
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

