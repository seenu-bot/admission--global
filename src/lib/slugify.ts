export function slugify(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCollegeSlug(college: any): string {
  if (!college) return "";

  const explicitSlug = typeof college.slug === "string" ? college.slug.trim() : "";
  if (explicitSlug) return explicitSlug;

  const derivedName =
    college.name || college.collegeName || college.instituteName || college.universityName;
  const slugFromName = slugify(derivedName);
  if (slugFromName) return slugFromName;

  const fallback = slugify(college.id);
  if (fallback) return fallback;

  return "";
}

export function getExamSlug(exam: any): string {
  if (!exam) return "";

  const explicitSlug = typeof exam.slug === "string" ? exam.slug.trim() : "";
  if (explicitSlug) return explicitSlug;

  const derivedName = exam.name || exam.examName || exam.title || exam.shortName;
  const slugFromName = slugify(derivedName);
  if (slugFromName) return slugFromName;

  const fallback = slugify(exam.id);
  if (fallback) return fallback;

  return "";
}

export function getScholarshipSlug(scholarship: any): string {
  if (!scholarship) return "";

  const explicitSlug = typeof scholarship.slug === "string" ? scholarship.slug.trim() : "";
  if (explicitSlug) return explicitSlug;

  const derivedName = scholarship.title || scholarship.name;
  const slugFromName = slugify(derivedName);
  if (slugFromName) return slugFromName;

  const fallback = slugify(scholarship.id);
  if (fallback) return fallback;

  return "";
}

export function getArticleSlug(article: any): string {
  if (!article) return "";

  const explicitSlug = typeof article.slug === "string" ? article.slug.trim() : "";
  if (explicitSlug) return explicitSlug;

  const derivedTitle = article.title || article.name || article.heading;
  const slugFromTitle = slugify(derivedTitle);
  if (slugFromTitle) return slugFromTitle;

  const fallback = slugify(article.id);
  if (fallback) return fallback;

  return "";
}

export function getNewsSlug(news: any): string {
  if (!news) return "";

  const explicitSlug = typeof news.slug === "string" ? news.slug.trim() : "";
  if (explicitSlug) return explicitSlug;

  const derivedTitle = news.title || news.name || news.heading;
  const slugFromTitle = slugify(derivedTitle);
  if (slugFromTitle) return slugFromTitle;

  const fallback = slugify(news.id);
  if (fallback) return fallback;

  return "";
}

export function getInternshipSlug(internship: any): string {
  if (!internship) return "";

  const explicitSlug = typeof internship.slug === "string" ? internship.slug.trim() : "";
  if (explicitSlug) return explicitSlug;

  const derivedName =
    internship.title ||
    internship.name ||
    internship.position ||
    (internship.company ? `${internship.company} internship` : "");

  const combined = derivedName && internship.company
    ? `${derivedName} ${internship.company}`
    : derivedName || internship.company;

  const slugFromName = slugify(combined);
  if (slugFromName) return slugFromName;

  const fallback = slugify(internship.id);
  if (fallback) return fallback;

  return "";
}

export function getJobSlug(job: any): string {
  if (!job) return "";

  const explicitSlug = typeof job.slug === "string" ? job.slug.trim() : "";
  if (explicitSlug) return explicitSlug;

  const derivedName =
    job.title ||
    job.name ||
    job.position ||
    (job.company ? `${job.company} job` : "");

  const combined = derivedName && job.company
    ? `${derivedName} ${job.company}`
    : derivedName || job.company;

  const slugFromName = slugify(combined);
  if (slugFromName) return slugFromName;

  const fallback = slugify(job.id);
  if (fallback) return fallback;

  return "";
}

export function getCourseSlug(course: any): string {
  if (!course) return "";

  const explicitSlug = typeof course.slug === "string" ? course.slug.trim() : "";
  if (explicitSlug) return explicitSlug;

  const derivedName = course.courseName || course.name || course.title;
  const slugFromName = slugify(derivedName);
  if (slugFromName) return slugFromName;

  const fallback = slugify(course.id);
  if (fallback) return fallback;

  return "";
}

