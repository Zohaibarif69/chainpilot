import { NextRequest, NextResponse } from "next/server";
import { listAffectedWarehouses, ApiError } from "@/lib/tools";

export async function GET(req: NextRequest) {
  const shipmentId = req.nextUrl.searchParams.get("shipmentId") ?? "";
  try {
    return NextResponse.json({ warehouses: await listAffectedWarehouses({ shipmentId }) });
  } catch (err: any) {
    const status = err instanceof ApiError && err.code === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
