export type ProgramEntry = {
  id: string;
  name: string;
  category: string;
  description?: string;
  duration?: string;
  seats?: string;
  totalFees?: string;
  level?: string;
};

export type ProgramGroup = {
  category: string;
  programs: ProgramEntry[];
};

const toStringArray = (input: any): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item;
        if (typeof item === "number" || typeof item === "boolean") {
          return String(item);
        }
        if (typeof item === "object") {
          const nested =
            item.name ||
            item.programName ||
            item.courseName ||
            item.title ||
            item.specialization;
          return nested ? String(nested) : "";
        }
        return "";
      })
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(/[,|/]/)
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (typeof input === "number" || typeof input === "boolean") {
    return [String(input)];
  }
  return [];
};

const formatCurrency = (value: any): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") {
    return `₹ ${value.toLocaleString("en-IN")}`;
  }
  const raw = String(value).trim();
  if (!raw) return undefined;
  const numericValue = Number(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isNaN(numericValue) && numericValue > 0) {
    return `₹ ${numericValue.toLocaleString("en-IN")}`;
  }
  return raw;
};

const formatSeats = (value: any): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") return value.toString();
  const raw = String(value).trim();
  if (!raw) return undefined;
  const numericValue = Number(raw.replace(/[^0-9]/g, ""));
  if (!Number.isNaN(numericValue) && numericValue > 0) {
    return numericValue.toString();
  }
  return raw;
};

const formatDuration = (value: any): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") {
    return value === 1 ? "1 Year" : `${value} Years`;
  }
  const raw = String(value).trim();
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) {
    const numeric = Number(raw);
    return numeric === 1 ? "1 Year" : `${numeric} Years`;
  }
  return raw;
};

const detectCategory = (name: string): string => {
  const normalized = name.toLowerCase();
  if (normalized.includes("b.sc nursing") || normalized.includes("bsc nursing")) {
    return "B.Sc Nursing";
  }
  if (normalized === "ms" || normalized.includes("master of surgery")) {
    return "MS";
  }
  if (normalized.includes("mba") || normalized.includes("pgdm")) return "MBA / PGDM";
  if (normalized.includes("bba")) return "BBA";
  if (normalized.includes("bca")) return "BCA";
  if (normalized.includes("b.tech") || normalized.includes("btech")) return "B.Tech";
  if (normalized.includes("m.tech") || normalized.includes("mtech")) return "M.Tech";
  if (normalized.includes("mbbs")) return "MBBS";
  if (normalized.includes("md")) return "MD";
  if (normalized.includes("pharma") || normalized.includes("pharm")) return "Pharmacy";
  if (normalized.includes("law") || normalized.includes("llb")) return "Law";
  if (normalized.includes("design")) return "Design";
  if (normalized.includes("hotel")) return "Hotel Management";
  if (normalized.includes("arts") || normalized.includes("ba")) return "Arts";
  if (normalized.includes("science") || normalized.includes("bsc")) return "Science";
  if (normalized.includes("commerce") || normalized.includes("bcom") || normalized.includes("b.com")) {
    return "Commerce";
  }
  return "Programs";
};

type RawProgram = {
  name?: string;
  programName?: string;
  courseName?: string;
  title?: string;
  category?: string;
  description?: string;
  specialization?: string;
  duration?: string | number;
  courseDuration?: string | number;
  durationText?: string;
  seats?: string | number;
  seatCount?: string | number;
  capacity?: string | number;
  totalFees?: string | number;
  fee?: string | number;
  fees?: string | number;
  avgFee?: string | number;
  averageFee?: string | number;
  cost?: string | number;
  price?: string | number;
  level?: string;
};

const normalizeProgramEntry = (
  entry: RawProgram,
  fallbackFees?: string,
  fallbackSeats?: string,
  fallbackDuration?: string
): ProgramEntry | null => {
  const name =
    entry?.name ||
    entry?.programName ||
    entry?.courseName ||
    entry?.title ||
    entry?.specialization;
  if (!name) return null;

  const totalFees =
    formatCurrency(entry.totalFees) ||
    formatCurrency(entry.fee) ||
    formatCurrency(entry.fees) ||
    formatCurrency(entry.avgFee) ||
    formatCurrency(entry.averageFee) ||
    formatCurrency(entry.cost) ||
    formatCurrency(entry.price) ||
    fallbackFees;

  const seats =
    formatSeats(entry.seats) ||
    formatSeats(entry.seatCount) ||
    formatSeats(entry.capacity) ||
    fallbackSeats;

  const duration =
    formatDuration(entry.duration) ||
    formatDuration(entry.courseDuration) ||
    formatDuration(entry.durationText) ||
    fallbackDuration;

  return {
    id: `${name}-${entry?.category || entry?.level || ""}`.trim(),
    name: name.trim(),
    category: entry.category || detectCategory(name),
    description: entry.description,
    duration,
    seats,
    totalFees,
    level: entry.level,
  };
};

const pushUniqueProgram = (programs: ProgramEntry[], program: ProgramEntry | null) => {
  if (!program) return;
  const key = `${program.category || ""}::${program.name.toLowerCase()}`;
  if (
    programs.some(
      (existing) =>
        `${existing.category || ""}::${existing.name.toLowerCase()}` === key
    )
  ) {
    return;
  }
  programs.push(program);
};

const gatherValueStrings = (input: any, depth = 0): string[] => {
  if (input === null || input === undefined || depth > 3) return [];
  if (typeof input === "string" || typeof input === "number" || typeof input === "boolean") {
    const trimmed = String(input).trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(input)) {
    return input.flatMap((value) => gatherValueStrings(value, depth + 1));
  }
  if (typeof input === "object") {
    return Object.values(input).flatMap((value) => gatherValueStrings(value, depth + 1));
  }
  return [];
};

export const buildProgramsFromCollege = (college: any): ProgramEntry[] => {
  if (!college) return [];

  const fallbackFees =
    formatCurrency(college.totalFees) ||
    formatCurrency(college.fees) ||
    formatCurrency(college.fee) ||
    formatCurrency(college.avgFee) ||
    formatCurrency(college.averageFee) ||
    formatCurrency(college.tuition);
  const fallbackSeats =
    formatSeats(college.intakeCapacity) ||
    formatSeats(college.totalSeats) ||
    formatSeats(college.studentCount);
  const fallbackDuration = formatDuration(college.duration || college.courseDuration);

  const programs: ProgramEntry[] = [];
  const courseIndicators: string[] = gatherValueStrings([
    college.courseName,
    college.primaryCourse,
    college.programName,
    college.programs,
    college.programList,
    college.programDetails,
    college.topPrograms,
    college.topCourses,
    college.popularCourses,
    college.featuredCourses,
    college.courses,
    college.coursesOffered,
    college.courseList,
    college.streams,
  ]);

  const buckets = [
    college.programs,
    college.programList,
    college.programDetails,
    college.topPrograms,
    college.topCourses,
    college.popularCourses,
    college.featuredCourses,
    college.courses,
    college.coursesOffered,
    college.courseList,
  ];

  buckets.forEach((bucket) => {
    if (!bucket) return;
    if (Array.isArray(bucket)) {
      bucket.forEach((entry) => {
        if (typeof entry === "string" || typeof entry === "number") {
          pushUniqueProgram(
            programs,
            normalizeProgramEntry(
              { name: String(entry) },
              fallbackFees,
              fallbackSeats,
              fallbackDuration
            )
          );
        } else if (entry && typeof entry === "object") {
          pushUniqueProgram(
            programs,
            normalizeProgramEntry(entry as RawProgram, fallbackFees, fallbackSeats, fallbackDuration)
          );
        }
      });
      return;
    }

    if (typeof bucket === "string") {
      toStringArray(bucket).forEach((name) => {
        pushUniqueProgram(
          programs,
          normalizeProgramEntry({ name }, fallbackFees, fallbackSeats, fallbackDuration)
        );
      });
      return;
    }

    if (typeof bucket === "object") {
      Object.values(bucket).forEach((value) => {
        if (typeof value === "string") {
          pushUniqueProgram(
            programs,
            normalizeProgramEntry({ name: value }, fallbackFees, fallbackSeats, fallbackDuration)
          );
        } else if (value && typeof value === "object") {
          pushUniqueProgram(
            programs,
            normalizeProgramEntry(value as RawProgram, fallbackFees, fallbackSeats, fallbackDuration)
          );
        }
      });
    }
  });

  if (!programs.length && college.courseName) {
    pushUniqueProgram(
      programs,
      normalizeProgramEntry(
        { name: String(college.courseName), category: detectCategory(college.courseName) },
        fallbackFees,
        fallbackSeats,
        fallbackDuration
      )
    );
  }

  // Add generic Under Graduate (UG) / Post Graduate (PG) entries
  // under each relevant course category, so they appear within
  // their respective Courses & Fees groups.
  const categoryMap = new Map<string, ProgramEntry[]>();
  programs.forEach((program) => {
    const key = program.category || "Programs";
    if (!categoryMap.has(key)) categoryMap.set(key, []);
    categoryMap.get(key)!.push(program);
  });

  const hasLevelIndicator = (
    texts: string[],
    level: "UG" | "PG"
  ): boolean => {
    const blob = texts.join(" ").toLowerCase();
    if (level === "UG") {
      return (
        blob.includes(" ug") ||
        blob.startsWith("ug") ||
        blob.includes("undergraduate") ||
        blob.includes("under graduate") ||
        blob.includes("bachelor") ||
        blob.includes("b.tech") ||
        blob.includes("btech") ||
        blob.includes("mbbs") ||
        blob.includes("bds") ||
        blob.includes("b.arch") ||
        blob.includes("b.sc") ||
        blob.includes("bcom") ||
        blob.includes("b.com") ||
        blob.includes("bba") ||
        blob.includes("bca")
      );
    }
    // PG
    return (
      blob.includes(" pg") ||
      blob.startsWith("pg") ||
      blob.includes("postgraduate") ||
      blob.includes("post graduate") ||
      blob.includes("master") ||
      blob.includes("m.tech") ||
      blob.includes("mtech") ||
      blob.includes("mba") ||
      blob.includes("md") ||
      blob.includes("ms") ||
      blob.includes("m.sc") ||
      blob.includes("m.com") ||
      blob.includes("llm")
    );
  };

  categoryMap.forEach((entries, category) => {
    const texts = gatherValueStrings([
      category,
      entries.map((e) => e.name),
      entries.map((e) => e.level),
    ]);

    const hasUg = hasLevelIndicator(texts, "UG");
    const hasPg = hasLevelIndicator(texts, "PG");

    const hasUgProgramInCategory = entries.some((program) =>
      /under\s*graduate\s*\(ug\)/i.test(program.name)
    );
    const hasPgProgramInCategory = entries.some((program) =>
      /post\s*graduate\s*\(pg\)/i.test(program.name)
    );

    if (hasUg && !hasUgProgramInCategory) {
      pushUniqueProgram(programs, {
        id: `${category.toLowerCase()}-ug-${college.id || "default"}`,
        name: "Under Graduate (UG)",
        category,
        description: `Undergraduate programs under ${category} at ${
          college.name || college.collegeName || "this college"
        }`,
        duration: fallbackDuration || undefined,
        seats: fallbackSeats,
        totalFees: fallbackFees,
        level: "UG",
      });
    }

    if (hasPg && !hasPgProgramInCategory) {
      pushUniqueProgram(programs, {
        id: `${category.toLowerCase()}-pg-${college.id || "default"}`,
        name: "Post Graduate (PG)",
        category,
        description: `Postgraduate programs under ${category} at ${
          college.name || college.collegeName || "this college"
        }`,
        duration: fallbackDuration || undefined,
        seats: fallbackSeats,
        totalFees: fallbackFees,
        level: "PG",
      });
    }
  });

  return programs;
};

export const groupProgramsByCategory = (programs: ProgramEntry[]): ProgramGroup[] => {
  const map = new Map<string, ProgramEntry[]>();
  programs.forEach((program) => {
    const key = program.category || "Programs";
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(program);
  });

  return Array.from(map.entries()).map(([category, entries]) => ({
    category,
    programs: entries,
  }));
};

