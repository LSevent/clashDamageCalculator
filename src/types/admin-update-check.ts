export const updateDetectedTypes = [
  "patch-notes",
  "balance-update",
  "event",
  "equipment",
  "spell",
  "general-news",
  "unknown",
] as const;

export type UpdateDetectedType = (typeof updateDetectedTypes)[number];

export const updateResultStatuses = [
  "new",
  "already-known",
  "ignored",
  "patch-draft-created",
] as const;

export type UpdateResultStatus = (typeof updateResultStatuses)[number];

export type OfficialPostCandidate = {
  title: string;
  url: string;
  publishedAt: Date | null;
  detectedType: UpdateDetectedType;
};

export type UpdateCheckSummary = {
  sourcesChecked: number;
  sourcesSkipped: number;
  newPosts: number;
  alreadyKnownPosts: number;
  ignoredPosts: number;
  failedSources: number;
  checkedAt: string;
  messages: readonly string[];
};

export type UpdateCheckActionState = {
  ok: boolean;
  message?: string;
  summary?: UpdateCheckSummary;
  runId?: string;
};

export type UpdateSourceView = {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  enabled: boolean;
  lastCheckedAt: string | null;
};

export type UpdateCheckResultView = {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  url: string;
  publishedAt: string | null;
  detectedType: UpdateDetectedType;
  status: UpdateResultStatus;
  checkedAt: string;
  patch: {
    id: string;
    name: string;
    verificationStatus: string;
  } | null;
};

export type UpdateCheckerDashboardData = {
  sources: readonly UpdateSourceView[];
  results: readonly UpdateCheckResultView[];
  enabledSourceCount: number;
  newPostCount: number;
  alreadyKnownPostCount: number;
  ignoredPostCount: number;
  patchDraftCount: number;
  lastCheckedAt: string | null;
};

export type PatchDraftActionState = {
  ok: boolean;
  message: string;
  patchId?: string;
  existing?: boolean;
};

export type UpdateCheckerDashboardResult =
  | {
      available: true;
      data: UpdateCheckerDashboardData;
    }
  | {
      available: false;
      message: string;
    };
