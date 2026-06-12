-- CreateTable
CREATE TABLE "UpdateSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpdateSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateCheckResult" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "detectedType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpdateCheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UpdateCheckResult_url_key" ON "UpdateCheckResult"("url");

-- CreateIndex
CREATE INDEX "UpdateCheckResult_sourceId_status_idx" ON "UpdateCheckResult"("sourceId", "status");

-- CreateIndex
CREATE INDEX "UpdateCheckResult_checkedAt_idx" ON "UpdateCheckResult"("checkedAt");

-- AddForeignKey
ALTER TABLE "UpdateCheckResult" ADD CONSTRAINT "UpdateCheckResult_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "UpdateSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
