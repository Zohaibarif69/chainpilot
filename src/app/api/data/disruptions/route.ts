import { NextRequest, NextResponse } from "next/server";
import { listDisruptions } from "@/lib/tools";
import { getSessionId, patchSessionCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req);
  const _res = NextResponse.json({ disruptions: await listDisruptions(sessionId) });

  patchSessionCookie(req, _res, sessionId);

  return _res;
}
