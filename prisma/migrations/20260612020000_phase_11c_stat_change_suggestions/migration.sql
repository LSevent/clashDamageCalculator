-- CreateTable
CREATE TABLE "StatChangeSuggestion" (
    "id" TEXT NOT NULL,
    "patchId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT,
    "sourceExcerpt" TEXT,
    "targetKind" TEXT NOT NULL,
    "targetId" TEXT,
    "targetName" TEXT,
    "level" INTEGER,
    "townHallLevel" INTEGER,
    "isSupercharged" BOOLEAN,
    "superchargeLevel" INTEGER,
    "fieldName" TEXT,
    "oldValue" JSONB,
    "suggestedValue" JSONB,
    "finalValue" JSONB,
    "confidence" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "verificationStatus" TEXT,
    "notes" TEXT,
    "parserNotes" TEXT,
    "createdBy" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatChangeSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatChangeSuggestion_patchId_idx" ON "StatChangeSuggestion"("patchId");

-- CreateIndex
CREATE INDEX "StatChangeSuggestion_status_idx" ON "StatChangeSuggestion"("status");

-- CreateIndex
CREATE INDEX "StatChangeSuggestion_targetKind_idx" ON "StatChangeSuggestion"("targetKind");

-- CreateIndex
CREATE INDEX "StatChangeSuggestion_targetId_idx" ON "StatChangeSuggestion"("targetId");

-- AddForeignKey
ALTER TABLE "StatChangeSuggestion" ADD CONSTRAINT "StatChangeSuggestion_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
