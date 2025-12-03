"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";
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
  content?: string;
  body?: string;
  fullContent?: string;
  newsContent?: string;
  slug?: string;
  [key: string]: any;
}

export default function NewsDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if ID is "news" (this handles the /news/news case)
  useEffect(() => {
    if (id === "news") {
      router.replace("/news");
      return;
    }
  }, [id, router]);

  useEffect(() => {
    // Don't fetch if ID is "news"
    if (id === "news") {
      return;
    }

    const fetchNewsDetails = async () => {
      try {
        const mapNewsData = (docId: string, data: any): News => ({
          id: docId,
          title: data.title || "Untitled News",
          description: data.description || "",
          author: data.author || "Unknown Author",
          category: data.category || "Uncategorized",
          url: data.url || "#",
          readTime: data.readTime || "",
          type: data.type || "default_news",
          image: data.image || data.imageUrl || "",
          content: data.content || data.body || data.fullContent || data.newsContent || data.description || "",
          date: data.date
            ? data.date.toDate
              ? data.date.toDate()
              : new Date(data.date)
            : null,
          slug: getNewsSlug({ id: docId, ...data }),
          ...data,
        });

        const newsRef = doc(db, "news", id);
        const newsSnap = await getDoc(newsRef);

        if (newsSnap.exists()) {
          setNews(mapNewsData(newsSnap.id, newsSnap.data()));
          setLoading(false);
          return;
        }

        try {
          const newsQuery = query(collection(db, "news"), where("slug", "==", id), limit(1));
          const newsSnapshot = await getDocs(newsQuery);

          if (!newsSnapshot.empty) {
            const newsData = newsSnapshot.docs[0];
            setNews(mapNewsData(newsData.id, newsData.data()));
            setLoading(false);
            return;
          }
        } catch (error) {
          console.log("Slug query failed, continuing...");
        }

        const tryGeneratedSlug = async () => {
          try {
            const snapshot = await getDocs(collection(db, "news"));
            for (const docSnap of snapshot.docs) {
              const docData = docSnap.data();
              const generatedSlug = getNewsSlug({ id: docSnap.id, ...docData });
              if (generatedSlug && generatedSlug === id) {
                setNews(mapNewsData(docSnap.id, docData));
                setLoading(false);
                return true;
              }
            }
          } catch (error) {
            console.log("Generated slug scan failed for news", error);
          }
          return false;
        };

        if (await tryGeneratedSlug()) return;

        console.warn("News not found");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching news:", error);
        setLoading(false);
      }
    };

    if (id) {
      fetchNewsDetails();
    }
  }, [id]);

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "long" });
    const year = d.getFullYear();
    const suffix =
      day === 1 || day === 21 || day === 31
        ? "st"
        : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
        ? "rd"
        : "th";
    return `${day}${suffix} ${month}, ${year}`;
  };

  const getAuthorInitial = (author: string | undefined) => {
    if (!author) return "A";
    return author.charAt(0).toUpperCase();
  };

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

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button Skeleton */}
          <div className="h-6 w-32 bg-gray-200 rounded mb-6 animate-pulse"></div>

          {/* News Header Image Skeleton */}
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <div className="w-full h-96 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
          </div>

          {/* News Content Skeleton */}
          <article className="bg-white rounded-lg shadow-md p-8 md:p-12">
            {/* Category Badge Skeleton */}
            <div className="h-6 w-24 bg-gray-200 rounded-full mb-4 animate-pulse"></div>

            {/* Title Skeleton */}
            <div className="space-y-3 mb-6">
              <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-5/6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-4/6 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Author and Date Info Skeleton */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-40 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* News Description Skeleton */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-200">
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Full News Content Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Share Section Skeleton */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="h-4 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </article>
        </div>

        <Footer />
      </main>
    );
  }

  if (!news) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="min-h-screen flex flex-col justify-center items-center text-center">
          <h1 className="text-2xl font-semibold text-gray-800">News Not Found</h1>
          <Link href="/news" className="text-red-700 hover:underline mt-3">
            Go back to news
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const displayTitle = news.title || "News Details";
  const displayContent = news.content || news.description || "No content available.";

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/news"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to News
        </Link>

        {/* News Header Image */}
        {news.image && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={news.image}
              alt={displayTitle}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* News Content */}
        <article className="bg-white rounded-lg shadow-md p-8 md:p-12">
          {/* Category Badge */}
          {news.category && (
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 bg-gradient-to-r ${getGradient(
                news.type
              )} text-white`}
            >
              {news.category}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {displayTitle}
          </h1>

          {/* Author and Date Info */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${getGradient(
                news.type
              )}`}
            >
              {getAuthorInitial(news.author)}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{news.author}</p>
              <p className="text-sm text-gray-500">
                {formatDate(news.date)} {news.readTime && `• ${news.readTime}`}
              </p>
            </div>
          </div>

          {/* Description */}
          {news.description && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-lg text-gray-700 leading-relaxed">
                {news.description}
              </p>
            </div>
          )}

          {/* Full Content */}
          <div
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: displayContent.replace(/\n/g, "<br />"),
            }}
          />

          {/* Share Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-4">Share this news:</p>
            <div className="flex gap-3">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.href : ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.href : ""
                )}&text=${encodeURIComponent(displayTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
              >
                Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.href : ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </article>
      </div>

      <FooterLinking />
      <Footer />
    </main>
  );
}

