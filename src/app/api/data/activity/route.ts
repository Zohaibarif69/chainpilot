import { NextRequest, NextResponse } from "next/server";
import { getActivity } from "@/lib/tools";
import { getSessionId, patchSessionCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req);
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const _res = NextResponse.json({ activity: await getActivity(sessionId, { limit }) });

  patchSessionCookie(req, _res, sessionId);

  return _res;
}
