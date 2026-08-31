import { NextResponse } from "next/server";
import { listAllSuppliers } from "@/lib/tools";

export async function GET() {
  return NextResponse.json({ suppliers: await listAllSuppliers() });
}
