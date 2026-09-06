// Seed data for local demo/dev. Seeds a coach (farhan) with an OPEN shift at
// Tampines Centre so a fresh login lands directly on the check-in desk, plus
// shifts in every payroll state (PENDING/APPROVED/REJECTED) so the admin
// payroll queue has something real to review immediately.
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

type LevelStr =
  | "P1" | "P2" | "P3" | "P4" | "P5" | "P6"
  | "SEC1" | "SEC2" | "SEC3" | "SEC4" | "SEC5"
  | "JC1" | "JC2";
type SubjectStr = "ENGLISH" | "MATH" | "SCIENCE";
type DayStr = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
type RelationshipStr = "MOTHER" | "FATHER" | "GUARDIAN" | "OTHER";
type ReferralStr = "MAP_CLASS" | "SOCIAL_MEDIA" | "FRIENDS_FAMILY" | "OTHER";
type ShiftStatus = "OPEN" | "PENDING" | "APPROVED" | "REJECTED";

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

function deriveEmergencyContact(studentName: string, index: number) {
  const match = studentName.match(/\bbin(?:te)?\s+(\S+)/i);
  const fatherFirstName = match ? match[1] : "Rahman";
  const emergencyContactName = `Encik ${fatherFirstName}`;
  const areaCode = 200 + (index % 30);
  const suffix = ((1000 + index * 111) % 9000) + 1000;
  const emergencyContactPhone = `9${areaCode} ${suffix}`;
  return { emergencyContactName, emergencyContactPhone };
}

// Singapore is a fixed UTC+8 with no DST — building the offset directly
// avoids any dependence on the machine's local timezone.
function toSingaporeDateTime(dateStr: string, time: string): Date {
  return new Date(`${dateStr}T${time}:00+08:00`);
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.checkInNotification.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.coachShift.deleteMany();
  await prisma.guardianNotification.deleteMany();
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

  console.log("Creating a couple of legacy classes (unlinked from nav, kept non-destructively)...");
  // Minimal — just enough that the still-existing /classes/* routes have
  // something valid to show if visited directly. Nothing in the new
  // coach-facing flow links here.
  const classDefs: { key: string; venueId: string; subject: SubjectStr; level: LevelStr; dayOfWeek: DayStr; startTime: string }[] = [
    { key: "c0", venueId: tampines.id, subject: "SCIENCE", level: "P3", dayOfWeek: "MON", startTime: "16:00" },
    { key: "c1", venueId: woodlands.id, subject: "MATH", level: "SEC1", dayOfWeek: "TUE", startTime: "17:30" },
  ];
  const classes: Record<string, Awaited<ReturnType<typeof prisma.class.create>>> = {};
  for (const def of classDefs) {
    classes[def.key] = await prisma.class.create({
      data: { venueId: def.venueId, subject: def.subject, level: def.level, dayOfWeek: def.dayOfWeek, startTime: def.startTime },
    });
  }
  await prisma.classAssignment.createMany({
    data: [
      { coachId: coaches.farhan.id, classId: classes.c0.id },
      { coachId: coaches.haziq.id, classId: classes.c1.id },
    ],
  });

  console.log("Creating students...");
  type StudentDef = {
    key: string;
    name: string;
    level: LevelStr;
    schoolName: string;
    isMapStudent: boolean;
    relationship: RelationshipStr;
    referralSource: ReferralStr;
  };
  const studentDefs: StudentDef[] = [
    { key: "s1", name: "Amir Hafiz bin Zainal", level: "P3", schoolName: "Tampines Primary School", isMapStudent: true, relationship: "MOTHER", referralSource: "MAP_CLASS" },
    { key: "s2", name: "Nur Aleesya binte Rosman", level: "P3", schoolName: "Tampines Primary School", isMapStudent: true, relationship: "FATHER", referralSource: "FRIENDS_FAMILY" },
    { key: "s3", name: "Muhammad Irfan bin Karim", level: "P3", schoolName: "Tampines Primary School", isMapStudent: true, relationship: "GUARDIAN", referralSource: "SOCIAL_MEDIA" },
    { key: "s4", name: "Siti Zara binte Anuar", level: "P3", schoolName: "Tampines Primary School", isMapStudent: true, relationship: "MOTHER", referralSource: "MAP_CLASS" },
    { key: "s5", name: "Ahmad Zayyan bin Rizal", level: "P2", schoolName: "Bedok North Primary School", isMapStudent: true, relationship: "FATHER", referralSource: "OTHER" },
    { key: "s6", name: "Nur Batrisyia binte Faizal", level: "P5", schoolName: "Tampines Primary School", isMapStudent: true, relationship: "MOTHER", referralSource: "FRIENDS_FAMILY" },
    { key: "s7", name: "Muhammad Aiman bin Rahim", level: "P5", schoolName: "Woodlands Ring Primary School", isMapStudent: true, relationship: "GUARDIAN", referralSource: "MAP_CLASS" },
    { key: "s8", name: "Nur Damia binte Hakim", level: "P6", schoolName: "Tampines North Primary School", isMapStudent: true, relationship: "MOTHER", referralSource: "SOCIAL_MEDIA" },
    { key: "s9", name: "Muhd Amsyar bin Fadzil", level: "SEC1", schoolName: "Yishun Secondary School", isMapStudent: true, relationship: "FATHER", referralSource: "MAP_CLASS" },
    { key: "s10", name: "Nur Alysha binte Rusli", level: "SEC2", schoolName: "Woodlands Secondary School", isMapStudent: true, relationship: "MOTHER", referralSource: "FRIENDS_FAMILY" },
    { key: "s11", name: "Muhammad Haiqal bin Suhaili", level: "SEC3", schoolName: "Bedok View Secondary School", isMapStudent: true, relationship: "GUARDIAN", referralSource: "MAP_CLASS" },
    { key: "s12", name: "Nur Adriana binte Shukor", level: "SEC3", schoolName: "Damai Secondary School", isMapStudent: true, relationship: "MOTHER", referralSource: "OTHER" },
    { key: "s13", name: "Ahmad Danish bin Yaakob", level: "SEC4", schoolName: "Woodlands Ring Secondary School", isMapStudent: true, relationship: "FATHER", referralSource: "SOCIAL_MEDIA" },
    { key: "s14", name: "Nurul Iman binte Salleh", level: "JC1", schoolName: "Tampines Junior College", isMapStudent: true, relationship: "MOTHER", referralSource: "MAP_CLASS" },
    { key: "s15", name: "Farid Danish bin Osman", level: "P4", schoolName: "Woodlands Primary School", isMapStudent: false, relationship: "GUARDIAN", referralSource: "FRIENDS_FAMILY" },
    { key: "s16", name: "Siti Khadijah binte Rahim", level: "SEC1", schoolName: "Bedok Green Secondary School", isMapStudent: false, relationship: "FATHER", referralSource: "OTHER" },
  ];

  const students: Record<string, Awaited<ReturnType<typeof prisma.student.create>>> = {};
  for (const [i, def] of studentDefs.entries()) {
    const { emergencyContactName, emergencyContactPhone } = deriveEmergencyContact(def.name, i);
    students[def.key] = await prisma.student.create({
      data: {
        name: def.name,
        level: def.level,
        schoolName: def.schoolName,
        contactNumber: `8${100 + i}${(200 + i * 3).toString().padStart(4, "0")}`.replace(/(\d{4})(\d{4})$/, "$1 $2"),
        email: `${def.name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
        isMapStudent: def.isMapStudent,
        emergencyContactName,
        emergencyContactRelationship: def.relationship,
        emergencyContactPhone,
        referralSource: def.referralSource,
        loginCode: generateLoginCode(i),
      },
    });
  }

  console.log("Creating coach shifts (every payroll status, so the admin queue has something to review)...");
  type ShiftDef = {
    coachKey: string;
    venue: typeof tampines;
    shiftDate: string;
    clockInTime: string;
    clockOutTime: string | null;
    status: ShiftStatus;
    reviewNote?: string;
  };
  const shiftDefs: ShiftDef[] = [
    // farhan: OPEN today at Tampines — logging in as farhan lands directly
    // on the check-in desk, camera-ready.
    { coachKey: "farhan", venue: tampines, shiftDate: today, clockInTime: "16:00", clockOutTime: null, status: "OPEN" },
    // farhan: two past approved shifts, so his profile shows real hours.
    { coachKey: "farhan", venue: tampines, shiftDate: addDaysToDateString(today, -7), clockInTime: "16:00", clockOutTime: "19:30", status: "APPROVED" },
    { coachKey: "farhan", venue: bedok, shiftDate: addDaysToDateString(today, -3), clockInTime: "17:00", clockOutTime: "20:00", status: "APPROVED" },
    // aishah: clocked out yesterday, awaiting review.
    { coachKey: "aishah", venue: woodlands, shiftDate: addDaysToDateString(today, -1), clockInTime: "16:00", clockOutTime: "18:45", status: "PENDING" },
    // danial: already reviewed and approved.
    { coachKey: "danial", venue: bedok, shiftDate: addDaysToDateString(today, -2), clockInTime: "17:00", clockOutTime: "20:15", status: "APPROVED" },
    // ain: rejected, with a reason — demos the reject-with-reviewNote path.
    {
      coachKey: "ain",
      venue: tampines,
      shiftDate: addDaysToDateString(today, -4),
      clockInTime: "16:00",
      clockOutTime: "16:20",
      status: "REJECTED",
      reviewNote: "Clocked out after 20 minutes — check with Ain before re-approving.",
    },
    { coachKey: "haziq", venue: woodlands, shiftDate: addDaysToDateString(today, -6), clockInTime: "17:30", clockOutTime: "20:00", status: "APPROVED" },
    { coachKey: "nabila", venue: woodlands, shiftDate: addDaysToDateString(today, -5), clockInTime: "16:00", clockOutTime: "18:00", status: "APPROVED" },
  ];

  const shifts: Record<string, Awaited<ReturnType<typeof prisma.coachShift.create>>> = {};
  for (const [i, def] of shiftDefs.entries()) {
    const clockInAt = toSingaporeDateTime(def.shiftDate, def.clockInTime);
    const clockOutAt = def.clockOutTime ? toSingaporeDateTime(def.shiftDate, def.clockOutTime) : null;
    const isReviewed = def.status === "APPROVED" || def.status === "REJECTED";
    shifts[`shift${i}`] = await prisma.coachShift.create({
      data: {
        coachId: coaches[def.coachKey].id,
        venueId: def.venue.id,
        shiftDate: def.shiftDate,
        clockInAt,
        clockOutAt,
        status: def.status,
        approvedByCoachId: isReviewed ? coaches.hidayah.id : null,
        approvedAt: isReviewed ? clockOutAt : null,
        reviewNote: def.reviewNote ?? null,
      },
    });
  }

  console.log("Creating check-ins...");
  // The Tampines P3 crew, checked in today under farhan's open shift — so
  // "checked in this shift" isn't zero the moment you log in.
  for (const key of ["s1", "s2", "s3", "s4"]) {
    await prisma.checkIn.create({
      data: {
        studentId: students[key].id,
        venueId: tampines.id,
        checkInDate: today,
        checkedInAt: toSingaporeDateTime(today, "16:05"),
        coachShiftId: shifts.shift0.id,
      },
    });
  }

  // A little check-in history under the past approved shifts, so student
  // profile pages have real history to show.
  const historyCheckIns: { studentKey: string; shiftKey: string; venue: typeof tampines; date: string; time: string }[] = [
    { studentKey: "s1", shiftKey: "shift1", venue: tampines, date: addDaysToDateString(today, -7), time: "16:10" },
    { studentKey: "s2", shiftKey: "shift1", venue: tampines, date: addDaysToDateString(today, -7), time: "16:12" },
    { studentKey: "s6", shiftKey: "shift6", venue: woodlands, date: addDaysToDateString(today, -6), time: "17:40" },
    { studentKey: "s7", shiftKey: "shift6", venue: woodlands, date: addDaysToDateString(today, -6), time: "17:45" },
    { studentKey: "s9", shiftKey: "shift7", venue: woodlands, date: addDaysToDateString(today, -5), time: "16:05" },
    { studentKey: "s11", shiftKey: "shift4", venue: bedok, date: addDaysToDateString(today, -2), time: "17:05" },
  ];
  for (const c of historyCheckIns) {
    await prisma.checkIn.create({
      data: {
        studentId: students[c.studentKey].id,
        venueId: c.venue.id,
        checkInDate: c.date,
        checkedInAt: toSingaporeDateTime(c.date, c.time),
        coachShiftId: shifts[c.shiftKey].id,
      },
    });
  }

  console.log("Creating curriculum topics (full P1-Sec4 syllabus, English/Math; P3-Sec4, Science)...");
  // Unchanged from before — /curriculum is independent of Class/Student and
  // needs no changes for this feature.
  const allCurricula: { subject: SubjectStr; levels: LevelCurriculum[] }[] = [
    { subject: "MATH", levels: mathCurriculum },
    { subject: "ENGLISH", levels: englishCurriculum },
    { subject: "SCIENCE", levels: scienceCurriculum },
  ];

  let totalTopics = 0;
  let totalCombos = 0;
  for (const { subject, levels } of allCurricula) {
    for (const levelCurriculum of levels) {
      for (const [i, t] of levelCurriculum.topics.entries()) {
        await prisma.curriculumTopic.create({
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
        totalTopics++;
      }
      totalCombos++;
    }
  }

  console.log("\nSeed complete.\n");
  console.log("Demo login credentials (all coaches share the same password):");
  console.log(`  Password: ${DEMO_PASSWORD}\n`);
  for (const def of coachDefs) {
    console.log(`  ${def.email}${def.isAdmin ? "  (admin)" : ""}`);
  }
  console.log("\nfarhan@map.test is clocked in at Tampines Centre with 4 students already checked in today —");
  console.log("log in as farhan to see the check-in desk live. admin@map.test has a pending shift (aishah's)");
  console.log("waiting for review at /payroll.");
  console.log(`\nCurriculum guide: ${totalTopics} topics across ${totalCombos} subject/level combinations (Math & English P1-Sec4, Science P3-Sec4).`);

  console.log("\nStudent QR/portal login codes (sign in at /login's Student tab, or scan the QR from their profile):");
  for (const def of studentDefs.slice(0, 5)) {
    console.log(`  ${def.name}: ${students[def.key].loginCode}`);
  }
  console.log(`  ...and ${studentDefs.length - 5} more (every student has one; look any of them up at /students as admin).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
