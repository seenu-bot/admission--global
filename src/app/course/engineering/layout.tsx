import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'B.Tech Colleges in India - Top Engineering Colleges, Fees, JEE Cut-off 2025',
  description: 'Find the best B.Tech/B.E. colleges in India. Compare top engineering colleges, fees, JEE Main cut-off, admission process, and placement records. Get expert counselling for engineering admissions.',
  keywords: 'B.Tech colleges, engineering colleges, B.Tech admission, B.Tech fees, top engineering colleges, B.Tech colleges in India, JEE Main, engineering entrance exam',
  alternates: {
    canonical: '/course/engineering',
  },
  openGraph: {
    title: 'B.Tech Colleges in India - Top Engineering Colleges | AdmissionGlobal',
    description: 'Find the best B.Tech/B.E. colleges in India. Compare top engineering colleges, fees, JEE Main cut-off, and admission process.',
    url: '/course/engineering',
    type: 'website',
  },
};

export default function EngineeringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

