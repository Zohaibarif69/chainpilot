import { NextRequest, NextResponse } from "next/server";
import { listAffectedWarehouses, ApiError } from "@/lib/tools";
import { getSessionId, patchSessionCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req);
  const shipmentId = req.nextUrl.searchParams.get("shipmentId") ?? "";
  try {
    const _res = NextResponse.json({ warehouses: await listAffectedWarehouses(sessionId, { shipmentId }) });

    patchSessionCookie(req, _res, sessionId);

    return _res;
  } catch (err: any) {
    const status = err instanceof ApiError && err.code === "NOT_FOUND" ? 404 : 500;
    const _res = NextResponse.json({ error: err.message }, { status });

    patchSessionCookie(req, _res, sessionId);

    return _res;
  }
}
