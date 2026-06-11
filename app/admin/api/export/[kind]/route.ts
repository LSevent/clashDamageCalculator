import { NextResponse } from "next/server";

import { getAdminAuthState } from "@/src/lib/admin/admin-auth";
import {
  bulkCsvHeaders,
  createBulkTemplate,
  createCsv,
} from "@/src/lib/admin/bulk-export";
import { isBulkImportType } from "@/src/lib/admin/bulk-import";
import { getPrismaClient } from "@/src/lib/db/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ kind: string }>;
};

function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await getAdminAuthState();
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 401 },
    );
  }

  const { kind } = await params;
  if (!isBulkImportType(kind)) {
    return NextResponse.json(
      { error: "Unknown export type." },
      { status: 404 },
    );
  }

  const template = new URL(request.url).searchParams.get("template") === "1";
  if (template) {
    return csvResponse(
      createBulkTemplate(kind),
      `${kind}-template.csv`,
    );
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return NextResponse.json(
      { error: "Export requires database access." },
      { status: 503 },
    );
  }

  try {
    if (kind === "building-levels") {
      const rows = await prisma.buildingLevel.findMany({
        include: { building: { select: { name: true } } },
        orderBy: [
          { buildingId: "asc" },
          { townHallLevel: "asc" },
          { level: "asc" },
        ],
      });

      return csvResponse(
        createCsv([...bulkCsvHeaders[kind], "updatedAt"], rows.map((row) => [
          row.buildingId,
          row.building.name,
          row.townHallLevel,
          row.level,
          row.hp,
          row.isSupercharged,
          row.superchargeLevel,
          row.patchId,
          row.sourceUrl,
          row.verificationStatus,
          row.notes,
          row.updatedAt.toISOString(),
        ])),
        "building-levels.csv",
      );
    }

    if (kind === "equipment-levels") {
      const rows = await prisma.equipmentLevel.findMany({
        include: { equipment: { select: { name: true } } },
        orderBy: [{ equipmentId: "asc" }, { level: "asc" }],
      });

      return csvResponse(
        createCsv([...bulkCsvHeaders[kind], "updatedAt"], rows.map((row) => [
          row.equipmentId,
          row.equipment.name,
          row.level,
          row.damage,
          row.healing,
          row.hpIncrease,
          row.abilityDescription,
          row.specialRules,
          row.patchId,
          row.sourceUrl,
          row.verificationStatus,
          row.notes,
          row.updatedAt.toISOString(),
        ])),
        "equipment-levels.csv",
      );
    }

    const rows = await prisma.spellLevel.findMany({
      include: { spell: { select: { name: true } } },
      orderBy: [{ spellId: "asc" }, { level: "asc" }],
    });

    return csvResponse(
      createCsv([...bulkCsvHeaders[kind], "updatedAt"], rows.map((row) => [
        row.spellId,
        row.spell.name,
        row.level,
        row.damage,
        row.damagePercent,
        row.repeatDamageRule,
        row.patchId,
        row.sourceUrl,
        row.verificationStatus,
        row.notes,
        row.updatedAt.toISOString(),
      ])),
      "spell-levels.csv",
    );
  } catch {
    return NextResponse.json(
      { error: "Export requires database access." },
      { status: 503 },
    );
  }
}
