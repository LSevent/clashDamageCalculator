export type UserProgressSource = "manual";

export type UserProgress = {
  playerTag?: string;
  townHallLevel: number;
  equipmentLevels: Record<string, number>;
  spellLevels: Record<string, number>;
  heroLevels?: Record<string, number>;
  updatedAt: string;
  source: UserProgressSource;
};

export type UserProgressValidationErrors = {
  playerTag?: string;
  townHallLevel?: string;
  equipmentLevels?: Record<string, string>;
  spellLevels?: Record<string, string>;
  updatedAt?: string;
  source?: string;
};

export type UserProgressValidationResult =
  | {
      valid: true;
      progress: UserProgress;
      errors: UserProgressValidationErrors;
    }
  | {
      valid: false;
      errors: UserProgressValidationErrors;
    };

