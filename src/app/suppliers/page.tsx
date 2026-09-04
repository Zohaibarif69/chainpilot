"use client";

import { useState, useEffect, useCallback } from "react";
import { useSessionReady } from "@/lib/useSessionReady";
import { AlertTriangle, Loader } from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { dataApi, type SupplierRow } from "@/mcp/client";
import { formatPercent } from "@/utils/format";

function supplierStatusVariant(status: string) {
  if (status === "active") return "success" as const;
  if (status === "at_risk") return "warning" as const;
  return "neutral" as const;
}

function ReliabilityBar({ value }: { value: number }) {
  const color = value >= 90 ? "#15803D" : value >= 80 ? "#D97706" : "#DC2626";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-[13px] font-medium tabular-nums" style={{ color }}>{formatPercent(value)}</span>
    </div>
  );
}

export default function SuppliersPage() {
  const sessionReady = useSessionReady();
  const [rows, setRows] = useState<SupplierRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      setRows(await dataApi.getSuppliers());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load suppliers.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    load();
  }, [load, sessionReady]);

  return (
    <div className="flex flex-col h-full">
      <TopHeader
        title="Suppliers"
        subtitle="Operations"
        breadcrumbs={[{ label: "Operations" }, { label: "Suppliers" }]}
      />
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
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
            <span className="text-[13px] text-[#667085]">Loading real suppliers…</span>
          </div>
        )}

        {!loadError && loaded && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA]">
                    {["Supplier", "Location", "Reliability", "Lead Time", "Active Orders", "Status"].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold text-[#667085] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-b border-[#F1F3F5] hover:bg-[#F7F8FA]">
                      <td className="px-5 py-3">
                        <div className="font-medium text-[#111827]">{s.name}</div>
                        <div className="text-[11px] font-mono text-[#98A2B3]">{s.id}</div>
                      </td>
                      <td className="px-5 py-3 text-[#667085]">{s.location}</td>
                      <td className="px-5 py-3"><ReliabilityBar value={s.reliability} /></td>
                      <td className="px-5 py-3 text-[#667085]">{s.leadTimeDays} days</td>
                      <td className="px-5 py-3 tabular-nums">{s.activeOrders}</td>
                      <td className="px-5 py-3"><Badge variant={supplierStatusVariant(s.status)}>{s.status.replace("_", " ").toUpperCase()}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
