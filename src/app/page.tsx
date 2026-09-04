"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Package, DollarSign, Truck, ArrowRight, CheckCircle, Zap, Activity, Loader } from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { formatCurrency, formatNumber } from "@/utils/format";
import { tools, dataApi, type ShipmentImpactResult, type AffectedWarehouse, type ActivityEntry, type DisruptionSummary } from "@/mcp/client";

function KpiCard({
  label,
  value,
  sub,
  subVariant = "neutral",
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  subVariant?: "critical" | "warning" | "success" | "neutral";
  icon: React.ReactNode;
}) {
  const subColors = {
    critical: "text-[#DC2626]",
    warning: "text-[#D97706]",
    success: "text-[#15803D]",
    neutral: "text-[#667085]",
  };
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">{label}</p>
        <div className="text-[#98A2B3]">{icon}</div>
      </div>
      <p className="text-[32px] font-bold text-[#111827] leading-none mb-1.5">{value}</p>
      <p className={`text-[12px] font-medium ${subColors[subVariant]}`}>{sub}</p>
    </div>
  );
}

function ActiveDisruptionCard({
  shipment,
  otherActiveCount,
  onInvestigate,
  onViewAll,
}: {
  shipment: ShipmentImpactResult;
  otherActiveCount: number;
  onInvestigate: () => void;
  onViewAll: () => void;
}) {
  const isActive = shipment.status === "delayed" || shipment.status === "at_risk";
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB] bg-[#FEF2F2]">
        <span className="text-[11px] font-semibold text-[#98A2B3] uppercase tracking-wider">
          {otherActiveCount > 0 ? "Most Severe Active Disruption" : "Active Disruption"}
        </span>
        <Badge variant="critical" dot>HIGH SEVERITY</Badge>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[18px] font-bold text-[#111827]">Shipment #{shipment.shipmentId.replace("SHP-", "")}</h2>
              <Badge variant="warning">{shipment.status.replace("_", " ").toUpperCase()}</Badge>
            </div>
            <p className="text-[13px] text-[#667085] mb-4">
              {shipment.origin} → {shipment.destination} · Supplier shipment delayed by {shipment.delayDays} days
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Units at Risk", value: formatNumber(shipment.unitsAtRisk) },
                { label: "Warehouses Affected", value: String(shipment.affectedWarehouses) },
                { label: "Orders at Risk", value: String(shipment.ordersAtRisk) },
                { label: "Revenue Exposure", value: formatCurrency(shipment.revenueAtRisk, true) },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-[22px] font-bold text-[#111827]">{m.value}</p>
                  <p className="text-[11px] text-[#667085] mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-[#E5E7EB] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full pulse-dot ${isActive ? "bg-[#DC2626]" : "bg-[#15803D]"}`} />
            <span className={`text-[12px] font-medium ${isActive ? "text-[#DC2626]" : "text-[#15803D]"}`}>
              {isActive ? "ACTIVE" : "RECOVERED"}
            </span>
            <span className="text-[12px] text-[#98A2B3]">· {isActive ? "Requires immediate attention" : "No action needed"}</span>
          </div>
          <div className="flex items-center gap-2">
            {otherActiveCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onViewAll}>
                +{otherActiveCount} more disruption{otherActiveCount === 1 ? "" : "s"}
              </Button>
            )}
            <Button variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />} onClick={onInvestigate}>
              Investigate Disruption
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImpactFlowPreview({ shipment, warehouses }: { shipment: ShipmentImpactResult; warehouses: AffectedWarehouse[] }) {
  const steps = [
    { label: `Shipment #${shipment.shipmentId.replace("SHP-", "")}`, sub: `${shipment.origin} → ${shipment.destination}`, color: "text-[#DC2626]" },
    { label: `${formatNumber(shipment.unitsAtRisk)} Units`, sub: "at risk", color: "text-[#D97706]" },
    { label: `${warehouses.length} Warehouse${warehouses.length === 1 ? "" : "s"}`, sub: warehouses.map((w) => w.id).join(" · "), color: "text-[#D97706]" },
    { label: `${shipment.ordersAtRisk} Orders`, sub: `${shipment.criticalOrders} critical`, color: "text-[#DC2626]" },
    { label: `${formatCurrency(shipment.revenueAtRisk, true)} Revenue`, sub: "exposure", color: "text-[#DC2626]" },
  ];
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
      <p className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-4">Impact Chain</p>
      <div className="flex flex-col items-start gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex flex-col items-start">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#E5E7EB] border-2 border-current" style={{ color: step.color.replace("text-[", "").replace("]", "") }} />
              <div>
                <span className={`text-[13px] font-semibold ${step.color}`}>{step.label}</span>
                <span className="text-[11px] text-[#98A2B3] ml-2">{step.sub}</span>
              </div>
            </div>
            {i < steps.length - 1 && <div className="w-px h-4 bg-[#E5E7EB] ml-[3.5px] my-0.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function activityIcon(message: string) {
  if (message.includes("verified")) return <CheckCircle className="w-3.5 h-3.5 text-[#15803D]" />;
  if (message.includes("executed")) return <Zap className="w-3.5 h-3.5 text-[#2563EB]" />;
  if (message.includes("approved") || message.includes("rejected")) return <CheckCircle className="w-3.5 h-3.5 text-[#3157D5]" />;
  if (message.includes("marked delayed") || message.includes("marked at risk")) return <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />;
  return <Activity className="w-3.5 h-3.5 text-[#667085]" />;
}

function RecentActivity({ items }: { items: ActivityEntry[] }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
      <p className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-4">Recent Activity</p>
      {items.length === 0 ? (
        <p className="text-[13px] text-[#98A2B3]">No activity yet — start an investigation to see real tool calls appear here.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-center">
                {activityIcon(item.message)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#111827] leading-snug">{item.message}</p>
              </div>
              <span className="text-[11px] text-[#98A2B3] shrink-0 tabular-nums font-mono">
                {new Date(item.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [disruptions, setDisruptions] = useState<DisruptionSummary[]>([]);
  const [featured, setFeatured] = useState<ShipmentImpactResult | null>(null);
  const [warehouses, setWarehouses] = useState<AffectedWarehouse[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const list = await dataApi.getDisruptions();
      setDisruptions(list);

      const active = list.filter((d) => d.status === "delayed" || d.status === "at_risk");
      const featuredId = (active[0] ?? list[0])?.shipmentId;

      if (featuredId) {
        const [impact, whs, acts] = await Promise.all([
          tools.get_shipment_impact({ shipmentId: featuredId }),
          dataApi.getAffectedWarehouses(featuredId),
          dataApi.getActivity(6),
        ]);
        setFeatured(impact);
        setWarehouses(whs);
        setActivity(acts);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load dashboard data. Is the backend running?");
    }
  }, []);

  useEffect(() => {
    // Wait for the session cookie to be set before making any API calls.
    // providers.tsx fires "session:ready" once /api/session completes.
    // If the cookie is already present (e.g. on refresh), load immediately.
    const alreadyReady = document.cookie.includes("cp_session");
    if (alreadyReady) {
      load();
      return;
    }
    const onReady = () => load();
    window.addEventListener("session:ready", onReady, { once: true });
    return () => window.removeEventListener("session:ready", onReady);
  }, [load]);

  if (loadError) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 p-6">
        <AlertTriangle className="w-8 h-8 text-[#DC2626]" />
        <p className="text-[14px] font-semibold text-[#111827]">Couldn't reach the ChainPilot backend</p>
        <p className="text-[13px] text-[#667085] text-center max-w-md">{loadError}</p>
        <Button variant="secondary" size="sm" onClick={load}>Retry</Button>
      </div>
    );
  }

  if (!featured) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-2">
        <Loader className="w-5 h-5 animate-spin text-[#2563EB]" />
        <p className="text-[13px] text-[#667085]">Loading real data…</p>
      </div>
    );
  }

  const activeDisruptions = disruptions.filter((d) => d.status === "delayed" || d.status === "at_risk");
  const totalOrdersAtRisk = activeDisruptions.reduce((sum, d) => sum + d.ordersAtRisk, 0);
  const totalRevenueAtRisk = activeDisruptions.reduce((sum, d) => sum + d.revenueAtRisk, 0);
  const totalCritical = activeDisruptions.reduce((sum, d) => sum + d.criticalOrders, 0);

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Overview" subtitle="Supply Chain Control Tower" breadcrumbs={[{ label: "Overview" }]} />
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Supply Chain Control Tower</h2>
            <p className="text-[13px] text-[#667085] mt-0.5">Monitor disruptions, assess operational risk, and coordinate recovery.</p>
          </div>
          <Button variant="primary" size="md" icon={<AlertTriangle className="w-4 h-4" />} onClick={() => router.push(`/disruptions/${featured.shipmentId}`)}>
            Investigate Shipment #{featured.shipmentId.replace("SHP-", "")}
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Active Disruptions" value={String(activeDisruptions.length)} sub={activeDisruptions.length > 0 ? "Requires attention" : "All clear"} subVariant={activeDisruptions.length > 0 ? "critical" : "success"} icon={<AlertTriangle className="w-4 h-4" />} />
          <KpiCard label="Orders at Risk (total)" value={String(totalOrdersAtRisk)} sub={`${totalCritical} critical`} subVariant={totalOrdersAtRisk > 0 ? "critical" : "success"} icon={<Package className="w-4 h-4" />} />
          <KpiCard label="Revenue Exposure (total)" value={formatCurrency(totalRevenueAtRisk, true)} sub={`Across ${activeDisruptions.length} disruption${activeDisruptions.length === 1 ? "" : "s"}`} subVariant="warning" icon={<DollarSign className="w-4 h-4" />} />
          <KpiCard label="Shipments Delayed" value={String(activeDisruptions.length)} sub={activeDisruptions.length > 0 ? `up to +${Math.max(...activeDisruptions.map((d) => d.delayDays))} days` : "On schedule"} subVariant={activeDisruptions.length > 0 ? "warning" : "success"} icon={<Truck className="w-4 h-4" />} />
        </div>

        <ActiveDisruptionCard
          shipment={featured}
          otherActiveCount={Math.max(0, activeDisruptions.length - 1)}
          onInvestigate={() => router.push(`/disruptions/${featured.shipmentId}`)}
          onViewAll={() => router.push("/disruptions")}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ImpactFlowPreview shipment={featured} warehouses={warehouses} />
          <RecentActivity items={activity} />
        </div>
      </div>
    </div>
  );
}
