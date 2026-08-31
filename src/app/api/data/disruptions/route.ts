import { NextResponse } from "next/server";
import { listDisruptions } from "@/lib/tools";

export async function GET() {
  return NextResponse.json({ disruptions: await listDisruptions() });
}
