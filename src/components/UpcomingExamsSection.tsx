'use client'

import Link from 'next/link'

export default function UpcomingExamsSection() {
  const exams = [
    { name: 'CAT', date: '30th November, 2025', description: 'Common Admission Test for MBA' },
    { name: 'JEE Main', date: '24th January, 2026', description: 'Joint Entrance Examination Main' },
    { name: 'NEET UG', date: '05th May, 2026', description: 'National Eligibility cum Entrance Test' },
    { name: 'CLAT', date: '07th December, 2025', description: 'Common Law Admission Test' },
    { name: 'GATE', date: '08th February, 2026', description: 'Graduate Aptitude Test in Engineering' },
    { name: 'XAT', date: '04th January, 2026', description: 'Xavier Aptitude Test' },
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Upcoming Exams
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay updated with important exam dates and registration deadlines
          </p>
        </div>

        {/* Exam Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exams.map((exam, index) => {
            const slug = exam.name.toLowerCase().replace(/\s+/g, '-')
            return (
              <article
                key={index}
                className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                {/* Exam Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {exam.name.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{exam.name}</h3>
                    <p className="text-sm text-gray-600">{exam.description}</p>
                  </div>
                </div>

                {/* Exam Date */}
                <div className="bg-red-50 rounded-lg p-3 mb-4">
                  <span className="text-sm font-medium text-gray-700">Exam Date: </span>
                  <time
                    dateTime={exam.date}
                    className="text-sm font-bold text-red-600"
                  >
                    {exam.date}
                  </time>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <Link
                    href={`/exams/${slug}/apply`}
                    aria-label={`Apply for ${exam.name}`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors duration-200 text-center"
                  >
                    Apply Now
                  </Link>
                  <Link
                    href={`/exams/${slug}`}
                    aria-label={`View details for ${exam.name}`}
                    className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors duration-200 text-center"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            )
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-10">
          <Link
            href="/exams"
            className="inline-block bg-blue-600 text-white text-lg font-medium px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Exams
          </Link>
        </div>
      </div>
    </section>
  )
}
