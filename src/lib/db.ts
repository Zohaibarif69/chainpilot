// Datastore backed by Vercel Blob (persists across serverless invocations),
// with a filesystem fallback for local development so `npm run dev` still
// works without a BLOB_READ_WRITE_TOKEN configured.
//
// Per-session isolation: every visitor gets their own copy of the DB keyed by
// their session ID (cookie: cp_session). Changes one user makes never affect
// another user's view.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { put, get, head } from "@vercel/blob";
import { buildSeedDb, type Db } from "./seedData";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

// ---- Local filesystem fallback (used only when no Blob token is set) ------
const DATA_DIR = join(process.cwd(), "data");

function localPath(sessionId: string) {
  return join(DATA_DIR, `session-${sessionId}.json`);
}

function loadFromFile(sessionId: string): Db {
  const p = localPath(sessionId);
  if (!existsSync(p)) {
    mkdirSync(DATA_DIR, { recursive: true });
    const db = buildSeedDb();
    writeFileSync(p, JSON.stringify(db, null, 2));
    return db;
  }
  return JSON.parse(readFileSync(p, "utf-8"));
}

function saveToFile(sessionId: string, db: Db) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(localPath(sessionId), JSON.stringify(db, null, 2));
}

// ---- Vercel Blob (used in production / whenever a token is present) -------
function blobPath(sessionId: string) {
  return `chainpilot/sessions/${sessionId}.json`;
}

async function loadFromBlob(sessionId: string): Promise<Db> {
  try {
    await head(blobPath(sessionId));
    const result = await get(blobPath(sessionId), { access: "private", useCache: false });
    if (!result || !result.stream) throw new Error("Blob exists but returned no content");
    const text = await new Response(result.stream).text();
    return JSON.parse(text);
  } catch {
    // First visit for this session — seed fresh data
    const db = buildSeedDb();
    await saveToBlob(sessionId, db);
    return db;
  }
}

async function saveToBlob(sessionId: string, db: Db) {
  await put(blobPath(sessionId), JSON.stringify(db, null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

// ---- Public API -------------------------------------------------------------
export async function loadDb(sessionId: string): Promise<Db> {
  return USE_BLOB ? loadFromBlob(sessionId) : loadFromFile(sessionId);
}

export async function saveDb(sessionId: string, db: Db): Promise<void> {
  return USE_BLOB ? saveToBlob(sessionId, db) : saveToFile(sessionId, db);
}
