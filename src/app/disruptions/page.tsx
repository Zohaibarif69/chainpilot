"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSessionReady } from "@/lib/useSessionReady";
import { AlertTriangle, ArrowRight, Loader } from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { formatCurrency } from "@/utils/format";
import { dataApi, type DisruptionSummary } from "@/mcp/client";

export default function DisruptionsPage() {
  const sessionReady = useSessionReady();
  const router = useRouter();
  const [disruptions, setDisruptions] = useState<DisruptionSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      setDisruptions(await dataApi.getDisruptions());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load disruptions. Is the backend running?");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    load();
  }, [load, sessionReady]);

  const activeCount = disruptions.filter((d) => d.status === "delayed" || d.status === "at_risk").length;

  return (
    <div className="flex flex-col h-full">
      <TopHeader
        title="Disruptions"
        subtitle="Operations"
        breadcrumbs={[{ label: "Operations" }, { label: "Disruptions" }]}
      />
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#111827]">Disruptions</h2>
          <span className="text-[13px] text-[#667085]">{activeCount} active</span>
        </div>
        <p className="text-[13px] text-[#98A2B3]">Pick a disruption to investigate — each one runs the same real WebMCP tools against its own live data.</p>

        {loadError && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-[#E5E7EB] rounded-xl">
            <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
            <p className="text-[13px] text-[#667085] text-center">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={load}>Retry</Button>
          </div>
        )}

        {!loadError && !loaded && (
          <div className="flex items-center justify-center gap-2 p-10">
            <Loader className="w-4 h-4 animate-spin text-[#2563EB]" />
            <span className="text-[13px] text-[#667085]">Loading real disruption data…</span>
          </div>
        )}

        {!loadError && loaded && disruptions.length === 0 && (
          <div className="text-center py-12 text-[13px] text-[#98A2B3] bg-white border border-[#E5E7EB] rounded-xl">
            No disruptions right now — all shipments are on schedule.
          </div>
        )}

        {!loadError && disruptions.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA]">
                    {["Shipment", "Route", "Severity", "Status", "Delay", "Orders at Risk", "Revenue", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold text-[#667085] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {disruptions.map((d) => {
                    const isActive = d.status === "delayed" || d.status === "at_risk";
                    return (
                      <tr key={d.shipmentId} className="border-b border-[#F1F3F5] hover:bg-[#F7F8FA] cursor-pointer" onClick={() => router.push(`/disruptions/${d.shipmentId}`)}>
                        <td className="px-5 py-3 font-mono text-[12px] font-medium text-[#3157D5]">{d.shipmentId}</td>
                        <td className="px-5 py-3 text-[#111827]">{d.origin} → {d.destination}</td>
                        <td className="px-5 py-3">
                          <Badge variant={isActive ? "critical" : "success"}>{isActive ? "HIGH" : "RESOLVED"}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#DC2626] pulse-dot" : "bg-[#15803D]"}`} />
                            <Badge variant={isActive ? "warning" : "success"}>{d.status.replace("_", " ").toUpperCase()}</Badge>
                          </div>
                        </td>
                        <td className={`px-5 py-3 font-medium ${isActive ? "text-[#D97706]" : "text-[#15803D]"}`}>
                          {d.delayDays === 0 ? "On time" : `+${d.delayDays} days`}
                        </td>
                        <td className="px-5 py-3 tabular-nums">{d.ordersAtRisk}{d.criticalOrders > 0 ? ` (${d.criticalOrders} critical)` : ""}</td>
                        <td className="px-5 py-3 tabular-nums font-medium">{formatCurrency(d.revenueAtRisk, true)}</td>
                        <td className="px-5 py-3">
                          <Button variant="ghost" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />} onClick={(e) => { e.stopPropagation(); router.push(`/disruptions/${d.shipmentId}`); }}>
                            {isActive ? "Investigate" : "View"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
