-- CreateTable
CREATE TABLE "GuardianNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sessionDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recipientPhone" TEXT,
    "delivered" BOOLEAN NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuardianNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GuardianNotification_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GuardianNotification_studentId_idx" ON "GuardianNotification"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianNotification_studentId_classId_sessionDate_key" ON "GuardianNotification"("studentId", "classId", "sessionDate");
