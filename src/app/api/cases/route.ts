import { NextResponse } from "next/server";

import { seedReports } from "@/lib/seed-data";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(
    {
      data: seedReports,
      count: seedReports.length,
      generated_at: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
