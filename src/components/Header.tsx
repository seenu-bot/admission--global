'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { contactDetails, navigationLinks, socialLinks, headerData, navigationData2, navigationData } from "@/json/Header";
import { db } from "@/firebase/firebase";
import { collection, onSnapshot, query, getDocs } from "firebase/firestore";
import HomeSearchModal from "@/components/HomeSearchModal";



interface Course {
  id: string;
  courseName: string;
  shortForm: string;
  entranceExams?: string[];
  description?: string;
}

interface ExamInfo {
  name: string;
  id: string;
}

interface CourseDetails {
  exams: ExamInfo[];
  cities: string[];
  states: string[];
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeNavIndex, setActiveNavIndex] = useState<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [mbbsCities, setMbbsCities] = useState<string[]>([]);
  const [mbbsCountries, setMbbsCountries] = useState<string[]>([]);

  const [mbaStates, setMbaStates] = useState<string[]>([]);
  const [bbaStates, setBbaStates] = useState<string[]>([]);
  const [mtechStates, setMtechStates] = useState<string[]>([]);
  const [btechCities, setBtechCities] = useState<string[]>([]);
  const [paramedicalCourses, setParamedicalCourses] = useState<string[]>([]);
  const [paramedicalDiplomaCourses, setParamedicalDiplomaCourses] = useState<string[]>([]);
  const [paramedicalCities, setParamedicalCities] = useState<string[]>([]);
  const [paramedicalColleges, setParamedicalColleges] = useState<
    { id: string; name: string; city?: string }[]
  >([]);
  const [paramedicalLoading, setParamedicalLoading] = useState<boolean>(true);
  
  // Explore Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseDetails, setCourseDetails] = useState<CourseDetails>({ exams: [], cities: [], states: [] });
  
  const combinedNavigation = useMemo(() => {
    const availableNavigation = [...(navigationData || []), ...(navigationData2 || [])];
    const desiredOrder = ['MBBS', 'Engineering', 'Management', 'Paramedical', 'Explore Courses', 'More'];

    const orderedNavigation = desiredOrder
      .map((heading) =>
        availableNavigation.find((nav) => (nav.heading || 'Explore Courses') === heading)
      )
      .filter(Boolean);

    const remainingNavigation = availableNavigation.filter(
      (nav) => !desiredOrder.includes(nav.heading || 'Explore Courses')
    );

    return [...orderedNavigation, ...remainingNavigation];
  }, []);

  // Helper function to ensure URLs are absolute
  const normalizeUrl = (url: string | undefined): string => {
    if (!url) return '/';
    // Remove any leading/trailing whitespace
    const trimmedUrl = url.trim();
    // Special case: if url is "articles" (without slash), make sure it's "/articles"
    if (trimmedUrl === 'articles') {
      return '/articles';
    }
    // If URL already starts with /, http, or https, return as is
    if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('mailto:') || trimmedUrl.startsWith('tel:')) {
      return trimmedUrl;
    }
    // Otherwise, make it absolute by adding leading slash
    return `/${trimmedUrl}`;
  };

  // Lightweight MBBS detector for header (kept minimal for perf)
  const isMbbsCollege = (data: any) => {
    const text = JSON.stringify(data || {}).toLowerCase();
    if (text.includes('mbbs') || text.includes('bachelor of medicine')) return true;
    const name = String(data?.name || data?.collegeName || '').toLowerCase();
    return name.includes('medical');
  };

  const gatherStrings = (val: any, depth = 0): string[] => {
    if (!val || depth > 2) return [];
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return [String(val)];
    }
    if (Array.isArray(val)) {
      return val.flatMap((v) => gatherStrings(v, depth + 1));
    }
    if (typeof val === 'object') {
      return Object.values(val).flatMap((v) => gatherStrings(v, depth + 1));
    }
    return [];
  };

  const isMbaCourse = (data: any) => {
    const categoryText = gatherStrings([data.category, data.categories, data.tags, data.courseName, data.name])
      .join(' ')
      .toLowerCase();
    const levelText = gatherStrings([data.courseLevel, data.level])
      .join(' ')
      .toLowerCase();
    const hasMbaCategory = categoryText.includes('mba');
    const isPgLevel =
      levelText.includes('pg') || levelText.includes('postgraduate') || levelText.includes('post graduate');
    return hasMbaCategory && isPgLevel;
  };

  const BBA_KEYWORDS = ['bba', 'bbm', 'bachelor of business administration', 'business administration'];

  // Detect MBA colleges (from "colleges" collection) based on coursesOffered and related fields
  const MBA_COLLEGE_KEYWORDS = ['mba', 'pgdm', 'pgp', 'master of business administration', 'business administration'];

  const isMbaCollegeDoc = (data: any): boolean => {
    const text = buildTextBlob(
      data.coursesOffered,
      data.courses,
      data.programs,
      data.programmes,
      data.departments,
      data.streams,
      data.tags,
      data.description,
      data.about,
      data.overview
    );
    return MBA_COLLEGE_KEYWORDS.some((keyword) => text.includes(keyword));
  };

  const mentionsBba = (entry: any, fallback?: any) => {
    const text = buildTextBlob(
      entry?.name,
      entry?.collegeName,
      entry?.courseName,
      entry?.title,
      entry?.program,
      entry?.programs,
      entry?.courses,
      entry?.coursesOffered,
      entry?.streams,
      entry?.tags,
      entry?.description,
      fallback?.courseName,
      fallback?.name,
      fallback?.coursesOffered,
      fallback?.programs,
      fallback?.tags,
      fallback?.description
    );
    return BBA_KEYWORDS.some((keyword) => text.includes(keyword));
  };

  const isBbaCourse = (data: any) => {
    const text = buildTextBlob(
      data.courseName,
      data.name,
      data.title,
      data.program,
      data.programs,
      data.courses,
      data.coursesOffered,
      data.tags,
      data.description
    );
    if (BBA_KEYWORDS.some((keyword) => text.includes(keyword))) {
      const levelText = buildTextBlob(data.courseLevel, data.level, data.programLevel, data.degreeLevel);
      const ugIndicators = ['ug', 'undergraduate', 'bachelor', 'graduate'];
      const excludeKeywords = ['mba', 'pgdm', 'pg', 'postgraduate', 'master', 'pgp'];
      const isUgLevel =
        ugIndicators.some((term) => levelText.includes(term)) ||
        (!levelText.includes('pg') && !levelText.includes('postgraduate'));
      const isExcluded = excludeKeywords.some((term) => levelText.includes(term) || text.includes(term));
      return isUgLevel && !isExcluded;
    }
    return false;
  };

  const isMtechCourse = (data: any) => {
    const categoryText = gatherStrings([
      data.category,
      data.categories,
      data.categoryName,
      data.tags,
      data.courseName,
      data.name,
    ])
      .join(' ')
      .toLowerCase();

    const levelText = gatherStrings([
      data.courseLevel,
      data.level,
      data.programLevel,
      data.degreeLevel,
    ])
      .join(' ')
      .toLowerCase();

    // PG indicators
    const pgIndicators = ['pg', 'postgraduate', 'post graduate', 'masters', 'master'];
    const isPgLevel = pgIndicators.some((term) => levelText.includes(term));

    // M.Tech keywords
    const mtechKeywords = [
      'm.tech',
      'mtech',
      'm.e',
      'me',
      'master of technology',
      'master of engineering',
    ];
    const isMtechKeyword = mtechKeywords.some((term) => categoryText.includes(term));

    // Exclude UG/B.Tech
    const excludeKeywords = ['b.tech', 'btech', 'bachelor', 'undergraduate', 'ug'];
    const isExcluded = excludeKeywords.some(
      (term) => categoryText.includes(term) || levelText.includes(term)
    );

    // Check if it's an M.Tech course document
    if (isMtechKeyword && isPgLevel && !isExcluded) return true;
    
    // Also check coursesOffered field for colleges collection
    const coursesOffered = gatherStrings([
      data.coursesOffered,
      data.courses,
      data.programs,
      data.programmes,
      data.offeredCourses,
      data.availableCourses,
    ]).join(' ').toLowerCase();
    
    return mtechKeywords.some((term) => coursesOffered.includes(term));
  };

  const isBtechCourse = (data: any) => {
    const categoryText = gatherStrings([
      data.category,
      data.categories,
      data.categoryName,
      data.tags,
      data.courseName,
      data.name,
    ])
      .join(' ')
      .toLowerCase();

    const levelText = gatherStrings([
      data.courseLevel,
      data.level,
      data.programLevel,
      data.degreeLevel,
    ])
      .join(' ')
      .toLowerCase();

    // UG indicators
    const ugIndicators = ['ug', 'undergraduate', 'bachelor'];
    const isUgLevel = ugIndicators.some((term) => levelText.includes(term)) || !levelText.includes('pg') && !levelText.includes('postgraduate');

    // B.Tech keywords
    const btechKeywords = [
      'b.tech',
      'btech',
      'b.e',
      'be',
      'bachelor of technology',
      'bachelor of engineering',
    ];
    const isBtechKeyword = btechKeywords.some((term) => categoryText.includes(term));

    // Exclude PG/M.Tech
    const excludeKeywords = ['m.tech', 'mtech', 'm.e', 'master', 'postgraduate', 'pg'];
    const isExcluded = excludeKeywords.some(
      (term) => categoryText.includes(term) || levelText.includes(term)
    );

    // Check if it's a B.Tech course document
    if (isBtechKeyword && isUgLevel && !isExcluded) return true;
    
    // Also check coursesOffered field for colleges collection
    const coursesOffered = gatherStrings([
      data.coursesOffered,
      data.courses,
      data.programs,
      data.programmes,
      data.offeredCourses,
      data.availableCourses,
    ]).join(' ').toLowerCase();
    
    return btechKeywords.some((term) => coursesOffered.includes(term));
  };

  const extractField = (obj: any, keys: string[]): any => {
    if (!obj) return undefined;
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
    }
    if (obj.location) {
      for (const key of keys) {
        if (obj.location[key] !== undefined && obj.location[key] !== null && obj.location[key] !== '') return obj.location[key];
      }
    }
    if (obj.address) {
      for (const key of keys) {
        if (obj.address[key] !== undefined && obj.address[key] !== null && obj.address[key] !== '') return obj.address[key];
      }
    }
    return undefined;
  };

  const collectEntries = (data: any): any[] => {
    const sources = [
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
    sources.forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item && typeof item === 'object') entries.push(item);
        });
      }
    });
    if (entries.length === 0) entries.push(data);
    return entries;
  };

  const buildTextBlob = (...values: any[]): string =>
    gatherStrings(values)
      .join(' ')
      .toLowerCase();

  const PARAMEDICAL_KEYWORDS = [
    'paramedical',
    'physiotherapy',
    'bpt',
    'bachelor of physiotherapy',
    'nursing',
    'bsc nursing',
    'gnm',
    'mlt',
    'medical laboratory',
    'medical lab technology',
    'laboratory technology',
    'occupational therapy',
    'optometry',
    'dialysis technology',
    'dialysis technician',
    'anesthesia technology',
    'anaesthesia technology',
    'radiology',
    'medical imaging',
    'imaging technology',
    'operation theatre technology',
    'ott',
    'speech therapy',
    'audiology',
    'nuclear medicine',
    'emergency medical technology'
  ];

  const DIPLOMA_KEYWORDS = [
    'diploma',
    'pg diploma',
    'postgraduate diploma',
    'post graduate diploma',
    'certificate',
    'certification'
  ];

  const isParamedicalCourseDoc = (data: any): boolean => {
    const text = buildTextBlob(
      data.courseName,
      data.shortForm,
      data.shortName,
      data.name,
      data.title,
      data.subtitle,
      data.category,
      data.categories,
      data.courseCategory,
      data.stream,
      data.branch,
      data.program,
      data.programs,
      data.courses,
      data.coursesOffered,
      data.tags,
      data.discipline,
      data.description,
      data.about,
      data.overview,
      data.specializations,
      data.departments
    );
    return PARAMEDICAL_KEYWORDS.some((keyword) => text.includes(keyword));
  };

  const getParamedicalCourseLabel = (data: any): string | undefined => {
    const candidates = [
      data.courseName,
      data.name,
      data.title,
      data.shortForm,
      data.shortName,
      data.subtitle,
      data.program
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
    const aliasOptions = gatherStrings([data.aliases, data.tags, data.courses]);
    const alias = aliasOptions.find((value) => value && value.trim());
    return alias ? alias.trim() : undefined;
  };

  const isDiplomaOrCertificateProgram = (data: any, label?: string): boolean => {
    const text = buildTextBlob(
      label,
      data.courseLevel,
      data.programLevel,
      data.programType,
      data.degreeLevel,
      data.description,
      data.about,
      data.subtitle,
      data.tags,
      data.category,
      data.categories
    );
    return DIPLOMA_KEYWORDS.some((keyword) => text.includes(keyword));
  };

  const isParamedicalCollegeDoc = (data: any): boolean => {
    const text = buildTextBlob(
      data.collegeName,
      data.name,
      data.about,
      data.description,
      data.overview,
      data.coursesOffered,
      data.courses,
      data.programs,
      data.departments,
      data.specializations,
      data.streams,
      data.tags,
      data.categories,
      data.medicalPrograms,
      data.medicalCourses,
      collectEntries(data)
    );
    return PARAMEDICAL_KEYWORDS.some((keyword) => text.includes(keyword));
  };

  const normalize = (v?: string) =>
    (v || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Map course short forms to their course listing URLs.
  // Cities / states are NOT hardcoded here; filters are handled by the target pages using Firestore data.
  const getCourseCollegesUrl = (shortForm: string): string => {
    if (!shortForm || !selectedCourse?.id) {
      return '/course';
    }
    
    const shortFormLower = shortForm.toLowerCase().trim();
    // Also check the course name for better matching
    const courseNameLower = (selectedCourse.courseName || '').toLowerCase().trim();
    // Normalize by removing dots and spaces for better matching
    const shortFormNormalized = shortFormLower.replace(/[.\s]/g, '');
    const courseNameNormalized = courseNameLower.replace(/[.\s]/g, '');
    
    // Map only courses that have dedicated course pages
    const courseUrlMap: Record<string, string> = {
      'b.tech': '/course/engineering',
      'btech': '/course/engineering',
      'b.e': '/course/engineering',
      'be': '/course/engineering',
      'bachelor of technology': '/course/engineering',
      'bachelor of engineering': '/course/engineering',
      'bocs': '/course/engineering',
      'bachelor of computer science': '/course/engineering',
      'bachelor of computer applications': '/course/engineering',
      'bca': '/course/engineering',
      'm.tech': '/course/mtech',
      'mtech': '/course/mtech',
      'm.e': '/course/mtech',
      'me': '/course/mtech',
      'master of technology': '/course/mtech',
      'master of engineering': '/course/mtech',
      'mba': '/course/mba',
      'moba': '/course/mba',
      'master of business administration': '/course/mba',
      'bba': '/course/bba',
      'bachelor of business administration': '/course/bba',
      'mbbs': '/course/mbbs',
      'bachelor of medicine': '/course/mbbs',
    };
    
    // Check for exact match first
    if (courseUrlMap[shortFormLower]) {
      const baseUrl = courseUrlMap[shortFormLower];
      return baseUrl;
    }
    
    // Check for partial matches (normalize both for comparison)
    for (const [key, url] of Object.entries(courseUrlMap)) {
      const keyNormalized = key.toLowerCase().replace(/[.\s]/g, '');
      if (shortFormNormalized === keyNormalized || 
          shortFormNormalized.includes(keyNormalized) || 
          keyNormalized.includes(shortFormNormalized) ||
          courseNameNormalized.includes(keyNormalized) ||
          keyNormalized.includes(courseNameNormalized)) {
        return url;
      }
    }
    
    // For courses without dedicated pages, route to the generic course detail page.
    return `/course/${selectedCourse.id}`;
  };

  // Get short form of course name
  const getShortForm = (courseName: string): string => {
    if (!courseName) return '';
    const name = courseName.trim();
    
    // Common abbreviations
    const abbreviations: { [key: string]: string } = {
      'master of computer application': 'MCA',
      'bachelor of computer application': 'BCA',
      'bachelor of medicine, bachelor of surgery': 'MBBS',
      'bachelor of pharmacy': 'B.Pharm',
      'master of pharmacy': 'M.Pharm',
      'bachelor of architecture': 'B.Arch',
      'master of architecture': 'M.Arch',
      'doctor of medicine': 'MD',
      'bachelor of design': 'B.Des',
      'bachelor of arts': 'BA',
      'master of arts': 'MA',
    };
    
    const lowerName = name.toLowerCase();
    for (const [full, short] of Object.entries(abbreviations)) {
      if (lowerName.includes(full)) return short;
    }
    
    // Extract first letters of words
    const words = name.split(/\s+/);
    if (words.length > 1) {
      const firstLetters = words.map(w => w[0]?.toUpperCase() || '').join('');
      if (firstLetters.length >= 2 && firstLetters.length <= 5) {
        return firstLetters;
      }
    }
    
    // Return first word if it's short enough
    if (words[0] && words[0].length <= 10) {
      return words[0];
    }
    
    return name.substring(0, 10);
  };

  const isDesktopView = viewportWidth === null ? true : viewportWidth >= 768;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateViewport = () => setViewportWidth(window.innerWidth);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      setActiveNavIndex(null);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    if (isDesktopView) {
      setActiveNavIndex(null);
    }
  }, [isDesktopView]);

  // Helper function to normalize state names (capitalize properly and deduplicate)
  const normalizeStateName = (state: string): string => {
    if (!state) return '';
    const trimmed = state.trim();
    // Capitalize first letter of each word
    return trimmed
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    const mtechStatesSet = new Set<string>();
    const btechCitiesSet = new Set<string>();
    // Use Map to track normalized states (key: lowercase, value: best capitalized version)
    const mbaStatesMap = new Map<string, string>();
    const bbaStatesMap = new Map<string, string>();
    
    const updateMtechStates = () => {
      setMtechStates(Array.from(mtechStatesSet).sort((a, b) => a.localeCompare(b)));
    };
    
    const updateBtechCities = () => {
      setBtechCities(Array.from(btechCitiesSet).sort((a, b) => a.localeCompare(b)));
    };
    
    const updateMbaStates = () => {
      const normalized = Array.from(mbaStatesMap.values()).sort((a, b) => a.localeCompare(b));
      setMbaStates(normalized);
    };
    
    const updateBbaStates = () => {
      const normalized = Array.from(bbaStatesMap.values()).sort((a, b) => a.localeCompare(b));
      setBbaStates(normalized);
    };
    
    // Helper to add state with normalization
    const addMbaState = (state: string) => {
      if (!state) return;
      const normalized = normalizeStateName(state);
      const key = normalized.toLowerCase();
      // Keep the best capitalized version (prefer already capitalized if exists)
      const existing = mbaStatesMap.get(key);
      if (!existing || (state === normalized && existing !== normalized)) {
        mbaStatesMap.set(key, normalized);
      }
    };
    
    const addBbaState = (state: string) => {
      if (!state) return;
      const normalized = normalizeStateName(state);
      const key = normalized.toLowerCase();
      // Keep the best capitalized version (prefer already capitalized if exists)
      const existing = bbaStatesMap.get(key);
      if (!existing || (state === normalized && existing !== normalized)) {
        bbaStatesMap.set(key, normalized);
      }
    };
    
    // Fetch from colleges collection
    const collegesQ = query(collection(db, 'colleges'));
    setParamedicalLoading(true);

    const collegesUnsub = onSnapshot(
      collegesQ,
      (snap) => {
        const cities = new Set<string>();
        const countriesMap = new Map<string, string>();
        const paramedicalCitiesSet = new Set<string>();
        const paramedicalCollegesMap = new Map<string, { id: string; name: string; city?: string }>();
        snap.forEach((doc) => {
          const d = doc.data();
          if (isMbbsCollege(d)) {
            const city = d.city || d.cityName || d?.location?.city || d?.address?.city;
            const country = d.country || d.countryName || d?.location?.country || d?.address?.country;
            const normCountry = country ? normalize(String(country)) : '';
            if (normCountry === 'india') {
              if (city) cities.add(String(city));
            } else if (normCountry) {
              if (!countriesMap.has(normCountry)) {
                countriesMap.set(normCountry, String(country));
              }
            }
          }
          if (isMbaCollegeDoc(d)) {
            const state =
              extractField(d, ['state', 'stateName', 'province']) ||
              extractField(d?.location, ['state', 'stateName', 'province']);
            if (state) {
              addMbaState(String(state));
            }
          }
          if (mentionsBba(d)) {
            const state =
              extractField(d, ['state', 'stateName', 'province']) ||
              extractField(d?.location, ['state', 'stateName', 'province']);
            if (state) {
              addBbaState(String(state));
            }
          }
          if (isBtechCourse(d)) {
            // If it's a college document (has coursesOffered), extract city directly
            if (d.coursesOffered || d.courses || d.programs) {
              const city = d.city || d.cityName || 
                (d.location && (d.location.city || d.location.cityName));
              const country = d.country || d.countryName || 
                (d.location && (d.location.country || d.location.countryName)) ||
                'India';
              if (city && normalize(country) === 'india') {
                btechCitiesSet.add(String(city));
              }
            } else {
              // If it's a course document, extract from entries
              const entries = collectEntries(d);
              entries.forEach((entry) => {
                const city = extractField(entry, ['city', 'cityName']) || extractField(d, ['city', 'cityName']);
                const country =
                  extractField(entry, ['country', 'countryName']) ||
                  extractField(d, ['country', 'countryName']) ||
                  'India';
                if (!city) return;
                if (normalize(country) && normalize(country) !== 'india') return;
                btechCitiesSet.add(String(city));
              });
            }
          }
          const courseBbaEntries = collectEntries(d).filter((entry) => mentionsBba(entry, d));
          if (isBbaCourse(d) || courseBbaEntries.length > 0) {
            if (d.coursesOffered || d.courses || d.programs) {
              const state =
                d.state ||
                d.stateName ||
                d.province ||
                d?.location?.state ||
                d?.location?.stateName;
              const country =
                d.country ||
                d.countryName ||
                d?.location?.country ||
                d?.location?.countryName ||
                'India';
              if (state && normalize(country) === 'india') {
                addBbaState(String(state));
              }
            }
            (courseBbaEntries.length > 0 ? courseBbaEntries : collectEntries(d)).forEach((entry) => {
              if (!mentionsBba(entry, d) && !isBbaCourse(entry) && !isBbaCourse(d)) return;
              const state =
                extractField(entry, ['state', 'stateName', 'province']) ||
                extractField(entry?.location, ['state', 'stateName', 'province']) ||
                extractField(d, ['state', 'stateName', 'province']) ||
                extractField(d?.location, ['state', 'stateName', 'province']);
              const country =
                extractField(entry, ['country', 'countryName']) ||
                extractField(entry?.location, ['country', 'countryName']) ||
                extractField(d, ['country', 'countryName']) ||
                extractField(d?.location, ['country', 'countryName']) ||
                'India';
              if (!state) return;
              if (normalize(country) && normalize(country) !== 'india') return;
              addBbaState(String(state));
            });
          }
          if (isMtechCourse(d)) {
            // If it's a college document (has coursesOffered), extract state directly
            if (d.coursesOffered || d.courses || d.programs) {
              const state = d.state || d.stateName || d.province || 
                (d.location && (d.location.state || d.location.stateName));
              const country = d.country || d.countryName || 
                (d.location && (d.location.country || d.location.countryName)) ||
                'India';
              if (state && normalize(country) === 'india') {
                mtechStatesSet.add(String(state));
              }
            } else {
              // If it's a course document, extract from entries
              const entries = collectEntries(d);
              entries.forEach((entry) => {
                const state = extractField(entry, ['state', 'stateName', 'province']) || extractField(d, ['state', 'stateName']);
                const country =
                  extractField(entry, ['country', 'countryName']) ||
                  extractField(d, ['country', 'countryName']) ||
                  'India';
                if (!state) return;
                if (normalize(country) && normalize(country) !== 'india') return;
                mtechStatesSet.add(String(state));
              });
            }
          }
          if (isParamedicalCollegeDoc(d)) {
            const entries = collectEntries(d);
            entries.forEach((entry) => {
              const city =
                extractField(entry, ['city', 'cityName', 'district']) ||
                extractField(d, ['city', 'cityName', 'district']);
              const country =
                extractField(entry, ['country', 'countryName']) ||
                extractField(d, ['country', 'countryName']) ||
                'India';
              if (city && normalize(country) === 'india') {
                paramedicalCitiesSet.add(String(city));
              }
              const collegeName =
                extractField(entry, ['collegeName', 'name']) ||
                d.collegeName ||
                d.name;
              if (collegeName) {
                paramedicalCollegesMap.set(doc.id, {
                  id: doc.id,
                  name: String(collegeName),
                  city: city ? String(city) : undefined,
                });
              }
            });
          }
        });
        setMbbsCities(Array.from(cities).sort((a, b) => a.localeCompare(b)));
        setMbbsCountries(
          Array.from(countriesMap.values()).sort((a, b) => a.localeCompare(b))
        );
        updateMbaStates();
        updateBbaStates();
        updateMtechStates();
        updateBtechCities();
        setParamedicalCities(Array.from(paramedicalCitiesSet).sort((a, b) => a.localeCompare(b)));
        setParamedicalColleges(
          Array.from(paramedicalCollegesMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        setParamedicalLoading(false);
      },
      (error) => {
        console.error('Error fetching colleges snapshot:', error);
        setParamedicalLoading(false);
      }
    );

    // Also fetch from courses collection for M.Tech states and B.Tech cities
    const coursesQ = query(collection(db, 'courses'));
    const coursesUnsub = onSnapshot(
      coursesQ,
      (snap) => {
        const paramedicalCourseSet = new Set<string>();
        const paramedicalDiplomaSet = new Set<string>();
        snap.forEach((doc) => {
          const d = doc.data();
          if (isBtechCourse(d)) {
            // If it's a college document (has coursesOffered), extract city directly
            if (d.coursesOffered || d.courses || d.programs) {
              const city = d.city || d.cityName || 
                (d.location && (d.location.city || d.location.cityName));
              const country = d.country || d.countryName || 
                (d.location && (d.location.country || d.location.countryName)) ||
                'India';
              if (city && normalize(country) === 'india') {
                btechCitiesSet.add(String(city));
              }
            } else {
              // If it's a course document, extract from entries
              const entries = collectEntries(d);
              entries.forEach((entry) => {
                const city = extractField(entry, ['city', 'cityName']) || extractField(d, ['city', 'cityName']);
                const country =
                  extractField(entry, ['country', 'countryName']) ||
                  extractField(d, ['country', 'countryName']) ||
                  'India';
                if (!city) return;
                if (normalize(country) && normalize(country) !== 'india') return;
                btechCitiesSet.add(String(city));
              });
            }
          }
          // Collect MBA states from courses data (doc-level)
          if (isMbaCourse(d)) {
            const state =
              extractField(d, ['state', 'stateName', 'province']) ||
              extractField(d?.location, ['state', 'stateName', 'province']);
            if (state) {
              addMbaState(String(state));
            }
          }

          // Collect BBA states from courses data (doc-level)
          if (isBbaCourse(d) || mentionsBba(d)) {
            const state =
              extractField(d, ['state', 'stateName', 'province']) ||
              extractField(d?.location, ['state', 'stateName', 'province']);
            if (state) {
              addBbaState(String(state));
            }
          }
          if (isMtechCourse(d)) {
            // If it's a college document (has coursesOffered), extract state directly
            if (d.coursesOffered || d.courses || d.programs) {
              const state = d.state || d.stateName || d.province || 
                (d.location && (d.location.state || d.location.stateName));
              const country = d.country || d.countryName || 
                (d.location && (d.location.country || d.location.countryName)) ||
                'India';
              if (state && normalize(country) === 'india') {
                mtechStatesSet.add(String(state));
              }
            } else {
              // If it's a course document, extract from entries
              const entries = collectEntries(d);
              entries.forEach((entry) => {
                const state = extractField(entry, ['state', 'stateName', 'province']) || extractField(d, ['state', 'stateName']);
                const country =
                  extractField(entry, ['country', 'countryName']) ||
                  extractField(d, ['country', 'countryName']) ||
                  'India';
                if (!state) return;
                if (normalize(country) && normalize(country) !== 'india') return;
                mtechStatesSet.add(String(state));
              });
            }
          }
          if (isParamedicalCourseDoc(d)) {
            const label = getParamedicalCourseLabel(d);
            if (label) {
              if (isDiplomaOrCertificateProgram(d, label)) {
                paramedicalDiplomaSet.add(label);
              } else {
                paramedicalCourseSet.add(label);
              }
            }
          }
        });
        updateMbaStates();
        updateMtechStates();
        updateBtechCities();
        updateBbaStates();
        setParamedicalCourses(Array.from(paramedicalCourseSet).sort((a, b) => a.localeCompare(b)));
        setParamedicalDiplomaCourses(Array.from(paramedicalDiplomaSet).sort((a, b) => a.localeCompare(b)));
      },
      () => {}
    );

    return () => {
      collegesUnsub();
      coursesUnsub();
    };
  }, []);

  // Fetch courses for Explore Courses dropdown - ONLY from Firebase
  useEffect(() => {
    const coursesQ = query(collection(db, 'courses'));
    const coursesUnsub = onSnapshot(
      coursesQ,
      (snapshot) => {
        // Only use courses from Firebase, no hardcoded data
        const coursesMap = new Map<string, Course>();
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const courseName = data.courseName || data.name || '';
          
          // Only include courses with valid names from Firebase
          if (!courseName || !courseName.trim()) return;
          
          const shortForm = getShortForm(courseName);
          
          // Use short form as key to remove duplicates
          // Only keep the first occurrence (from Firebase)
          if (!coursesMap.has(shortForm)) {
            coursesMap.set(shortForm, {
              id: doc.id,
              courseName: courseName,
              shortForm: shortForm,
              entranceExams: Array.isArray(data.entranceExams) ? data.entranceExams : [],
              description: data.description || '',
            });
          }
        });

        // Convert to array and sort - ONLY Firebase courses
        const uniqueCourses = Array.from(coursesMap.values())
          .sort((a, b) => a.shortForm.localeCompare(b.shortForm));
        
        // Only set courses that exist in Firebase
        setCourses(uniqueCourses);
      },
      (error) => {
        console.error('Error fetching courses from Firebase:', error);
        // On error, set empty array - no fallback data
        setCourses([]);
      }
    );

    return () => {
      coursesUnsub();
    };
  }, []);

  // Select first course by default when courses are loaded
  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0]);
    }
  }, [courses, selectedCourse]);

  // Fetch course details when a course is selected - ONLY from Firebase
  useEffect(() => {
    if (!selectedCourse) {
      setCourseDetails({ exams: [], cities: [], states: [] });
      return;
    }

    const citiesSet = new Set<string>();
    const statesSet = new Set<string>();
    const examNamesSet = new Set<string>();

    // Get exam names from course data - ONLY from Firebase
    if (Array.isArray(selectedCourse.entranceExams) && selectedCourse.entranceExams.length > 0) {
      selectedCourse.entranceExams.forEach((exam: string) => {
        if (exam && exam.trim()) {
          examNamesSet.add(String(exam.trim()));
        }
      });
    }

    // Fetch colleges that offer this course - ONLY from Firebase
    const collegesQ = query(collection(db, 'colleges'));
    const collegesUnsub = onSnapshot(
      collegesQ,
      (snapshot) => {
        // Only process colleges from Firebase
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const courseName = selectedCourse.courseName.toLowerCase().trim();
          const shortFormLower = selectedCourse.shortForm.toLowerCase().trim();
          
          // Check if college offers this course - match against actual Firebase data
          const coursesOffered = gatherStrings([
            data.coursesOffered,
            data.courses,
            data.programs,
            data.programmes,
            data.courseName, // Also check if college has courseName field
          ]).join(' ').toLowerCase();
          
          // Only match if college actually offers this course in Firebase
          const matchesCourse = coursesOffered.includes(courseName) || 
                               coursesOffered.includes(shortFormLower) ||
                               (data.courseName && data.courseName.toLowerCase().trim() === courseName);
          
          if (matchesCourse) {
            const city = extractField(data, ['city', 'cityName']);
            const state = extractField(data, ['state', 'stateName', 'province']);
            const country = extractField(data, ['country', 'countryName']) || 'India';
            
            // Only include Indian colleges from Firebase
            if (normalize(country) === 'india') {
              if (city && city.trim()) {
                citiesSet.add(String(city.trim()));
              }
              if (state && state.trim()) {
                statesSet.add(String(state.trim()));
              }
            }
          }
        });

        // Fetch exam IDs by matching exam names
        const fetchExamIds = async () => {
          const examNames = Array.from(examNamesSet).slice(0, 6);
          const examInfos: ExamInfo[] = [];

          // Fetch from "exams" collection
          try {
            const examsQ = query(collection(db, 'exams'));
            const examsSnapshot = await getDocs(examsQ);
            
            examsSnapshot.docs.forEach((doc) => {
              const data = doc.data();
              const examName = data.title || data.examName || data.name || '';
              
              // Check if this exam name matches any of our exam names
              const normalizedExamName = examName.toLowerCase().trim();
              for (const examNameToMatch of examNames) {
                const normalizedToMatch = examNameToMatch.toLowerCase().trim();
                // Check for exact match or if exam name contains the search term
                if (normalizedExamName === normalizedToMatch || 
                    normalizedExamName.includes(normalizedToMatch) ||
                    normalizedToMatch.includes(normalizedExamName)) {
                  // Avoid duplicates
                  if (!examInfos.some(e => e.id === doc.id)) {
                    examInfos.push({
                      name: examNameToMatch, // Use the original name from course
                      id: doc.id
                    });
                  }
                }
              }
            });
          } catch (error) {
            console.error('Error fetching exams:', error);
          }

          // Fetch from "keamExams" collection
          try {
            const keamExamsQ = query(collection(db, 'keamExams'));
            const keamExamsSnapshot = await getDocs(keamExamsQ);
            
            keamExamsSnapshot.docs.forEach((doc) => {
              const data = doc.data();
              const examName = data.examName || data.title || data.name || '';
              
              // Check if this exam name matches any of our exam names
              const normalizedExamName = examName.toLowerCase().trim();
              for (const examNameToMatch of examNames) {
                const normalizedToMatch = examNameToMatch.toLowerCase().trim();
                // Check for exact match or if exam name contains the search term
                if (normalizedExamName === normalizedToMatch || 
                    normalizedExamName.includes(normalizedToMatch) ||
                    normalizedToMatch.includes(normalizedExamName)) {
                  // Avoid duplicates
                  if (!examInfos.some(e => e.id === doc.id)) {
                    examInfos.push({
                      name: examNameToMatch, // Use the original name from course
                      id: doc.id
                    });
                  }
                }
              }
            });
          } catch (error) {
            console.error('Error fetching keamExams:', error);
          }

          // Only set details from Firebase data - no hardcoded values
          setCourseDetails({
            exams: examInfos.slice(0, 6),
            cities: Array.from(citiesSet).sort((a, b) => a.localeCompare(b)).slice(0, 6),
            states: Array.from(statesSet).sort((a, b) => a.localeCompare(b)).slice(0, 6),
          });
        };

        fetchExamIds();
      },
      (error) => {
        console.error('Error fetching course details from Firebase:', error);
        // On error, set empty - no fallback data
        setCourseDetails({ exams: [], cities: [], states: [] });
      }
    );

    return () => {
      collegesUnsub();
    };
  }, [selectedCourse]);


  const handleNavHeadingInteraction = (index: number) => {
    if (isDesktopView) return;
    setActiveNavIndex((prev) => (prev === index ? null : index));
  };

  const handleNavigationWrapperClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDesktopView) return;
    const anchor = (event.target as HTMLElement).closest('a');
    if (anchor) {
      setIsMenuOpen(false);
      setActiveNavIndex(null);
    }
  };

  const handleMobileBack = () => {
    if (isDesktopView) return;
    setActiveNavIndex(null);
  };

  return (
    <header id="universalHeader" className="checking">
      {/* Top Bar */}
      <div className="headerBarWrapper">
        <div id="headerAddressBar">
          <div className="CS_contact_details">
            {contactDetails.map((item, idx) => (
              <Link key={idx} href={item.href}>{item.label}</Link>
            ))}
          </div>

          <div className="moduleNavigation">
            {navigationLinks.map((link, idx) => (
              <Link key={idx} href={link.href}>{link.label}</Link>
            ))}
          </div>

          <div className="socialNavigation">
            <div className="social_right">
              {socialLinks.map((social, idx) => (
                <Link key={idx} href={social.href} target="_blank" className={social.className}></Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div id="headernavigationBar">
        <div className="logo_and_navigation_wrap">
                   <div
            className="hamburger_menu_wrap"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className={`hamburger_menu ${isMenuOpen ? "active" : ""}`}></span>
          </div>


          <Link href="/">
            <Image
              src="/build/assets/logo.png"
              alt="Mythri Logo"
              width={180}
              height={32}
              className="logo-img"
              priority
            />
          </Link>

          <div
            className={`navigation_wrapper  ${isMenuOpen ? "open" : "visible_side_nav"}`}
            onClick={handleNavigationWrapperClick}
          >
            <div className="sidenav_closer" onClick={() => setIsMenuOpen(false)}>
              <Link href="/"></Link>
              <span className="close_sidenav"></span>
            </div>

            {combinedNavigation.map((nav: any, idx) => {
              if (nav.heading === 'Explore Courses') {
                // Explore Courses navigation temporarily hidden
                return null;
              }
              return (
              <div key={idx} className="navigation_div">
                <p
                  className={`nav_main_heading ${!isDesktopView && activeNavIndex === idx ? 'active_mobile_nav' : ''}`}
                  onClick={() => handleNavHeadingInteraction(idx)}
                  role={!isDesktopView ? 'button' : undefined}
                  tabIndex={!isDesktopView ? 0 : undefined}
                  aria-expanded={!isDesktopView ? activeNavIndex === idx : undefined}
                  onKeyDown={(event) => {
                    if (isDesktopView) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleNavHeadingInteraction(idx);
                    }
                  }}
                >
                  {nav.heading || "Explore Courses"}
                </p>

                <div className={`navigation_content ${!isDesktopView && activeNavIndex === idx ? 'mobile_nav_open' : ''}`}>
                  <div className="right_navigation">
                    <p
                      className="hide_right_navigation"
                      onClick={handleMobileBack}
                      role={!isDesktopView ? 'button' : undefined}
                      tabIndex={!isDesktopView ? 0 : undefined}
                      onKeyDown={(event) => {
                        if (isDesktopView) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleMobileBack();
                        }
                      }}
                    >
                      <span className="hide_sidenav">&larr;</span> &nbsp;
                      {nav.heading || "Explore Courses"}
                    </p>

                    <div className={`parent_wrapper ${nav.heading === 'Management' ? 'management-dropdown' : ''}`}>
                      {/* Explore Courses - Dynamic - ONLY from Firebase */}
                      {nav.heading === 'Explore Courses' ? (
                        <>
                          {/*
                          <div style={{ display: 'flex', gap: '20px' }}>
                            {courses.length > 0 ? (
                              <div className="type_of_navigation_wrap" style={{ minWidth: '200px' }}>
                                {courses.map((course) => (
                                  <Link
                                    key={course.id}
                                    href={`/course/${course.id}`}
                                    onMouseEnter={() => setSelectedCourse(course)}
                                    style={{
                                      display: 'block',
                                      padding: '8px 12px',
                                      backgroundColor: selectedCourse?.id === course.id ? '#f3e8ff' : 'transparent',
                                      borderRadius: '4px',
                                      marginBottom: '4px',
                                    }}
                                  >
                                    {course.shortForm}
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <div className="type_of_navigation_wrap" style={{ minWidth: '200px' }}>
                                <p>No courses available</p>
                              </div>
                            )}

                            {selectedCourse && (
                              <>
                                <div className="type_of_navigation_wrap" style={{ minWidth: '250px' }}>
                                  <p style={{ color: '#9333ea', fontWeight: 'bold' }}>About The Courses</p>
                                  <Link href={`/course/${selectedCourse.id}`}>
                                    {selectedCourse.courseName}
                                  </Link>
                                  <Link href={getCourseCollegesUrl(selectedCourse.shortForm)}>
                                    {selectedCourse.shortForm} Colleges In India
                                  </Link>
                                </div>

                                {courseDetails.exams.length > 0 && (
                                  <div className="type_of_navigation_wrap" style={{ minWidth: '200px' }}>
                                    <p style={{ color: '#9333ea', fontWeight: 'bold' }}>Related Exams</p>
                                    {courseDetails.exams.map((exam, idx) => (
                                      <Link 
                                        key={idx} 
                                        href={`/exam/${exam.id}?title=${encodeURIComponent(exam.name)}`}
                                      >
                                        {exam.name}
                                      </Link>
                                    ))}
                                  </div>
                                )}

                                {courseDetails.cities.length > 0 && (
                                  <div className="type_of_navigation_wrap" style={{ minWidth: '250px' }}>
                                    <p style={{ color: '#9333ea', fontWeight: 'bold' }}>Colleges by City</p>
                                    {courseDetails.cities.map((city, idx) => (
                                      <Link
                                        key={idx}
                                        href={`/course/${selectedCourse.id}?city=${encodeURIComponent(city)}`}
                                      >
                                        {selectedCourse.shortForm} Colleges in {city}
                                      </Link>
                                    ))}
                                  </div>
                                )}

                                {courseDetails.states.length > 0 && (
                                  <div className="type_of_navigation_wrap" style={{ minWidth: '250px' }}>
                                    <p style={{ color: '#9333ea', fontWeight: 'bold' }}>Colleges by State</p>
                                    {courseDetails.states.map((state, idx) => (
                                      <Link
                                        key={idx}
                                        href={`/course/${selectedCourse.id}?state=${encodeURIComponent(state)}`}
                                      >
                                        {selectedCourse.shortForm} Colleges in {state}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          */}
                        </>
                      ) : nav.heading === 'Paramedical' ? (
                        <>
                          <div className="type_of_navigation_wrap">
                            <p>Paramedical Colleges</p>

                            {/* Skeleton loader while paramedical data is loading */}
                            {paramedicalLoading && paramedicalColleges.length === 0 && (
                              <div className="space-y-2 mt-2">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <div
                                    key={`param-skeleton-${idx}`}
                                    className="h-4 w-40 bg-gray-200 rounded animate-pulse"
                                  />
                                ))}
                              </div>
                            )}

                            {/* Dynamic colleges list from Firestore */}
                            {!paramedicalLoading && paramedicalColleges.length > 0 && (
                              <>
                                {paramedicalColleges.slice(0, 6).map((college) => (
                                  <Link
                                    key={`param-college-${college.id}`}
                                    href={`/colleges/${college.id}`}
                                  >
                                    {college.name}
                                    {college.city ? `, ${college.city}` : ''}
                                  </Link>
                                ))}
                              </>
                            )}

                            {/* Fallback to static config only if not loading and no dynamic data */}
                            {!paramedicalLoading &&
                              paramedicalColleges.length === 0 &&
                              (nav.sections?.find(
                                (section: any) =>
                                  String(section?.title || '').toLowerCase().includes('college')
                              )?.links || []
                              ).map((link: any, linkIdx: number) => (
                                <Link key={linkIdx} href={normalizeUrl(link.url)}>
                                  {link.label}
                                </Link>
                              ))}
                          </div>
                        </>
                      ) : nav.heading === 'MBBS' ? (
                        <>
                          {/* Render Popular Courses from static config if present */}
                          {Array.isArray(nav.sections) && (() => {
                            const popularSection = nav.sections.find(
                              (s: any) => String(s?.title || '').toLowerCase() === 'popular courses'
                            );
                            if (!popularSection) return null;
                            return (
                              <div className="type_of_navigation_wrap">
                                <p>{popularSection.title}</p>
                                {Array.isArray(popularSection.links) &&
                                  popularSection.links.map((link: any, linkIdx: any) => (
                                    <Link key={linkIdx} href={normalizeUrl(link.url)}>
                                      {link.label}
                                    </Link>
                                  ))}
                              </div>
                            );
                          })()}
                          <div className="type_of_navigation_wrap">
                            <p>MBBS Colleges in India</p>
                            {(mbbsCities.length > 0 ? mbbsCities.slice(0, 6) : []).map((city) => (
                              <Link key={city} href={`/course/mbbs?scope=india&city=${encodeURIComponent(city)}`}>
                                {`MBBS Colleges in ${city}`}
                              </Link>
                            ))}
                          </div>
                          <div className="type_of_navigation_wrap">
                            <p>MBBS Colleges in Abroad</p>
                            {(mbbsCountries.length > 0 ? mbbsCountries.slice(0, 6) : []).map((country) => (
                              <Link key={country} href={`/course/mbbs?scope=abroad&country=${encodeURIComponent(country)}`}>
                                {`MBBS in ${country}`}
                              </Link>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          {nav.courses
                            ? nav.courses.map((course: any, courseIdx: any) => (
                                <div key={courseIdx} className="course_navigation_wrap">
                                  <h4 className="course_title">{course.name}</h4>
                                  {course.sections.map((section: any, secIdx: any) => {
                                    const title = String(section.title || '').toLowerCase();
                                    const isMbaStateSection =
                                      nav.heading === 'Management' && title.includes('mba') && title.includes('state');
                                    const isBbaStateSection =
                                      nav.heading === 'Management' && title.includes('bba') && title.includes('state');
                                    const isMtechStateSection =
                                      nav.heading === 'Engineering' && title.includes('m.tech') && title.includes('state');
                                    const isBtechCitySection =
                                      nav.heading === 'Engineering' && title.includes('b.tech') && title.includes('city');
                                    if (isMbaStateSection) {
                                      const mbaLocations = [
                                        { name: 'Karnataka', type: 'state', url: '/course/mba?scope=india&state=Karnataka' },
                                        { name: 'Maharashtra', type: 'state', url: '/course/mba?scope=india&state=Maharashtra' },
                                        { name: 'Tamil Nadu', type: 'state', url: '/course/mba?scope=india&state=Tamil%20Nadu' },
                                      ];
                                      return (
                                        <div key={secIdx} className="type_of_navigation_wrap">
                                          <p>{section.title}</p>
                                          {mbaLocations.map((location) => (
                                            <Link
                                              key={location.name}
                                              href={location.url}
                                            >
                                              {`MBA Colleges in ${location.name}`}
                                            </Link>
                                          ))}
                                        </div>
                                      );
                                    }
                                    if (isBbaStateSection) {
                                      const bbaLocations = [
                                        { name: 'Delhi', url: '/course/bba?state=Delhi' },
                                        { name: 'Tamil Nadu', url: '/course/bba?state=Tamil%20Nadu' },
                                      ];
                                      return (
                                        <div key={secIdx} className="type_of_navigation_wrap">
                                          <p>{section.title}</p>
                                          {bbaLocations.map((location) => (
                                            <Link
                                              key={location.name}
                                              href={location.url}
                                            >
                                              {`BBA Colleges in ${location.name}`}
                                            </Link>
                                          ))}
                                        </div>
                                      );
                                    }
                                    if (isBtechCitySection) {
                                      return (
                                        <div key={secIdx} className="type_of_navigation_wrap">
                                          <p>{section.title}</p>
                                          {(btechCities.length > 0 ? btechCities.slice(0, 6) : []).map((city) => (
                                            <Link
                                              key={city}
                                              href={`/course/engineering?city=${encodeURIComponent(city)}`}
                                            >
                                              {`B.Tech Colleges in ${city}`}
                                            </Link>
                                          ))}
                                        </div>
                                      );
                                    }
                                    if (isMtechStateSection) {
                                      const mtechLocations = [
                                        { name: 'Bihar', url: '/course/mtech?state=Bihar' },
                                        { name: 'Madhya Pradesh', url: '/course/mtech?state=Madhya%20Pradesh' },
                                        { name: 'Maharashtra', url: '/course/mtech?state=Maharashtra' },
                                        { name: 'Tamil Nadu', url: '/course/mtech?state=Tamil%20Nadu' },
                                      ];
                                      return (
                                        <div key={secIdx} className="type_of_navigation_wrap">
                                          <p>{section.title}</p>
                                          {mtechLocations.map((location) => (
                                            <Link
                                              key={location.name}
                                              href={location.url}
                                            >
                                              {`M.Tech Colleges in ${location.name}`}
                                            </Link>
                                          ))}
                                        </div>
                                      );
                                    }
                                    return (
                                      <div key={secIdx} className="type_of_navigation_wrap">
                                        <p>{section.title}</p>
                                        {section.links.map((link: any, linkIdx: any) => (
                                          <Link key={linkIdx} href={normalizeUrl(link.url)}>{link.label}</Link>
                                        ))}
                                      </div>
                                    );
                                  })}
                                </div>
                              ))
                              : nav.sections.map((section: any, secIdx: any) => {
                                const title = String(section.title || '').toLowerCase();
                                const isMbaStateSection =
                                  nav.heading === 'Management' && title.includes('mba') && title.includes('state');
                                const isBbaStateSection =
                                  nav.heading === 'Management' && title.includes('bba') && title.includes('state');
                                const isMtechStateSection =
                                  nav.heading === 'Engineering' && title.includes('m.tech') && title.includes('state');
                                const isBtechCitySection =
                                  nav.heading === 'Engineering' && title.includes('b.tech') && title.includes('city');

                                if (isMbaStateSection) {
                                  const mbaLocations = [
                                    { name: 'Karnataka', type: 'state', url: '/course/mba?scope=india&state=Karnataka' },
                                    { name: 'Maharashtra', type: 'state', url: '/course/mba?scope=india&state=Maharashtra' },
                                    { name: 'Tamil Nadu', type: 'state', url: '/course/mba?scope=india&state=Tamil%20Nadu' },
                                  ];
                                  return (
                                    <div key={secIdx} className="type_of_navigation_wrap">
                                      <p>{section.title}</p>
                                      {mbaLocations.map((location) => (
                                        <Link
                                          key={location.name}
                                          href={location.url}
                                        >
                                          {`MBA Colleges in ${location.name}`}
                                        </Link>
                                      ))}
                                    </div>
                                  );
                                }

                                if (isBbaStateSection) {
                                  const bbaLocations = [
                                    { name: 'Delhi', url: '/course/bba?state=Delhi' },
                                    { name: 'Tamil Nadu', url: '/course/bba?state=Tamil%20Nadu' },
                                  ];
                                  return (
                                    <div key={secIdx} className="type_of_navigation_wrap">
                                      <p>{section.title}</p>
                                      {bbaLocations.map((location) => (
                                        <Link
                                          key={location.name}
                                          href={location.url}
                                        >
                                          {`BBA Colleges in ${location.name}`}
                                        </Link>
                                      ))}
                                    </div>
                                  );
                                }

                                if (isBtechCitySection) {
                                  return (
                                    <div key={secIdx} className="type_of_navigation_wrap">
                                      <p>{section.title}</p>
                                      {(btechCities.length > 0 ? btechCities.slice(0, 6) : []).map((city) => (
                                        <Link
                                          key={city}
                                          href={`/course/engineering?city=${encodeURIComponent(city)}`}
                                        >
                                          {`B.Tech Colleges in ${city}`}
                                        </Link>
                                      ))}
                                    </div>
                                  );
                                }

                                if (isMtechStateSection) {
                                  const mtechLocations = [
                                    { name: 'Bihar', url: '/course/mtech?state=Bihar' },
                                    { name: 'Madhya Pradesh', url: '/course/mtech?state=Madhya%20Pradesh' },
                                    { name: 'Maharashtra', url: '/course/mtech?state=Maharashtra' },
                                    { name: 'Tamil Nadu', url: '/course/mtech?state=Tamil%20Nadu' },
                                  ];
                                  return (
                                    <div key={secIdx} className="type_of_navigation_wrap">
                                      <p>{section.title}</p>
                                      {mtechLocations.map((location) => (
                                        <Link
                                          key={location.name}
                                          href={location.url}
                                        >
                                          {`M.Tech Colleges in ${location.name}`}
                                        </Link>
                                      ))}
                                    </div>
                                  );
                                }

                                return (
                                <div key={secIdx} className="type_of_navigation_wrap">
                                  <p>{section.title}</p>
                                  {section.links.map((link: any, linkIdx: any) => (
                                    <Link key={linkIdx} href={normalizeUrl(link.url)}>{link.label}</Link>
                                  ))}
                                </div>
                                );
                              })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Search */}
        <div className="search_and_user_wrapper">
          <div className="header_searchbar_wrapper">
            <button
              id="headerHomeSearch"
              className="searchbar_icon"
              type="button"
              aria-label="Search colleges, exams, scholarships and more"
              onClick={() => setIsSearchModalOpen(true)}
            ></button>
          </div>
        </div>
      </div>
      <HomeSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </header>
  );
}
