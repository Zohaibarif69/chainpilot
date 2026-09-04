"use client";

import { useState } from "react";
import { TopHeader } from "@/components/layout/TopHeader";
import { Badge } from "@/components/shared/Badge";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#E5E7EB] bg-[#FAFAFA]">
        <h3 className="text-[13px] font-semibold text-[#111827]">{title}</h3>
      </div>
      <div className="divide-y divide-[#F1F3F5]">{children}</div>
    </div>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#111827]">{label}</p>
        {description && <p className="text-[12px] text-[#667085] mt-0.5 leading-snug">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={`w-10 h-5 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#3157D5] focus:ring-offset-1 ${
        on ? "bg-[#3157D5]" : "bg-[#D1D5DB]"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
          on ? "right-0.5" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    critical: true,
    planReady: true,
    execDone: true,
  });
  const [prefs, setPrefs] = useState({
    autoInvestigate: false,
    demoMode: true,
  });

  return (
    <div className="flex flex-col h-full">
      <TopHeader
        title="Settings"
        subtitle="System"
        breadcrumbs={[{ label: "System" }, { label: "Settings" }]}
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        {/* Two-column grid on wide screens, single column on narrow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          {/* LEFT column */}
          <div className="space-y-4">

            <SettingsSection title="Organization">
              <SettingsRow label="Organization Name" description="Your company name">
                <input
                  className="border border-[#E5E7EB] rounded-lg px-3 h-8 text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3157D5] bg-white w-44"
                  defaultValue="ACME Logistics"
                />
              </SettingsRow>
              <SettingsRow label="Timezone" description="Used for all timestamps">
                <select className="border border-[#E5E7EB] rounded-lg px-3 h-8 text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3157D5] bg-white">
                  <option>UTC+4 (Dubai)</option>
                  <option>UTC+0</option>
                  <option>UTC-5 (New York)</option>
                  <option>UTC+8 (Singapore)</option>
                </select>
              </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Notifications">
              <SettingsRow
                label="Critical Disruption Alerts"
                description="Get notified immediately for high-severity disruptions"
              >
                <Toggle on={notifications.critical} onChange={(v) => setNotifications((n) => ({ ...n, critical: v }))} />
              </SettingsRow>
              <SettingsRow
                label="Recovery Plan Ready"
                description="Notify when ChainPilot has a recommendation ready"
              >
                <Toggle on={notifications.planReady} onChange={(v) => setNotifications((n) => ({ ...n, planReady: v }))} />
              </SettingsRow>
              <SettingsRow
                label="Execution Completed"
                description="Confirm when recovery actions are executed"
              >
                <Toggle on={notifications.execDone} onChange={(v) => setNotifications((n) => ({ ...n, execDone: v }))} />
              </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Agent Preferences">
              <SettingsRow
                label="Auto-Investigation"
                description="Automatically start investigation on new disruptions"
              >
                <Toggle on={prefs.autoInvestigate} onChange={(v) => setPrefs((p) => ({ ...p, autoInvestigate: v }))} />
              </SettingsRow>
              <SettingsRow
                label="Demo Mode"
                description="Use scripted responses for demonstrations"
              >
                <Toggle on={prefs.demoMode} onChange={(v) => setPrefs((p) => ({ ...p, demoMode: v }))} />
              </SettingsRow>
            </SettingsSection>

          </div>

          {/* RIGHT column */}
          <div className="space-y-4">

            <SettingsSection title="System Status">
              {[
                { label: "ChainPilot Agent", desc: "AI recovery engine" },
                { label: "WebMCP Bridge", desc: "Tool call protocol" },
                { label: "Supply Chain Data Feed", desc: "Live shipment data" },
                { label: "Notification Service", desc: "Alert delivery" },
              ].map((item) => (
                <SettingsRow key={item.label} label={item.label} description={item.desc}>
                  <Badge variant="success" dot>Operational</Badge>
                </SettingsRow>
              ))}
            </SettingsSection>

            <SettingsSection title="About ChainPilot">
              <SettingsRow label="Version" description="Current build">
                <span className="text-[13px] font-mono text-[#667085]">1.0.0-demo</span>
              </SettingsRow>
              <SettingsRow label="WebMCP" description="Protocol version">
                <span className="text-[13px] font-mono text-[#667085]">v2.0</span>
              </SettingsRow>
              <div className="px-5 py-4">
                <p className="text-[12px] text-[#98A2B3] leading-relaxed">
                  ChainPilot is a WebMCP-powered AI supply chain control tower. Investigate
                  disruptions, simulate recoveries, and coordinate human-approved execution —
                  all in one interface. Each session is fully isolated so your actions never
                  affect other users.
                </p>
              </div>
            </SettingsSection>

          </div>
        </div>
      </div>
    </div>
  );
}
