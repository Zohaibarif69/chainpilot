import { NextRequest } from "next/server";
import { randomUUID } from "crypto";

export const SESSION_COOKIE = "cp_session";

/**
 * Read the session ID from the incoming request cookie.
 * If somehow the cookie is missing (should not happen after SessionInit runs),
 * fall back to a random UUID so the request still gets its own isolated DB.
 */
export function getSessionId(req: NextRequest): string {
  return req.cookies.get(SESSION_COOKIE)?.value ?? randomUUID();
}
