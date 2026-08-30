// Datastore backed by Vercel Blob (persists across serverless invocations),
// with a filesystem fallback for local development so `npm run dev` still
// works without a BLOB_READ_WRITE_TOKEN configured.
//
// Same single-JSON-blob shape as before — this just changes WHERE that blob
// lives, not its structure. Both loadDb() and saveDb() are now async because
// they make a network call instead of a local disk read/write.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { put, head } from "@vercel/blob";
import { buildSeedDb, type Db } from "./seedData";

const BLOB_PATH = "chainpilot/db.json";
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

// ---- Local filesystem fallback (used only when no Blob token is set) ------
const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "db.json");

function loadFromFile(): Db {
  if (!existsSync(DB_PATH)) {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DB_PATH, JSON.stringify(buildSeedDb(), null, 2));
  }
  return JSON.parse(readFileSync(DB_PATH, "utf-8"));
}

function saveToFile(db: Db) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ---- Vercel Blob (used in production / whenever a token is present) -------
async function loadFromBlob(): Promise<Db> {
  try {
    const blob = await head(BLOB_PATH);
    // Cache-bust: blob URLs are content-addressed but can be edge-cached:
    // append a timestamp query param so we always read the latest write.
    const res = await fetch(`${blob.url}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
    return res.json();
  } catch {
    // Not found yet (first ever request) -> seed it.
    const db = buildSeedDb();
    await saveToBlob(db);
    return db;
  }
}

async function saveToBlob(db: Db) {
  await put(BLOB_PATH, JSON.stringify(db, null, 2), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

// ---- Public API -------------------------------------------------------------
export async function loadDb(): Promise<Db> {
  return USE_BLOB ? loadFromBlob() : loadFromFile();
}

export async function saveDb(db: Db): Promise<void> {
  return USE_BLOB ? saveToBlob(db) : saveToFile(db);
}
