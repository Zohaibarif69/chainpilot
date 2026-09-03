"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/shared/Toast";
import { registerChainPilotTools } from "@/mcp/registerTools";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Mint a session cookie for this visitor (no-op if already set).
    // Must happen before any tool call so every request carries a sessionId.
    fetch("/api/session", { method: "POST", credentials: "include" });

    // Expose ChainPilot's 5 real tools to any WebMCP-capable agent.
    registerChainPilotTools();
  }, []);

  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  );
}
