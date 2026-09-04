"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once the cp_session cookie has been set by /api/session.
 * On first visit this waits for the "session:ready" event fired by providers.tsx.
 * On subsequent visits (cookie already exists) it returns true immediately.
 */
export function useSessionReady(): boolean {
  const [ready, setReady] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.cookie.includes("cp_session");
  });

  useEffect(() => {
    if (ready) return;
    const onReady = () => setReady(true);
    window.addEventListener("session:ready", onReady, { once: true });
    return () => window.removeEventListener("session:ready", onReady);
  }, [ready]);

  return ready;
}
