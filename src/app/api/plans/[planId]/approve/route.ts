import { NextRequest, NextResponse } from "next/server";
import { approvePlan, ApiError } from "@/lib/tools";

export async function POST(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  try {
    return NextResponse.json(await approvePlan({ planId }));
  } catch (err: any) {
    const status = err instanceof ApiError && err.code === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
