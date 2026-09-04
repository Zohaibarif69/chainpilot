"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/shared/Toast";
import { registerChainPilotTools } from "@/mcp/registerTools";

// Store the session promise globally so any page can await it,
// even if it resolves before the page mounts.
let sessionPromise: Promise<void> | null = null;

export function getSessionPromise(): Promise<void> {
  if (!sessionPromise) {
    sessionPromise = fetch("/api/session", {
      method: "POST",
      credentials: "include",
    }).then(() => undefined).catch(() => undefined);
  }
  return sessionPromise;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getSessionPromise(); // kick it off immediately on mount
    registerChainPilotTools();
  }, []);

  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  );
}
