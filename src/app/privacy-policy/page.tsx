"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterLinking from "@/components/FooterLinking";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gray-800 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <p className="text-orange-500 text-sm md:text-base mb-2">Admission Global</p>
          <h1 className="text-4xl md:text-6xl font-bold">Privacy Policy</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8 text-gray-700 text-base md:text-lg leading-relaxed">
            {/* Introduction */}
            <p>
              This website www.CollegeSearch.in (hereinafter referred to as "Website") is operated and owned by 'SET Education Pvt Ltd'. We are committed to respecting your online privacy and we recognize your need for protection of any personally identifiable information ("Personal Information") that you share with us. In general, you can visit the website without telling us who you are or revealing any Personal Information. This privacy policy sets forth what information we collect from and/or about you and how we use this information.
            </p>

            {/* Information from Cookies etc */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Information from Cookies etc
              </h2>
              <div className="space-y-4">
                <p>
                  We use "cookies" and other tracking technologies on our website. A cookie is a piece of text stored by a user's web browser. It can be used to store information about the user's browsing habits and can be retrieved later. We use small cookies stored for a better browsing experience. You can manage cookies through your browser settings.
                </p>
                <p>
                  Tracking technologies may record information such as Uniform Resource Locator (URL), Internet domain and host names, Internet protocol (IP) addresses, computer information (version, OS, platform), browser software and version, dates and times of access, and content viewed. We use this information to improve our website and user experience, and for analyzing trends and statistics.
                </p>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Personal Information
              </h2>
              <div className="space-y-4">
                <p>
                  Providing information is voluntary. The information we collect includes contact details such as name, email, phone number, etc. To access certain features of our website, such as "My Shortlisted Colleges," "Send Profile," and other functionalities, you are required to register with us. Registration involves creating a User Name and Password.
                </p>
                <p>
                  You may be prompted to register in the following scenarios:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Clicking 'Login' or 'Register' on home/login screens.</li>
                  <li>Clicking 'Add to Shortlist' on a college profile page.</li>
                  <li>Other functionalities that require registration.</li>
                </ol>
                <p>
                  During registration, we collect information including but not limited to: name, gender, email, contact details, description, extracurricular activities, and country. We also collect educational information such as exams, education level, marks, grade/rank, and expected admission year.
                </p>
                <p>
                  We reserve the right to use this information for analysis purposes and to provide it to business partners/third parties for various purposes, including monetary gains. We also reserve the right to contact students based on the information provided.
                </p>
                <p>
                  If you do not agree to this privacy policy, please do not register with us. By registering or filling out any forms on our website, you are deemed to have agreed to this privacy policy of the website. The terms of this privacy policy are subject to change from time to time without any prior consent or notice.
                </p>
              </div>
            </div>

            {/* Security */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Security
              </h2>
              <div className="space-y-4">
                <p>
                  We understand the importance of security of your personal information. We treat your personal data as an asset that must be protected using tools like encryption, passwords, and physical security against unauthorized access and disclosure.
                </p>
                <p>
                  However, we cannot guarantee absolute security of your personal information. Due to the nature of internet transmission, third parties might intercept or misuse information. By accessing our website or sending information to us, you agree to receive electronic communications (transactional, promotional, and commercial) from us via email, SMS, phone call, or website notices.
                </p>
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

