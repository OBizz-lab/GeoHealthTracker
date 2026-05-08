import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";

// Placeholder route — wire to Supabase once NEXT_PUBLIC_SUPABASE_URL is set.
// For now returns success so the form UX works end-to-end.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: true });
}
