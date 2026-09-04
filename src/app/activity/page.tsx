"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, User, Cpu, Loader, AlertTriangle, RefreshCw } from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { dataApi, type ActivityEntry } from "@/mcp/client";

function typeIcon(message: string) {
  const m = message.toLowerCase();
  if (m.includes("human") || m.includes("approved") || m.includes("rejected")) {
    return <User className="w-3.5 h-3.5 text-[#15803D]" />;
  }
  if (
    m.includes("simulated") ||
    m.includes("identified") ||
    m.includes("verified") ||
    m.includes("executed") ||
    m.includes("recovery options") ||
    m.includes("chainpilot") ||
    m.includes("plan")
  ) {
    return <Cpu className="w-3.5 h-3.5 text-[#3157D5]" />;
  }
  return <Activity className="w-3.5 h-3.5 text-[#667085]" />;
}

function typeBadge(message: string) {
  const m = message.toLowerCase();
  if (m.includes("human") || m.includes("approved") || m.includes("rejected")) {
    return <Badge variant="success" size="sm">Human</Badge>;
  }
  if (
    m.includes("simulated") ||
    m.includes("identified") ||
    m.includes("verified") ||
    m.includes("executed") ||
    m.includes("recovery options") ||
    m.includes("plan")
  ) {
    return <Badge variant="primary" size="sm">AI</Badge>;
  }
  return <Badge variant="neutral" size="sm">System</Badge>;
}

function iconBg(message: string) {
  const m = message.toLowerCase();
  if (m.includes("human") || m.includes("approved") || m.includes("rejected")) {
    return "bg-[#F0FDF4] border-[#BBF7D0]";
  }
  if (
    m.includes("simulated") ||
    m.includes("identified") ||
    m.includes("verified") ||
    m.includes("executed") ||
    m.includes("recovery options") ||
    m.includes("plan")
  ) {
    return "bg-[#EEF2FF] border-[#C7D2FE]";
  }
  return "bg-[#F7F8FA] border-[#E5E7EB]";
}

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// Group entries by date label
function groupByDate(entries: ActivityEntry[]): { label: string; entries: ActivityEntry[] }[] {
  const groups: Map<string, ActivityEntry[]> = new Map();
  for (const e of entries) {
    const label = formatDate(e.at);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(e);
  }
  return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }));
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadError(null);
      setRefreshing(true);
      const data = await dataApi.getActivity(30);
      setEntries(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load activity log.");
    } finally {
      setLoaded(true);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = groupByDate(entries);

  return (
    <div className="flex flex-col h-full">
      <TopHeader
        title="Activity"
        subtitle="System · Audit Log"
        breadcrumbs={[{ label: "System" }, { label: "Activity" }]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => load(true)}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">

        {/* Error state */}
        {loadError && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <AlertTriangle className="w-7 h-7 text-[#DC2626]" />
            <p className="text-[14px] font-semibold text-[#111827]">Couldn't load activity log</p>
            <p className="text-[13px] text-[#667085] text-center max-w-sm">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={() => load()}>Retry</Button>
          </div>
        )}

        {/* Loading skeleton */}
        {!loaded && !loadError && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E7EB] bg-[#F7F8FA]">
              <div className="skeleton h-3 w-12 rounded" />
            </div>
            <div className="divide-y divide-[#F1F3F5]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4">
                  <div className="skeleton h-3 w-10 rounded mt-1" />
                  <div className="skeleton w-7 h-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-48 rounded" />
                    <div className="skeleton h-2.5 w-72 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {loaded && !loadError && entries.length === 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl flex flex-col items-center justify-center py-16 gap-3">
            <Activity className="w-8 h-8 text-[#E5E7EB]" />
            <p className="text-[14px] font-semibold text-[#111827]">No activity yet</p>
            <p className="text-[13px] text-[#667085]">Start an investigation to see real-time events here.</p>
          </div>
        )}

        {/* Live entries grouped by date */}
        {loaded && !loadError && entries.length > 0 && (
          <div className="space-y-5 max-w-2xl">
            {groups.map(({ label, entries: group }) => (
              <div key={label}>
                {/* Date group header */}
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-[11px] font-semibold text-[#98A2B3] uppercase tracking-wider">{label}</p>
                  <div className="flex-1 h-px bg-[#E5E7EB]" />
                </div>

                {/* Card wrapping each group — matches other pages */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                  {group.map((entry, i) => (
                    <div
                      key={entry.id}
                      className={`flex items-start gap-4 px-5 py-4 animate-fade-in ${
                        i < group.length - 1 ? "border-b border-[#F1F3F5]" : ""
                      } hover:bg-[#FAFAFA] transition-colors`}
                    >
                      {/* Time */}
                      <span className="text-[11px] text-[#98A2B3] tabular-nums font-mono w-12 shrink-0 pt-0.5">
                        {formatTime(entry.at)}
                      </span>

                      {/* Icon */}
                      <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${iconBg(entry.message)}`}>
                        {typeIcon(entry.message)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-[13px] font-medium text-[#111827] leading-snug">
                            {entry.message}
                          </p>
                          {typeBadge(entry.message)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Footer note */}
            <p className="text-[11px] text-[#98A2B3] text-center pb-2">
              Showing last {entries.length} events · Live from your session
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
