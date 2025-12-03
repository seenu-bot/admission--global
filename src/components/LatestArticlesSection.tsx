'use client';

import Link from 'next/link';

export default function LatestArticlesSection() {
  const articles = [
    {
      title: 'Top 10 Engineering Colleges in India 2025',
      description:
        'Discover the best engineering colleges in India based on rankings and placement records.',
      category: 'Engineering',
      date: '06th October, 2025',
      readTime: '5 min read',
      author: 'MiniMax Agent',
    },
    {
      title: 'MBA Admission 2025: Complete Guide',
      description:
        'Everything you need to know about MBA admissions in 2025, including top colleges and entrance exams.',
      category: 'Management',
      date: '05th October, 2025',
      readTime: '8 min read',
      author: 'MiniMax Agent',
    },
    {
      title: 'NEET UG 2026: Preparation Strategy',
      description:
        'Expert tips and strategies to crack NEET UG 2026 and secure admission in top medical colleges.',
      category: 'Medical',
      date: '04th October, 2025',
      readTime: '6 min read',
      author: 'MiniMax Agent',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Latest Articles
            </h2>
            <p className="text-lg text-gray-600">
              Stay informed with the latest education trends and insights
            </p>
          </div>
          <Link href="/articles" className="btn-secondary hidden md:block">
            View All Articles
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, index) => (
            <div
              key={index}
              className="card p-6 course-card-hover transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  {article.category}
                </span>
                <span className="text-xs text-gray-500">
                  {article.readTime}
                </span>
              </div>

              <h3 className="font-bold text-lg text-gray-800 mb-3 line-clamp-2">
                {article.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {article.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>By {article.author}</span>
                <span>{article.date}</span>
              </div>

              <Link
                href={`/articles/${encodeURIComponent(
                  article.title.toLowerCase().replace(/\s+/g, '-')
                )}`}
                className="block w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 text-center rounded-lg transition-colors duration-200"
              >
                Read More
              </Link>
            </div>
          ))}
        </div>

        {/* Mobile Button */}
        <div className="text-center mt-8 md:hidden">
          <Link href="/articles" className="btn-primary">
            View All Articles
          </Link>
        </div>
      </div>
    </section>
  );
}
