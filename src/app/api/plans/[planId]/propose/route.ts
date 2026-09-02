import { NextRequest, NextResponse } from "next/server";
import { proposePlan, ApiError } from "@/lib/tools";

export async function POST(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  try {
    const result = await proposePlan({ planId });
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err instanceof ApiError && err.code === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: { code: err.code ?? "INTERNAL", message: err.message } }, { status });
  }
}
