import type { Metadata } from "next";

import { PageHeading } from "@/components/page-heading";
import { ProgressSetupForm } from "@/src/components/progress/ProgressSetupForm";

export const metadata: Metadata = {
  title: "Progress Setup",
};

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <PageHeading
        eyebrow="Village profile"
        title="Progress Setup"
        description="Save your current Town Hall, equipment, and spell levels locally so the calculator can start with familiar defaults."
      />
      <ProgressSetupForm />
    </div>
  );
}
