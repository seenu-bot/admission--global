"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterLinking from "@/components/FooterLinking";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    query: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
    // You can add API call or form handling logic here
    alert("Thank you for contacting us! We'll get back to you within 24 hours.");
    setFormData({ name: "", mobile: "", email: "", query: "" });
  };

  return (
    <main className="min-h-screen bg-gray-800">
      <Header />

      {/* Hero Section with Contact Form */}
      <section className="bg-gray-800 text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Section - Information */}
            <div className="space-y-6">
              <p className="text-orange-500 text-sm md:text-base">Admission Global</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">Contact Us</h1>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                Our experts provide timely and accurate answers to your questions within 24 hours. 
                Submit your query and receive a detailed response quickly, ensuring you have the 
                information you need without delay, helping you make informed decisions efficiently.
              </p>
            </div>

            {/* Right Section - Contact Form */}
            <div className="bg-white rounded-lg p-4 md:p-5 shadow-lg max-w-md lg:max-w-lg">
              <p className="text-gray-600 text-xs mb-1">Contact Form</p>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Get in touch with us
              </h2>
              <p className="text-gray-600 text-xs mb-4 italic">
                *Fill all the fields and Let us reply you back within 24hrs.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-1 text-sm">
                    Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label htmlFor="mobile" className="block text-gray-700 font-medium mb-1 text-sm">
                    Mobile*
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                    placeholder="Enter your mobile number"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-1 text-sm">
                    Email*
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="query" className="block text-gray-700 font-medium mb-1 text-sm">
                    Enter your query
                  </label>
                  <textarea
                    id="query"
                    name="query"
                    value={formData.query}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 resize-none"
                    placeholder="Enter your query here..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm"
                >
                  Let&apos;s Connect
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map and Contact Information Section */}
      <section className="bg-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Section - Google Maps */}
            <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3506.1234567890123!2d77.0865!3d28.4595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d19d582e38859%3A0x2cf5fe8e5c64b1c!2sSCO%2027%2C%20AIHP%20(Highway%20Side%2C%20Institutional%20Area%2C%20Sector%2032%2C%20Gurugram%2C%20Haryana%20122001!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="CollegeSearch Office Location"
                className="w-full h-full"
              ></iframe>
            </div>

            {/* Right Section - Contact Information */}
            <div className="space-y-8">
              {/* Visit Us Section */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" style={{ color: '#8B4513' }}>
                  Visit Us
                </h3>
                <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                  UNITECH CYBER PARK<br />
                  Durga Colony, Sector 39,<br />
                  Gurugram, Haryana 122003
                </p>
              </div>

              {/* Contact Section */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" style={{ color: '#8B4513' }}>
                  Contact
                </h3>
                <div className="space-y-3">
                  <p className="text-gray-700 text-base md:text-lg">
                    <strong>Email:</strong>{" "}
                    <a 
                      href="mailto:info@admissionglobal.in" 
                      className="text-orange-500 hover:text-orange-600 hover:underline"
                    >
                      info@admissionglobal.in
                    </a>
                  </p>
                  <p className="text-gray-700 text-base md:text-lg">
                    <strong>Phone:</strong>{" "}
                    <a 
                      href="tel:+919228151258" 
                      className="text-orange-500 hover:text-orange-600 hover:underline"
                    >
                      +919228151258
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white">
        <FooterLinking />
        <Footer />
      </div>
    </main>
  );
}

