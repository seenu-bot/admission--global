"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCollegeSlug, slugify } from "@/lib/slugify";
import { buildProgramsFromCollege, groupProgramsByCategory } from "@/lib/programUtils";

const DEFAULT_IMAGE = "/build/assets/t-1709039660-chitkara-university-rajpura.jpeg";

type CollegeRecord = {
  id: string;
  sourceId?: string;
  slug?: string;
  sourceCollection?: string;
  name?: string;
  collegeName?: string;
  instituteName?: string;
  universityName?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  description?: string;
  overview?: string;
  about?: string;
  notes?: string;
  image?: string;
  logo?: string;
  banner?: string;
  website?: string;
  url?: string;
  applyUrl?: string;
  avgFee?: string | number;
  averageFee?: string | number;
  totalFees?: string | number;
  fees?: string | number;
  rating?: number;
  approvals?: string[] | string;
  streams?: string[];
  coursesOffered?: string[] | string;
  courses?: string[] | string;
  programs?: string[] | string;
  facilities?: string[] | string;
  admissionProcess?: string[] | string;
  examsAccepted?: string[] | string;
  exams?: string[] | string;
  contactNumber?: string;
  phone?: string;
  email?: string;
  contact?: {
    phone?: string;
    email?: string;
  };
  fee?: string | number;
  totalCourses?: string | number;
};

// Helper to derive short course codes like "MBBS", "B.Tech" from full course names
function getCourseShortForm(courseName: string): string {
  if (!courseName) return "";

  const name = courseName.trim();

  const shortFormPatterns = [
    { pattern: /\b(B\.?Tech|B\.?E\.?|Bachelor of Technology|Bachelor of Engineering)\b/i, short: "B.Tech" },
    { pattern: /\b(M\.?Tech|M\.?E\.?|Master of Technology|Master of Engineering)\b/i, short: "M.Tech" },
    { pattern: /\b(MBA|Master of Business Administration)\b/i, short: "MBA" },
    { pattern: /\b(BBA|Bachelor of Business Administration)\b/i, short: "BBA" },
    { pattern: /\b(BCA|Bachelor of Computer Applications)\b/i, short: "Bachelor of Computer Applications" },
    { pattern: /\b(MCA|Master of Computer Applications)\b/i, short: "MCA" },
    { pattern: /\b(MBBS|Bachelor of Medicine.*Bachelor of Surgery)\b/i, short: "MBBS" },
    { pattern: /\b(B\.?Sc|Bachelor of Science)\b/i, short: "B.Sc" },
    { pattern: /\b(M\.?Sc|Master of Science)\b/i, short: "M.Sc" },
    { pattern: /\b(B\.?Com|Bachelor of Commerce)\b/i, short: "B.Com" },
    { pattern: /\b(M\.?Com|Master of Commerce)\b/i, short: "M.Com" },
    { pattern: /\b(BA|Bachelor of Arts)\b/i, short: "BA" },
    { pattern: /\b(MA|Master of Arts)\b/i, short: "MA" },
    { pattern: /\b(LLB|Bachelor of Laws)\b/i, short: "LLB" },
    { pattern: /\b(LLM|Master of Laws)\b/i, short: "LLM" },
    { pattern: /\b(B\.?Pharm|Bachelor of Pharmacy)\b/i, short: "B.Pharm" },
    { pattern: /\b(M\.?Pharm|Master of Pharmacy)\b/i, short: "M.Pharm" },
    { pattern: /\b(B\.?Arch|Bachelor of Architecture)\b/i, short: "B.Arch" },
    { pattern: /\b(M\.?Arch|Master of Architecture)\b/i, short: "M.Arch" },
    { pattern: /\b(BDS|Bachelor of Dental Surgery)\b/i, short: "BDS" },
    { pattern: /\b(BHM|Bachelor of Hotel Management)\b/i, short: "BHM" },
  ];

  for (const { pattern, short } of shortFormPatterns) {
    if (pattern.test(name)) {
      return short;
    }
  }

  const abbrevMatch = name.match(/\b([A-Z]{2,5})\b/);
  if (abbrevMatch && abbrevMatch[1].length >= 2 && abbrevMatch[1].length <= 5) {
    return abbrevMatch[1];
  }

  const words = name
    .split(/\s+/)
    .filter((w) => w && /^[A-Za-z]/.test(w))
    .map((w) => w[0].toUpperCase());
  if (words.length >= 2 && words.length <= 5) {
    return words.join("");
  }

  return name.length <= 12 ? name : name.slice(0, 12);
}

function gatherStrings(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((item) => gatherStrings(item))
      .flat()
      .filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(/[,/|]/)
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (typeof input === "number" || typeof input === "boolean") {
    return [String(input)];
  }
  if (typeof input === "object") {
    return Object.values(input || {})
      .map((value) => gatherStrings(value))
      .flat()
      .filter(Boolean);
  }
  return [];
}

function extractField(entry: any, doc: any, keys: string[]): any {
  for (const key of keys) {
    if (entry && entry[key] !== undefined && entry[key] !== null && entry[key] !== "") {
      return entry[key];
    }
    if (doc && doc[key] !== undefined && doc[key] !== null && doc[key] !== "") {
      return doc[key];
    }
    if (entry?.location && entry.location[key] !== undefined) return entry.location[key];
    if (doc?.location && doc.location[key] !== undefined) return doc.location[key];
    if (entry?.address && entry.address[key] !== undefined) return entry.address[key];
    if (doc?.address && doc.address[key] !== undefined) return doc.address[key];
  }
  return undefined;
}

function combineApprovals(entry: any, doc: any): string[] {
  const approvals = new Set<string>();
  const raw = [entry?.approvals, entry?.approval, doc?.approvals, doc?.approval];
  raw.forEach((item) => {
    if (!item) return;
    if (Array.isArray(item)) {
      item.forEach((value) => approvals.add(String(value)));
    } else {
      gatherStrings(item).forEach((value) => approvals.add(value));
    }
  });
  return Array.from(approvals).filter(Boolean);
}

function combineStreams(entry: any, doc: any): string[] {
  const streams = new Set<string>();
  const raw = [
    entry?.streams,
    entry?.courses,
    entry?.disciplines,
    entry?.specialisations,
    doc?.streams,
    doc?.courses,
  ];
  raw.forEach((item) => {
    if (!item) return;
    gatherStrings(item).forEach((value) => streams.add(value));
  });
  return Array.from(streams).filter(Boolean);
}

function isValidImageUrl(url: string | undefined): boolean {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return false;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  if (url.startsWith("/")) {
    return true;
  }
  if (url.startsWith("data:")) {
    return true;
  }
  return false;
}

// Check if identifier looks like a Firestore ID (typically 20-28 alphanumeric characters)
function looksLikeId(identifier: string): boolean {
  // Firestore IDs are typically 20-28 characters, alphanumeric
  return /^[a-zA-Z0-9]{20,28}$/.test(identifier);
}

async function getDocById(collectionName: string, id: string) {
  try {
    const ref = doc(db, collectionName, id);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
  } catch (error) {
    console.warn(`Failed to fetch ${collectionName}/${id}`, error);
  }

  // Handle composite IDs created as `${doc.id}-${idx}` in listing pages
  const lastDash = id.lastIndexOf("-");
  if (lastDash > 0) {
    const baseId = id.slice(0, lastDash);
    const suffix = id.slice(lastDash + 1);
    if (baseId && suffix && !Number.isNaN(Number(suffix))) {
      try {
        const ref = doc(db, collectionName, baseId);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() };
        }
      } catch (error) {
        console.warn(`Failed to fetch composite base id ${collectionName}/${baseId}`, error);
      }
    }
  }
  return null;
}

function collectCollegeEntries(data: any): any[] {
  if (!data || typeof data !== "object") return [];
  const potentialArrays: any[] = [
    data.topColleges,
    data.relatedColleges,
    data.colleges,
    data.collegeList,
    data.popularColleges,
    data.featuredColleges,
    data.campuses,
    data.locations,
    data.centers,
    data.centres,
  ];
  const entries: any[] = [];
  potentialArrays.forEach((arr) => {
    if (Array.isArray(arr)) {
      arr.forEach((entry) => {
        if (entry && typeof entry === "object") entries.push(entry);
      });
    }
  });
  if (entries.length === 0) {
    entries.push(data);
  }
  return entries;
}

function buildCandidatesFromDoc(docSnap: any) {
  const docData = docSnap.data();
  const candidates: Array<{ slug?: string; record: CollegeRecord }> = [];
  const baseRecord: CollegeRecord = { id: docSnap.id, ...docData };
  const baseSlug =
    typeof docData.slug === "string" && docData.slug.trim()
      ? docData.slug.trim()
      : getCollegeSlug(baseRecord);
  if (baseSlug) {
    baseRecord.slug = baseSlug;
  }
  candidates.push({
    slug: baseSlug,
    record: baseRecord,
  });

  const entries = collectCollegeEntries(docData);
  entries.forEach((entry, idx) => {
    if (!entry || typeof entry !== "object") return;

    const name =
      entry?.name ||
      entry?.collegeName ||
      entry?.college ||
      entry?.institute ||
      entry?.university ||
      entry?.title ||
      docData?.instituteName ||
      docData?.universityName ||
      docData?.collegeName ||
      docData?.courseProvider ||
      docData?.courseName ||
      "";
    if (!name) return;

    const city =
      extractField(entry, docData, ["city", "cityName"]) ||
      extractField(entry?.location, docData?.location, ["city"]);
    const state =
      extractField(entry, docData, ["state", "stateName", "province"]) ||
      extractField(entry?.location, docData?.location, ["state"]);
    let country =
      extractField(entry, docData, ["country", "countryName", "nation"]) ||
      extractField(entry?.location, docData?.location, ["country"]) ||
      "India";
    if (country) {
      const countryNorm = String(country).trim().toLowerCase();
      if (countryNorm === "in" || countryNorm === "ind" || countryNorm === "indian") {
        country = "India";
      }
    }
    const address =
      extractField(entry, docData, [
        "address",
        "addressLine",
        "streetAddress",
        "fullAddress",
        "location",
      ]) || "";
    const approvals = combineApprovals(entry, docData);
    const streams = combineStreams(entry, docData);
    const ratingRaw = extractField(entry, docData, ["rating", "overallRating", "score"]);
    const rating =
      ratingRaw !== undefined && !Number.isNaN(Number(ratingRaw)) ? Number(ratingRaw) : null;
    const totalCourses = extractField(entry, docData, [
      "totalCourses",
      "noOfCourses",
      "coursesCount",
      "programCount",
      "count",
    ]);
    const fee = extractField(entry, docData, [
      "totalFees",
      "fee",
      "fees",
      "package",
      "avgFee",
      "averageFee",
      "tuition",
      "courseFee",
    ]);
    const rawWebsite = extractField(entry, docData, ["website", "url", "link", "applyUrl"]);
    const website = Array.isArray(rawWebsite)
      ? rawWebsite.map((w) => String(w)).find((w) => w.trim())
      : typeof rawWebsite === "string"
      ? rawWebsite.trim()
      : undefined;
    const image = extractField(entry, docData, ["image", "logo", "banner", "thumbnail"]);

    const merged: CollegeRecord = {
      id: `${docSnap.id}-${idx}`,
      sourceId: docSnap.id,
      sourceCollection: "courses",
      name,
      city: city ? String(city) : "",
      state: state ? String(state) : "",
      country: country ? String(country) : "India",
      address: address ? String(address) : "",
      approvals,
      streams,
      rating: rating ?? undefined,
      totalCourses,
      fee,
      website,
      image,
      ...(Array.isArray(docData) ? {} : docData),
      ...(entry && typeof entry === "object" ? entry : {}),
    } as CollegeRecord;
    const explicit = typeof entry.slug === "string" ? entry.slug.trim() : "";
    const candidateSlug =
      explicit ||
      getCollegeSlug({
        id: docSnap.id,
        name,
        city,
        state,
        country,
        address,
        approvals,
        streams,
        ...docData,
        ...(entry && typeof entry === "object" ? entry : {}),
      });
    if (candidateSlug) {
      merged.slug = candidateSlug;
    }
    candidates.push({
      slug: candidateSlug,
      record: merged,
    });
  });

  return candidates;
}

async function getDocBySlug(collectionName: string, slug: string) {
  try {
    const slugQuery = query(
      collection(db, collectionName),
      where("slug", "==", slug),
      limit(1)
    );
    const slugSnapshot = await getDocs(slugQuery);
    if (!slugSnapshot.empty) {
      const docSnap = slugSnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (error) {
    console.warn(`Failed slug lookup in ${collectionName}`, error);
  }
  return null;
}

async function getDocByGeneratedSlug(collectionName: string, slug: string) {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    for (const docSnap of snapshot.docs) {
      const candidates = buildCandidatesFromDoc(docSnap);
      for (const candidate of candidates) {
        if (candidate.slug && candidate.slug === slug) {
          return candidate.record;
        }
      }
    }
  } catch (error) {
    console.warn(`Failed generated slug scan in ${collectionName}`, error);
  }
  return null;
}

async function getEntryByCompositeId(collectionName: string, identifier: string) {
  const lastDash = identifier.lastIndexOf("-");
  if (lastDash <= 0) return null;
  const baseId = identifier.slice(0, lastDash);
  const suffix = Number(identifier.slice(lastDash + 1));
  if (!baseId || Number.isNaN(suffix)) return null;

  try {
    const ref = doc(db, collectionName, baseId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;

    const docData = snapshot.data();
    const entries = collectCollegeEntries(docData);
    const entry = entries[suffix];
    if (entry && typeof entry === "object") {
      const merged: CollegeRecord = {
        id: identifier,
        sourceId: baseId,
        ...docData,
        ...entry,
      };
      const explicit = typeof entry.slug === "string" ? entry.slug.trim() : "";
      const slug = explicit || getCollegeSlug({ id: baseId, ...docData, ...entry });
      if (slug) merged.slug = slug;
      return merged;
    }
    const fallbackRecord: CollegeRecord = { id: baseId, ...docData };
    const fallbackSlug = getCollegeSlug(fallbackRecord);
    if (fallbackSlug) fallbackRecord.slug = fallbackSlug;
    return fallbackRecord;
  } catch (error) {
    console.warn(`Failed to fetch composite entry ${collectionName}/${baseId}`, error);
    return null;
  }
}

async function resolveCollege(identifier: string): Promise<CollegeRecord | null> {
  const collections = ["colleges", "courses"];
  
  // 1. Direct slug lookup (preferred)
  for (const collectionName of collections) {
    const bySlug = await getDocBySlug(collectionName, identifier);
    if (bySlug) return bySlug as CollegeRecord;
  }

  // 2. Generated slug lookup for docs or nested entries without explicit slug field
  for (const collectionName of collections) {
    const byGenerated = await getDocByGeneratedSlug(collectionName, identifier);
    if (byGenerated) return byGenerated as CollegeRecord;
  }

  // 3. Fallback to ID lookup (handles older ID links)
  for (const collectionName of collections) {
    const byId = await getDocById(collectionName, identifier);
    if (byId) return byId as CollegeRecord;

    const byComposite = await getEntryByCompositeId(collectionName, identifier);
    if (byComposite) return byComposite as CollegeRecord;
  }

  return null;
}

export default function CourseCollegePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const currentYear = new Date().getFullYear();
  const { slug } = use(params);
  const router = useRouter();
  const [college, setCollege] = useState<CollegeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [expandedProgramGroups, setExpandedProgramGroups] = useState<Record<string, boolean>>({});
  const [registerModal, setRegisterModal] = useState<{
    open: boolean;
    action: "admission" | "brochure" | "eligibility";
    program?: string;
  }>({ open: false, action: "admission" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    currentCourse: "",
  });
  const [registerStatus, setRegisterStatus] = useState("");
  const [courseDurations, setCourseDurations] = useState<Record<string, string>>({});

  const toggleProgramGroup = (category: string) => {
    setExpandedProgramGroups((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const openRegisterModal = (
    action: "admission" | "brochure" | "eligibility",
    program?: string
  ) => {
    setRegisterModal({ open: true, action, program });
    setRegisterForm((prev) => ({
      ...prev,
      currentCourse: program || prev.currentCourse,
    }));
    setRegisterStatus("");
  };

  const closeRegisterModal = () => {
    setRegisterModal({ open: false, action: "admission" });
    setRegisterStatus("");
  };

  const handleRegisterInput = (field: keyof typeof registerForm, value: string) => {
    setRegisterForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = {
        fullName: registerForm.fullName.trim(),
        phone: registerForm.phone.trim(),
        email: registerForm.email.trim(),
        currentCourse: registerForm.currentCourse.trim(),
        collegeId: college?.id || null,
        collegeName:
          collegeName ||
          college?.name ||
          college?.collegeName ||
          college?.instituteName ||
          college?.universityName ||
          "",
        city: college?.city || "",
        state: college?.state || "",
        country: college?.country || "",
        action: registerModal.action,
        program: registerModal.program || "",
        source: "course_college_page",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "admissions"), payload);
      setRegisterStatus("Thanks! Our counsellor will contact you shortly.");
      setTimeout(() => {
        closeRegisterModal();
      }, 1800);
    } catch (error) {
      console.error("Error saving admission data:", error);
      setRegisterStatus("Something went wrong. Please try again.");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCollege = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await resolveCollege(slug);
        
        if (!isMounted) return;

        if (!data) {
          setCollege(null);
          setLoading(false);
          return;
        }

        const explicitSlug =
          typeof data.slug === "string" && data.slug.trim() ? data.slug.trim() : "";

        // If we fetched via explicit slug but the URL differs, redirect once
        if (explicitSlug && explicitSlug !== slug) {
          setRedirecting(true);
          router.replace(`/course/college/${explicitSlug}`);
          return;
        }

        // If the identifier looks like an ID, redirect to the derived slug
        if (looksLikeId(slug)) {
          const fallbackSlug = explicitSlug || getCollegeSlug(data);
          if (fallbackSlug && fallbackSlug !== slug) {
            setRedirecting(true);
            router.replace(`/course/college/${fallbackSlug}`);
            return;
          }
        }

        setCollege(data as CollegeRecord | null);
      } catch (error) {
        console.error("Error loading course college page:", error);
        if (isMounted) {
          setCollege(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchCollege();
    return () => {
      isMounted = false;
    };
  }, [slug, router]);

  // Load generic course durations (e.g. MBBS = 5.5 Years) from `courses` collection
  useEffect(() => {
    const fetchCourseDurations = async () => {
      if (!college) return;
      try {
        const snapshot = await getDocs(collection(db, "courses"));
        const map: Record<string, string> = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const courseName = (data.courseName || data.name || "").trim();
          const duration =
            (data.duration || data.courseDuration || data.durationText || "").toString().trim();
          if (!courseName || !duration) return;

          const shortForm = getCourseShortForm(courseName);
          if (!shortForm) return;

          if (!map[shortForm]) {
            map[shortForm] = duration;
          }
        });

        setCourseDurations(map);
      } catch (error) {
        console.error("Error fetching course durations:", error);
      }
    };

    fetchCourseDurations();
  }, [college]);

  if (redirecting || loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="bg-white p-6 rounded-2xl shadow-sm border animate-pulse space-y-4">
            <div className="h-8 w-1/3 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!college) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">College Not Found</h1>
          <p className="text-gray-600">
            We could not find the requested college. It might have been removed or renamed.
          </p>
          <Link
            href="/course"
            className="inline-flex items-center px-4 py-2 rounded-full border border-red-700 text-red-700 hover:bg-red-50 transition"
          >
            Back to Courses
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const collegeName =
    college.name ||
    college.collegeName ||
    college.instituteName ||
    college.universityName ||
    "Unnamed College";
  const city = college.city || "";
  const state = college.state || "";
  const country = college.country || "India";
  const address = college.address;
  const website = college.website || college.url || college.applyUrl || "";
  const averageFees =
    college.avgFee || college.averageFee || college.totalFees || college.fees || "NA";
  const rating =
    typeof college.rating === "number" ? college.rating.toFixed(1) : college.rating;
  const approvalsArray = Array.isArray(college.approvals)
    ? college.approvals
    : college.approvals
    ? [college.approvals]
    : [];
  const streamsArray = Array.isArray(college.streams) ? college.streams : [];
  const coursesArray = Array.isArray(college.coursesOffered)
    ? college.coursesOffered
    : Array.isArray(college.courses)
    ? college.courses
    : Array.isArray(college.programs)
    ? college.programs
    : college.coursesOffered
    ? [college.coursesOffered]
    : [];
  const facilitiesArray = Array.isArray(college.facilities)
    ? college.facilities
    : college.facilities
    ? [college.facilities]
    : [];
  const admissionProcessArray = Array.isArray(college.admissionProcess)
    ? college.admissionProcess
    : college.admissionProcess
    ? [college.admissionProcess]
    : [];
  const examsArray = Array.isArray(college.examsAccepted)
    ? college.examsAccepted
    : Array.isArray(college.exams)
    ? college.exams
    : college.examsAccepted
    ? [college.examsAccepted]
    : [];
  const description =
    college.description || college.overview || college.about || college.notes || "";
  const heroImage = college.image || college.banner || college.logo || DEFAULT_IMAGE;
  const contactPhone = college.phone || college.contactNumber || college.contact?.phone;
  const contactEmail = college.email || college.contact?.email;
  const collegeSlug = getCollegeSlug(college) || college.id;
  const programEntries = buildProgramsFromCollege(college);
  const programGroups = groupProgramsByCategory(programEntries);
  const primaryProgram = programEntries[0];
  
  // Additional fields from Firestore
  const galleryImages = Array.isArray((college as any).galleryImages) 
    ? (college as any).galleryImages 
    : (college as any).galleryImages 
    ? [(college as any).galleryImages] 
    : [];
  const videos = Array.isArray((college as any).videos) 
    ? (college as any).videos 
    : (college as any).videos 
    ? [(college as any).videos] 
    : [];
  const highlights = (college as any).highlights || "";
  const cutoff = (college as any).cutoff || "";
  const admissionEligibility = (college as any).admissionEligibility || "";
  const scholarships = (college as any).scholarships || "";
  const placements = (college as any).placements || "";
  const topRecruiters = Array.isArray((college as any).topRecruiters) 
    ? (college as any).topRecruiters 
    : (college as any).topRecruiters 
    ? [(college as any).topRecruiters] 
    : [];
  const events = (college as any).events || "";
  const news = (college as any).news || "";
  const reviews = (college as any).reviews || "";
  const establishedYear = (college as any).establishedYear || "";
  const collegeCode = (college as any).collegeCode || "";
  const pincode = (college as any).pincode || "";
  const facebook = (college as any).facebook || "";
  const twitter = (college as any).twitter || "";
  const linkedin = (college as any).linkedin || "";
  const instagram = (college as any).instagram || "";
  const nirfRanking = (college as any).nirfRanking || (college as any).nirfRank || (college as any).ranking || "";
  const highestPackage = (college as any).highestPackage || (college as any).highestSalary || "";
  const averageSalary = (college as any).averageSalary || "";
  const intakeCapacity = (college as any).intakeCapacity || "";
  const facultyCount = (college as any).facultyCount || "";
  const studentCount = (college as any).studentCount || "";
  const departments = Array.isArray((college as any).departments) ? (college as any).departments : [];
  const hostels = (college as any).hostels || "";
  const labs = (college as any).labs || "";
  const libraries = (college as any).libraries || "";
  const transport = (college as any).transport || "";

  const quickFacts = [
    { label: "City", value: city },
    { label: "State", value: state },
    { label: "Country", value: country },
    { label: "Average Fees", value: averageFees },
    { label: "Rating", value: rating },
    { label: "Contact", value: contactPhone },
    { label: "Email", value: contactEmail },
  ].filter((fact) => fact.value);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-10 space-y-8">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:underline text-red-700">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/course" className="hover:underline text-red-700">
            Courses
          </Link>{" "}
          / <span>{collegeName}</span>
        </nav>

        <section id="info" className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="grid md:grid-cols-[2fr_1fr]">
            <div className="p-6 md:p-10">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="relative w-full max-w-xs mx-auto lg:mx-0 aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  {isValidImageUrl(heroImage) ? (
                    <Image
                      src={heroImage}
                      alt={collegeName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 320px"
                      unoptimized={heroImage.startsWith("http://") || heroImage.startsWith("https://")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-semibold">
                      {collegeName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-red-600 font-semibold mb-1">
                      Featured College
                    </p>
                    <h1 className="text-3xl font-bold text-gray-900">{collegeName}</h1>
                    <p className="text-gray-600 text-sm mt-2">
                      {address || [city, state, country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                      <p className="text-xs uppercase text-red-600 tracking-wide">Average Fees</p>
                      <p className="text-2xl font-bold text-red-800 mt-1">
                        {typeof averageFees === "number" ? `₹${averageFees}` : averageFees}
                      </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                      <p className="text-xs uppercase text-emerald-600 tracking-wide">Streams</p>
                      <p className="text-2xl font-bold text-emerald-800 mt-1">
                        {streamsArray.length > 0 ? streamsArray.length : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {approvalsArray.slice(0, 4).map((approval, idx) => (
                      <span
                        key={`${approval}-${idx}`}
                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                      >
                        {approval}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-5 py-2 rounded-full bg-red-700 text-white text-sm font-semibold shadow hover:bg-red-800 transition"
                      >
                        Continue to Official Website
                      </a>
                    )}
                    <Link
                      href={`/colleges/${collegeSlug}`}
                      className="inline-flex items-center px-5 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold hover:border-red-700 hover:text-red-700 transition"
                    >
                      View Full College Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <aside id="faculty" className="bg-gray-50 border-l border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Information</h2>
              <div className="space-y-3">
                {quickFacts.map((fact) => (
                  <div key={fact.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{fact.label}</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[160px]">
                      {fact.value}
                    </span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        {/* Section Tabs (Info / Courses & Fees / Cutoff / Admissions / Placements / Faculty / Gallery) */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex gap-4 overflow-x-auto text-sm font-semibold text-gray-600">
            {[
              { id: "info", label: "Info" },
              { id: "courses-fees", label: "Courses & Fees" },
              { id: "cutoff", label: "Cutoff" },
              { id: "admissions", label: `Admissions ${currentYear}` },
              { id: "placements", label: "Placements" },
              { id: "faculty", label: "Faculty" },
              { id: "gallery", label: "Gallery" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(tab.id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="px-3 py-2 border-b-2 border-transparent hover:border-red-700 hover:text-red-700 whitespace-nowrap"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <section id="courses-fees" className="grid lg:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="lg:col-span-2 space-y-6">
            {description && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Overview</h3>
                <p className="text-gray-600 leading-relaxed">{description}</p>
              </div>
            )}

            {programEntries.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 animate-fade-in-up">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{programEntries.length} Programs • {collegeName}</p>
                    <h3 className="text-2xl font-semibold text-gray-900">Courses & Fees</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => openRegisterModal("eligibility", primaryProgram?.name)}
                      className="px-5 py-2 rounded-full border border-red-700 text-red-700 font-semibold hover:bg-red-50 transition"
                    >
                      Check Eligibility
                    </button>
                    <button
                      onClick={() => openRegisterModal("brochure", primaryProgram?.name)}
                      className="px-5 py-2 rounded-full bg-red-700 text-white font-semibold shadow hover:bg-red-800 transition"
                    >
                      Brochure
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {programGroups.map((group) => {
                    const categoryKey = group.category || "Programs";
                    const expanded = expandedProgramGroups[categoryKey];
                    const visiblePrograms = expanded ? group.programs : group.programs.slice(0, 4);
                    return (
                      <div key={categoryKey} className="rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              {group.programs.length} Programs
                            </p>
                            <h4 className="text-lg font-semibold text-gray-900">{categoryKey}</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openRegisterModal("eligibility", categoryKey)}
                              className="px-4 py-2 text-sm rounded-full border border-gray-300 text-gray-700 hover:border-red-700 hover:text-red-700 transition"
                            >
                              Check Eligibility
                            </button>
                            <button
                              onClick={() => openRegisterModal("brochure", categoryKey)}
                              className="px-4 py-2 text-sm rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                            >
                              Brochure
                            </button>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {visiblePrograms.map((program) => {
                            const isGenericLevel =
                              program.name === "Under Graduate (UG)" ||
                              program.name === "Post Graduate (PG)";
                            const content = isGenericLevel ? (
                              <span>{program.name}</span>
                            ) : (
                              <Link
                                href={`/course/${slugify(program.name)}`}
                                className="hover:text-red-700 hover:underline"
                              >
                                {program.name}
                              </Link>
                            );

                            return (
                                <div
                                  key={`${categoryKey}-${program.id}`}
                                  className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between animate-card-hover"
                                >
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {(() => {
                                      const key =
                                        getCourseShortForm(program.name) || program.name || "";
                                      const fromCourses = key ? courseDurations[key] : undefined;
                                      const durationText = (fromCourses || program.duration || "")
                                        .toString()
                                        .trim();
                                      const metaParts: string[] = [];
                                      if (durationText) metaParts.push(durationText);
                                      if (program.level) metaParts.push(program.level);
                                      return metaParts.join(" • ");
                                    })()}
                                  </p>
                                  <h5 className="text-lg font-semibold text-gray-900">
                                    {content}
                                  </h5>
                                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                                    <span>
                                      Total Fees:{" "}
                                      <span className="font-semibold text-gray-900">
                                        {program.totalFees || "—"}
                                      </span>
                                    </span>
                                    <span>
                                      Seats:{" "}
                                      <span className="font-semibold text-gray-900">
                                        {program.seats || "—"}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  <button
                                    onClick={() => openRegisterModal("admission", program.name)}
                                    className="px-4 py-2 rounded-full bg-red-700 text-white font-semibold hover:bg-red-800 transition"
                                  >
                                    {`Admission ${currentYear}`}
                                  </button>
                                  <button
                                    onClick={() => openRegisterModal("brochure", program.name)}
                                    className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:border-red-700 hover:text-red-700 transition"
                                  >
                                    View Brochure
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {group.programs.length > 4 && (
                          <button
                            onClick={() => toggleProgramGroup(categoryKey)}
                            className="w-full py-3 text-sm font-semibold text-red-700 bg-white hover:bg-red-50 transition"
                          >
                            {expanded ? "Show Less Programs" : "Show All Programs"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {coursesArray.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Popular Courses</h3>
                <div className="flex flex-wrap gap-2">
                  {coursesArray.slice(0, 12).map((course, idx) => (
                    <span
                      key={`${course}-${idx}`}
                      className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium"
                    >
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {admissionProcessArray.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Admission Process</h3>
                <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                  {admissionProcessArray.map((step, idx) => (
                    <li key={`${step}-${idx}`}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Highlights */}
            {highlights && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Highlights</h3>
                {typeof highlights === "string" ? (
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line">{highlights}</div>
                ) : (
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    {Array.isArray(highlights) ? (
                      highlights.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))
                    ) : (
                      <li>{String(highlights)}</li>
                    )}
                  </ul>
                )}
              </div>
            )}

            {/* Admission Eligibility */}
            {admissionEligibility && (
              <div id="admissions" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Admission Eligibility</h3>
                <p className="text-gray-600 leading-relaxed">{admissionEligibility}</p>
              </div>
            )}

            {/* Cutoff */}
            {cutoff && (
              <div id="cutoff" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Cutoff</h3>
                <p className="text-gray-600 leading-relaxed">{cutoff}</p>
              </div>
            )}

            {/* Scholarships */}
            {scholarships && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Scholarships</h3>
                {typeof scholarships === "string" ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{scholarships}</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-2 text-gray-600">
                    {Array.isArray(scholarships) ? (
                      scholarships.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))
                    ) : (
                      <li>{String(scholarships)}</li>
                    )}
                  </ul>
                )}
              </div>
            )}

            {/* Placements */}
            {placements && (
              <div id="placements" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Placements</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{placements}</p>
              </div>
            )}

            {/* Top Recruiters */}
            {topRecruiters.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Top Recruiters</h3>
                <div className="flex flex-wrap gap-2">
                  {topRecruiters.map((recruiter: string, i: number) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full border border-orange-100 text-sm"
                    >
                      {recruiter}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {events && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Events</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{events}</p>
              </div>
            )}

            {/* News */}
            {news && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">News</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{news}</p>
              </div>
            )}

            {/* Reviews */}
            {reviews && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Reviews</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{reviews}</p>
              </div>
            )}

            {/* Gallery */}
            {galleryImages.length > 0 && (
              <div id="gallery" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryImages.map((imageUrl: string, i: number) => {
                    if (!isValidImageUrl(imageUrl)) return null;
                    // Check if it's an external URL that might not be configured
                    const isExternal = imageUrl.startsWith("http://") || imageUrl.startsWith("https://");
                    if (isExternal) {
                      // Use regular img tag for external images to avoid Next.js domain restrictions
                      return (
                        <div key={i} className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={imageUrl}
                            alt={`${collegeName} - Image ${i + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Hide broken images
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      );
                    }
                    // Use Next.js Image for local/configured external images
                    return (
                      <div key={i} className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={imageUrl}
                          alt={`${collegeName} - Image ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                          unoptimized={imageUrl.startsWith("http://") || imageUrl.startsWith("https://")}
                          onError={() => {
                            // Fallback handled by isValidImageUrl check
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Videos</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {videos.map((videoUrl: string, i: number) => {
                    if (!videoUrl || typeof videoUrl !== "string") return null;
                    // Convert YouTube watch URL to embed URL
                    const embedUrl = videoUrl
                      .replace("watch?v=", "embed/")
                      .replace("youtu.be/", "youtube.com/embed/")
                      .split("&")[0]; // Remove additional parameters
                    return (
                      <div key={i} className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact Details */}
            {(contactPhone || contactEmail || address || website || facebook || twitter || linkedin || instagram) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Contact Details</h3>
                <div className="space-y-3 text-gray-600">
                  {address && (
                    <div>
                      <strong className="text-gray-800">Address:</strong>
                      <p className="mt-1">{address}</p>
                      {pincode && <p className="text-sm text-gray-500">Pincode: {pincode}</p>}
                    </div>
                  )}
                  {contactPhone && (
                    <div>
                      <strong className="text-gray-800">Phone:</strong>{" "}
                      <a href={`tel:${contactPhone}`} className="text-red-700 hover:underline">{contactPhone}</a>
                    </div>
                  )}
                  {contactEmail && (
                    <div>
                      <strong className="text-gray-800">Email:</strong>{" "}
                      <a href={`mailto:${contactEmail}`} className="text-red-700 hover:underline">{contactEmail}</a>
                    </div>
                  )}
                  {website && (
                    <div>
                      <strong className="text-gray-800">Website:</strong>{" "}
                      <a href={website} target="_blank" rel="noopener noreferrer" className="text-red-700 hover:underline">{website}</a>
                    </div>
                  )}
                  {(facebook || twitter || linkedin || instagram) && (
                    <div className="pt-2">
                      <strong className="text-gray-800 block mb-2">Social Media:</strong>
                      <div className="flex gap-3">
                        {facebook && (
                          <a href={facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Facebook
                          </a>
                        )}
                        {twitter && (
                          <a href={twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            Twitter
                          </a>
                        )}
                        {linkedin && (
                          <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                            LinkedIn
                          </a>
                        )}
                        {instagram && (
                          <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">
                            Instagram
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {examsArray.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Exams Accepted</h3>
                <div className="flex flex-wrap gap-2">
                  {examsArray.map((exam, idx) => (
                    <span
                      key={`${exam}-${idx}`}
                      className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold"
                    >
                      {exam}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {facilitiesArray.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Facilities</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  {facilitiesArray.slice(0, 10).map((facility, idx) => (
                    <li key={`${facility}-${idx}`} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                      <span>{facility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Information */}
            {(establishedYear || collegeCode || nirfRanking || intakeCapacity || facultyCount || studentCount || highestPackage || averageSalary) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="space-y-2 text-gray-600 text-sm">
                  {establishedYear && (
                    <div className="flex justify-between border-b pb-2">
                      <span>Established Year</span>
                      <span className="font-medium">{establishedYear}</span>
                    </div>
                  )}
                  {collegeCode && (
                    <div className="flex justify-between border-b pb-2">
                      <span>College Code</span>
                      <span className="font-medium">{collegeCode}</span>
                    </div>
                  )}
                  {nirfRanking && (
                    <div className="flex justify-between border-b pb-2">
                      <span>NIRF Ranking</span>
                      <span className="font-medium">{nirfRanking}</span>
                    </div>
                  )}
                  {intakeCapacity && (
                    <div className="flex justify-between border-b pb-2">
                      <span>Intake Capacity</span>
                      <span className="font-medium">{intakeCapacity}</span>
                    </div>
                  )}
                  {facultyCount && (
                    <div className="flex justify-between border-b pb-2">
                      <span>Faculty Count</span>
                      <span className="font-medium">{facultyCount}</span>
                    </div>
                  )}
                  {studentCount && (
                    <div className="flex justify-between border-b pb-2">
                      <span>Student Count</span>
                      <span className="font-medium">{studentCount}</span>
                    </div>
                  )}
                  {highestPackage && (
                    <div className="flex justify-between border-b pb-2">
                      <span>Highest Package</span>
                      <span className="font-medium">
                        {typeof highestPackage === "number" 
                          ? `₹${(highestPackage / 100000).toFixed(1)} LPA` 
                          : String(highestPackage)}
                      </span>
                    </div>
                  )}
                  {averageSalary && (
                    <div className="flex justify-between">
                      <span>Average Salary</span>
                      <span className="font-medium">
                        {typeof averageSalary === "number" 
                          ? `₹${(averageSalary / 100000).toFixed(1)} LPA` 
                          : String(averageSalary)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Infrastructure */}
            {(hostels || labs || libraries || transport) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Infrastructure</h3>
                <div className="space-y-2 text-gray-600 text-sm">
                  {hostels && (
                    <div className="flex justify-between border-b pb-2">
                      <span>Hostels</span>
                      <span className="font-medium">{hostels}</span>
                    </div>
                  )}
                  {labs && (
                    <div className="flex justify-between border-b pb-2">
                      <span>Labs</span>
                      <span className="font-medium">{labs}</span>
                    </div>
                  )}
                  {libraries && (
                    <div className="flex justify-between border-b pb-2">
                      <span>Libraries</span>
                      <span className="font-medium">{libraries}</span>
                    </div>
                  )}
                  {transport && (
                    <div className="flex justify-between">
                      <span>Transport</span>
                      <span className="font-medium">{transport}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Departments */}
            {departments.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Departments</h3>
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 text-sm"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Looking for more options?</h3>
              <p className="text-gray-600">
                Browse more colleges across different courses powered by your Firestore data.
              </p>
            </div>
            <Link
              href="/course"
              className="inline-flex items-center px-5 py-2 rounded-full border border-red-700 text-red-700 font-semibold hover:bg-red-50 transition"
            >
              Back to Courses
            </Link>
          </div>
        </section>
      </div>

      <Footer />
      {registerModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <button
              onClick={closeRegisterModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close registration form"
            >
              ×
            </button>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
              {registerModal.action === "brochure"
                ? "Register to Download Brochure"
                : registerModal.action === "eligibility"
                ? "Check Eligibility"
                : `College Admission ${currentYear}`}
            </p>
            <h3 className="mt-1 text-2xl font-semibold text-gray-900">{collegeName}</h3>
            <p className="text-sm text-gray-500">
              {registerModal.program
                ? `${registerModal.program} • Personalized guidance`
                : "Guidance for navigating the admissions process with up-to-date tips."}
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="course-register-name">
                  Full Name
                </label>
                <input
                  id="course-register-name"
                  type="text"
                  value={registerForm.fullName}
                  onChange={(event) => handleRegisterInput("fullName", event.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-red-600 focus:outline-none"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="course-register-phone">
                  Mobile Number
                </label>
                <div className="flex rounded-xl border border-gray-200 focus-within:border-red-600">
                  <span className="inline-flex items-center border-r border-gray-200 px-3 text-sm text-gray-500">
                    +91
                  </span>
                  <input
                    id="course-register-phone"
                    type="tel"
                    value={registerForm.phone}
                    onChange={(event) => handleRegisterInput("phone", event.target.value)}
                    required
                    pattern="[0-9]{10}"
                    className="flex-1 rounded-r-xl px-3 py-2 focus:outline-none"
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="course-register-email">
                  Email
                </label>
                <input
                  id="course-register-email"
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => handleRegisterInput("email", event.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-red-600 focus:outline-none"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="course-register-current">
                  Current Course
                </label>
                <input
                  id="course-register-current"
                  type="text"
                  value={registerForm.currentCourse}
                  onChange={(event) => handleRegisterInput("currentCourse", event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-red-600 focus:outline-none"
                  placeholder="Eg. BBA / B.Tech"
                />
              </div>
              {registerStatus && (
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {registerStatus}
                </div>
              )}
              <button
                type="submit"
                className="w-full rounded-2xl bg-red-700 py-3 text-center text-white font-semibold shadow hover:bg-red-800 transition"
              >
                Register
              </button>
              {/* Google sign-in hidden */}
              <p className="text-center text-xs text-gray-500">
                By submitting, you accept our Terms, Privacy Policy and consent to SMS updates.
              </p>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

