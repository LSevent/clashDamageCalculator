import { describe, expect, it } from "vitest";

import { equipment, spells } from "@/src/data/game";

describe("current static game data", () => {
  it("stores the official Giant Arrow balance checkpoints", () => {
    const giantArrow = equipment.find((item) => item.id === "giant-arrow");

    expect(
      giantArrow?.levels.map((level) => [level.level, level.damage]),
    ).toEqual([
      [9, 1100],
      [12, 1200],
      [15, 1350],
      [18, 1500],
    ]);
    expect(giantArrow?.levels.at(-1)?.targetMultipliers).toContainEqual({
      targetBuildingId: "air-defense",
      multiplier: 2,
      description: "Deals 2x damage to Air Defense.",
    });
  });

  it("keeps the Rocket Backpack MVP seed marked for review", () => {
    const rocketBackpack = equipment.find(
      (item) => item.id === "rocket-backpack",
    );
    const level24 = rocketBackpack?.levels.find((level) => level.level === 24);

    expect(level24).toMatchObject({
      damage: 2050,
      sourceType: "manual-seed",
      verificationStatus: "needs-review",
    });
  });

  it("stores Fire Heart effects without one-shot calculator damage", () => {
    const fireHeart = equipment.find((item) => item.id === "fire-heart");
    const level18 = fireHeart?.levels.find((level) => level.level === 18);

    expect(fireHeart?.calculatorEnabled).toBe(false);
    expect(level18).toMatchObject({
      damagePerSecond: 23,
      regeneration: 150,
      verificationStatus: "verified",
    });
    expect(level18 && "damage" in level18).toBe(false);
  });

  it("keeps partial June content outside the calculator", () => {
    const monolithArrow = equipment.find(
      (item) => item.id === "monolith-arrow",
    );
    const eventSpells = spells.filter((spell) => spell.spellType === "event");

    expect(monolithArrow).toMatchObject({
      verificationStatus: "partial",
      calculatorEnabled: false,
      levels: [],
    });
    expect(eventSpells.map((spell) => spell.id)).toEqual([
      "recall-revive-spell",
      "yellow-card-spell",
    ]);
    expect(
      eventSpells.every(
        (spell) =>
          spell.verificationStatus === "partial" &&
          spell.calculatorEnabled === false &&
          spell.levels.length === 0,
      ),
    ).toBe(true);
  });
});
