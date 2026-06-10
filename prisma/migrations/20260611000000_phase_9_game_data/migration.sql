-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Patch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "sourceUrls" JSONB,
    "notes" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "changedItems" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "dataId" INTEGER,
    "name" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "canBeSupercharged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingLevel" (
    "id" TEXT NOT NULL,
    "levelKey" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "townHallLevel" INTEGER,
    "hp" INTEGER,
    "patchId" TEXT,
    "sourceUrl" TEXT,
    "isSupercharged" BOOLEAN NOT NULL DEFAULT false,
    "superchargeLevel" INTEGER,
    "verificationStatus" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "dataId" INTEGER,
    "name" TEXT NOT NULL,
    "hero" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "category" TEXT,
    "patchId" TEXT,
    "sourceUrls" JSONB,
    "verificationStatus" TEXT,
    "notes" TEXT,
    "calculatorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentLevel" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "damage" INTEGER,
    "damagePerSecond" INTEGER,
    "regeneration" INTEGER,
    "healing" INTEGER,
    "hpIncrease" INTEGER,
    "abilityDescription" TEXT,
    "specialRules" JSONB,
    "patchId" TEXT,
    "sourceUrl" TEXT,
    "sourceType" TEXT,
    "verificationStatus" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spell" (
    "id" TEXT NOT NULL,
    "dataId" INTEGER,
    "name" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "spellType" TEXT NOT NULL,
    "housingSpace" INTEGER,
    "patchId" TEXT,
    "sourceUrls" JSONB,
    "verificationStatus" TEXT,
    "notes" TEXT,
    "calculatorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpellLevel" (
    "id" TEXT NOT NULL,
    "spellId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "damage" INTEGER,
    "damagePercent" DOUBLE PRECISION,
    "repeatDamageRule" TEXT,
    "patchId" TEXT,
    "sourceUrl" TEXT,
    "sourceType" TEXT,
    "verificationStatus" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpellLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectIdMapping" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dataId" INTEGER NOT NULL,
    "appObjectId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObjectIdMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BuildingLevel_levelKey_key" ON "BuildingLevel"("levelKey");

-- CreateIndex
CREATE INDEX "BuildingLevel_buildingId_townHallLevel_idx" ON "BuildingLevel"("buildingId", "townHallLevel");

-- CreateIndex
CREATE INDEX "BuildingLevel_patchId_idx" ON "BuildingLevel"("patchId");

-- CreateIndex
CREATE INDEX "Equipment_patchId_idx" ON "Equipment"("patchId");

-- CreateIndex
CREATE INDEX "EquipmentLevel_patchId_idx" ON "EquipmentLevel"("patchId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentLevel_equipmentId_level_key" ON "EquipmentLevel"("equipmentId", "level");

-- CreateIndex
CREATE INDEX "Spell_patchId_idx" ON "Spell"("patchId");

-- CreateIndex
CREATE INDEX "SpellLevel_patchId_idx" ON "SpellLevel"("patchId");

-- CreateIndex
CREATE UNIQUE INDEX "SpellLevel_spellId_level_key" ON "SpellLevel"("spellId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "ObjectIdMapping_category_dataId_key" ON "ObjectIdMapping"("category", "dataId");

-- AddForeignKey
ALTER TABLE "BuildingLevel" ADD CONSTRAINT "BuildingLevel_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingLevel" ADD CONSTRAINT "BuildingLevel_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentLevel" ADD CONSTRAINT "EquipmentLevel_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentLevel" ADD CONSTRAINT "EquipmentLevel_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spell" ADD CONSTRAINT "Spell_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpellLevel" ADD CONSTRAINT "SpellLevel_spellId_fkey" FOREIGN KEY ("spellId") REFERENCES "Spell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpellLevel" ADD CONSTRAINT "SpellLevel_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
