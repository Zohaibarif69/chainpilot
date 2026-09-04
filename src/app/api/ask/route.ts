import { NextRequest, NextResponse } from "next/server";
import { askQuestion, ApiError } from "@/lib/tools";
import { getSessionId, patchSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const sessionId = getSessionId(req);
  const body = await req.json();
  try {
    const _res = NextResponse.json(await askQuestion(sessionId, { shipmentId: body.shipmentId, question: body.question }));

    patchSessionCookie(req, _res, sessionId);

    return _res;
  } catch (err: any) {
    const status = err instanceof ApiError && err.code === "NOT_FOUND" ? 404 : 500;
    const _res = NextResponse.json({ error: err.message }, { status });

    patchSessionCookie(req, _res, sessionId);

    return _res;
  }
}
