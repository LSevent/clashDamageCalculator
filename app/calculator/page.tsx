import type { Metadata } from "next";

import { PageHeading } from "@/components/page-heading";
import { CalculatorForm } from "@/src/components/calculator/CalculatorForm";

export const metadata: Metadata = {
  title: "Calculator",
};

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <PageHeading
        eyebrow="Damage workspace"
        title="Calculator"
        description="Select a target building, equipment, and Earthquake setup to see whether the chosen combo destroys the target."
      />
      <CalculatorForm />
    </div>
  );
}
