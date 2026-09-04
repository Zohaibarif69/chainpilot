import { NextRequest, NextResponse } from "next/server";
import { simulateRecoveryPlan, ApiError } from "@/lib/tools";
import { getSessionId, patchSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const sessionId = getSessionId(req);
  try {
    const body = await req.json().catch(() => ({}));
    const result = await simulateRecoveryPlan(sessionId, body);
    const _res = NextResponse.json(result);

    patchSessionCookie(req, _res, sessionId);

    return _res;
  } catch (err: any) {
    const status = err instanceof ApiError && err.code === "NOT_FOUND" ? 404 : 500;
    const _res = NextResponse.json({ error: { code: err.code ?? "INTERNAL", message: err.message } }, { status });

    patchSessionCookie(req, _res, sessionId);

    return _res;
  }
}
