"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/shared/Toast";
import { registerChainPilotTools } from "@/mcp/registerTools";

export function Providers({ children }: { children: React.ReactNode }) {
  // Expose ChainPilot's 5 real tools to any WebMCP-capable agent (Chrome with the
  // WebMCP flag, ChatGPT's in-app browser, etc.) as soon as the app loads.
  useEffect(() => {
    registerChainPilotTools();
  }, []);

  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  );
}
