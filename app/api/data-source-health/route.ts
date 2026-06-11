import { NextResponse } from "next/server";

import {
  createDataSourceHealthResponse,
  resolveGameDataSource,
} from "@/src/lib/game/game-data-source";

export const dynamic = "force-dynamic";

export async function GET() {
  const gameData = await resolveGameDataSource();

  return NextResponse.json(createDataSourceHealthResponse(gameData), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
