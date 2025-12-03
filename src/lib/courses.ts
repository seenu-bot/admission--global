// Central mapping between slug used in the URL and the human readable course name stored in Firestore.
// Adjust values to match your Firestore 'exams' documents' `course` field exactly.
export const slugToCourseName: Record<string, string> = {
  "b-tech-b-e": "B.Tech / B.E.",
  "mba-pgdm": "MBA / PGDM",
  "mbbs": "MBBS",
  "llb": "LLB",
  "bba-bbm-bbs": "BBA / BBM / BBS",
  "mca-mcm": "MCA / MCM",
  "m-tech-m-e": "M.Tech / M.E.",
  "bhm": "BHM",
  "m-pharm": "M.Pharm",
  "b-arch": "B.Arch",
  "md": "MD",
  "llm": "LLM",
  "bsc": "BSc",
  "bed": "BEd",
  "msc": "MSc",
  "overall": "Overall",
};

export const courseNameToSlug: Record<string, string> = Object.fromEntries(
  Object.entries(slugToCourseName).map(([slug, name]) => [name, slug])
);

export const supportedCourseSlugs = Object.keys(slugToCourseName);


