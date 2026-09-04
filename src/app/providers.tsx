"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/shared/Toast";
import { registerChainPilotTools } from "@/mcp/registerTools";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Mint session cookie FIRST, then signal all pages that it's safe to load.
    fetch("/api/session", { method: "POST", credentials: "include" })
      .then(() => {
        // Dispatch a custom event so any page waiting on session can start fetching.
        window.dispatchEvent(new Event("session:ready"));
      })
      .catch(() => {
        // Even on failure, unblock pages so they don't hang forever.
        window.dispatchEvent(new Event("session:ready"));
      });

    registerChainPilotTools();
  }, []);

  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  );
}
