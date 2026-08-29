"use client";

import { Sidebar } from "./Sidebar";
import { LayoutProvider, useLayout } from "./LayoutContext";

function Shell({ children }: { children: React.ReactNode }) {
  const { mobileOpen, closeMobileMenu } = useLayout();
  return (
    <div className="flex h-full bg-[#F7F8FA] overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobileMenu} />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <Shell>{children}</Shell>
    </LayoutProvider>
  );
}
