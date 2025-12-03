'use client';

import { useState } from 'react';

export default function HeroSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Searching for:', searchTerm, 'in:', location);
  };

  return (
    <section className="hero-gradient py-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Discover and Find the <br />
          <span className="text-yellow-300">Best Right College</span>
        </h1>

        <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
          Search through thousands of colleges and courses across India. Find the perfect match for your future.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-3xl font-bold text-white">20 Lakhs+</h3>
            <p className="text-blue-100">Monthly Users</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-3xl font-bold text-white">50,000+</h3>
            <p className="text-blue-100">Colleges Listed</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-3xl font-bold text-white">500+</h3>
            <p className="text-blue-100">Courses Available</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="text-left">
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Course
                </label>
                <input
                  type="text"
                  id="course"
                  placeholder="MBA, B.Tech, MBBS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="text-left">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  placeholder="Delhi, Mumbai, Bangalore..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="search-input"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 h-fit"
              >
                Search Colleges
              </button>
            </div>

            <div className="mt-6 text-left">
              <p className="text-sm text-gray-600 mb-3">Popular Searches:</p>
              <div className="flex flex-wrap gap-2">
                {['MBA in Delhi', 'B.Tech in Bangalore', 'MBBS in Mumbai', 'BCA in Pune'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const [course, loc] = tag.split(' in ');
                      setSearchTerm(course);
                      setLocation(loc || '');
                    }}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm hover:bg-blue-100 transition-colors duration-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
