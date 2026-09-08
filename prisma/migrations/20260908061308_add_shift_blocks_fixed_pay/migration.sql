/*
  Warnings:

  - Added the required column `shiftBlock` to the `CoachShift` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CoachShift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coachId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "shiftDate" TEXT NOT NULL,
    "shiftBlock" TEXT NOT NULL,
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
INSERT INTO "new_CoachShift" ("approvedAt", "approvedByCoachId", "clockInAt", "clockOutAt", "coachId", "createdAt", "id", "reviewNote", "shiftDate", "status", "updatedAt", "venueId") SELECT "approvedAt", "approvedByCoachId", "clockInAt", "clockOutAt", "coachId", "createdAt", "id", "reviewNote", "shiftDate", "status", "updatedAt", "venueId" FROM "CoachShift";
DROP TABLE "CoachShift";
ALTER TABLE "new_CoachShift" RENAME TO "CoachShift";
CREATE INDEX "CoachShift_coachId_idx" ON "CoachShift"("coachId");
CREATE INDEX "CoachShift_venueId_shiftDate_idx" ON "CoachShift"("venueId", "shiftDate");
CREATE INDEX "CoachShift_status_idx" ON "CoachShift"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
