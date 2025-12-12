"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface ApplyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle?: string;
  companyName?: string;
  jobId?: string;
  type?: "job" | "internship";
}

export default function ApplyNowModal({
  isOpen,
  onClose,
  jobTitle = "",
  companyName = "",
  jobId = "",
  type = "job",
}: ApplyNowModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    experience: "",
    resume: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        mobile: "",
        email: "",
        experience: "",
        resume: "",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    // Validation
    if (!formData.name.trim()) {
      setSubmitStatus("Please enter your name.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.length !== 10) {
      setSubmitStatus("Please enter a valid 10-digit mobile number.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setSubmitStatus("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        fullName: formData.name.trim(),
        phone: formData.mobile.trim(),
        email: formData.email.trim(),
        experience: formData.experience.trim(),
        resume: formData.resume.trim(),
        jobTitle: jobTitle || "",
        companyName: companyName || "",
        jobId: jobId || "",
        applicationType: type, // "job" or "internship"
        action: type === "job" ? "job_application" : "internship_application",
        source: type === "job" ? "jobs_page" : "internships_page",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "admission"), payload);

      setSubmitStatus(`Thank you! Your application for ${jobTitle || "this position"} has been submitted successfully.`);

      // Reset form
      setFormData({
        name: "",
        mobile: "",
        email: "",
        experience: "",
        resume: "",
      });

      // Close modal after 3 seconds
      setTimeout(() => {
        setSubmitStatus("");
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Error saving application data:", error);
      setSubmitStatus("Something went wrong. Please try again.");
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
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Apply for {type === "job" ? "Job" : "Internship"}
              </h2>
              {jobTitle && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    <strong className="font-semibold text-gray-900">{jobTitle}</strong>
                  </p>
                  {companyName && (
                    <p className="text-sm text-gray-600">
                      {companyName}
                    </p>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-600">
                Fill in the form below to apply for this position. Our team will review your application and get back to you.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Mobile */}
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleMobileInput}
                  required
                  maxLength={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Enter your 10-digit mobile number"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Experience */}
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (Optional)
                </label>
                <input
                  type="text"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="e.g., 2 years, Fresher, etc."
                />
              </div>

              {/* Resume Link */}
              <div>
                <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-1">
                  Resume Link (Optional)
                </label>
                <input
                  type="url"
                  id="resume"
                  name="resume"
                  value={formData.resume}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Paste your resume link (Google Drive, Dropbox, etc.)"
                />
              </div>

              {/* Submit Status */}
              {submitStatus && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    submitStatus.includes("Thank you") || submitStatus.includes("successfully")
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {submitStatus}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

