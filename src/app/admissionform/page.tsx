"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { collection, getDocs, query, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FooterLinking from '@/components/FooterLinking';

interface College {
  id: string;
  name?: string;
  collegeName?: string;
  instituteName?: string;
  universityName?: string;
  image?: string;
  logo?: string;
  logoUrl?: string;
  city?: string;
  cityName?: string;
  state?: string;
  stateName?: string;
  province?: string;
  location?: {
    city?: string;
    state?: string;
  };
  totalFees?: number | string;
  fee?: number | string;
  fees?: number | string;
  avgFee?: number | string;
  averageFee?: number | string;
  applicationCost?: number | string;
  applicationFee?: number | string;
}

export default function Admissionform() {
  const [htmlContent, setHtmlContent] = useState("");
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [htmlTemplate, setHtmlTemplate] = useState("");
  const isSubmittingRef = useRef(false); // Persistent ref to track submission state
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  // Handle modal open/close and body scroll lock
  useEffect(() => {
    if (showThankYouModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showThankYouModal]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showThankYouModal) {
        setShowThankYouModal(false);
      }
    };

    if (showThankYouModal) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showThankYouModal]);

  // Format currency
  const formatCurrency = (amount: number | string | undefined): string => {
    if (!amount) return '₹ —';
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.]/g, '')) : amount;
    if (isNaN(num)) return '₹ —';
    return '₹ ' + num.toLocaleString('en-IN');
  };

  // Get location string
  const getLocation = (college: College): string => {
    const city = college.city || college.cityName || (college.location && college.location.city) || '';
    const state = college.state || college.stateName || college.province || (college.location && college.location.state) || '';
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    return '—';
  };

  // Fetch colleges from Firestore
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const collegesRef = collection(db, 'colleges');
        const q = query(collegesRef, limit(10));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const collegesData: College[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as College[];
          setColleges(collegesData);
        }
      } catch (error) {
        console.error('Error fetching colleges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, []);

  // Fetch HTML template
  useEffect(() => {
    fetch("/html/admissionform.html")
      .then((res) => res.text())
      .then((data) => {
        // Remove the Firebase script from HTML if it exists
        let html = data.replace(/<!-- Firebase SDK -->[\s\S]*?<\/script>/g, '');
        // Remove form action to prevent GET submission
        html = html.replace(/<form([^>]*)\s+action=["'][^"']*["']([^>]*)>/gi, '<form$1$2>');
        // Ensure form has method="post" or no method (defaults to GET, but we'll prevent it)
        html = html.replace(/<form([^>]*)\s+onsubmit=["']([^"']*)["']([^>]*)>/gi, (match, before, onsubmit, after) => {
          // Keep onsubmit but ensure we can override it
          return `<form${before} onsubmit="return window.validateForm && window.validateForm(event) || false;"${after}>`;
        });

        // Remove the hardcoded Popular Searches section
        // Match from <div id="footer_linking"> to </div> (closing the footer_linking div)
        const footerLinkingStart = html.indexOf('<div id="footer_linking">');
        if (footerLinkingStart !== -1) {
          // Find the matching closing tag by counting divs
          let depth = 0;
          let pos = footerLinkingStart;
          let startPos = footerLinkingStart;

          while (pos < html.length) {
            if (html.substr(pos, 4) === '<div') {
              depth++;
            } else if (html.substr(pos, 6) === '</div>') {
              depth--;
              if (depth === 0) {
                const endPos = pos + 6;
                const before = html.substring(0, startPos);
                const after = html.substring(endPos);
                // Remove the entire footer_linking section as it will be replaced by FooterLinking component
                html = before + after;
                break;
              }
            }
            pos++;
          }
        }

        setHtmlTemplate(html);
      })
      .catch((err) => console.error("Error loading HTML:", err));
  }, []);

  // Store form data to Firebase
  const saveFormDataToFirebase = useCallback(async (formData: {
    name: string;
    mobile: string;
    email: string;
    course: string;
    location: string;
  }) => {
    try {
      const admissionFormData = {
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email,
        course: formData.course,
        location: [formData.location], // Convert single value to array for consistency
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        source: 'admission_form',
      };

      await addDoc(collection(db, 'admissions'), admissionFormData);
      console.log('Form data saved to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error saving form data to Firebase:', error);
      return false;
    }
  }, []);

  // Inject CSS for Apply Now button styling
  useEffect(() => {
    const styleId = 'admission-form-apply-btn-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .apply-btn {
        display: inline-block !important;
        padding: 12px 24px !important;
        background-color: #dc2626 !important;
        color: #ffffff !important;
        text-decoration: none !important;
        border-radius: 6px !important;
        font-weight: 700 !important;
        font-size: 14px !important;
        text-align: center !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3) !important;
        border: none !important;
        cursor: pointer !important;
        white-space: nowrap !important;
        min-width: 120px !important;
        line-height: 1.5 !important;
      }
      .apply-btn:hover {
        background-color: #b91c1c !important;
        box-shadow: 0 4px 8px rgba(220, 38, 38, 0.4) !important;
        transform: translateY(-1px) !important;
      }
      .apply-btn:active {
        transform: translateY(0) !important;
        box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3) !important;
      }
      #collegesTable td:last-child {
        text-align: center !important;
        vertical-align: middle !important;
        padding: 16px !important;
      }
      @media (max-width: 768px) {
        .apply-btn {
          padding: 10px 20px !important;
          font-size: 13px !important;
          min-width: 100px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Inject colleges data into HTML when both template and colleges are ready
  useEffect(() => {
    if (htmlTemplate && !loading) {
      const tbodyId = 'collegesTableBody';
      const tbodyRegex = new RegExp(`<tbody[^>]*id="${tbodyId}"[^>]*>.*?</tbody>`, 's');

      let tableRows = '';
      if (colleges.length === 0) {
        tableRows = '<tr><td colspan="6" style="text-align: center; padding: 20px;"><p>No colleges found</p></td></tr>';
      } else {
        tableRows = colleges.map((college) => {
          const name = college.name || college.collegeName || college.instituteName || college.universityName || 'Unknown College';
          // Use college image or default to a proper placeholder
          const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAxNUMxOC45Mjg5IDE1IDE0IDE5LjkyODkgMTQgMjZDMTQgMzIuMDcxMSAxOC45Mjg5IDM3IDI1IDM3QzMxLjA3MTEgMzcgMzYgMzIuMDcxMSAzNiAyNkMzNiAxOS45Mjg5IDMxLjA3MTEgMTUgMjUgMTVaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMiAzNUwxMiA0MEgxNkwxNiAzNUgxMloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTM0IDM1TDM0IDQwSDM4TDM4IDM1SDM0WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
          const image = college.image || college.logo || college.logoUrl || defaultImage;
          const location = getLocation(college);
          const totalFees = college.totalFees || college.fee || college.fees || college.avgFee || college.averageFee || '';
          const applicationCost = college.applicationCost || college.applicationFee || 500;
          const formattedFees = formatCurrency(totalFees);
          const formattedAppCost = formatCurrency(applicationCost);

          return `
            <tr>
              <td>
                <div style="background-color: transparent;">
                  <img 
                    src="${image}" 
                    alt="${name}" 
                    style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; background-color: #f3f4f6;"
                    onerror="this.onerror=null; this.src='${defaultImage}';"
                  >
                  <p style="background-color: transparent; margin: 0; padding: 0;">${name}</p>
                </div>
              </td>
              <td>${location}</td>
              <td>${formattedFees}</td>
              <td>${formattedAppCost}</td>
              <td>
                <del>${formattedAppCost}</del>
                <s>Free</s>
              </td>
              <td>
                <a 
                  href="#admissionPageForm" 
                  class="apply-btn"
                  style="
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #dc2626;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 14px;
                    text-align: center;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
                    border: none;
                    cursor: pointer;
                    white-space: nowrap;
                    min-width: 120px;
                  "
                  onmouseover="this.style.backgroundColor='#b91c1c'; this.style.boxShadow='0 4px 8px rgba(220, 38, 38, 0.4)'; this.style.transform='translateY(-1px)';"
                  onmouseout="this.style.backgroundColor='#dc2626'; this.style.boxShadow='0 2px 4px rgba(220, 38, 38, 0.3)'; this.style.transform='translateY(0)';"
                >
                  Apply Now
                </a>
              </td>
            </tr>
          `;
        }).join('');
      }

      const updatedHtml = htmlTemplate.replace(tbodyRegex, `<tbody id="${tbodyId}">${tableRows}</tbody>`);
      setHtmlContent(updatedHtml);
    } else if (htmlTemplate && loading) {
      // Show loading state
      const tbodyId = 'collegesTableBody';
      const tbodyRegex = new RegExp(`<tbody[^>]*id="${tbodyId}"[^>]*>.*?</tbody>`, 's');
      const loadingHtml = htmlTemplate.replace(tbodyRegex, `<tbody id="${tbodyId}"><tr><td colspan="6" style="text-align: center; padding: 20px;"><p>Loading colleges...</p></td></tr></tbody>`);
      setHtmlContent(loadingHtml);
    }
  }, [colleges, loading, htmlTemplate]);

  // Add form submission handler after HTML is injected
  useEffect(() => {
    if (!htmlContent) return;

    // Make saveFormDataToFirebase accessible globally
    (window as any).saveFormDataToFirebase = saveFormDataToFirebase;

    let handleFormSubmit: ((e: Event) => Promise<boolean>) | null = null;

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const form = document.getElementById('admission_forms') as HTMLFormElement;
      if (!form) {
        console.log('Form not found, retrying...');
        return;
      }

      // Remove default form action and set method to prevent GET submission
      form.removeAttribute('action');
      form.method = 'post';
      // Remove the inline onsubmit to use our event listener instead
      form.removeAttribute('onsubmit');

      // Store original validateForm if it exists and prevent it from running
      const originalValidateForm = (window as any).validateForm;

      // Create our form submission handler
      handleFormSubmit = async (e: Event) => {
        // Prevent multiple submissions using ref
        if (isSubmittingRef.current) {
          console.log('Form submission already in progress, ignoring duplicate submission');
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        e.preventDefault();
        e.stopPropagation();

        // Set flag to prevent duplicate submissions
        isSubmittingRef.current = true;

        console.log('Form submission intercepted');

        try {
          // Get form values
          const nameInput = document.getElementById('reg_name') as HTMLInputElement;
          const mobileInput = document.getElementById('reg_mobile') as HTMLInputElement;
          const emailInput = document.getElementById('reg_email') as HTMLInputElement;
          const courseSelect = document.getElementById('preferred_course') as HTMLSelectElement;
          const locationSelect = document.getElementById('admissionLocation') as HTMLSelectElement;

          if (!nameInput || !mobileInput || !emailInput || !courseSelect || !locationSelect) {
            console.error('Form fields not found');
            isSubmittingRef.current = false;
            return false;
          }

          const name = nameInput.value.trim();
          const mobile = mobileInput.value.trim();
          const email = emailInput.value.trim();
          const course = courseSelect.value;
          const location = locationSelect.value; // Single value instead of array

          // Basic validation
          if (!name || !mobile || !email || !course || !location) {
            console.error('Please fill all required fields');
            isSubmittingRef.current = false;
            // Call original validateForm if it exists for error display (but don't submit)
            if (originalValidateForm) {
              try {
                const syntheticEvent = new Event('submit', { bubbles: false, cancelable: true });
                originalValidateForm.call(null, syntheticEvent);
              } catch (err) {
                console.error('Error in original validateForm:', err);
              }
            }
            return false;
          }

          console.log('Saving form data to Firebase:', { name, mobile, email, course, location });

          // Save to Firebase (only once)
          const saved = await saveFormDataToFirebase({
            name,
            mobile,
            email,
            course,
            location,
          });

          if (saved) {
            console.log('Form data saved successfully');
            // Reset form
            form.reset();
            // Show thank you modal
            setShowThankYouModal(true);
            // Call original validateForm if it exists to continue with existing flow (but prevent default)
            if (originalValidateForm) {
              try {
                // Create a synthetic event that won't cause navigation
                const syntheticEvent = new Event('submit', { bubbles: false, cancelable: true });
                Object.defineProperty(syntheticEvent, 'preventDefault', {
                  value: () => { },
                  writable: false
                });
                originalValidateForm.call(null, syntheticEvent);
              } catch (err) {
                console.error('Error in original validateForm:', err);
              }
            }
          } else {
            alert('There was an error submitting the form. Please try again.');
          }
        } catch (error) {
          console.error('Error saving form:', error);
          alert('There was an error submitting the form. Please try again.');
        } finally {
          // Reset flag after a delay to allow UI updates
          setTimeout(() => {
            isSubmittingRef.current = false;
          }, 2000);
        }

        return false;
      };

      // Override validateForm function to use our handler (this prevents the original from running)
      (window as any).validateForm = function (e?: Event) {
        if (!e) {
          e = window.event as Event;
        }
        if (handleFormSubmit && e) {
          // Our handler will prevent default and handle everything
          return handleFormSubmit(e);
        }
        return false;
      };

      // Remove any existing listeners first, then add our handler
      // Use capture phase to intercept before other handlers
      const existingHandler = handleFormSubmit as EventListener;
      form.removeEventListener('submit', existingHandler, true);
      form.addEventListener('submit', existingHandler, true);

      console.log('Form handler attached successfully');
    }, 1000); // Increased timeout to ensure DOM is ready

    return () => {
      clearTimeout(timer);
      // Clean up
      const form = document.getElementById('admission_forms') as HTMLFormElement;
      if (form && handleFormSubmit) {
        form.removeEventListener('submit', handleFormSubmit as EventListener, true);
      }
      delete (window as any).saveFormDataToFirebase;
    };
  }, [htmlContent, saveFormDataToFirebase]);

  return (
    <main className="min-h-screen bg-gray-50 page-admission">
      <Header />

      {/* Render HTML once loaded */}
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />

      {/* Popular Searches - Same as home page */}
      <FooterLinking />

      <Footer />

      {/* Thank You Modal */}
      {showThankYouModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
            onClick={() => setShowThankYouModal(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative">
              {/* Close Button */}
              <button
                onClick={() => setShowThankYouModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>

              {/* Modal Content */}
              <div className="p-8 text-center">
                {/* Success Icon */}
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                {/* Thank You Message */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Thank You for Applying!
                </h2>
                <p className="text-gray-600 mb-6">
                  We have received your application successfully. Our counsellors will connect with you shortly to guide you through the admission process.
                </p>

                {/* Close Button */}
                <button
                  onClick={() => setShowThankYouModal(false)}
                  className="w-full bg-[#8B4513] hover:bg-[#A0522D] text-white font-semibold py-3 rounded-lg transition-colors"
                  style={{ backgroundColor: '#8B4513' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
