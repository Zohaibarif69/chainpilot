import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { SESSION_COOKIE } from "@/lib/session";
import { loadDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const existing = req.cookies.get(SESSION_COOKIE)?.value;
  const sessionId = existing ?? randomUUID();

  await loadDb(sessionId);

  const res = NextResponse.json({ sessionId });

  // Always set the cookie (even if refreshing) to ensure it survives
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return res;
}

export async function GET(req: NextRequest) {
  // Allow GET too so browsers can prefetch
  return POST(req);
}
