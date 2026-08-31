import { NextResponse } from "next/server";
import { listRecoveryPlans } from "@/lib/tools";

export async function GET() {
  return NextResponse.json({ plans: await listRecoveryPlans() });
}
