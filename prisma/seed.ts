// Seed data for local demo/dev. Deliberately engineers a handful of students'
// attendance history to exercise every rule described in the plan:
//  - a student clearly below the 80% MAP disbursement threshold
//  - a student with exactly 4 consecutive unexcused absences (2 short of removal)
//  - a student with exactly 6 consecutive unexcused absences (removed)
//  - a student whose streak is broken by one excused absence
// and leaves one class's "today" session unmarked so the attendance screen has
// a live, actionable empty state right after seeding.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { getSingaporeTodayString, addDaysToDateString } from "../src/lib/dates";
import { mathCurriculum } from "./curriculum-data/math";
import { englishCurriculum } from "./curriculum-data/english";
import { scienceCurriculum } from "./curriculum-data/science";
import type { LevelCurriculum } from "./curriculum-data/types";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Coach123!";
const today = getSingaporeTodayString();

type LevelStr = "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "SEC1" | "SEC2" | "SEC3" | "SEC4" | "SEC5";
type SubjectStr = "ENGLISH" | "MATH" | "SCIENCE";
type DayStr = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
type AttStatus = "PRESENT" | "ABSENT" | "LATE";
type SessionRecord = { status: AttStatus; excused?: boolean };

// Excludes visually-ambiguous characters (0/O, 1/I) since a child reads this
// off a card or hears it spoken by their coach.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateLoginCode(seed: number): string {
  // Math.imul keeps every step within real 32-bit integer arithmetic —
  // plain `*` silently loses precision past 2^53, which degenerated this
  // into producing duplicate codes for different seeds.
  let code = "";
  let n = (seed + 1) >>> 0;
  for (let i = 0; i < 6; i++) {
    n = (Math.imul(n, 1103515245) + 12345) >>> 0;
    code += CODE_ALPHABET[n % CODE_ALPHABET.length];
  }
  return code;
}

function deriveGuardian(studentName: string, index: number) {
  const match = studentName.match(/\bbin(?:te)?\s+(\S+)/i);
  const fatherFirstName = match ? match[1] : "Rahman";
  const guardianName = `Encik ${fatherFirstName}`;
  const areaCode = 200 + (index % 30);
  const suffix = (1000 + index * 111) % 9000 + 1000;
  const guardianPhone = `9${areaCode} ${suffix}`;
  return { guardianName, guardianPhone };
}

// A mostly-healthy 8-session pattern (oldest -> newest) that stays comfortably
// above the 80% threshold even in the worst-case overlap of all three quirks.
function healthyPattern(seedIndex: number): SessionRecord[] {
  const pattern: SessionRecord[] = Array.from({ length: 8 }, () => ({ status: "PRESENT" }));
  if (seedIndex % 4 === 0) pattern[3] = { status: "LATE" };
  if (seedIndex % 5 === 0) pattern[1] = { status: "ABSENT" };
  if (seedIndex % 7 === 0) pattern[5] = { status: "ABSENT", excused: true };
  return pattern;
}

// oldest -> newest. 5/8 present, absences spread out (never consecutive) —
// demonstrates the 80% flag firing independently of the streak flag.
const BELOW_THRESHOLD_PATTERN: SessionRecord[] = [
  { status: "PRESENT" },
  { status: "ABSENT" },
  { status: "PRESENT" },
  { status: "ABSENT" },
  { status: "PRESENT" },
  { status: "ABSENT" },
  { status: "PRESENT" },
  { status: "PRESENT" },
];

// oldest -> newest. Most recent 4 sessions are unexcused absences.
const FOUR_CONSECUTIVE_PATTERN: SessionRecord[] = [
  { status: "PRESENT" },
  { status: "PRESENT" },
  { status: "PRESENT" },
  { status: "PRESENT" },
  { status: "ABSENT" },
  { status: "ABSENT" },
  { status: "ABSENT" },
  { status: "ABSENT" },
];

// oldest -> newest. Most recent 6 sessions are unexcused absences — triggers removal.
const SIX_CONSECUTIVE_PATTERN: SessionRecord[] = [
  { status: "PRESENT" },
  { status: "PRESENT" },
  { status: "ABSENT" },
  { status: "ABSENT" },
  { status: "ABSENT" },
  { status: "ABSENT" },
  { status: "ABSENT" },
  { status: "ABSENT" },
];

// oldest -> newest. Without the excused flag at index 4 this would be 6
// consecutive (removal-triggering); with it, the streak resets there and the
// trailing unexcused run is only 3.
const EXCUSED_BREAKS_STREAK_PATTERN: SessionRecord[] = [
  { status: "PRESENT" },
  { status: "PRESENT" },
  { status: "ABSENT" },
  { status: "ABSENT" },
  { status: "ABSENT", excused: true },
  { status: "ABSENT" },
  { status: "ABSENT" },
  { status: "ABSENT" },
];

const REGULAR_OFFSETS = [49, 42, 35, 28, 21, 14, 7, 0]; // oldest -> newest, most recent = today
const TODAY_UNMARKED_OFFSETS = [56, 49, 42, 35, 28, 21, 14, 7]; // most recent = 7 days ago

async function main() {
  console.log("Clearing existing data...");
  await prisma.classProgress.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.curriculumTopic.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.classAssignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.coach.deleteMany();
  await prisma.venue.deleteMany();

  console.log("Creating venues...");
  const tampines = await prisma.venue.create({
    data: { name: "Tampines Centre", address: "Blk 201 Tampines Street 21, #01-123, Singapore 521201" },
  });
  const woodlands = await prisma.venue.create({
    data: { name: "Woodlands Centre", address: "Blk 885 Woodlands Street 82, #01-456, Singapore 730885" },
  });
  const bedok = await prisma.venue.create({
    data: { name: "Bedok Centre", address: "Blk 511 Bedok North Street 3, #01-789, Singapore 460511" },
  });

  console.log("Creating coaches...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const coachDefs = [
    { key: "hidayah", name: "Nur Hidayah Rahman", email: "admin@map.test", isAdmin: true },
    { key: "farhan", name: "Muhammad Farhan Yusof", email: "farhan@map.test", isAdmin: false },
    { key: "aishah", name: "Siti Aishah Kamal", email: "aishah@map.test", isAdmin: false },
    { key: "danial", name: "Ahmad Danial Rosli", email: "danial@map.test", isAdmin: false },
    { key: "ain", name: "Nurul Ain Zulkifli", email: "ain@map.test", isAdmin: false },
    { key: "haziq", name: "Muhammad Haziq Ismail", email: "haziq@map.test", isAdmin: false },
    { key: "nabila", name: "Farah Nabila Hassan", email: "nabila@map.test", isAdmin: false },
  ] as const;

  const coaches: Record<string, Awaited<ReturnType<typeof prisma.coach.create>>> = {};
  for (const [i, def] of coachDefs.entries()) {
    coaches[def.key] = await prisma.coach.create({
      data: {
        name: def.name,
        email: def.email,
        passwordHash,
        isAdmin: def.isAdmin,
        phone: `9${100 + i}${(200 + i * 3).toString().padStart(4, "0")}`.replace(/(\d{4})(\d{4})$/, "$1 $2"),
        trainingCompletedAt: new Date(Date.now() - (365 - i * 10) * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Creating classes...");
  type ClassDef = {
    key: string;
    venueId: string;
    subject: SubjectStr;
    level: LevelStr;
    dayOfWeek: DayStr;
    startTime: string;
  };
  const classDefs: ClassDef[] = [
    { key: "c0", venueId: tampines.id, subject: "SCIENCE", level: "P3", dayOfWeek: "MON", startTime: "16:00" },
    { key: "c1", venueId: tampines.id, subject: "MATH", level: "P5", dayOfWeek: "MON", startTime: "17:30" },
    { key: "c2", venueId: tampines.id, subject: "ENGLISH", level: "P6", dayOfWeek: "WED", startTime: "16:00" },
    { key: "c3", venueId: woodlands.id, subject: "SCIENCE", level: "P5", dayOfWeek: "TUE", startTime: "16:00" },
    { key: "c4", venueId: woodlands.id, subject: "MATH", level: "SEC1", dayOfWeek: "TUE", startTime: "17:30" },
    { key: "c5", venueId: woodlands.id, subject: "SCIENCE", level: "SEC2", dayOfWeek: "THU", startTime: "16:00" },
    { key: "c6", venueId: bedok.id, subject: "ENGLISH", level: "SEC3", dayOfWeek: "WED", startTime: "17:00" },
    { key: "c7", venueId: bedok.id, subject: "MATH", level: "P2", dayOfWeek: "SAT", startTime: "10:00" },
  ];
  const classes: Record<string, Awaited<ReturnType<typeof prisma.class.create>>> = {};
  for (const def of classDefs) {
    classes[def.key] = await prisma.class.create({
      data: {
        venueId: def.venueId,
        subject: def.subject,
        level: def.level,
        dayOfWeek: def.dayOfWeek,
        startTime: def.startTime,
      },
    });
  }

  console.log("Assigning coaches to classes...");
  const assignments: [keyof typeof coaches, keyof typeof classes][] = [
    ["hidayah", "c0"],
    ["farhan", "c0"],
    ["aishah", "c1"],
    ["danial", "c2"],
    ["ain", "c3"],
    ["haziq", "c4"],
    ["nabila", "c5"],
    ["farhan", "c6"],
    ["ain", "c6"],
    ["danial", "c7"],
  ];
  await prisma.classAssignment.createMany({
    data: assignments.map(([coachKey, classKey]) => ({
      coachId: coaches[coachKey].id,
      classId: classes[classKey].id,
    })),
  });

  console.log("Creating students...");
  type StudentDef = {
    key: string;
    name: string;
    level: LevelStr;
    venueKey: "tampines" | "woodlands" | "bedok";
    classKeys: string[]; // first = primary
    pattern: "healthy" | "below80" | "four" | "six" | "excusedBreaks";
  };
  const venuesByKey = { tampines, woodlands, bedok };
  const studentDefs: StudentDef[] = [
    { key: "s1", name: "Amir Hafiz bin Zainal", level: "P3", venueKey: "tampines", classKeys: ["c0"], pattern: "healthy" },
    { key: "s2", name: "Nur Aleesya binte Rosman", level: "P3", venueKey: "tampines", classKeys: ["c0"], pattern: "healthy" },
    { key: "s3", name: "Muhammad Irfan bin Karim", level: "P3", venueKey: "tampines", classKeys: ["c0"], pattern: "healthy" },
    { key: "s4", name: "Siti Zara binte Anuar", level: "P3", venueKey: "tampines", classKeys: ["c0"], pattern: "healthy" },

    { key: "s5", name: "Nur Batrisyia binte Faizal", level: "P5", venueKey: "tampines", classKeys: ["c1", "c3", "c2"], pattern: "healthy" },
    { key: "s6", name: "Muhammad Aiman bin Rahim", level: "P5", venueKey: "tampines", classKeys: ["c1", "c3"], pattern: "healthy" },
    { key: "s7", name: "Aina Sofea binte Jamal", level: "P5", venueKey: "tampines", classKeys: ["c1"], pattern: "healthy" },
    { key: "s8", name: "Muhammad Zharif bin Kassim", level: "P5", venueKey: "tampines", classKeys: ["c1"], pattern: "healthy" },
    { key: "s9", name: "Nurul Iman binte Salleh", level: "P5", venueKey: "tampines", classKeys: ["c1"], pattern: "below80" },

    { key: "s10", name: "Muhammad Rayyan bin Latif", level: "P6", venueKey: "tampines", classKeys: ["c2", "c1"], pattern: "healthy" },
    { key: "s11", name: "Nur Damia binte Hakim", level: "P6", venueKey: "tampines", classKeys: ["c2"], pattern: "healthy" },
    { key: "s12", name: "Ahmad Syafiq bin Nordin", level: "P6", venueKey: "tampines", classKeys: ["c2"], pattern: "healthy" },
    { key: "s13", name: "Siti Maryam binte Ghani", level: "P6", venueKey: "tampines", classKeys: ["c2"], pattern: "healthy" },

    { key: "s14", name: "Farid Danish bin Osman", level: "P5", venueKey: "woodlands", classKeys: ["c3", "c1"], pattern: "healthy" },
    { key: "s15", name: "Nur Ellysa binte Tahir", level: "P5", venueKey: "woodlands", classKeys: ["c3"], pattern: "healthy" },
    { key: "s16", name: "Aisyah Humaira binte Zulkarnain", level: "P5", venueKey: "woodlands", classKeys: ["c3"], pattern: "healthy" },
    { key: "s17", name: "Muhammad Haziq bin Rosdi", level: "P5", venueKey: "woodlands", classKeys: ["c3"], pattern: "four" },

    { key: "s18", name: "Muhd Amsyar bin Fadzil", level: "SEC1", venueKey: "woodlands", classKeys: ["c4", "c5", "c6"], pattern: "healthy" },
    { key: "s19", name: "Nur Alysha binte Rusli", level: "SEC1", venueKey: "woodlands", classKeys: ["c4"], pattern: "healthy" },
    { key: "s20", name: "Muhammad Danish bin Yaakob", level: "SEC1", venueKey: "woodlands", classKeys: ["c4"], pattern: "healthy" },
    { key: "s21", name: "Nur Qistina binte Ibrahim", level: "SEC1", venueKey: "woodlands", classKeys: ["c4"], pattern: "six" },

    { key: "s22", name: "Muhammad Haiqal bin Suhaili", level: "SEC2", venueKey: "woodlands", classKeys: ["c5", "c4"], pattern: "healthy" },
    { key: "s23", name: "Nur Farzana binte Rashid", level: "SEC2", venueKey: "woodlands", classKeys: ["c5"], pattern: "healthy" },
    { key: "s24", name: "Ahmad Zikri bin Hamzah", level: "SEC2", venueKey: "woodlands", classKeys: ["c5"], pattern: "excusedBreaks" },

    { key: "s25", name: "Nur Adriana binte Shukor", level: "SEC3", venueKey: "bedok", classKeys: ["c6", "c5"], pattern: "healthy" },
    { key: "s26", name: "Muhammad Firdaus bin Anwar", level: "SEC3", venueKey: "bedok", classKeys: ["c6"], pattern: "healthy" },
    { key: "s27", name: "Siti Khadijah binte Rahim", level: "SEC3", venueKey: "bedok", classKeys: ["c6"], pattern: "healthy" },

    { key: "s28", name: "Ahmad Zayyan bin Rizal", level: "P2", venueKey: "bedok", classKeys: ["c7", "c0"], pattern: "healthy" },
    { key: "s29", name: "Nur Sarah binte Aziz", level: "P2", venueKey: "bedok", classKeys: ["c7"], pattern: "healthy" },
    { key: "s30", name: "Muhammad Haris bin Johari", level: "P2", venueKey: "bedok", classKeys: ["c7"], pattern: "healthy" },
  ];

  const students: Record<string, Awaited<ReturnType<typeof prisma.student.create>>> = {};
  for (const [i, def] of studentDefs.entries()) {
    const { guardianName, guardianPhone } = deriveGuardian(def.name, i);
    students[def.key] = await prisma.student.create({
      data: {
        name: def.name,
        level: def.level,
        venueId: venuesByKey[def.venueKey].id,
        guardianName,
        guardianPhone,
        status: def.pattern === "six" ? "REMOVED" : "ACTIVE",
        loginCode: generateLoginCode(i),
      },
    });
  }

  console.log("Creating enrollments...");
  for (const def of studentDefs) {
    for (const classKey of def.classKeys) {
      await prisma.enrollment.create({
        data: { studentId: students[def.key].id, classId: classes[classKey].id },
      });
    }
  }

  console.log("Creating attendance sessions and records...");
  function patternFor(def: StudentDef, roleIndex: number): SessionRecord[] {
    switch (def.pattern) {
      case "below80":
        return BELOW_THRESHOLD_PATTERN;
      case "four":
        return FOUR_CONSECUTIVE_PATTERN;
      case "six":
        return SIX_CONSECUTIVE_PATTERN;
      case "excusedBreaks":
        return EXCUSED_BREAKS_STREAK_PATTERN;
      default:
        return healthyPattern(roleIndex);
    }
  }

  let healthySeedCounter = 0;
  for (const classDef of classDefs) {
    const classId = classes[classDef.key].id;
    const isTodayUnmarkedClass = classDef.key === "c0";
    const offsets = isTodayUnmarkedClass ? TODAY_UNMARKED_OFFSETS : REGULAR_OFFSETS;

    const rosterForClass = studentDefs.filter((s) => s.classKeys.includes(classDef.key));
    const coachForSession = assignments.find(([, ck]) => ck === classDef.key)![0];

    for (let sessionIdx = 0; sessionIdx < offsets.length; sessionIdx++) {
      const sessionDate = addDaysToDateString(today, -offsets[sessionIdx]);
      const session = await prisma.attendanceSession.create({
        data: {
          classId,
          sessionDate,
          markedByCoachId: coaches[coachForSession].id,
          submittedAt: new Date(new Date(sessionDate).getTime() + 18 * 60 * 60 * 1000),
        },
      });

      for (const studentDef of rosterForClass) {
        const roleIndex = healthySeedCounter++;
        const pattern = patternFor(studentDef, roleIndex);
        const record = pattern[sessionIdx];
        await prisma.attendanceRecord.create({
          data: {
            attendanceSessionId: session.id,
            studentId: students[studentDef.key].id,
            status: record.status,
            excused: record.excused ?? false,
          },
        });
      }
    }
  }

  console.log("Creating curriculum topics (full P1-Sec4 syllabus, English/Math; P3-Sec4, Science)...");
  // Full real-syllabus coverage, researched separately per subject — see
  // prisma/curriculum-data/{math,english,science}.ts for sources and the
  // per-file scoping notes (e.g. Science has no P1/P2 content because MOE
  // doesn't teach it before P3; Math covers E-Math only, not elective A-Math;
  // Sec3-4 Science is framed as Combined Science with Physics/Chemistry/
  // Biology as strand labels, since this app has one SCIENCE subject).
  const allCurricula: { subject: SubjectStr; levels: LevelCurriculum[] }[] = [
    { subject: "MATH", levels: mathCurriculum },
    { subject: "ENGLISH", levels: englishCurriculum },
    { subject: "SCIENCE", levels: scienceCurriculum },
  ];

  const topicsBySubjectLevel: Record<string, Awaited<ReturnType<typeof prisma.curriculumTopic.create>>[]> = {};
  for (const { subject, levels } of allCurricula) {
    for (const levelCurriculum of levels) {
      const created = [];
      for (const [i, t] of levelCurriculum.topics.entries()) {
        const topic = await prisma.curriculumTopic.create({
          data: {
            subject,
            level: levelCurriculum.level,
            order: i + 1,
            title: t.title,
            strand: t.strand,
            description: t.description,
            conceptExplanation: t.conceptExplanation,
            workedExamples: JSON.stringify(t.workedExamples),
            teachingSteps: JSON.stringify(t.teachingSteps),
            diagramSpec: t.diagram ? JSON.stringify(t.diagram) : null,
          },
        });
        created.push(topic);
      }
      topicsBySubjectLevel[`${subject}-${levelCurriculum.level}`] = created;
    }
  }

  // The 8 demo classes only span 8 of the 28 seeded subject+level combos —
  // this just looks up each class's slice of the full syllabus above so the
  // ClassProgress step below still has something to attach to.
  const topicsByClassKey: Record<string, Awaited<ReturnType<typeof prisma.curriculumTopic.create>>[]> = {};
  for (const classDef of classDefs) {
    topicsByClassKey[classDef.key] = topicsBySubjectLevel[`${classDef.subject}-${classDef.level}`] ?? [];
  }

  console.log("Creating class progress...");
  for (const classDef of classDefs) {
    const topics = topicsByClassKey[classDef.key];
    const isDueTodayClass = classDef.key === "c0";
    const completedCount = Math.ceil(topics.length * 0.5);

    for (const [i, topic] of topics.entries()) {
      if (i < completedCount) {
        const completedDate = addDaysToDateString(today, -7 * (completedCount - i));
        await prisma.classProgress.create({
          data: {
            classId: classes[classDef.key].id,
            curriculumTopicId: topic.id,
            status: "COMPLETED",
            plannedDate: completedDate,
            completedDate,
            notes: null,
          },
        });
      } else if (i === completedCount && isDueTodayClass) {
        await prisma.classProgress.create({
          data: {
            classId: classes[classDef.key].id,
            curriculumTopicId: topic.id,
            status: "PLANNED",
            plannedDate: today,
          },
        });
      } else {
        const weeksAhead = i - completedCount + (isDueTodayClass ? 1 : 0);
        await prisma.classProgress.create({
          data: {
            classId: classes[classDef.key].id,
            curriculumTopicId: topic.id,
            status: "PLANNED",
            plannedDate: addDaysToDateString(today, 7 * Math.max(weeksAhead, 1)),
          },
        });
      }
    }
  }

  console.log("\nSeed complete.\n");
  console.log("Demo login credentials (all coaches share the same password):");
  console.log(`  Password: ${DEMO_PASSWORD}\n`);
  for (const def of coachDefs) {
    console.log(`  ${def.email}${def.isAdmin ? "  (admin)" : ""}`);
  }
  console.log("\nTampines Centre / P3 Science (class c0) has no attendance session for today yet —");
  console.log("log in as farhan@map.test to take it live, and see today's curriculum topic due.");
  const totalTopics = Object.values(topicsBySubjectLevel).reduce((sum, t) => sum + t.length, 0);
  console.log(`\nCurriculum guide: ${totalTopics} topics across ${Object.keys(topicsBySubjectLevel).length} subject/level combinations (Math & English P1-Sec4, Science P3-Sec4).`);

  console.log("\nStudent portal — sign in with just a login code, no password:");
  for (const def of studentDefs.slice(0, 5)) {
    console.log(`  ${def.name}: ${students[def.key].loginCode}`);
  }
  console.log(`  ...and ${studentDefs.length - 5} more (every student has one; check /students as admin to look any of them up).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
