-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('ENGLISH', 'MATH', 'SCIENCE');

-- CreateEnum
CREATE TYPE "Level" AS ENUM ('P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'SEC1', 'SEC2', 'SEC3', 'SEC4', 'SEC5', 'JC1', 'JC2');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'DROPPED');

-- CreateEnum
CREATE TYPE "EmergencyContactRelationship" AS ENUM ('MOTHER', 'FATHER', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "ReferralSource" AS ENUM ('MAP_CLASS', 'SOCIAL_MEDIA', 'FRIENDS_FAMILY', 'OTHER');

-- CreateEnum
CREATE TYPE "CoachShiftStatus" AS ENUM ('OPEN', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ShiftBlock" AS ENUM ('WEEKDAY_EVENING', 'WEEKEND_MORNING', 'WEEKEND_AFTERNOON');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'REMOVED', 'GRADUATED');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('PLANNED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "level" "Level" NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "trainingCompletedAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isMapStudent" BOOLEAN NOT NULL DEFAULT true,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactRelationship" "EmergencyContactRelationship" NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "referralSource" "ReferralSource",
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loginCode" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassAssignment" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sessionDate" TEXT NOT NULL,
    "markedByCoachId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "attendanceSessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "excused" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianNotification" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sessionDate" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "recipientPhone" TEXT,
    "delivered" BOOLEAN NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "checkInDate" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coachShiftId" TEXT NOT NULL,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInNotification" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "checkInId" TEXT NOT NULL,
    "recipientPhone" TEXT,
    "delivered" BOOLEAN NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckInNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachShift" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "shiftDate" TEXT NOT NULL,
    "shiftBlock" "ShiftBlock" NOT NULL,
    "clockInAt" TIMESTAMP(3) NOT NULL,
    "clockOutAt" TIMESTAMP(3),
    "status" "CoachShiftStatus" NOT NULL DEFAULT 'OPEN',
    "approvedByCoachId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumTopic" (
    "id" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "level" "Level" NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "strand" TEXT,
    "description" TEXT,
    "conceptExplanation" TEXT,
    "workedExamples" TEXT,
    "teachingSteps" TEXT,
    "diagramSpec" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassProgress" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "curriculumTopicId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedDate" TEXT NOT NULL,
    "completedDate" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Venue_name_idx" ON "Venue"("name");

-- CreateIndex
CREATE INDEX "Class_venueId_idx" ON "Class"("venueId");

-- CreateIndex
CREATE INDEX "Class_subject_level_idx" ON "Class"("subject", "level");

-- CreateIndex
CREATE UNIQUE INDEX "Coach_email_key" ON "Coach"("email");

-- CreateIndex
CREATE INDEX "Coach_email_idx" ON "Coach"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_loginCode_key" ON "Student"("loginCode");

-- CreateIndex
CREATE INDEX "Student_level_idx" ON "Student"("level");

-- CreateIndex
CREATE INDEX "Enrollment_classId_idx" ON "Enrollment"("classId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_classId_key" ON "Enrollment"("studentId", "classId");

-- CreateIndex
CREATE INDEX "ClassAssignment_classId_idx" ON "ClassAssignment"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassAssignment_coachId_classId_key" ON "ClassAssignment"("coachId", "classId");

-- CreateIndex
CREATE INDEX "AttendanceSession_sessionDate_idx" ON "AttendanceSession"("sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_classId_sessionDate_key" ON "AttendanceSession"("classId", "sessionDate");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_attendanceSessionId_studentId_key" ON "AttendanceRecord"("attendanceSessionId", "studentId");

-- CreateIndex
CREATE INDEX "GuardianNotification_studentId_idx" ON "GuardianNotification"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianNotification_studentId_classId_sessionDate_key" ON "GuardianNotification"("studentId", "classId", "sessionDate");

-- CreateIndex
CREATE INDEX "CheckIn_venueId_checkInDate_idx" ON "CheckIn"("venueId", "checkInDate");

-- CreateIndex
CREATE INDEX "CheckIn_coachShiftId_idx" ON "CheckIn"("coachShiftId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_studentId_venueId_checkInDate_key" ON "CheckIn"("studentId", "venueId", "checkInDate");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInNotification_checkInId_key" ON "CheckInNotification"("checkInId");

-- CreateIndex
CREATE INDEX "CoachShift_coachId_idx" ON "CoachShift"("coachId");

-- CreateIndex
CREATE INDEX "CoachShift_venueId_shiftDate_idx" ON "CoachShift"("venueId", "shiftDate");

-- CreateIndex
CREATE INDEX "CoachShift_status_idx" ON "CoachShift"("status");

-- CreateIndex
CREATE INDEX "CurriculumTopic_subject_level_idx" ON "CurriculumTopic"("subject", "level");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumTopic_subject_level_order_key" ON "CurriculumTopic"("subject", "level", "order");

-- CreateIndex
CREATE INDEX "ClassProgress_classId_idx" ON "ClassProgress"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassProgress_classId_curriculumTopicId_key" ON "ClassProgress"("classId", "curriculumTopicId");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_markedByCoachId_fkey" FOREIGN KEY ("markedByCoachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianNotification" ADD CONSTRAINT "GuardianNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianNotification" ADD CONSTRAINT "GuardianNotification_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_coachShiftId_fkey" FOREIGN KEY ("coachShiftId") REFERENCES "CoachShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInNotification" ADD CONSTRAINT "CheckInNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInNotification" ADD CONSTRAINT "CheckInNotification_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachShift" ADD CONSTRAINT "CoachShift_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachShift" ADD CONSTRAINT "CoachShift_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachShift" ADD CONSTRAINT "CoachShift_approvedByCoachId_fkey" FOREIGN KEY ("approvedByCoachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassProgress" ADD CONSTRAINT "ClassProgress_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassProgress" ADD CONSTRAINT "ClassProgress_curriculumTopicId_fkey" FOREIGN KEY ("curriculumTopicId") REFERENCES "CurriculumTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
