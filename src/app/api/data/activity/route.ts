import { NextRequest, NextResponse } from "next/server";
import { getActivity } from "@/lib/tools";
import { getSessionId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req);
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  return NextResponse.json({ activity: await getActivity(sessionId, { limit }) });
}
