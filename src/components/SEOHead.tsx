"use client";

import Head from "next/head";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: object;
}

export default function SEOHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = "website",
  structuredData,
}: SEOHeadProps) {
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.admissionglobal.com";
  const fullTitle = title ? `${title} | AdmissionGlobal` : "AdmissionGlobal - Find the Best Right College";
  const fullDescription = description || "Find the perfect college for your future. Search through thousands of colleges and courses across India.";
  const fullCanonical = canonicalUrl || siteUrl;
  const fullOgImage = ogImage || `${siteUrl}/og-image.jpg`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullCanonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="AdmissionGlobal" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullOgImage} />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </Head>
  );
}

