import type { Subject, Level, DayOfWeek, EmergencyContactRelationship, ReferralSource } from "@/generated/prisma/client";

const SUBJECT_LABELS: Record<Subject, string> = {
  ENGLISH: "English",
  MATH: "Math",
  SCIENCE: "Science",
};

const LEVEL_LABELS: Record<Level, string> = {
  P1: "P1",
  P2: "P2",
  P3: "P3",
  P4: "P4",
  P5: "P5",
  P6: "P6",
  SEC1: "Sec 1",
  SEC2: "Sec 2",
  SEC3: "Sec 3",
  SEC4: "Sec 4",
  SEC5: "Sec 5",
  JC1: "JC 1",
  JC2: "JC 2",
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

export const EMERGENCY_CONTACT_LABELS: Record<EmergencyContactRelationship, string> = {
  MOTHER: "Mother",
  FATHER: "Father",
  GUARDIAN: "Guardian",
  OTHER: "Other",
};

export const REFERRAL_SOURCE_LABELS: Record<ReferralSource, string> = {
  MAP_CLASS: "A MAP class",
  SOCIAL_MEDIA: "Social media",
  FRIENDS_FAMILY: "Friends & family",
  OTHER: "Other",
};

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, "0")}${period}`;
}

// The single source of truth for a class's display label — Class has no
// stored "name" field so this never goes stale relative to its schedule.
export function formatClassLabel(cls: { subject: Subject; level: Level; dayOfWeek: DayOfWeek; startTime: string }): string {
  return `${LEVEL_LABELS[cls.level]} ${SUBJECT_LABELS[cls.subject]} — ${DAY_LABELS[cls.dayOfWeek]} ${formatTime12h(cls.startTime)}`;
}

export function formatSubject(subject: Subject): string {
  return SUBJECT_LABELS[subject];
}

export function formatLevel(level: Level): string {
  return LEVEL_LABELS[level];
}

// CurriculumTopic.teachingSteps is stored as a JSON-encoded string[] (see
// schema comment) rather than Prisma's Json scalar, so parsing is explicit
// and this is the one place malformed/missing data degrades gracefully to
// an empty list instead of throwing during render.
export function parseTeachingSteps(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export type WorkedExample = { problem: string; solution: string[] };

// Same rationale as parseTeachingSteps — CurriculumTopic.workedExamples is
// JSON-encoded text, and malformed/missing data degrades to an empty list
// rather than throwing during render.
export function parseWorkedExamples(raw: string | null): WorkedExample[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is WorkedExample =>
        e && typeof e.problem === "string" && Array.isArray(e.solution) && e.solution.every((s: unknown) => typeof s === "string"),
    );
  } catch {
    return [];
  }
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
}
