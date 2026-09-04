"use client";

import { useEffect, useState } from "react";
import { getSessionPromise } from "@/app/providers";

/**
 * Returns true once the session cookie is guaranteed to exist.
 * Works whether the session resolved before or after this hook mounts.
 */
export function useSessionReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // getSessionPromise() returns the same promise every time —
    // if it already resolved, .then() fires on the next microtask tick.
    getSessionPromise().then(() => setReady(true));
  }, []);

  return ready;
}
