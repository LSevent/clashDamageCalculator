import { Badge } from "@/src/components/ui/Badge";
import type { AdminVerificationStatus } from "@/src/types/admin";

type VerificationBadgeProps = {
  status?: string | null;
};

export function VerificationBadge({ status }: VerificationBadgeProps) {
  const normalized =
    (status as AdminVerificationStatus | null) ?? "needs-review";
  const tone =
    normalized === "verified"
      ? "success"
      : normalized === "rejected"
        ? "neutral"
        : "warning";

  return <Badge tone={tone}>{normalized.replaceAll("-", " ")}</Badge>;
}
