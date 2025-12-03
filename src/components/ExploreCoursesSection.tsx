'use client'

export default function ExploreCoursesSection() {
  const courses = [
    { name: 'B.Tech / B.E.', duration: '4 Years', colleges: 24057, exams: 31, icon: '⚙️' },
    { name: 'MBBS', duration: '5 Years', colleges: 449, exams: 1, icon: '🩺' },
    { name: 'MBA / PGDM', duration: '2 Years', colleges: 12518, exams: 21, icon: '👔' },
    { name: 'BCA', duration: '3 Years', colleges: 4407, exams: 0, icon: '💻' },
    { name: 'LLB', duration: '3 Years', colleges: 1433, exams: 6, icon: '⚖️' },
    { name: 'B.Arch', duration: '5 Years', colleges: 503, exams: 3, icon: '🏗️' },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Explore Courses
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover a wide range of courses across different levels and specializations
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <div
              key={index}
              className="p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-white cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{course.icon}</span>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{course.name}</h3>
                    <p className="text-sm text-gray-600">{course.duration}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="font-bold text-xl text-gray-800">
                    {course.colleges.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Colleges</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="font-bold text-xl text-gray-800">{course.exams}</div>
                  <div className="text-gray-600">Related Exams</div>
                </div>
              </div>

              <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 rounded-lg transition-colors duration-200">
                View Colleges
              </button>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-3 rounded-lg transition-colors duration-200">
            View All Courses
          </button>
        </div>
      </div>
    </section>
  )
}
