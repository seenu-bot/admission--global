"use client";


import { useEffect, useState } from "react";
import { use } from "react"; // ✅ For unwrapping params in Next.js 15+
import { doc, getDoc, collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterLinking from "@/components/FooterLinking";
import Image from "next/image";
import { slugify } from "@/lib/slugify";

// Helper function to validate image URL
function isValidImageUrl(url) {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return false;
  }
  // Check if it's a valid absolute URL (http/https)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  // Check if it's a valid relative path (starts with /)
  if (url.startsWith("/")) {
    return true;
  }
  // If it's a data URL
  if (url.startsWith("data:")) {
    return true;
  }
  return false;
}

const toDisplayText = (value) => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => toDisplayText(item))
      .filter((text) => text && text !== "N/A")
      .join(", ");
  }
  if (typeof value === "object") {
    const prioritized =
      value.title ||
      value.name ||
      value.label ||
      value.criteria ||
      value.description ||
      value.value;
    if (prioritized) return String(prioritized);
    try {
      return JSON.stringify(value);
    } catch {
      return "N/A";
    }
  }
  return "N/A";
};

export default function CourseDetailsPage({ params }) {
 // ✅ unwrap params with React.use() for future-proof Next.js compatibility
  const { id: identifier } = use(params);

  const [course, setCourse] = useState(null);
  const [courseDocId, setCourseDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // 🔹 Fetch course details (supports slug or Firestore ID)
  const fetchCourseDetails = async () => {
    try {
      let resolvedId = null;
      let data = null;

      const identifierSlug = slugify(identifier || "");

      // 1) Try to resolve by slug derived from courseName / explicit slug
      const coursesCol = collection(db, "courses");
      const allCoursesSnap = await getDocs(coursesCol);

      allCoursesSnap.forEach((docSnap) => {
        if (data) return; // already found

        const raw = docSnap.data();
        const explicitSlug =
          typeof raw.slug === "string" && raw.slug.trim() ? raw.slug.trim() : null;
        const nameSource =
          raw.courseName || raw.name || raw.title || raw.shortName || docSnap.id;
        const generatedSlug = explicitSlug || slugify(nameSource || "");

        if (
          (identifierSlug && generatedSlug === identifierSlug) ||
          identifier === docSnap.id
        ) {
          resolvedId = docSnap.id;
          data = { id: docSnap.id, ...raw };
        }
      });

      // 2) If still not found, last fallback: direct document lookup by identifier
      if (!data && identifier) {
        const directRef = doc(db, "courses", identifier);
        const directSnap = await getDoc(directRef);
        if (directSnap.exists()) {
          resolvedId = directSnap.id;
          data = { id: directSnap.id, ...directSnap.data() };
        }
      }

      if (data && resolvedId) {
        setCourse(data);
        setCourseDocId(resolvedId);
      } else {
        console.warn("Course not found for identifier:", identifier);
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch comments (stored under each course)
  const fetchComments = async (docId) => {
    if (!docId) return;
    try {
      const querySnapshot = await getDocs(collection(db, "courses", docId, "comments"));
      const list = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComments(list);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  // 🔹 Add comment
  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!courseDocId) return;
    try {
      await addDoc(collection(db, "courses", courseDocId, "comments"), {
        text: newComment,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
      fetchComments(courseDocId);
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  useEffect(() => {
    if (identifier) {
      fetchCourseDetails();
    }
  }, [identifier]);

  useEffect(() => {
    if (courseDocId) {
      fetchComments(courseDocId);
    }
  }, [courseDocId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center">
        <h1 className="text-2xl font-semibold text-gray-800">Course Not Found</h1>
        <a href="/courses" className="text-red-700 hover:underline mt-3">
          Go back to courses
        </a>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm mb-4 text-gray-500">
          <a href="/" className="hover:underline text-red-700">Home</a> /{" "}
          <a href="/courses" className="hover:underline text-red-700">Courses</a> /{" "}
          <span>{course.courseName}</span>
        </nav>

        {/* Header */}
        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 mb-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{course.courseName}</h1>
              <p className="text-gray-600 mt-1">
                {course.courseLevel || "N/A"} • Duration: {course.duration || "N/A"}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Last Updated:{" "}
                {course.lastUpdated
                  ? new Date(course.lastUpdated.seconds * 1000).toLocaleDateString()
                  : course.publishDate}
              </p>
            </div>
           {course.media?.images?.[0] && isValidImageUrl(course.media.images[0]) && (
  <div className="w-40 h-28 relative mt-4 md:mt-0">
    <Image
      src={course.media.images[0]}
      alt={course.courseName || "Course Image"}
      fill
      className="object-cover rounded-lg"
      sizes="(max-width: 768px) 100vw, 200px"
      priority={false}
      unoptimized={course.media.images[0]?.startsWith("http://") || course.media.images[0]?.startsWith("https://")}
    />
  </div>
)}
          </div>
        </div>

        {/* Highlights */}
        {course.highlights && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Course Highlights</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {course.highlights.map((item, i) => {
                const text = toDisplayText(item);
                return text ? <li key={i}>{text}</li> : null;
              })}
            </ul>
          </section>
        )}

        {/* Overview */}
        <section className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Overview</h2>
            <p className="text-gray-600 leading-relaxed">{toDisplayText(course.notes)}</p>
            <div className="mt-5 space-y-2 text-gray-700">
              <p><strong>Eligibility:</strong> {toDisplayText(course.eligibility)}</p>
              <p><strong>Average Fee:</strong> {toDisplayText(course.averageFee)}</p>
              <p><strong>Average Salary:</strong> {toDisplayText(course.averageSalary)}</p>
            </div>
          </div>

          {/* Admission & Scholarships */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Admission & Scholarships</h2>
            <p className="text-gray-600 mb-3">{toDisplayText(course.admissionProcess)}</p>
            <h3 className="font-medium text-gray-800 mb-2">Scholarships Available:</h3>
            <ul className="list-disc pl-5 text-gray-700">
              {course.scholarships?.map((s, i) => {
                const text = toDisplayText(s);
                return text ? <li key={i}>{text}</li> : null;
              })}
            </ul>
          </div>
        </section>

        {/* Syllabus */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Semester-wise Syllabus</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Object.entries(course.syllabus || {}).map(([sem, subjects]) => (
              <div key={sem} className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-medium text-gray-800 mb-2 capitalize">{sem}</h3>
                <ul className="list-disc pl-4 text-gray-700 text-sm space-y-1">
                  {subjects.map((sub, i) => (
                    <li key={i}>{sub}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Top Recruiters */}
        {course.topRecruiters && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Top Recruiters</h2>
            <div className="flex flex-wrap gap-3">
              {course.topRecruiters.map((r, i) => {
                const text = toDisplayText(r);
                return text ? (
                <span
                  key={i}
                  className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-full text-sm text-gray-700"
                >
                    {text}
                </span>
                ) : null;
              })}
            </div>
          </section>
        )}

        {/* Media Section */}
        {course.media?.videos?.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Videos</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {course.media.videos.map((video, i) => (
                <iframe
                  key={i}
                  src={video.replace("watch?v=", "embed/")}
                  className="w-full h-64 rounded-xl border border-gray-200"
                  allowFullScreen
                ></iframe>
              ))}
            </div>
          </section>
        )}


        
        {/* ✅ Comment Section */}
        <section className="bg-white border rounded-2xl shadow-sm p-6 mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Comments</h2>

          {comments.length > 0 ? (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="border-b pb-2 text-gray-700 text-sm flex justify-between"
                >
                  <span>{c.text}</span>
                  <span className="text-gray-400 text-xs">
                    {c.createdAt?.seconds
                      ? new Date(c.createdAt.seconds * 1000).toLocaleString()
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No comments yet.</p>
          )}

          <form onSubmit={addComment} className="mt-6 flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your comment..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-700"
            />
            <button
              type="submit"
              className="bg-red-700 text-white px-5 py-2 rounded-lg hover:bg-red-800 transition"
            >
              Post
            </button>
          </form>
        </section>

        {/* CTA */}
        <div className="flex justify-end gap-4 mt-8">
          <a
            href="/colleges"
            className="bg-red-700 text-white px-5 py-2 rounded-lg hover:bg-red-800 transition"
          >
            Explore Colleges
          </a>
          <a
            href="/course"
            className="border border-red-700 text-red-700 px-5 py-2 rounded-lg hover:bg-red-700 hover:text-white transition"
          >
            Back to Courses
          </a>
        </div>
      </div>

      <FooterLinking />
      <Footer />
    </main>
  );
}
