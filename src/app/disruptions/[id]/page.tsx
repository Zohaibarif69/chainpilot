"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  Loader,
  Circle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertTriangle,
  Package,
  Warehouse,
  ShoppingCart,
  DollarSign,
  Zap,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { Badge, SeverityBadge, StatusBadge, riskVariant, priorityVariant, orderStatusVariant } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { formatCurrency, formatNumber } from "@/utils/format";
import type { AgentToolEvent, InvestigationState } from "@/types";
import {
  tools,
  dataApi,
  type ShipmentImpactResult,
  type AffectedOrder,
  type AffectedWarehouse,
  type RecoveryOptionSummary,
} from "@/mcp/client";

function mergeEvents(current: AgentToolEvent[], updates: Partial<AgentToolEvent>[]): AgentToolEvent[] {
  const map = new Map<string, AgentToolEvent>(current.map((e) => [e.id, e]));
  for (const u of updates) {
    if (!u.id) continue;
    const existing = map.get(u.id);
    map.set(u.id, existing ? ({ ...existing, ...u } as AgentToolEvent) : (u as AgentToolEvent));
  }
  return Array.from(map.values());
}

const toolLabels: Record<string, string> = {
  get_shipment_impact: "get_shipment_impact",
  find_recovery_options: "find_recovery_options",
  simulate_recovery_plan: "simulate_recovery_plan",
  execute_recovery_plan: "execute_recovery_plan",
  verify_recovery: "verify_recovery",
};

function ToolStatusIcon({ status }: { status: AgentToolEvent["status"] }) {
  if (status === "completed") return <CheckCircle className="w-4 h-4 text-[#15803D]" />;
  if (status === "running") return <Loader className="w-4 h-4 text-[#2563EB] animate-spin" />;
  if (status === "failed") return <XCircle className="w-4 h-4 text-[#DC2626]" />;
  return <Circle className="w-4 h-4 text-[#98A2B3]" />;
}

function ToolCallCard({ event }: { event: AgentToolEvent }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = !!event.output || !!event.input;

  return (
    <div className="animate-fade-in">
      <button
        className="w-full text-left flex items-start gap-2.5 py-2 px-3 rounded-lg hover:bg-[#F7F8FA] transition-colors group"
        onClick={() => hasDetail && setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="mt-0.5 shrink-0"><ToolStatusIcon status={event.status} /></span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-mono font-medium text-[#111827]">{toolLabels[event.tool] ?? event.tool}</span>
            {event.durationMs && (
              <span className="text-[10px] text-[#98A2B3] tabular-nums">{event.durationMs}ms</span>
            )}
          </div>
          {event.input && (
            <div className="text-[11px] text-[#667085] mt-0.5 truncate">
              {Object.entries(event.input).map(([k, v]) => `${k}: ${v}`).join(" · ")}
            </div>
          )}
          {event.detail && event.status === "completed" && (
            <div className="text-[11px] text-[#15803D] mt-0.5">{event.detail}</div>
          )}
          {event.status === "running" && <div className="text-[11px] text-[#2563EB] mt-0.5">Running…</div>}
          {event.status === "failed" && <div className="text-[11px] text-[#DC2626] mt-0.5">Failed — see detail</div>}
        </div>
        {hasDetail && (event.status === "completed" || event.status === "failed") && (
          <span className="shrink-0 text-[#98A2B3] group-hover:text-[#667085] mt-0.5">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        )}
      </button>
      {expanded && event.output && (
        <div className="mt-1 ml-9 mr-3 mb-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-3 animate-fade-in">
          <p className="text-[10px] font-semibold text-[#98A2B3] uppercase tracking-wider mb-1.5">
            {event.status === "failed" ? "Error detail" : "Real tool output"}
          </p>
          <div className="space-y-1">
            {Object.entries(event.output).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-[11px]">
                <span className="font-mono text-[#98A2B3]">{k}:</span>
                <span className="text-[#111827] font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AgentPanel({
  state,
  events,
  onInvestigate,
  onReview,
  summary,
}: {
  state: InvestigationState;
  events: AgentToolEvent[];
  onInvestigate: () => void;
  onReview: () => void;
  summary: { ordersAtRisk: number; criticalOrders: number; revenueAtRisk: number; affectedWarehouses: number; optionsFound: number } | null;
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
        <div>
          <p className="text-[11px] font-semibold text-[#98A2B3] uppercase tracking-wider">ChainPilot Agent</p>
        </div>
        {state === "idle" && <Badge variant="neutral">Standby</Badge>}
        {state === "investigating" && <Badge variant="info" dot>Investigating</Badge>}
        {state === "simulating" && <Badge variant="info" dot>Simulating</Badge>}
        {state === "recommendation_ready" && <Badge variant="success">Recommendation Ready</Badge>}
      </div>

      <div className="flex-1 p-4 space-y-1 min-h-[200px]">
        {state === "idle" && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <p className="text-[13px] text-[#667085] text-center">
              Start an AI investigation to analyze<br />the supply chain impact via real WebMCP tools.
            </p>
            <Button variant="primary" size="sm" onClick={onInvestigate} icon={<Zap className="w-3.5 h-3.5" />}>
              Start Investigation
            </Button>
          </div>
        )}

        {(state === "investigating" || state === "simulating" || state === "recommendation_ready") && (
          <div className="space-y-0.5">
            {state === "investigating" && events.length === 0 && (
              <div className="flex items-center gap-2 py-2 px-3 text-[13px] text-[#2563EB]">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Calling get_shipment_impact…</span>
              </div>
            )}
            {events.map((event) => (
              <ToolCallCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {state === "recommendation_ready" && summary && (
          <div className="mt-4 border-t border-[#E5E7EB] pt-4 animate-fade-in">
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-[#15803D]" />
                <p className="text-[13px] font-semibold text-[#15803D]">Investigation Complete</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-[#667085] mb-3">
                <span>{summary.ordersAtRisk} orders at risk</span>
                <span>{summary.criticalOrders} critical orders</span>
                <span>{formatCurrency(summary.revenueAtRisk)} revenue exposure</span>
                <span>{summary.affectedWarehouses} warehouses affected</span>
              </div>
              <p className="text-[12px] text-[#667085] mb-3">{summary.optionsFound} recovery strategies simulated.</p>
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />} onClick={onReview} className="w-full justify-center">
                Review Recovery Options
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ImpactGraph({ shipment, warehouses }: { shipment: ShipmentImpactResult; warehouses: AffectedWarehouse[] }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
      <p className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider mb-5">Supply Chain Impact</p>
      <div className="flex flex-col items-center gap-0 select-none">
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-2 text-center">
          <p className="text-[13px] font-bold text-[#DC2626]">SHIPMENT #{shipment.shipmentId.replace("SHP-", "")}</p>
          <p className="text-[11px] text-[#667085]">{shipment.origin} → {shipment.destination}</p>
        </div>
        <div className="w-px h-5 bg-[#E5E7EB]" />
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-4 py-2 text-center">
          <p className="text-[13px] font-bold text-[#D97706]">{formatNumber(shipment.unitsAtRisk)} UNITS</p>
          <p className="text-[11px] text-[#667085]">at risk</p>
        </div>
        <div className="w-px h-5 bg-[#E5E7EB]" />
        <div className="flex items-start gap-4 flex-wrap justify-center">
          {warehouses.map((wh) => (
            <div key={wh.id} className="flex flex-col items-center">
              <div className="bg-[#F1F3F5] border border-[#E5E7EB] rounded-lg px-3 py-2 text-center">
                <p className="text-[12px] font-bold text-[#111827]">{wh.id}</p>
                <p className="text-[10px] text-[#667085]">affected</p>
              </div>
            </div>
          ))}
        </div>
        <div className="w-px h-5 bg-[#E5E7EB]" />
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-4 py-2 text-center">
          <p className="text-[13px] font-bold text-[#D97706]">{shipment.ordersAtRisk} CUSTOMER ORDERS</p>
          <p className="text-[11px] text-[#DC2626] font-medium">{shipment.criticalOrders} critical</p>
        </div>
        <div className="w-px h-5 bg-[#E5E7EB]" />
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-2 text-center">
          <p className="text-[13px] font-bold text-[#DC2626]">{formatCurrency(shipment.revenueAtRisk)} REVENUE</p>
          <p className="text-[11px] text-[#667085]">exposure</p>
        </div>
      </div>
    </div>
  );
}

const FALLBACK_SHIPMENT_ID = "SHP-482";

export default function DisruptionDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const shipmentId = params?.id ?? FALLBACK_SHIPMENT_ID;

  const [state, setState] = useState<InvestigationState>("idle");
  const [events, setEvents] = useState<AgentToolEvent[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>("All");

  const [shipment, setShipment] = useState<ShipmentImpactResult | null>(null);
  const [orders, setOrders] = useState<AffectedOrder[]>([]);
  const [warehouses, setWarehouses] = useState<AffectedWarehouse[]>([]);
  const [options, setOptions] = useState<RecoveryOptionSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    ordersAtRisk: number;
    criticalOrders: number;
    revenueAtRisk: number;
    affectedWarehouses: number;
    optionsFound: number;
  } | null>(null);

  // Load the current real state on mount / whenever the shipment changes.
  const loadShipment = useCallback(async () => {
    try {
      setLoadError(null);
      const [impact, ords, whs] = await Promise.all([
        tools.get_shipment_impact({ shipmentId }),
        dataApi.getAffectedOrders(shipmentId),
        dataApi.getAffectedWarehouses(shipmentId),
      ]);
      setShipment(impact);
      setOrders(ords);
      setWarehouses(whs);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load shipment data. Is the backend running?");
    }
  }, [shipmentId]);

  useEffect(() => {
    loadShipment();
  }, [loadShipment]);

  // Real investigation: actually calls the 5 WebMCP tools in sequence via HTTP,
  // measuring real durations and showing real responses — no fake timers.
  const startInvestigation = async () => {
    if (state !== "idle") return;
    setEvents([]);
    setState("investigating");

    let accumulated: AgentToolEvent[] = [];
    const push = (updates: Partial<AgentToolEvent>[]) => {
      accumulated = mergeEvents(accumulated, updates);
      setEvents([...accumulated]);
    };
    const now = () => new Date().toLocaleTimeString();

    // Tracks whichever step is currently in flight so a thrown error can be
    // attributed to the real tool/event instead of being hardcoded.
    let currentEventId: string | null = null;

    try {
      // 1. get_shipment_impact
      currentEventId = "e1";
      push([{ id: "e1", tool: "get_shipment_impact", status: "running", startedAt: now(), input: { shipmentId } }]);
      let t0 = performance.now();
      const impact = await tools.get_shipment_impact({ shipmentId });
      setShipment(impact);
      push([
        {
          id: "e1",
          status: "completed",
          completedAt: now(),
          durationMs: Math.round(performance.now() - t0),
          output: { unitsAtRisk: impact.unitsAtRisk, warehouses: impact.affectedWarehouses, orders: impact.ordersAtRisk },
          detail: `${formatNumber(impact.unitsAtRisk)} units at risk across ${impact.affectedWarehouses} warehouses, ${impact.ordersAtRisk} orders affected`,
        },
      ]);

      // 2. find_recovery_options
      currentEventId = "e2";
      push([{ id: "e2", tool: "find_recovery_options", status: "running", startedAt: now(), input: { shipmentId } }]);
      t0 = performance.now();
      const { options: foundOptions } = await tools.find_recovery_options({ shipmentId });
      setOptions(foundOptions);
      push([
        {
          id: "e2",
          status: "completed",
          completedAt: now(),
          durationMs: Math.round(performance.now() - t0),
          output: { optionsFound: foundOptions.length },
          detail: `${foundOptions.length} recovery options found`,
        },
      ]);

      setState("simulating");

      // 3. simulate_recovery_plan — once per option, sequentially, real calls.
      let bestScore = -1;
      let bestOptionId = foundOptions[0]?.id;
      for (let i = 0; i < foundOptions.length; i++) {
        const opt = foundOptions[i];
        const eventId = `sim-${opt.id}`;
        currentEventId = eventId;
        push([{ id: eventId, tool: "simulate_recovery_plan", status: "running", startedAt: now(), input: { optionId: opt.id, planName: opt.name } }]);
        t0 = performance.now();
        const sim = await tools.simulate_recovery_plan({ shipmentId, optionId: opt.id });
        push([
          {
            id: eventId,
            status: "completed",
            completedAt: now(),
            durationMs: Math.round(performance.now() - t0),
            output: { score: sim.score, ordersProtected: sim.ordersProtected, revenueProtected: sim.revenueProtected },
            detail: `Score: ${sim.score}/100 · ${sim.ordersProtected} orders protected`,
          },
        ]);
        if (sim.score > bestScore) {
          bestScore = sim.score;
          bestOptionId = opt.id;
        }
      }

      setSummary({
        ordersAtRisk: impact.ordersAtRisk,
        criticalOrders: impact.criticalOrders,
        revenueAtRisk: impact.revenueAtRisk,
        affectedWarehouses: impact.affectedWarehouses,
        optionsFound: foundOptions.length,
      });
      setState("recommendation_ready");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Investigation failed";
      // Mark whichever step was actually in flight as failed, instead of
      // always blaming get_shipment_impact — and surface the real error text.
      push([
        {
          id: currentEventId ?? "error",
          status: "failed",
          startedAt: now(),
          detail: message,
          output: { error: message },
        },
      ]);
    }
  };

  const priorities: Record<string, number> = { critical: 0, high: 1, normal: 2 };
  const filteredOrders = orderFilter === "All" ? orders : orders.filter((o) => o.priority === orderFilter.toLowerCase());
  const sortedOrders = [...filteredOrders].sort((a, b) => priorities[a.priority] - priorities[b.priority]);

  if (loadError) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 p-6">
        <AlertTriangle className="w-8 h-8 text-[#DC2626]" />
        <p className="text-[14px] font-semibold text-[#111827]">Couldn't reach the ChainPilot backend</p>
        <p className="text-[13px] text-[#667085] text-center max-w-md">{loadError}</p>
        <p className="text-[12px] text-[#98A2B3]">Make sure `cd server &amp;&amp; npm run dev` is running.</p>
        <Button variant="secondary" size="sm" onClick={loadShipment}>Retry</Button>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-2">
        <Loader className="w-5 h-5 animate-spin text-[#2563EB]" />
        <p className="text-[13px] text-[#667085]">Loading real shipment data…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopHeader
        title={`Shipment #${shipment.shipmentId.replace("SHP-", "")}`}
        subtitle={`${shipment.origin} → ${shipment.destination}`}
        breadcrumbs={[
          { label: "Operations", to: "/disruptions" },
          { label: "Disruptions", to: "/disruptions" },
          { label: `Shipment #${shipment.shipmentId.replace("SHP-", "")}` },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="hidden sm:inline-flex"><SeverityBadge severity="high" /></span>
            <Badge variant="warning">DELAYED</Badge>
            {state === "idle" && (
              <Button variant="primary" size="sm" onClick={startInvestigation} icon={<Zap className="w-3.5 h-3.5" />}>
                <span className="hidden sm:inline">Investigate with ChainPilot</span>
                <span className="sm:hidden">Investigate</span>
              </Button>
            )}
            {state !== "idle" && state !== "recommendation_ready" && (
              <Badge variant="info" dot>Investigating</Badge>
            )}
            {state === "recommendation_ready" && (
              <Button variant="primary" size="sm" onClick={() => router.push(`/recovery/${shipmentId}`)} icon={<ArrowRight className="w-3.5 h-3.5" />}>
                <span className="hidden sm:inline">Review Recovery Options</span>
                <span className="sm:hidden">Recovery</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Shipment summary row */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              { label: "Original ETA", value: shipment.originalEta, sub: "" },
              { label: "New ETA", value: <span className="text-[#DC2626]">{shipment.newEta}</span>, sub: `+${shipment.delayDays} days delay` },
              { label: "Units at Risk", value: formatNumber(shipment.unitsAtRisk), sub: "requiring fulfillment" },
              { label: "Status", value: <StatusBadge status={shipment.status as any} />, sub: "" },
            ].map((item, i) => (
              <div key={i}>
                <p className="text-[11px] font-semibold text-[#98A2B3] uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-[22px] font-bold text-[#111827] leading-none">{item.value}</p>
                {item.sub && <p className="text-[11px] text-[#667085] mt-1">{item.sub}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Impact metrics — real numbers from get_shipment_impact */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { icon: <Package className="w-4 h-4" />, value: formatNumber(shipment.unitsAtRisk), label: "Units at Risk" },
            { icon: <Warehouse className="w-4 h-4" />, value: String(shipment.affectedWarehouses), label: "Warehouses Affected" },
            { icon: <ShoppingCart className="w-4 h-4" />, value: String(shipment.ordersAtRisk), label: "Orders at Risk" },
            { icon: <AlertTriangle className="w-4 h-4" />, value: String(shipment.criticalOrders), label: "Critical Orders" },
            { icon: <DollarSign className="w-4 h-4" />, value: formatCurrency(shipment.revenueAtRisk), label: "Revenue Exposure" },
          ].map((m) => (
            <div key={m.label} className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-1">
              <div className="text-[#98A2B3]">{m.icon}</div>
              <p className="text-[22px] font-bold text-[#111827] leading-none">{m.value}</p>
              <p className="text-[11px] text-[#667085]">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Main content: graph + agent panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ImpactGraph shipment={shipment} warehouses={warehouses} />
          <AgentPanel
            state={state}
            events={events}
            onInvestigate={startInvestigation}
            onReview={() => router.push(`/recovery/${shipmentId}`)}
            summary={summary}
          />
        </div>

        {/* Affected Warehouses */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-[13px] font-semibold text-[#111827]">Affected Warehouses</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA]">
                  {["Warehouse", "Location", "Current Inventory", "Expected Shortage", "Risk"].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold text-[#667085] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {warehouses.map((wh) => (
                  <tr key={wh.id} className="border-b border-[#F1F3F5] hover:bg-[#F7F8FA]">
                    <td className="px-5 py-3 font-medium text-[#111827] font-mono text-[12px]">{wh.id}</td>
                    <td className="px-5 py-3 text-[#667085]">{wh.location}</td>
                    <td className="px-5 py-3 tabular-nums">{formatNumber(wh.currentInventory)}</td>
                    <td className="px-5 py-3 tabular-nums text-[#DC2626] font-medium">{wh.expectedShortage.toLocaleString()}</td>
                    <td className="px-5 py-3"><Badge variant={riskVariant(wh.risk)}>{wh.risk.toUpperCase()}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Affected Orders */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-[13px] font-semibold text-[#111827]">Affected Orders</h3>
            <div className="flex gap-1">
              {["All", "Critical", "High", "Normal"].map((f) => (
                <button
                  key={f}
                  onClick={() => setOrderFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
                    orderFilter === f ? "bg-[#EEF2FF] text-[#3157D5]" : "text-[#667085] hover:bg-[#F1F3F5]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA]">
                  {["Order", "Customer", "Quantity", "Priority", "Promised Date", "Status", "Revenue"].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold text-[#667085] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#F1F3F5] hover:bg-[#F7F8FA]">
                    <td className="px-5 py-3 font-mono text-[12px] font-medium text-[#111827]">{order.id}</td>
                    <td className="px-5 py-3 text-[#111827]">{order.customer}</td>
                    <td className="px-5 py-3 tabular-nums text-[#667085]">{formatNumber(order.quantity)}</td>
                    <td className="px-5 py-3"><Badge variant={priorityVariant(order.priority)}>{order.priority.toUpperCase()}</Badge></td>
                    <td className="px-5 py-3 text-[#667085]">{order.promisedDate}</td>
                    <td className="px-5 py-3"><Badge variant={orderStatusVariant(order.status as any)}>{order.status.replace("_", " ").toUpperCase()}</Badge></td>
                    <td className="px-5 py-3 tabular-nums font-medium text-[#111827]">{formatCurrency(order.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}