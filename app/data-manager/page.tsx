import type { Metadata } from "next";

import { PageHeading } from "@/components/page-heading";
import { DataManagerDashboard } from "@/src/components/data-manager/DataManagerDashboard";

export const metadata: Metadata = {
  title: "Data Manager",
};

export default function DataManagerPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <PageHeading
        eyebrow="Game reference"
        title="Data Manager"
        description="Review the local game dataset, patch verification status, source coverage, and known limitations behind calculator results."
      />
      <DataManagerDashboard />
    </div>
  );
}
