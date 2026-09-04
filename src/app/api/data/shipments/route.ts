import { NextRequest, NextResponse } from "next/server";
import { listAllShipments } from "@/lib/tools";
import { getSessionId, patchSessionCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req);
  const _res = NextResponse.json({ shipments: await listAllShipments(sessionId) });

  patchSessionCookie(req, _res, sessionId);

  return _res;
}
