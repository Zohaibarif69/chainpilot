import { NextRequest, NextResponse } from "next/server";
import { listAllInventory } from "@/lib/tools";
import { getSessionId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req);
  return NextResponse.json({ inventory: await listAllInventory(sessionId) });
}
