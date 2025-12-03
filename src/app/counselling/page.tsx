"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FooterLinking from '@/components/FooterLinking';
import CounsellingModal from '@/components/CounsellingModal';

interface Counsellor {
  id: string;
  name?: string;
  title?: string;
  experience?: string | number;
  rating?: string | number;
  description?: string;
  bio?: string;
  image?: string;
  imageUrl?: string;
  photo?: string;
  status?: string;
}

interface Course {
  id: string;
  courseName?: string;
  name?: string;
  totalColleges?: number | string;
  colleges?: number | string;
  avgPackage?: string | number;
  averagePackage?: string | number;
  package?: string | number;
}

interface Exam {
  id: string;
  examName?: string;
  title?: string;
  name?: string;
  course?: string;
  logo?: string;
  examOverview?: {
    coursesOffered?: string[];
  };
}

export default function Counselling() {
  const [htmlContent, setHtmlContent] = useState("");
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [examsLoading, setExamsLoading] = useState(true);
  const [htmlTemplate, setHtmlTemplate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("BCA");

  // Fetch counsellors from Firestore
  useEffect(() => {
    const fetchCounsellors = async () => {
      try {
        // Try different collection names
        const collections = ['counsellors', 'counselors', 'counsellor', 'counselor'];
        let counsellorsData: Counsellor[] = [];

        for (const collName of collections) {
          try {
            const counsellorsRef = collection(db, collName);
            const q = query(counsellorsRef, limit(10));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
              counsellorsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as Counsellor[];
              break; // Found data, stop trying other collections
            }
          } catch (error) {
            // Collection doesn't exist, try next one
            continue;
          }
        }

        setCounsellors(counsellorsData);
      } catch (error) {
        console.error('Error fetching counsellors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounsellors();
  }, []);

  // Fetch courses from Firestore
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesRef = collection(db, 'courses');
        const q = query(coursesRef, limit(10));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const coursesData: Course[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Course[];
          setCourses(coursesData);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch exams from Firestore
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examsData: Exam[] = [];

        // Fetch from "exams" collection
        try {
          const examsRef = collection(db, 'exams');
          const q = query(examsRef, limit(20));
          const snapshot = await getDocs(q);

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            examsData.push({
              id: doc.id,
              examName: data.title || data.examName || data.name,
              title: data.title || data.examName || data.name,
              name: data.title || data.examName || data.name,
              course: data.course || (Array.isArray(data.examOverview?.coursesOffered) ? data.examOverview.coursesOffered[0] : ''),
              logo: data.logo,
              examOverview: data.examOverview,
            });
          });
        } catch (error) {
          console.error('Error fetching exams from "exams" collection:', error);
        }

        // Fetch from "keamExams" collection
        try {
          const keamExamsRef = collection(db, 'keamExams');
          const q = query(keamExamsRef, limit(20));
          const snapshot = await getDocs(q);

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            examsData.push({
              id: doc.id,
              examName: data.examName || data.title || data.name,
              title: data.examName || data.title || data.name,
              name: data.examName || data.title || data.name,
              course: data.course || (Array.isArray(data.examOverview?.coursesOffered) ? data.examOverview.coursesOffered[0] : ''),
              logo: data.logo,
              examOverview: data.examOverview,
            });
          });
        } catch (error) {
          console.error('Error fetching exams from "keamExams" collection:', error);
        }

        // Remove duplicates based on exam name
        const uniqueExams = examsData.filter((exam, index, self) =>
          index === self.findIndex((e) => 
            (e.examName || e.title || e.name)?.toLowerCase() === (exam.examName || exam.title || exam.name)?.toLowerCase()
          )
        );

        setExams(uniqueExams.slice(0, 10)); // Limit to 10 exams
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setExamsLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Fetch HTML template
  useEffect(() => {
    fetch("/html/counselling.html")
      .then((res) => res.text())
      .then((data) => {
        // Remove the hardcoded Popular Searches section
        // Match from <div id="footer_linking"> to </div> (closing the footer_linking div)
        const footerLinkingStart = data.indexOf('<div id="footer_linking">');
        if (footerLinkingStart !== -1) {
          // Find the matching closing tag by counting divs
          let depth = 0;
          let pos = footerLinkingStart;
          let startPos = footerLinkingStart;
          
          while (pos < data.length) {
            if (data.substr(pos, 4) === '<div') {
              depth++;
            } else if (data.substr(pos, 6) === '</div>') {
              depth--;
              if (depth === 0) {
                const endPos = pos + 6;
                const before = data.substring(0, startPos);
                const after = data.substring(endPos);
                // Remove the entire footer_linking section as it will be replaced by FooterLinking component
                data = before + after;
                break;
              }
            }
            pos++;
          }
        }
        // Replace Schedule Now buttons with counselling modal class
        // Match any Schedule Now button with open-modal class and replace it
        data = data.replace(
          /<a([^>]*class="[^"]*open-modal[^"]*"[^>]*)>Schedule Now<\/a>/gi,
          (match, attrs) => {
            // Replace open-modal with open-counselling-modal in the class attribute
            const newAttrs = attrs.replace(/class="([^"]*)open-modal([^"]*)"/, 'class="$1open-counselling-modal$2"');
            return `<a${newAttrs} data-leadcta="counselling_cta" data-head="Counselling" data-logo="https://www.collegesearch.in/build/assets/counselling_icon-D09RxFYt.svg">Schedule Now</a>`;
          }
        );
        
        setHtmlTemplate(data);
      })
      .catch((err) => console.error("Error loading HTML:", err));
  }, []);

  // Format package value
  const formatPackage = (pkg: string | number | undefined): string => {
    if (!pkg) return '—';
    const str = typeof pkg === 'number' ? pkg.toString() : pkg;
    // If already formatted, return as is
    if (str.includes('₹') || str.includes('LPA')) return str;
    // Otherwise format it
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '—';
    return `₹ ${num}LPA`;
  };

  // Inject counsellors, courses, and exams data into HTML when both template and data are ready
  useEffect(() => {
    if (htmlTemplate && !loading && !coursesLoading && !examsLoading) {
      let updatedHtml = htmlTemplate;

      // Inject counsellors
      const wrapId = 'counselorTeamWrap';
      const wrapRegex = new RegExp(`<div[^>]*id="${wrapId}"[^>]*>.*?</div>`, 's');
      
      let counsellorsHtml = '';
      if (counsellors.length === 0) {
        counsellorsHtml = '<div style="text-align: center; padding: 20px;"><p>No counsellors found</p></div>';
      } else {
        counsellorsHtml = counsellors.map((counsellor, index) => {
          const name = counsellor.name || 'Unknown';
          const image = counsellor.image || counsellor.imageUrl || counsellor.photo || '/images11.png';
          const title = counsellor.title || 'Counsellor';
          const rating = counsellor.rating || '4.5';
          const experience = counsellor.experience ? `${counsellor.experience}${typeof counsellor.experience === 'number' ? ' Years' : ''} of Experience` : '';
          const description = counsellor.description || counsellor.bio || '';

          return `
            <div class="counselorTeam_div counselorTeam_${index + 1}" style="background-image: none !important;">
              <img src="${image}" alt="${name}" style="width: 100%; height: auto; display: block;">
              <div class="counselorTeam_details">
                <p>${name}</p>
                <div class="exp_rtng">
                  ${title ? `<span>${title}</span>` : ''}
                  ${rating ? `<span>${rating}</span>` : ''}
                </div>
                ${description ? `<b>${description}</b>` : ''}
                <a href="javascript:void(0)" class="open-counselling-modal trackCTA"
                   data-leadcta="counselling_cta" data-head="Counselling"
                   data-logo="https://www.collegesearch.in/build/assets/counselling_icon-D09RxFYt.svg">
                  Contact Now
                </a>
              </div>
            </div>
          `;
        }).join('');
      }

      updatedHtml = updatedHtml.replace(wrapRegex, `<div class="counselorTeam_wrap" id="${wrapId}">${counsellorsHtml}</div>`);

      // Inject courses
      const coursesWrapId = 'coursesWrap';
      const coursesWrapRegex = new RegExp(`<div[^>]*id="${coursesWrapId}"[^>]*>.*?</div>`, 's');
      
      let coursesHtml = '';
      if (courses.length === 0) {
        coursesHtml = '<div style="text-align: center; padding: 20px;"><p>No courses found</p></div>';
      } else {
        coursesHtml = courses.map((course) => {
          const name = course.courseName || course.name || 'Unknown Course';
          const colleges = course.totalColleges || course.colleges || 0;
          const avgPackage = formatPackage(course.avgPackage || course.averagePackage || course.package);

          return `
            <div class="explore_course_div">
              <p class="course_logo"></p>
              <h4>${name}</h4>
              <div class="course_data_div">
                <p><span>Colleges</span><br>${colleges}</p>
                <p><span>Avg Package</span><br>${avgPackage}</p>
              </div>
              <a href="javascript:void(0)" class="open-counselling-modal trackCTA"
                 data-leadcta="counselling_cta" data-head="Counselling"
                 data-logo="https://www.collegesearch.in/build/assets/counselling_icon-D09RxFYt.svg"
                 data-course="${name}">
                Contact Now
              </a>
            </div>
          `;
        }).join('');
      }

      updatedHtml = updatedHtml.replace(coursesWrapRegex, `<div class="explore_course_wrap" id="${coursesWrapId}">${coursesHtml}</div>`);

      // Inject exams - find the related_exams_wrap div and replace all content inside
      let examsHtml = '';
      if (exams.length === 0) {
        examsHtml = '<div style="text-align: center; padding: 20px;"><p>No exams found</p></div>';
      } else {
        examsHtml = exams.map((exam) => {
          const examName = exam.examName || exam.title || exam.name || 'Unknown Exam';
          const course = exam.course || 
                        (Array.isArray(exam.examOverview?.coursesOffered) 
                          ? exam.examOverview.coursesOffered.join(', ') 
                          : '') || 
                        'General';
          const logo = exam.logo || '';

          return `
            <div class="related_exams_div">
              ${logo ? `<img src="${logo}" alt="${examName}" style="width: 48px; height: 48px; object-fit: contain; border-radius: 50%; margin-bottom: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />` : ''}
              <div class="relatedExamLogo" ${logo ? 'style="display: none;"' : ''}></div>
              <p>${examName}</p>
              <span>${course}</span>
              <a href="javascript:void(0)" class="open-counselling-modal trackCTA"
                 data-leadcta="counselling_cta" data-head="Counselling"
                 data-logo="https://www.collegesearch.in/build/assets/counselling_icon-D09RxFYt.svg"
                 data-course="${course}">
                Contact Now
              </a>
            </div>
          `;
        }).join('');
      }

      // Replace the entire related_exams_wrap div content
      // Match from opening tag to closing tag, including all nested content
      // Use a more robust regex that handles nested divs
      const examsWrapStart = updatedHtml.indexOf('<div class="related_exams_wrap">');
      if (examsWrapStart !== -1) {
        // Find the matching closing tag by counting divs
        let depth = 0;
        let pos = examsWrapStart;
        let startPos = examsWrapStart;
        
        while (pos < updatedHtml.length) {
          if (updatedHtml.substr(pos, 4) === '<div') {
            depth++;
          } else if (updatedHtml.substr(pos, 6) === '</div>') {
            depth--;
            if (depth === 0) {
              const endPos = pos + 6;
              const before = updatedHtml.substring(0, startPos);
              const after = updatedHtml.substring(endPos);
              updatedHtml = before + `<div class="related_exams_wrap">${examsHtml}</div>` + after;
              break;
            }
          }
          pos++;
        }
      } else {
        // Fallback to regex if structure is different
        const examsWrapRegex = /<div[^>]*class=["']related_exams_wrap["'][^>]*>[\s\S]*?<\/div>/;
        updatedHtml = updatedHtml.replace(examsWrapRegex, `<div class="related_exams_wrap">${examsHtml}</div>`);
      }
      
      setHtmlContent(updatedHtml);
    } else if (htmlTemplate && (loading || coursesLoading || examsLoading)) {
      // Show loading state
      let loadingHtml = htmlTemplate;
      
      const wrapId = 'counselorTeamWrap';
      const wrapRegex = new RegExp(`<div[^>]*id="${wrapId}"[^>]*>.*?</div>`, 's');
      loadingHtml = loadingHtml.replace(wrapRegex, `<div class="counselorTeam_wrap" id="${wrapId}"><div style="text-align: center; padding: 20px;"><p>Loading counsellors...</p></div></div>`);
      
      const coursesWrapId = 'coursesWrap';
      const coursesWrapRegex = new RegExp(`<div[^>]*id="${coursesWrapId}"[^>]*>.*?</div>`, 's');
      loadingHtml = loadingHtml.replace(coursesWrapRegex, `<div class="explore_course_wrap" id="${coursesWrapId}"><div style="text-align: center; padding: 20px;"><p>Loading courses...</p></div></div>`);
      
      // Replace exams section in loading state
      const examsWrapStartLoading = loadingHtml.indexOf('<div class="related_exams_wrap">');
      if (examsWrapStartLoading !== -1) {
        let depth = 0;
        let pos = examsWrapStartLoading;
        let startPos = examsWrapStartLoading;
        
        while (pos < loadingHtml.length) {
          if (loadingHtml.substr(pos, 4) === '<div') {
            depth++;
          } else if (loadingHtml.substr(pos, 6) === '</div>') {
            depth--;
            if (depth === 0) {
              const endPos = pos + 6;
              const before = loadingHtml.substring(0, startPos);
              const after = loadingHtml.substring(endPos);
              loadingHtml = before + `<div class="related_exams_wrap"><div style="text-align: center; padding: 20px;"><p>Loading exams...</p></div></div>` + after;
              break;
            }
          }
          pos++;
        }
      }
      
      setHtmlContent(loadingHtml);
    } else if (htmlTemplate) {
      setHtmlContent(htmlTemplate);
    }
  }, [counsellors, courses, exams, loading, coursesLoading, examsLoading, htmlTemplate]);

  // Handle Contact Now button clicks
  useEffect(() => {
    if (!htmlContent) return;

    const handleContactNowClick = (e: Event) => {
      const target = e.target as HTMLElement;
      // Check for new class first
      let contactButton = target.closest('.open-counselling-modal');
      
      // If not found, check for old class with "Contact Now" or "Schedule Now" text (for static HTML buttons)
      if (!contactButton) {
        const oldModalButton = target.closest('.open-modal');
        if (oldModalButton) {
          const buttonText = oldModalButton.textContent?.trim();
          if (buttonText === 'Contact Now' || buttonText === 'Schedule Now') {
            contactButton = oldModalButton;
          }
        }
      }
      
      if (contactButton) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get course name from data attribute if available
        const courseName = contactButton.getAttribute('data-course') || 'BCA';
        setSelectedCourse(courseName);
        setIsModalOpen(true);
      }
    };

    // Use event delegation on the document
    document.addEventListener('click', handleContactNowClick, true);

    return () => {
      document.removeEventListener('click', handleContactNowClick, true);
    };
  }, [htmlContent]);

  // Add custom styles for aligning Top Exams section to the left
  useEffect(() => {
    const styleId = 'counselling-page-styles';
    
    // Remove existing style if it exists
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .popular_exam_about_wrap {
        flex-direction: row-reverse !important;
        justify-content: flex-start !important;
        align-items: flex-start !important;
      }
      .popular_exam_about {
        text-align: left !important;
        align-items: flex-start !important;
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
      }
      .popular_exam_about h3 {
        text-align: left !important;
        align-self: flex-start !important;
        width: 100% !important;
        margin-left: 0 !important;
        margin-right: auto !important;
      }
      .popular_exam_about p {
        text-align: left !important;
        align-self: flex-start !important;
        width: 100% !important;
        margin-left: 0 !important;
        margin-right: auto !important;
      }
      .popular_exam_about span {
        text-align: left !important;
        align-self: flex-start !important;
        width: 100% !important;
        margin-left: 0 !important;
        margin-right: auto !important;
      }
      .popular_exam_about a {
        align-self: flex-start !important;
        margin-top: 16px !important;
        margin-left: 0 !important;
        margin-right: auto !important;
      }
      .course_wrapper.popular_exam_about_wrap {
        align-items: flex-start !important;
      }
      .course_wrapper.popular_exam_about_wrap .course_about {
        text-align: left !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [htmlContent]);

  return (
    <main className="min-h-screen bg-gray-50 page-counselling">
      <Header />

      {/* Render HTML once loaded */}
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />

      {/* Popular Searches - Same as home page */}
      <FooterLinking />

      <Footer />

      {/* Counselling Modal */}
      <CounsellingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentCourse={selectedCourse}
      />

    </main>
  );
}
