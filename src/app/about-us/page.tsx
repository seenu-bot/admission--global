"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterLinking from "@/components/FooterLinking";
import Image from "next/image";

export default function AboutUsPage() {
  const teamMembers = [
    {
      name: "Harshit Agarwal",
      title: "CEO",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    },
    {
      name: "Urmila Pokhriyal",
      title: "Head of Content Marketing",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    },
    {
      name: "Rahul Kumar",
      title: "Head of Technology",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    },
    {
      name: "Nawal Pathak",
      title: "Product Manager",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gray-800 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <p className="text-orange-500 text-sm md:text-base mb-2">Admission Global</p>
          <h1 className="text-4xl md:text-6xl font-bold">About Us</h1>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Welcome to CollegeSearch.in
          </h2>
          <div className="space-y-4 text-gray-700 text-base md:text-lg leading-relaxed">
            <p>
              CollegeSearch is India's most trusted education platform, which is relied on by over 15 million students and partnered with 40,000+ colleges nationwide. Our goal? To help you find the right college, not the best.
            </p>
            <p>
              We believe the journey to your dream college should be stress-free, informed, and personal. That's where we come in. CollegeSearch isn't just about browsing colleges — it's about getting the guidance you need to get into the one that fits you best.
            </p>
            <p>
              We've even been recognized by Red Herring as one of the Top 100 Fast-Growing Companies in Asia—an honor we share with iconic Indian brands like Naukri and MakeMyTrip. With a student-first mindset and smart tools to back it up, CollegeSearch is the companion you can count on during your entire college journey.
            </p>
          </div>
        </div>
      </section>

      {/* What You'll Find Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What You'll Find on Our Platform
          </h2>
          <p className="text-gray-700 text-base md:text-lg mb-8">
            At CollegeSearch, we simplify the entire process of exploring colleges and courses so you can make decisions with clarity and confidence. Here's what we offer:
          </p>
          <ul className="space-y-4 text-gray-700 text-base md:text-lg">
            <li className="flex items-start">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              <span>
                In-depth information on colleges and universities, including details on <strong>fees, admission processes, placement statistics, cutoffs,</strong> and more.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              <span>
                Comprehensive coverage of entrance exams, including <strong>eligibility, application processes, important dates, admit cards, exam patterns,</strong> and much more.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              <span>
                Board-related resources for <strong>CBSE, ICSE,</strong> and <strong>state boards.</strong> Find information on <strong>exam dates, results, preparations, admit cards, exam patterns, question papers,</strong> and <strong>PDFs.</strong>
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              <span>
                Course insights in fields like <strong>engineering, management, medicine, law,</strong> and more. Explore details such as <strong>course duration, eligibility, colleges offering the course, syllabus, exam papers,</strong> and more.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              <span>
                Educational articles to guide your research and boost your confidence.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              <span>
                Tools like <strong>Rank Predictors, College Predictors, and EMI Calculators.</strong>
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              <span>
                Personalized guidance based on your interests and academic profile from our team of experienced and dedicated counselors.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              <span>
                Thousands of reviews from students and alumni offering real-world perspectives on the colleges of your choice.
              </span>
            </li>
          </ul>
          <p className="text-gray-700 text-base md:text-lg mt-8">
            Whether you're just starting out or about to apply, you'll find everything you need - all in one place.
          </p>
        </div>
      </section>

      {/* Authentic Content Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Authentic Content you can trust
          </h3>
          <p className="text-gray-700 text-base md:text-lg leading-relaxed">
            Our content is created by a team of seasoned education writers and researchers with years of experience in edtech, academic publishing, and student advisory. Whether it's the latest updates on colleges, exams, courses, or boards, we strive to deliver high-quality, thoroughly researched, and reliable content to help you stay informed and make confident decisions.
          </p>
        </div>
      </section>

      {/* Free Expert Counseling Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Free Expert Counseling – Backed by 10+ Years of Student Support
          </h3>
          <p className="text-gray-700 text-base md:text-lg mb-6 leading-relaxed">
            Choosing the right college can feel overwhelming - entrance exams, endless options, tight deadlines. Worry Not! That's where our experienced counselors come in. With over 10 years of guiding students, our counselors offer one-on-one support that's free, friendly, and focused on what you need.
          </p>
          <h4 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
            Here's how we help:
          </h4>
          <ul className="space-y-3 text-gray-700 text-base md:text-lg">
            <li className="flex items-start">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              <span>Shortlisting colleges and courses that truly fit you</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              <span>Guiding you through entrance exams and applications</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              <span>Helping you explore career paths based on your strengths</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-3 font-bold">•</span>
              <span>Keeping you on track with deadlines and documentation</span>
            </li>
          </ul>
          <p className="text-gray-700 text-base md:text-lg mt-6">
            No pressure, no confusion — just honest advice to help you move forward with confidence.
          </p>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Meet the Team Behind CollegeSearch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-gray-600">{member.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Promise Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Our Promise to You
          </h2>
          <div className="space-y-4 text-gray-700 text-base md:text-lg leading-relaxed">
            <p>
              At CollegeSearch, we're committed to helping students make smarter choices about their future. Whether it's finding that perfect-fit college or figuring out how to get there, we're by your side.
            </p>
            <p>
              With the right data, the right tools, and the right people behind you, your college dream isn't just a possibility — it's a plan.
            </p>
            <p className="font-semibold text-gray-900">
              Join the 15 million+ students who trust CollegeSearch to help them find the right college — and get in.
            </p>
          </div>
        </div>
      </section>

      <FooterLinking />
      <Footer />
    </main>
  );
}

