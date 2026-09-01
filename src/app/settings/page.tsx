import { TopHeader } from "@/components/layout/TopHeader";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E5E7EB]">
        <h3 className="text-[13px] font-semibold text-[#111827]">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function SettingsRow({ label, description, children }: { label: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[13px] font-medium text-[#111827]">{label}</p>
        {description && <p className="text-[12px] text-[#667085] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <TopHeader
        title="Settings"
        subtitle="System"
        breadcrumbs={[{ label: "System" }, { label: "Settings" }]}
      />
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 max-w-2xl">
        <SettingsSection title="Organization">
          <SettingsRow label="Organization Name" description="Your company name">
            <input className="border border-[#E5E7EB] rounded-lg px-3 h-8 text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3157D5] bg-white w-48" defaultValue="ACME Logistics" />
          </SettingsRow>
          <SettingsRow label="Timezone" description="Used for all timestamps">
            <select className="border border-[#E5E7EB] rounded-lg px-3 h-8 text-[13px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3157D5] bg-white">
              <option>UTC+4 (Dubai)</option>
              <option>UTC+0</option>
              <option>UTC-5</option>
            </select>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Notifications">
          {[
            { label: "Critical Disruption Alerts", description: "Get notified immediately for high-severity disruptions" },
            { label: "Recovery Plan Ready", description: "Notify when ChainPilot has a recommendation ready" },
            { label: "Execution Completed", description: "Confirm when recovery actions are executed" },
          ].map((item) => (
            <SettingsRow key={item.label} label={item.label} description={item.description}>
              <button className="w-10 h-5 rounded-full bg-[#3157D5] relative transition-colors" aria-checked="true" role="switch">
                <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </SettingsRow>
          ))}
        </SettingsSection>

        <SettingsSection title="Agent Preferences">
          <SettingsRow label="Auto-Investigation" description="Automatically start investigation on new disruptions">
            <button className="w-10 h-5 rounded-full bg-[#E5E7EB] relative transition-colors" aria-checked="false" role="switch">
              <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
            </button>
          </SettingsRow>
          <SettingsRow label="Demo Mode" description="Use scripted responses for demonstrations">
            <button className="w-10 h-5 rounded-full bg-[#3157D5] relative transition-colors" aria-checked="true" role="switch">
              <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
            </button>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="System Status">
          {[
            { label: "ChainPilot Agent", status: "Operational" },
            { label: "WebMCP Bridge", status: "Operational" },
            { label: "Supply Chain Data Feed", status: "Operational" },
            { label: "Notification Service", status: "Operational" },
          ].map((item) => (
            <SettingsRow key={item.label} label={item.label}>
              <Badge variant="success" dot>{item.status}</Badge>
            </SettingsRow>
          ))}
        </SettingsSection>

        <SettingsSection title="About ChainPilot">
          <SettingsRow label="Version" description="Current build"><span className="text-[13px] font-mono text-[#667085]">1.0.0-demo</span></SettingsRow>
          <SettingsRow label="WebMCP" description="Protocol version"><span className="text-[13px] font-mono text-[#667085]">v2.0</span></SettingsRow>
          <div className="pt-2">
            <p className="text-[12px] text-[#98A2B3] leading-relaxed">
              ChainPilot is a WebMCP-powered AI supply chain control tower. Investigate disruptions, simulate recoveries, and coordinate human-approved execution — all in one interface.
            </p>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
