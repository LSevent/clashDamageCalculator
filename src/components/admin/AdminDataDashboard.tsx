import Link from "next/link";

import { Card } from "@/src/components/ui/Card";
import type {
  AdminDataSummary,
  AdminVerificationStatus,
} from "@/src/types/admin";

import { VerificationBadge } from "./VerificationBadge";

type AdminDataDashboardProps = {
  summary?: AdminDataSummary;
  unavailableMessage?: string;
};

const sections = [
  {
    href: "/admin/data/patches",
    label: "Patches",
    description: "Release metadata, current patch, sources, and verification.",
  },
  {
    href: "/admin/data/buildings",
    label: "Buildings",
    description: "Building definitions, HP rows, Town Hall, and supercharge data.",
  },
  {
    href: "/admin/data/equipment",
    label: "Equipment",
    description: "Equipment metadata, level stats, and target-specific rules.",
  },
  {
    href: "/admin/data/spells",
    label: "Spells",
    description: "Spell definitions, level stats, and repeat-damage rules.",
  },
  {
    href: "/admin/data/import-export",
    label: "Bulk import / export",
    description: "Preview curated CSV stat-table updates and export database rows.",
  },
  {
    href: "/admin/updates",
    label: "Official update checker",
    description: "Check configured official news sources for review-only post detections.",
  },
  {
    href: "/admin/stat-changes",
    label: "Stat change suggestions",
    description: "Review, approve, reject, and apply patch-linked stat suggestions.",
  },
];

export function AdminDataDashboard({
  summary,
  unavailableMessage,
}: AdminDataDashboardProps) {
  if (!summary) {
    return (
      <Card className="p-6 sm:p-8">
        <VerificationBadge
          status={"needs-review" satisfies AdminVerificationStatus}
        />
        <h2 className="mt-4 text-xl font-black text-white">
          Database editing unavailable
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {unavailableMessage ??
            "Database is unavailable. Admin editing requires database access."}
        </p>
        <p className="mt-3 text-sm text-slate-500">
          The public app continues using static fallback data.
        </p>
      </Card>
    );
  }

  const metrics = [
    ["Patches", summary.patches],
    ["Buildings", summary.buildings],
    ["Building levels", summary.buildingLevels],
    ["Equipment", summary.equipment],
    ["Equipment levels", summary.equipmentLevels],
    ["Spells", summary.spells],
    ["Spell levels", summary.spellLevels],
    ["Partial / review", summary.partialOrNeedsReview],
    ["Missing sources", summary.missingSourceUrls],
  ];

  return (
    <div className="grid gap-8">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-400">
              Data source status
            </p>
            <h2 className="mt-3 text-xl font-black text-white">
              Database connected
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Admin changes write to PostgreSQL only. Static fallback files
              remain unchanged.
            </p>
          </div>
          <VerificationBadge status="verified" />
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/8 bg-white/[0.03] p-4"
            >
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {label}
              </dt>
              <dd className="mt-2 text-2xl font-black text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full p-6 transition hover:border-emerald-300/20 hover:bg-white/[0.05]">
              <h2 className="text-lg font-black text-white">{section.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {section.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
