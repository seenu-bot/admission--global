// src/data/headerData.js

export const contactDetails = [
  { href: "tel:+919228151258", label: "+91 92281 51258" },
  { href: "mailto:info@admissionglobal.in", label: "info@admissionglobal.in" },
];

export const navigationLinks = [
  { href: "/exams/overall", label: "Exams" },
  { href: "/scholarships", label: "Scholarships" },
  { href: "/admissionform", label: "Admission 2025" },
  { href: "/counselling", label: "Counselling" },
  { href: "/internships", label: "Internships" },
  { href: "/jobs", label: "Jobs" },
  { href: "/colleges", label: "Colleges" },
];

export const socialLinks = [
  { href: "https://www.facebook.com/CollegeSearch?fref=ts", className: "facebook" },
  { href: "https://twitter.com/india_colleges", className: "twitter" },
  { href: "https://www.linkedin.com/school/indiacollegesearch", className: "linkedin" },
  { href: "https://www.instagram.com/collegesearch_in/", className: "instagram" },
];

export const headerData = {
  header: {
    joinMessage: {
      title: "Join CollegeSearch Family",
      subtitle:
        "Register & enjoy the perks of a Universal College Application, Easy Process, Time-saving, and Free Contact details and Brochures.",
      loginLink: "student-login.html",
    },
    facilities: [
      { iconClass: "facilities_icon", text: "20 Lakhs+\nMonthly Users" },
      { iconClass: "facilities_icon", text: "20 Lakhs+\nMonthly Users" },
      { iconClass: "facilities_icon", text: "20 Lakhs+\nMonthly Users" },
    ],
    search: {
      popularBranches: [
        { label: "MBA/PGDM", url: "mba-colleges-india.html" },
        { label: "MCA", url: "mca-colleges-india.html" },
        { label: "B.Tech/B.E", url: "engineering-colleges-india.html" },
        { label: "B.Sc", url: "bsc-colleges-india.html" },
        { label: "BCA", url: "bca-colleges-india.html" },
        { label: "BBA", url: "bba-colleges-india.html" },
        { label: "B.COM", url: "commerce-colleges-india.html" },
      ],
      trendingSearches: [
        { label: "Top MBA Colleges in Delhi/NCR", url: "mba/colleges-delhi-ncr.html" },
        { label: "Top MBA Colleges in Bangalore", url: "mba/colleges-bangalore.html" },
        { label: "Top engineering Colleges in Delhi/NCR", url: "engineering/colleges-delhi-ncr.html" },
        { label: "Top engineering Colleges in Bangalore", url: "engineering/colleges-bangalore.html" },
      ],
    },
  },
};

export const navigationData2 = [
  {
    heading: "Explore Courses",
    sections: [],
  },
];

export const navigationData = [
  {
    heading: "MBBS",
    sections: [
      {
        title: "Popular Courses",
        links: [
          { label: "MBBS", url: "/course/mbbs" },
        ],
      },
      {
        title: "MBBS Colleges in India",
        links: [
          // Cities will be populated dynamically from database
        ],
      },
      {
        title: "MBBS Colleges in Abroad",
        links: [
          // Countries will be populated dynamically from database
        ],
      },
    ],
  },
  {
    heading: "Engineering",
    sections: [
      {
        title: "Popular Courses",
        links: [
          { label: "Bachelor Of Technology (B.Tech)", url: "/course/engineering" },
          { label: "Master Of Technology (M.Tech)", url: "/course/mtech" },
        ],
      },
      {
        title: "B.Tech Colleges by City",
        links: [
          // Cities will be populated dynamically from database
        ],
      },
      {
        title: "M.Tech Colleges by State",
        links: [
          // States will be populated dynamically from database
        ],
      },
    ],
  },
  {
    heading: "Management",
    sections: [
      {
        title: "Popular Courses",
        links: [
          { label: "MBA", url: "/course/mba" },
          { label: "BBA", url: "/course/bba" },
        ],
      },
      {
        title: "MBA Colleges by State",
        links: [
          // States will be populated dynamically from database
        ],
      },
      {
        title: "BBA Colleges by State",
        links: [],
      },
    ],
  },
  {
    heading: "Paramedical",
    sections: [
      {
        title: "Popular Courses",
        links: [
          { label: "BPT (Physiotherapy)", url: "/course?category=paramedical&course=BPT" },
          { label: "B.Sc Nursing", url: "/course?category=paramedical&course=BSc%20Nursing" },
          { label: "B.Sc Medical Lab Technology", url: "/course?category=paramedical&course=MLT" },
          { label: "Bachelor of Occupational Therapy", url: "/course?category=paramedical&course=BOT" },
        ],
      },
      {
        title: "Diploma & Certificate Programs",
        links: [
          { label: "DMLT", url: "/course?category=paramedical&course=DMLT" },
          { label: "Diploma in Radiology", url: "/course?category=paramedical&course=Radiology" },
          { label: "Diploma in OTT", url: "/course?category=paramedical&course=OTT" },
        ],
      },
      {
        title: "Paramedical Colleges by City",
        links: [
          // Cities will be populated dynamically from database
        ],
      },
    ],
  },
  {
    heading: "More",
    sections: [
      {
        title: "More",
        links: [
          { label: "Exams", url: "overall" },
          { label: "Latest Articles", url: "/articles" },
          { label: "News & Updates", url: "/news" },
          { label: "Online Courses", url: "/online-courses" },
          { label: "Study Abroad", url: "/study-abroad" },
          { label: "Internships", url: "internships" },
          { label: "Jobs", url: "jobs" },
        ],
      },
    ],
  },
];
