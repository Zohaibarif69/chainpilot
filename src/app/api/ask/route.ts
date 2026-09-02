import { NextRequest, NextResponse } from "next/server";
import { askQuestion, ApiError } from "@/lib/tools";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    return NextResponse.json(await askQuestion({ shipmentId: body.shipmentId, question: body.question }));
  } catch (err: any) {
    const status = err instanceof ApiError && err.code === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
