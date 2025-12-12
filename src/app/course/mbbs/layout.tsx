import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MBBS Colleges in India - Top Medical Colleges, Fees, NEET Cut-off 2025',
  description: 'Find the best MBBS colleges in India. Compare top medical colleges, fees, NEET cut-off, admission process, and placement records. Get expert counselling for MBBS admissions.',
  keywords: 'MBBS colleges, medical colleges, MBBS admission, MBBS fees, top MBBS colleges, MBBS colleges in India, NEET, medical entrance exam',
  alternates: {
    canonical: '/course/mbbs',
  },
  openGraph: {
    title: 'MBBS Colleges in India - Top Medical Colleges | AdmissionGlobal',
    description: 'Find the best MBBS colleges in India. Compare top medical colleges, fees, NEET cut-off, and admission process.',
    url: '/course/mbbs',
    type: 'website',
  },
};

export default function MBBSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

