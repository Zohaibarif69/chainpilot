import { NextRequest, NextResponse } from "next/server";
import { getShipmentImpact, ApiError } from "@/lib/tools";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await getShipmentImpact(body);
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err instanceof ApiError && err.code === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: { code: err.code ?? "INTERNAL", message: err.message } }, { status });
  }
}
