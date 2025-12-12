/**
 * SEO utility functions for generating metadata and structured data
 */

export interface CourseStructuredData {
  "@context": string;
  "@type": string;
  name: string;
  description?: string;
  provider?: {
    "@type": string;
    name: string;
    url?: string;
  };
  educationalCredentialAwarded?: string;
  timeRequired?: string;
  courseCode?: string;
}

export interface CollegeStructuredData {
  "@context": string;
  "@type": string;
  name: string;
  description?: string;
  address?: {
    "@type": string;
    addressLocality?: string;
    addressRegion?: string;
    addressCountry?: string;
    streetAddress?: string;
  };
  url?: string;
  image?: string;
  telephone?: string;
  aggregateRating?: {
    "@type": string;
    ratingValue?: number;
    reviewCount?: number;
  };
}

export interface ExamStructuredData {
  "@context": string;
  "@type": string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  organizer?: {
    "@type": string;
    name: string;
  };
}

/**
 * Generate Course structured data (JSON-LD)
 */
export function generateCourseStructuredData(
  courseName: string,
  description?: string,
  duration?: string,
  providerName: string = "AdmissionGlobal"
): CourseStructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: courseName,
    description: description || `${courseName} course information, colleges, fees, and admission details.`,
    provider: {
      "@type": "Organization",
      name: providerName,
      url: process.env.NEXT_PUBLIC_BASE_URL || "https://www.admissionglobal.com",
    },
    educationalCredentialAwarded: courseName,
    timeRequired: duration || "PT4Y", // ISO 8601 duration format
  };
}

/**
 * Generate College structured data (JSON-LD)
 */
export function generateCollegeStructuredData(
  collegeName: string,
  city?: string,
  state?: string,
  country: string = "India",
  description?: string,
  address?: string,
  website?: string,
  image?: string,
  rating?: number
): CollegeStructuredData {
  const structuredData: CollegeStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: collegeName,
    description: description || `${collegeName} - College information, courses, fees, admission details, and more.`,
  };

  if (city || state || country || address) {
    structuredData.address = {
      "@type": "PostalAddress",
      addressLocality: city,
      addressRegion: state,
      addressCountry: country,
      streetAddress: address,
    };
  }

  if (website) {
    structuredData.url = website;
  }

  if (image) {
    structuredData.image = image;
  }

  if (rating) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
    };
  }

  return structuredData;
}

/**
 * Generate Exam structured data (JSON-LD)
 */
export function generateExamStructuredData(
  examName: string,
  description?: string,
  startDate?: string,
  endDate?: string,
  organizerName?: string
): ExamStructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: examName,
    description: description || `${examName} entrance exam information, dates, syllabus, and preparation tips.`,
    startDate: startDate,
    endDate: endDate,
    organizer: {
      "@type": "Organization",
      name: organizerName || "Exam Board",
    },
  };
}

/**
 * Generate Organization structured data (JSON-LD)
 */
export function generateOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AdmissionGlobal",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://www.admissionglobal.com",
    logo: `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.admissionglobal.com"}/logo.png`,
    description: "AdmissionGlobal - Your trusted partner in finding the best colleges and courses across India.",
    sameAs: [
      // Add your social media URLs here
      // "https://www.facebook.com/admissionglobal",
      // "https://twitter.com/admissionglobal",
      // "https://www.linkedin.com/company/admissionglobal",
    ],
  };
}

/**
 * Generate Breadcrumb structured data (JSON-LD)
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

