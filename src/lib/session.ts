import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const SESSION_COOKIE = "cp_session";

/**
 * Read the session ID from the incoming request cookie.
 * If missing, generates a new one. Call patchSessionCookie() to write it back.
 */
export function getSessionId(req: NextRequest): string {
  return req.cookies.get(SESSION_COOKIE)?.value ?? randomUUID();
}

/**
 * If the request had no session cookie, attach Set-Cookie to the response
 * so the browser stores it for all future requests automatically.
 */
export function patchSessionCookie(req: NextRequest, res: NextResponse, sessionId: string): void {
  if (!req.cookies.get(SESSION_COOKIE)?.value) {
    res.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  }
}
