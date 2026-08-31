import { NextResponse } from "next/server";
import { listAllShipments } from "@/lib/tools";

export async function GET() {
  return NextResponse.json({ shipments: await listAllShipments() });
}
