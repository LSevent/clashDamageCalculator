export type ImportSection =
  | "buildings"
  | "equipment"
  | "spells"
  | "heroes"
  | "pets";

export type RawVillageObject = {
  data?: unknown;
  lvl?: unknown;
};

export type RawVillageSnapshot = {
  tag?: unknown;
  playerTag?: unknown;
  buildings?: unknown;
  equipment?: unknown;
  spells?: unknown;
  heroes?: unknown;
  pets?: unknown;
};

export type ImportedProgressItem = {
  section: ImportSection;
  dataId: number;
  appObjectId?: string;
  name?: string;
  level?: number;
  validLevel: boolean;
};

export type ImportUnknownCounts = Record<ImportSection, number>;

export type ImportedProgressPreview = {
  playerTag?: string;
  detectedTownHallLevel?: number;
  equipmentLevels: Record<string, number>;
  spellLevels: Record<string, number>;
  heroLevels?: Record<string, number>;
  knownItems: readonly ImportedProgressItem[];
  unknownItems: readonly ImportedProgressItem[];
  unknownCounts: ImportUnknownCounts;
  warnings: readonly string[];
  source: "json-import";
};

export type JsonImportResult =
  | {
      success: true;
      preview: ImportedProgressPreview;
    }
  | {
      success: false;
      error: string;
    };

