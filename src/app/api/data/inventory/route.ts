import { NextResponse } from "next/server";
import { listAllInventory } from "@/lib/tools";

export async function GET() {
  return NextResponse.json({ inventory: await listAllInventory() });
}
