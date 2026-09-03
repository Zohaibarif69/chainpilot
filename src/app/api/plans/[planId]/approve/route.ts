import { NextRequest, NextResponse } from "next/server";
import { approvePlan, ApiError } from "@/lib/tools";
import { getSessionId } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const sessionId = getSessionId(req);
  const { planId } = await params;
  try {
    return NextResponse.json(await approvePlan(sessionId, { planId }));
  } catch (err: any) {
    const status = err instanceof ApiError && err.code === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
