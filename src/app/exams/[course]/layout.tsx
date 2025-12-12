import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  const { course } = await params;
  const courseName = course === 'overall' ? 'All' : course.charAt(0).toUpperCase() + course.slice(1).replace(/-/g, ' ');
  
  return {
    title: `${courseName} Entrance Exams 2025 - Dates, Syllabus, Eligibility | AdmissionGlobal`,
    description: `Find ${courseName} entrance exams 2025. Get exam dates, syllabus, eligibility criteria, application process, and preparation tips.`,
    keywords: `${courseName} entrance exams, ${courseName} exam dates, ${courseName} syllabus, ${courseName} eligibility`,
    alternates: {
      canonical: `/exams/${course}`,
    },
    openGraph: {
      title: `${courseName} Entrance Exams 2025 | AdmissionGlobal`,
      description: `Find ${courseName} entrance exams 2025. Get exam dates, syllabus, and eligibility criteria.`,
      url: `/exams/${course}`,
      type: 'website',
    },
  };
}

export default function ExamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

