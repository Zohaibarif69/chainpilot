"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSessionReady } from "@/lib/useSessionReady";
import { ArrowRight, AlertTriangle, Loader } from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { Badge, planStatusVariant, riskVariant } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { formatCurrency } from "@/utils/format";
import { dataApi, type RecoveryPlanSummary } from "@/mcp/client";

export default function RecoveryPlansPage() {
  const sessionReady = useSessionReady();
  const router = useRouter();
  const [plans, setPlans] = useState<RecoveryPlanSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const real = await dataApi.getRecoveryPlans();
      setPlans(real);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load recovery plans. Is the backend running?");
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
        title="Recovery Plans"
        subtitle="Recovery"
        breadcrumbs={[{ label: "Recovery" }, { label: "Recovery Plans" }]}
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
            <span className="text-[13px] text-[#667085]">Loading real recovery plans…</span>
          </div>
        )}

        {!loadError && loaded && plans.length === 0 && (
          <div className="text-center py-12 text-[13px] text-[#98A2B3] bg-white border border-[#E5E7EB] rounded-xl">
            No recovery plans yet. Plans appear here once ChainPilot simulates recovery options for a disruption —{" "}
            <button className="text-[#3157D5] font-medium hover:underline" onClick={() => router.push("/disruptions/SHP-482")}>
              investigate Shipment #482
            </button>{" "}
            to create some.
          </div>
        )}

        {!loadError && plans.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA]">
                    {["Plan", "Shipment", "Strategy", "Cost", "Recovery", "Risk", "Score", "Status", "Created", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold text-[#667085] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="border-b border-[#F1F3F5] hover:bg-[#F7F8FA]">
                      <td className="px-5 py-3 font-mono text-[12px] font-medium text-[#3157D5]">{plan.id}</td>
                      <td className="px-5 py-3 font-mono text-[12px] text-[#667085]">{plan.shipmentId}</td>
                      <td className="px-5 py-3 text-[#111827]">{plan.strategy}</td>
                      <td className="px-5 py-3 tabular-nums">{formatCurrency(plan.additionalCost)}</td>
                      <td className="px-5 py-3 text-[#667085]">{plan.recoveryDays} days</td>
                      <td className="px-5 py-3"><Badge variant={riskVariant(plan.riskLevel)}>{plan.riskLevel.toUpperCase()}</Badge></td>
                      <td className="px-5 py-3 tabular-nums font-medium">{plan.score}/100</td>
                      <td className="px-5 py-3"><Badge variant={planStatusVariant(plan.status)}>{plan.status.replace("_", " ").toUpperCase()}</Badge></td>
                      <td className="px-5 py-3 text-[#667085]">{new Date(plan.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-5 py-3">
                        <Button variant="ghost" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />} onClick={() => router.push(`/recovery/${plan.shipmentId}`)}>
                          View
                        </Button>
                      </td>
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
