"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  Truck,
  Warehouse,
  Users,
  ShoppingCart,
  RefreshCw,
  Activity,
  Settings,
} from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    label: "",
    items: [
      { label: "Overview", to: "/", icon: <LayoutDashboard className="w-4 h-4" />, exact: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Disruptions", to: "/disruptions", icon: <AlertTriangle className="w-4 h-4" /> },
      { label: "Shipments", to: "/shipments", icon: <Truck className="w-4 h-4" /> },
      { label: "Inventory", to: "/inventory", icon: <Warehouse className="w-4 h-4" /> },
      { label: "Suppliers", to: "/suppliers", icon: <Users className="w-4 h-4" /> },
      { label: "Orders", to: "/orders", icon: <ShoppingCart className="w-4 h-4" /> },
    ],
  },
  {
    label: "Recovery",
    items: [
      { label: "Recovery Plans", to: "/recovery", icon: <RefreshCw className="w-4 h-4" /> },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Activity", to: "/activity", icon: <Activity className="w-4 h-4" /> },
      { label: "Settings", to: "/settings", icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

function NavItemLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = item.exact
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(item.to + "/");

  return (
    <Link
      href={item.to}
      onClick={onNavigate}
      className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors group ${
        isActive
          ? "bg-[#EEF2FF] text-[#3157D5]"
          : "text-[#667085] hover:bg-[#F1F3F5] hover:text-[#111827]"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#3157D5] rounded-r-full" />
      )}
      <span className={isActive ? "text-[#3157D5]" : "text-[#98A2B3] group-hover:text-[#667085]"}>
        {item.icon}
      </span>
      {item.label}
    </Link>
  );
}

function ChainPilotLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="14" r="4" fill="#3157D5" />
      <circle cx="14" cy="8" r="3.5" fill="#3157D5" fillOpacity="0.7" />
      <circle cx="22" cy="14" r="4" fill="#3157D5" />
      <line x1="10" y1="14" x2="18" y2="14" stroke="#3157D5" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="10.5" x2="14" y2="8" stroke="#3157D5" strokeWidth="1.5" strokeOpacity="0.7" strokeLinecap="round" />
      <line x1="14" y1="8" x2="18" y2="10.5" stroke="#3157D5" strokeWidth="1.5" strokeOpacity="0.7" strokeLinecap="round" />
    </svg>
  );
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onMobileClose} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-60 flex flex-col bg-white border-r border-[#E5E7EB] transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[#E5E7EB] shrink-0">
          <ChainPilotLogo />
          <div>
            <div className="text-[14px] font-bold text-[#111827] leading-tight tracking-tight">ChainPilot</div>
            <div className="text-[11px] text-[#98A2B3] leading-tight">Control Tower</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              {group.label && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold text-[#98A2B3] uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavItemLink item={item} onNavigate={onMobileClose} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-2 text-[12px] text-[#667085]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            <span>Connected</span>
          </div>
        </div>
      </aside>
    </>
  );
}
