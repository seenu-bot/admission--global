"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface StudyAbroadModalProps {
  isOpen: boolean;
  onClose: () => void;
  formType?: string; // e.g., "find_university", "wishlist", "loan", "visa", "eligibility", "exams"
  title?: string;
  description?: string;
}

export default function StudyAbroadModal({ 
  isOpen, 
  onClose, 
  formType = "general",
  title = "Get in Touch",
  description = "Fill out the form below and our team will get back to you."
}: StudyAbroadModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    query: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error" | ""; message: string }>({
    type: "",
    message: "",
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        mobile: "",
        email: "",
        query: "",
      });
      setSubmitStatus({ type: "", message: "" });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear status message when user starts typing
    if (submitStatus.message) {
      setSubmitStatus({ type: "", message: "" });
    }
  };

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      mobile: value,
    }));
    if (submitStatus.message) {
      setSubmitStatus({ type: "", message: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: "", message: "" });

    try {
      const payload = {
        fullName: formData.name.trim(),
        phone: formData.mobile.trim(),
        email: formData.email.trim(),
        query: formData.query.trim() || "",
        formType: formType,
        action: `study_abroad_${formType}`,
        source: "study_abroad_page",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "admissions"), payload);

      setSubmitStatus({
        type: "success",
        message: "Thank you! Our team will get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        name: "",
        mobile: "",
        email: "",
        query: "",
      });

      // Close modal after 3 seconds
      setTimeout(() => {
        setSubmitStatus({ type: "", message: "" });
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Error saving admission form data:", error);
      setSubmitStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
            <p className="text-gray-600 mb-6">{description}</p>

            {/* Status Message */}
            {submitStatus.message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  submitStatus.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {submitStatus.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-gray-700 font-medium mb-1 text-sm">
                  Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
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
                  onChange={handleMobileInput}
                  required
                  maxLength={10}
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
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="query" className="block text-gray-700 font-medium mb-1 text-sm">
                  Query/Message
                </label>
                <textarea
                  id="query"
                  name="query"
                  value={formData.query}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 resize-none"
                  placeholder="Enter your query or message (optional)"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

