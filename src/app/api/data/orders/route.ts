import { NextRequest, NextResponse } from "next/server";
import { listAffectedOrders, ApiError } from "@/lib/tools";
import { getSessionId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req);
  const shipmentId = req.nextUrl.searchParams.get("shipmentId") ?? "";
  try {
    return NextResponse.json({ orders: await listAffectedOrders(sessionId, { shipmentId }) });
  } catch (err: any) {
    const status = err instanceof ApiError && err.code === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
