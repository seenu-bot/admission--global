"use client";

import { useState } from "react";
 import { useEffect } from "react";
 import { useRouter } from "next/navigation";
 import Header from "@/components/Header";
 import Footer from "@/components/Footer";
 import { courseNameToSlug } from "@/lib/courses";

 export default function Exams() {
   const router = useRouter();

   useEffect(() => {
    // Replace current history entry with home page, then navigate to articles
    // This ensures back button from articles goes to home page
    if (typeof window !== 'undefined') {
      // Replace the /exams entry in history with / (home)
      window.history.replaceState(null, '', '/');
    }
    // Redirect directly to articles page instead of overall exams
    // Using push instead of replace so home stays in history
        router.push('/articles');
   }, [router]);

   return (
     <main className="min-h-screen bg-gray-50">
       <Header />

       <div className="container common_listing_wrapper" id="exam_listing_wrapper">
         <h1>Entrance Exams - 2025</h1>

         <article className="sanitize_content">
           <p>
             There are various recognised Boards and Councils in India that are responsible for regulating and
             overseeing different aspects of education in the country.
           </p>
         </article>

         <div className="main_listing_wrapper">
           <div className="listing_data_parent">
             <div className="listing_data_card" style={{ textAlign: "center" }}>
               <p>Loading overall exams…</p>
             </div>
           </div>
         </div>
       </div>

       <Footer />
     </main>
   );
 }
