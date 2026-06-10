import type { Metadata } from "next";

import { PageHeading } from "@/components/page-heading";
import { DataManagerDashboard } from "@/src/components/data-manager/DataManagerDashboard";
import { resolveGameDataSource } from "@/src/lib/game/game-data-source";

export const metadata: Metadata = {
  title: "Data Manager",
};

export const dynamic = "force-dynamic";

export default async function DataManagerPage() {
  const gameData = await resolveGameDataSource();

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <PageHeading
        eyebrow="Game reference"
        title="Data Manager"
        description="Review the game dataset, patch verification status, source coverage, and known limitations behind calculator results."
      />
      <DataManagerDashboard gameData={gameData} />
    </div>
  );
}
