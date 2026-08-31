import { NextResponse } from "next/server";
import { listAllOrders } from "@/lib/tools";

export async function GET() {
  return NextResponse.json({ orders: await listAllOrders() });
}
