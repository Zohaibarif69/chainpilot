"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/shared/Toast";
import { registerChainPilotTools } from "@/mcp/registerTools";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Fire and forget — just ensure the cookie exists for subsequent requests.
    // Pages do NOT wait for this; the API handles missing cookies gracefully.
    fetch("/api/session", { method: "POST", credentials: "include" }).catch(() => {});
    registerChainPilotTools();
  }, []);

  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  );
}
