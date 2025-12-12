"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface CounsellingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCourse?: string;
}

export default function CounsellingModal({ isOpen, onClose, currentCourse = "BCA" }: CounsellingModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
  });
  const [selectedCourse, setSelectedCourse] = useState(currentCourse);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  useEffect(() => {
    setSelectedCourse(currentCourse);
  }, [currentCourse]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        mobile: "",
        email: "",
      });
      setSubmitStatus("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      mobile: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("");

    try {
      const payload = {
        fullName: formData.name.trim(),
        phone: formData.mobile.trim(),
        email: formData.email.trim(),
        currentCourse: selectedCourse.trim(),
        action: "counselling_registration",
        source: "counselling_page",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "admissions"), payload);
      
      setSubmitStatus("Thanks! Our counsellor will contact you shortly.");
      
      // Reset form
      setFormData({
        name: "",
        mobile: "",
        email: "",
      });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setSubmitStatus("");
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error saving counselling data:", error);
      setSubmitStatus("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // For now, we'll just log it. In a real implementation, you'd integrate with Google OAuth
    // and then save the data after successful authentication
    console.log("Google sign in clicked");
    // TODO: Implement Google OAuth integration
    // After successful Google auth, save to Firestore with the same payload structure
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>

          {/* Modal Content */}
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Register to Counselling
              </h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  {/* Computer screen with graduation cap icon */}
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 0v4m0-4h4m-4 0H8"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Register for Counselling
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Fill in the form below and our counsellors will reach out to you
                  </p>
                </div>
              </div>
            </div>

            {/* Current Course Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
                <p className="text-sm text-gray-700">
                  <strong className="font-semibold">{selectedCourse}</strong> is your Current Course.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  // Handle course change - you can implement a course selector here
                  console.log("Change course clicked");
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Change
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Mobile Field */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-medium">+91</span>
                  </div>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleMobileInput}
                    placeholder="Enter mobile number"
                    maxLength={10}
                    className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your Email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Status Message */}
              {submitStatus && (
                <div className={`p-3 rounded-lg text-sm text-center ${
                  submitStatus.includes("Thanks") 
                    ? "bg-green-50 text-green-700" 
                    : "bg-red-50 text-red-700"
                }`}>
                  {submitStatus}
                </div>
              )}

              {/* Register Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full text-white font-semibold py-3 rounded-lg transition-colors ${
                  isSubmitting 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-[#8B4513] hover:bg-[#A0522D]"
                }`}
                style={!isSubmitting ? { backgroundColor: '#8B4513' } : {}}
              >
                {isSubmitting ? "Registering..." : "Register"}
              </button>

              {/* Login Link */}
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Login Now
                  </button>
                </p>
              </div>

              {/* Terms and Privacy */}
              <p className="text-xs text-gray-500 text-center mt-4">
                By submitting, you accept our{" "}
                <a
                  href="/terms-and-conditions"
                  className="text-red-600 hover:underline"
                >
                  Terms
                </a>
                ,{" "}
                <a
                  href="/privacy-policy"
                  className="text-red-600 hover:underline"
                >
                  Privacy Policy
                </a>{" "}
                and consent to SMS updates.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

