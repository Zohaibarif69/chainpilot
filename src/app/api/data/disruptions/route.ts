import { NextRequest, NextResponse } from "next/server";
import { listDisruptions } from "@/lib/tools";
import { getSessionId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req);
  return NextResponse.json({ disruptions: await listDisruptions(sessionId) });
}
