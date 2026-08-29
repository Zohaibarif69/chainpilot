"use client";

import { createContext, useContext, useState } from "react";

interface LayoutContextValue {
  mobileOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const LayoutContext = createContext<LayoutContextValue>({
  mobileOpen: false,
  openMobileMenu: () => {},
  closeMobileMenu: () => {},
});

export function useLayout() {
  return useContext(LayoutContext);
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <LayoutContext.Provider
      value={{
        mobileOpen,
        openMobileMenu: () => setMobileOpen(true),
        closeMobileMenu: () => setMobileOpen(false),
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}
