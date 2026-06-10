import type { Metadata } from "next";

import { PageHeading } from "@/components/page-heading";
import { CalculatorForm } from "@/src/components/calculator/CalculatorForm";
import { resolveGameDataSource } from "@/src/lib/game/game-data-source";

export const metadata: Metadata = {
  title: "Calculator",
};

export const dynamic = "force-dynamic";

export default async function CalculatorPage() {
  const gameData = await resolveGameDataSource();

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <PageHeading
        eyebrow="Damage workspace"
        title="Calculator"
        description="Select a target building, equipment, and Earthquake setup to see whether the chosen combo destroys the target."
      />
      <CalculatorForm
        gameData={{
          source: gameData.source,
          buildings: gameData.buildings,
          equipment: gameData.equipment,
          spells: gameData.spells,
        }}
      />
    </div>
  );
}
