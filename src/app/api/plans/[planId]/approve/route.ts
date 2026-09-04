import { NextRequest, NextResponse } from "next/server";
import { approvePlan, ApiError } from "@/lib/tools";
import { getSessionId, patchSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const sessionId = getSessionId(req);
  const { planId } = await params;
  try {
    const _res = NextResponse.json(await approvePlan(sessionId, { planId }));

    patchSessionCookie(req, _res, sessionId);

    return _res;
  } catch (err: any) {
    const status = err instanceof ApiError && err.code === "NOT_FOUND" ? 404 : 500;
    const _res = NextResponse.json({ error: err.message }, { status });

    patchSessionCookie(req, _res, sessionId);

    return _res;
  }
}
