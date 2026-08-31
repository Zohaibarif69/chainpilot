import { NextRequest, NextResponse } from "next/server";
import { getActivity } from "@/lib/tools";

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  return NextResponse.json({ activity: await getActivity({ limit }) });
}
