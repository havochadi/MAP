/*
  Warnings:

  - You are about to drop the column `guardianName` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `guardianPhone` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `venueId` on the `Student` table. All the data in the column will be lost.
  - Added the required column `contactNumber` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergencyContactName` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergencyContactPhone` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergencyContactRelationship` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolName` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "checkInDate" TEXT NOT NULL,
    "checkedInAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coachShiftId" TEXT NOT NULL,
    CONSTRAINT "CheckIn_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckIn_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CheckIn_coachShiftId_fkey" FOREIGN KEY ("coachShiftId") REFERENCES "CoachShift" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckInNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "checkInId" TEXT NOT NULL,
    "recipientPhone" TEXT,
    "delivered" BOOLEAN NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckInNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckInNotification_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "CheckIn" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoachShift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coachId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "shiftDate" TEXT NOT NULL,
    "clockInAt" DATETIME NOT NULL,
    "clockOutAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "approvedByCoachId" TEXT,
    "approvedAt" DATETIME,
    "reviewNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoachShift_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CoachShift_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CoachShift_approvedByCoachId_fkey" FOREIGN KEY ("approvedByCoachId") REFERENCES "Coach" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isMapStudent" BOOLEAN NOT NULL DEFAULT true,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactRelationship" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "referralSource" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loginCode" TEXT NOT NULL
);
INSERT INTO "new_Student" ("id", "level", "loginCode", "name", "registeredAt", "status") SELECT "id", "level", "loginCode", "name", "registeredAt", "status" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_loginCode_key" ON "Student"("loginCode");
CREATE INDEX "Student_level_idx" ON "Student"("level");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

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
