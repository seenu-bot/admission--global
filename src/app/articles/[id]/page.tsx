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
import { getArticleSlug, getNewsSlug } from "@/lib/slugify";

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
  content?: string;
  body?: string;
  fullContent?: string;
  articleContent?: string;
  slug?: string;
  [key: string]: any;
}

export default function ArticleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if ID is "articles" (this handles the /articles/articles case)
  useEffect(() => {
    if (id === "articles") {
      router.replace("/articles");
      return;
    }
  }, [id, router]);

  useEffect(() => {
    // Don't fetch if ID is "articles"
    if (id === "articles") {
      return;
    }

    const fetchArticleDetails = async () => {
      try {
        const mapArticleData = (docId: string, data: any): Article => ({
          id: docId,
          title: data.title || "Untitled Article",
          description: data.description || "",
          author: data.author || "Unknown Author",
          category: data.category || "Uncategorized",
          url: data.url || "#",
          readTime: data.readTime || "",
          type: data.type || "default_article",
          image: data.image || data.imageUrl || "",
          content: data.content || data.body || data.fullContent || data.articleContent || data.description || "",
          date: data.date
            ? data.date.toDate
              ? data.date.toDate()
              : new Date(data.date)
            : null,
          slug: getArticleSlug({ id: docId, ...data }),
          ...data,
        });

        const articleRef = doc(db, "articles", id);
        const articleSnap = await getDoc(articleRef);

        if (articleSnap.exists()) {
          setArticle(mapArticleData(articleSnap.id, articleSnap.data()));
          setLoading(false);
          return;
        }

        try {
          const articlesQuery = query(collection(db, "articles"), where("slug", "==", id), limit(1));
          const articlesSnapshot = await getDocs(articlesQuery);

          if (!articlesSnapshot.empty) {
            const articleData = articlesSnapshot.docs[0];
            setArticle(mapArticleData(articleData.id, articleData.data()));
            setLoading(false);
            return;
          }
        } catch (error) {
          console.log("Slug query failed, continuing...");
        }

        try {
          const newsRef = doc(db, "news", id);
          const newsSnap = await getDoc(newsRef);

          if (newsSnap.exists()) {
            setArticle(mapArticleData(newsSnap.id, newsSnap.data()));
            setLoading(false);
            return;
          }
        } catch (newsError) {
          console.error("Error fetching from news collection:", newsError);
        }

        try {
          const newsQuery = query(collection(db, "news"), where("slug", "==", id), limit(1));
          const newsSnapshot = await getDocs(newsQuery);

          if (!newsSnapshot.empty) {
            const newsData = newsSnapshot.docs[0];
            setArticle(mapArticleData(newsData.id, newsData.data()));
            setLoading(false);
            return;
          }
        } catch (error) {
          console.log("News slug query failed, continuing...");
        }

        const tryGeneratedSlug = async (
          collectionName: string,
          slugFn: (record: any) => string
        ) => {
          try {
            const snapshot = await getDocs(collection(db, collectionName));
            for (const docSnap of snapshot.docs) {
              const docData = docSnap.data();
              const generatedSlug = slugFn({ id: docSnap.id, ...docData });
              if (generatedSlug && generatedSlug === id) {
                setArticle(mapArticleData(docSnap.id, docData));
                setLoading(false);
                return true;
              }
            }
          } catch (error) {
            console.log(`Generated slug scan failed for ${collectionName}`, error);
          }
          return false;
        };

        if (await tryGeneratedSlug("articles", getArticleSlug)) return;
        if (await tryGeneratedSlug("news", getNewsSlug)) return;

        console.warn("Article not found");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching article:", error);
        setLoading(false);
      }
    };

    if (id) {
      fetchArticleDetails();
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

          {/* Article Header Image Skeleton */}
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <div className="w-full h-96 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
          </div>

          {/* Article Content Skeleton */}
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

            {/* Article Description Skeleton */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-200">
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Full Article Content Skeleton */}
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

  if (!article) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="min-h-screen flex flex-col justify-center items-center text-center">
          <h1 className="text-2xl font-semibold text-gray-800">Article Not Found</h1>
          <Link href="/articles" className="text-red-700 hover:underline mt-3">
            Go back to articles
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const articleContent = article.content || article.body || article.fullContent || article.articleContent || article.description || "";

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/articles"
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
          Back to Articles
        </Link>

        {/* Article Header Image */}
        {article.image && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={article.image}
              alt={article.title || "Article image"}
              className="w-full h-96 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Article Content */}
        <article className="bg-white rounded-lg shadow-md p-8 md:p-12">
          {/* Category Badge */}
          {article.category && (
            <span className="inline-block px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-4">
              {article.category}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Author and Date Info */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {getAuthorInitial(article.author)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{article.author}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{formatDate(article.date)}</span>
                {article.readTime && (
                  <>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Article Description/Summary */}
          {article.description && article.description !== articleContent && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-lg text-gray-700 italic leading-relaxed">{article.description}</p>
            </div>
          )}

          {/* Full Article Content */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-img:rounded-lg prose-img:shadow-md"
            dangerouslySetInnerHTML={{
              __html: articleContent
                .split("\n")
                .map((paragraph) => {
                  if (paragraph.trim() === "") return "<br>";
                  // Check if paragraph looks like HTML
                  if (paragraph.trim().startsWith("<")) {
                    return paragraph;
                  }
                  // Otherwise wrap in <p> tags
                  return `<p>${paragraph}</p>`;
                })
                .join(""),
            }}
          />

          {/* Share Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">Share this article:</p>
            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title || "")}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Facebook
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors text-sm font-medium"
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

