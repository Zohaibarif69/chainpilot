"use client";

import { Bell, ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { useLayout } from "./LayoutContext";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function TopHeader({ title, subtitle, breadcrumbs, actions }: TopHeaderProps) {
  const { openMobileMenu } = useLayout();

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center justify-between shrink-0 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={openMobileMenu}
          className="p-2 rounded-md hover:bg-[#F1F3F5] text-[#667085] hover:text-[#111827] transition-colors shrink-0 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 mb-0.5">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.label} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-[#98A2B3]" />}
                  {crumb.to ? (
                    <Link href={crumb.to} className="text-[11px] text-[#667085] hover:text-[#111827] transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-[11px] text-[#98A2B3]">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-[14px] sm:text-[15px] font-semibold text-[#111827] leading-tight truncate">{title}</h1>
          {subtitle && <p className="hidden sm:block text-[11px] text-[#667085] leading-tight">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actions && <div className="flex items-center gap-2 flex-wrap justify-end">{actions}</div>}
        <div className="hidden md:flex items-center gap-1.5 text-[12px] text-[#667085] bg-[#F0FDF4] border border-[#BBF7D0] rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
          <span>Operational</span>
        </div>
        <button
          className="relative p-2 rounded-md hover:bg-[#F1F3F5] text-[#667085] hover:text-[#111827] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626] border-2 border-white" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#3157D5] flex items-center justify-center text-white text-[12px] font-semibold shrink-0">
          OM
        </div>
      </div>
    </header>
  );
}
