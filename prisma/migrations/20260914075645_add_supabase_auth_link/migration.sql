-- AlterTable
ALTER TABLE "Coach" ADD COLUMN     "authUserId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "authUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Coach_authUserId_key" ON "Coach"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_authUserId_key" ON "Student"("authUserId");
