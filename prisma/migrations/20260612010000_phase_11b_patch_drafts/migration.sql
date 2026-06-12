-- AlterTable
ALTER TABLE "Patch" ADD COLUMN "updateCheckResultId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Patch_updateCheckResultId_key" ON "Patch"("updateCheckResultId");

-- AddForeignKey
ALTER TABLE "Patch" ADD CONSTRAINT "Patch_updateCheckResultId_fkey" FOREIGN KEY ("updateCheckResultId") REFERENCES "UpdateCheckResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
