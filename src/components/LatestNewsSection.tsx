'use client'

import Link from 'next/link'

export default function LatestNewsSection() {
  const news = [
    {
      title: 'IIT Delhi Announces New AI and Data Science Program',
      category: 'Education',
      date: '06th October, 2025',
      readTime: '3 min read',
      author: 'MiniMax Agent'
    },
    {
      title: 'Medical Colleges Increase Seats for MBBS 2025',
      category: 'Medical',
      date: '05th October, 2025',
      readTime: '4 min read',
      author: 'MiniMax Agent'
    },
    {
      title: 'JEE Main 2026 Registration Starts Next Month',
      category: 'Exams',
      date: '03rd October, 2025',
      readTime: '2 min read',
      author: 'MiniMax Agent'
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              Latest News & Updates
            </h2>
            <p className="text-lg text-gray-600">
              Stay updated with the latest education news and policy changes
            </p>
          </div>
          <Link
            href="/news"
            className="hidden md:inline-block bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All News
          </Link>
        </div>

        {/* Breaking News Banner */}
        <div className="bg-red-500 text-white rounded-lg p-4 mb-8 overflow-hidden">
          <div className="flex items-center space-x-3 animate-pulse">
            <span className="bg-white text-red-500 px-2 py-1 rounded text-xs font-bold">
              BREAKING
            </span>
            <span className="font-medium">
              Supreme Court upholds reservation policy in higher education institutions
            </span>
          </div>
        </div>

        {/* News Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item, index) => {
            const slug = item.title.toLowerCase().replace(/\s+/g, '-')
            return (
              <article
                key={index}
                className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                {/* Category + Read Time */}
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.category === 'Education'
                        ? 'bg-blue-100 text-blue-700'
                        : item.category === 'Medical'
                        ? 'bg-green-100 text-green-700'
                        : item.category === 'Exams'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.category}
                  </span>
                  <span className="text-xs text-gray-500">{item.readTime}</span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg text-gray-800 mb-3 line-clamp-2">
                  {item.title}
                </h3>

                {/* Author + Date */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>By {item.author}</span>
                  <time dateTime={item.date}>{item.date}</time>
                </div>

                {/* Read Button */}
                <Link
                  href={`/news/${slug}`}
                  aria-label={`Read full news: ${item.title}`}
                  className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg transition-colors duration-200"
                >
                  Read News
                </Link>
              </article>
            )
          })}
        </div>

        {/* Mobile View All Button */}
        <div className="text-center mt-8 md:hidden">
          <Link
            href="/news"
            className="inline-block bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All News
          </Link>
        </div>
      </div>
    </section>
  )
}
