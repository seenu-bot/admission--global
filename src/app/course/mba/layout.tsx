import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MBA Colleges in India - Top MBA/PGDM Colleges, Fees, Admission 2025',
  description: 'Find the best MBA colleges in India. Compare top MBA/PGDM colleges, fees, admission process, cut-offs, and placement records. Get expert counselling for MBA admissions.',
  keywords: 'MBA colleges, PGDM colleges, MBA admission, MBA fees, top MBA colleges, MBA colleges in India, MBA entrance exams, CAT, XAT, MAT',
  alternates: {
    canonical: '/course/mba',
  },
  openGraph: {
    title: 'MBA Colleges in India - Top MBA/PGDM Colleges | AdmissionGlobal',
    description: 'Find the best MBA colleges in India. Compare top MBA/PGDM colleges, fees, admission process, and placement records.',
    url: '/course/mba',
    type: 'website',
  },
};

export default function MBALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

