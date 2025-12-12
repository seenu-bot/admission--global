"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FooterLinking from "@/components/FooterLinking";

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gray-800 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <p className="text-orange-500 text-sm md:text-base mb-2">Admission Global</p>
          <h1 className="text-4xl md:text-6xl font-bold">Terms & Conditions</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8 text-gray-700 text-base md:text-lg leading-relaxed">
            {/* Introduction */}
            <p>
              This website www.CollegeSearch.in (hereinafter referred to as "Website") is operated and owned by 'SET Education Pvt Ltd'. We are committed to respecting your online privacy and we recognize your need for protection of any personally identifiable information ("Personal Information") that you share with us. In general, you can visit the website without telling us who you are or revealing any Personal Information.
            </p>

            <p>
              Please read this Privacy Policy carefully. By using the Platform, you indicate, agree and acknowledge that you understand, agree and consent to this Privacy Policy and to the collection and use of information in accordance with this Privacy Policy. This Privacy Policy governs your use of our services and how we collect, safeguard and disclose information that results from your use of our service. We reserve the right to amend this Privacy Policy at any time. We encourage you to review this Privacy Policy periodically for any changes.
            </p>

            {/* Information from Cookies etc */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Information from Cookies etc
              </h2>
              <div className="space-y-4">
                <p>
                  We use "cookies" and other tracking technologies on our website. A cookie is a piece of text stored by a user's web browser. It can be used to store information about the user's browsing habits and can be retrieved later. We use small cookies stored when you log into CollegeSearch.in for a better browsing experience. You can configure your browser to be notified when a cookie is stored or to disable cookies. You can manage cookies through your browser settings.
                </p>
                <p>
                  Tracking technologies may record information such as Uniform Resource Locator (URL), Internet domain and host names, Internet protocol (IP) addresses, computer information (version, OS, platform), browser software and version, dates and times of access, and content viewed and searched. We use this information to improve our website and user experience, and for analyzing trends and statistics.
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
                  Providing information is strictly voluntary. The information we collect includes contact details such as name, email, phone number, etc. To access certain features of our website, such as "My Shortlisted Colleges," "Send Profile," and other functionalities, you are required to register with us. Registration involves creating a User Name and Password.
                </p>
                <p>
                  You may be prompted to register in the following scenarios:
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Click on the 'Login' or 'Register' link from the home page or login screens.</li>
                  <li>Click on 'Add to Shortlist' link on college profile page.</li>
                  <li>Other unlisted functionality which may be updated and/or incorporated at anytime.</li>
                </ol>
                <p>
                  Information collected from the registration form may include: name, gender, email address, contact details, description, extracurricular activities, and country. Educational information collected during registration includes: exams given, education level, marks, grade or rank obtained, and expected year of admission.
                </p>
                <p>
                  We reserve the right to use this compiled user information for analysis purposes. We also reserve the right to provide this information to business partners/relevant third parties for any purpose, including monetary gains. We also reserve the right to contact the student based on the information provided.
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
                  However, we cannot guarantee absolute security of your personal information. No method of transmission over the Internet or electronic storage is 100% secure. Therefore, while we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security. Due to the nature of internet transmission, third parties might unlawfully intercept or access transmissions or private communications, or other users might misuse personal information. Therefore, private communications may not always remain private despite our efforts.
                </p>
                <p>
                  By accessing our website or sending information to us, you agree to receive electronic communications (transactional, promotional, and commercial) from us via email, SMS, phone call, or website notices.
                </p>
              </div>
            </div>

            {/* Retention of Data */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Retention of Data
              </h2>
              <div className="space-y-4">
                <p>
                  We will retain your personal data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your personal data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
                </p>
                <p>
                  We will also retain the other data for internal analysis purposes. The other data collected is generally retained for a shorter period, except when this data is used to strengthen the security or to improve the functionality of our service, or we are legally obligated to retain this data for longer time periods. Mailing list information, discussion posts and email are kept for only the period of time considered reasonable to facilitate the user's requests.
                </p>
                <p>
                  We reserve the right to retain the aggregated and anonymized data derived from the personal data collected from the users of the Website including your personal data, for any purposes (commercial and non-commercial) as the Company deem fit and proper.
                </p>
              </div>
            </div>

            {/* Withdrawal of Consent */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Withdrawal of Consent
              </h2>
              <div className="space-y-4">
                <p>
                  To the extent possible, we provide you with the option of not divulging any specific information that you wish for us not to collect, store or use. You may also choose not to use a particular service or feature on the Website and opt-out of any non-essential communications from the Website.
                </p>
                <p>
                  You may withdraw your consent given for collecting any information and personal data under this Privacy Policy and pursuant to use of the Website, at any time by sending an email to grievance@CollegeSearch.in. In such an event, the Company reserves the right to not allow you further usage of the Website or provide/use any services thereunder, without any obligations or liability, whatsoever, whether in contract, tort, law, equity or otherwise, in this regard.
                </p>
              </div>
            </div>

            {/* Grievance Officer */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Grievance Officer
              </h2>
              <div className="space-y-4">
                <p>
                  In accordance with Information Technology Act 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 made there under, the name and contact details of the Grievance Officer are provided below:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">The Grievance Officer</p>
                  <p className="mb-1">Anmol Jain</p>
                  <p className="mb-1">AVP - Product Management</p>
                  <p>Address: Tower B Unitech Cyber Park Gurgaon | Email: <a href="mailto:grievance@CollegeSearch.in" className="text-orange-500 hover:text-orange-600 hover:underline">grievance@CollegeSearch.in</a></p>
                </div>
              </div>
            </div>

            {/* Transfer of Data */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Transfer of Data
              </h2>
              <div className="space-y-4">
                <p>
                  The information, including Personal Data, we obtain from or about you may be maintained, processed and stored by us on the systems situated in the territory of Republic of India. However, subject to applicable laws, your information, including Personal Data, may be transferred to – and maintained on – computers located in the countries other than India where the data protection laws may differ from those of the Data Protection laws of India.
                </p>
                <p>
                  Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer. The Company will take all the steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy and no transfer of your Personal Data will take place to an organisation or a country unless there are adequate controls in place including the security of your data and other Personal Information.
                </p>
                <p>
                  We comply with generally accepted industry standard regulations regarding the collection, use, and retention of data under the Information Technology Act, 2000 and Data Protection Rules. By using the Website and/or services, you consent to the collection, transfer, use, storage and disclosure of your information as described in this Privacy Policy, including to the transfer of your information outside of your country of residence.
                </p>
              </div>
            </div>

            {/* Links to Other Sites */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Links to Other Sites
              </h2>
              <div className="space-y-4">
                <p>
                  Our Website may contain links to third party websites and mobile applications that are not operated by us. If you click such link, you may be directed to such third party's websites and mobile applications. We strongly advise you to review the Privacy Policy of every site you visit.
                </p>
                <p>
                  We also use APIs, tools and other services of third party for offering our services to the Users. We have no control over and assume no responsibility for the content, privacy policies or practices of any third party websites and mobile applications or any services offered by such third parties. You agree that we shall not be liable for any breach of your privacy of Personal Information or loss incurred by your use of such websites or services.
                </p>
                <p>
                  We may host surveys for survey creators for our Website who are the owners and users of your survey responses. We do not own or sell your responses. Anything you expressly disclose in your responses will be disclosed to survey creators. Please contact the survey creator directly to better understand how they might share your survey responses.
                </p>
              </div>
            </div>

            {/* Changes to this Privacy Policy */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Changes to this Privacy Policy
              </h2>
              <div className="space-y-4">
                <p>
                  This Privacy Policy will remain in effect except with respect to any changes in its provisions in the future. We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page, which will be in effect immediately after being posted on this page.
                </p>
                <p>
                  We reserve the right to update or change our Privacy Policy at any time and you are advised to review this Privacy Policy periodically for any changes. Your continued use of the Website and our Service after we post any modifications to the Privacy Policy on this page will constitute your acknowledgment of the modifications and your consent to abide and be bound by the modified Privacy Policy.
                </p>
                <p>
                  We may let you know via email and/or a prominent notice on our Website, prior to the material change becoming effective and update "effective date" at the top of this Privacy Policy.
                </p>
              </div>
            </div>

            {/* Copyright, Trademark, and other Intellectual Property Protection */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Copyright, Trademark, and other Intellectual Property Protection
              </h2>
              <div className="space-y-4">
                <p>
                  All word marks and logos of CollegeSearch are intellectual property of the Company, all materials on the Website are protected by copyright laws, trademark laws, and other intellectual property laws. Any unauthorised use of any such information or materials may violate copyright laws, trademarks laws, intellectual property laws, and other laws and regulations.
                </p>
              </div>
            </div>

            {/* Contact Us */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Contact Us
              </h2>
              <div className="space-y-4">
                <p>
                  If you have any questions about this Privacy Policy, please contact us by email at <a href="mailto:info@CollegeSearch.in" className="text-orange-500 hover:text-orange-600 hover:underline">info@CollegeSearch.in</a>.
                </p>
                <p>
                  By accessing the Website or placing an order or sending any information, you are communicating with the Company electronically and you agree to receive communications (including transactional, promotional and/or commercial messages) from the Company periodically and as and when required. We may communicate with you by e-mail, SMS, phone call or by posting notices on the Website or by any other mode of communication.
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

