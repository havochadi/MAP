/*
  Warnings:

  - Added the required column `loginCode` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loginCode" TEXT NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    CONSTRAINT "Student_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("guardianName", "guardianPhone", "id", "level", "name", "registeredAt", "status", "venueId") SELECT "guardianName", "guardianPhone", "id", "level", "name", "registeredAt", "status", "venueId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_loginCode_key" ON "Student"("loginCode");
CREATE INDEX "Student_venueId_idx" ON "Student"("venueId");
CREATE INDEX "Student_level_idx" ON "Student"("level");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
