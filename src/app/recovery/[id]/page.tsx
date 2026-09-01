"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  CheckCircle,
  Circle,
  Loader,
  XCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  MessageCircle,
  Send,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { formatCurrency } from "@/utils/format";
import { tools, approvalApi, dataApi, type RecoveryOptionSummary, type SimulationResult, type VerificationResult } from "@/mcp/client";

type FlowState =
  | "loading"
  | "comparison"
  | "approved"
  | "executing"
  | "executed"
  | "verifying"
  | "recovered"
  | "rejected"
  | "error";

// A recovery option merged with its real, freshly-computed simulation result.
type FullOption = RecoveryOptionSummary & SimulationResult;

const EXEC_STEPS = [
  { id: "exec", label: "execute_recovery_plan", detail: "Updating order statuses and rescheduling the shipment" },
  { id: "verify", label: "verify_recovery", detail: "Re-checking risk exposure to confirm the recovery worked" },
];

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-[#667085] w-32 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
        <div className="h-full bg-[#3157D5] rounded-full transition-all duration-700" style={{ width: `${value}%` }} />
      </div>
      <span className="text-[12px] font-medium text-[#111827] tabular-nums w-8 text-right">{value}</span>
    </div>
  );
}

const SUGGESTED_QUESTIONS = ["What's the cheapest option?", "Which is fastest?", "Which is safest?", "What do you recommend?"];

function AskBox({ shipmentId }: { shipmentId: string }) {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [history, setHistory] = useState<{ question: string; answer: string; toolsCalled: string[] }[]>([]);

  const ask = async (q: string) => {
    if (!q.trim() || asking) return;
    setAsking(true);
    try {
      const res = await dataApi.ask(shipmentId, q);
      setHistory((h) => [...h, { question: q, answer: res.answer, toolsCalled: res.toolsCalled }]);
      setQuestion("");
    } catch {
      setHistory((h) => [...h, { question: q, answer: "Something went wrong answering that — try again.", toolsCalled: [] }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle className="w-4 h-4 text-[#3157D5]" />
        <p className="text-[13px] font-semibold text-[#111827]">Ask about this disruption</p>
      </div>
      <p className="text-[11px] text-[#98A2B3] mb-3">
        Not a chatbot — this recognizes what you're asking and calls the same real tools (like <span className="font-mono">simulate_recovery_plan</span>) to compute a genuine answer. No AI model, no invented numbers.
      </p>

      {history.length > 0 && (
        <div className="space-y-3 mb-3">
          {history.map((h, i) => (
            <div key={i} className="animate-fade-in">
              <p className="text-[13px] font-medium text-[#111827] mb-1">{h.question}</p>
              <p className="text-[13px] text-[#667085] leading-relaxed">{h.answer}</p>
              {h.toolsCalled.length > 0 && (
                <p className="text-[10px] font-mono text-[#98A2B3] mt-1">via {h.toolsCalled.join(" → ")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            disabled={asking}
            className="px-2.5 py-1 rounded-full border border-[#E5E7EB] text-[11px] text-[#667085] hover:bg-[#F7F8FA] hover:border-[#C7D2FE] transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          className="flex-1 border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-[#111827] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#3157D5] focus:border-transparent"
          placeholder="Ask a question about cost, speed, risk, or the recommendation…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(question)}
          disabled={asking}
        />
        <Button variant="primary" size="sm" icon={asking ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} onClick={() => ask(question)} disabled={asking || !question.trim()}>
          Ask
        </Button>
      </div>
    </div>
  );
}

function RecoveryOptionCard({ option, selected, isBest, onSelect }: { option: FullOption; selected: boolean; isBest: boolean; onSelect: () => void }) {
  const riskColors = {
    low: "text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]",
    medium: "text-[#D97706] bg-[#FFFBEB] border-[#FDE68A]",
    high: "text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]",
  };

  return (
    <button
      onClick={onSelect}
      className={`relative text-left bg-white rounded-xl border-2 p-5 transition-all ${
        selected ? "border-[#3157D5] shadow-sm" : "border-[#E5E7EB] hover:border-[#C7D2FE]"
      }`}
    >
      {isBest && <div className="absolute -top-px left-4 right-4 h-0.5 bg-[#3157D5] rounded-full" />}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-[14px] font-semibold text-[#111827]">{option.name}</p>
          {isBest && <span className="text-[10px] font-semibold text-[#3157D5] uppercase tracking-wider">Recommended by ChainPilot</span>}
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${riskColors[option.risk]}`}>{option.risk.toUpperCase()} RISK</span>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#667085]">Additional cost</span>
          <span className="font-semibold text-[#111827]">{formatCurrency(option.additionalCost)}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#667085]">Recovery time</span>
          <span className="font-semibold text-[#111827]">{option.recoveryDays} days</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#667085]">Orders protected</span>
          <span className="font-semibold text-[#15803D]">{option.ordersProtected} of {option.ordersProtected + option.ordersStillAtRisk}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#667085]">Orders still at risk</span>
          <span className={`font-semibold ${option.ordersStillAtRisk > 2 ? "text-[#DC2626]" : "text-[#D97706]"}`}>{option.ordersStillAtRisk}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-[#E5E7EB]">
        <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div className="h-full bg-[#3157D5] rounded-full" style={{ width: `${option.score}%` }} />
        </div>
        <span className="text-[12px] font-semibold text-[#111827] tabular-nums">{option.score}/100</span>
      </div>
    </button>
  );
}

function ComparisonTable({ options, selectedId, bestId, onSelect }: { options: FullOption[]; selectedId: string; bestId: string; onSelect: (id: string) => void }) {
  const totalOrders = options[0] ? options[0].ordersProtected + options[0].ordersStillAtRisk : 0;
  const rows: { label: string; render: (o: FullOption) => string }[] = [
    { label: "Additional Cost", render: (o) => formatCurrency(o.additionalCost) },
    { label: "Recovery Time", render: (o) => `${o.recoveryDays} days` },
    { label: "Orders Protected", render: (o) => `${o.ordersProtected} of ${totalOrders}` },
    { label: "Orders Still At Risk", render: (o) => String(o.ordersStillAtRisk) },
    { label: "Revenue Protected", render: (o) => formatCurrency(o.revenueProtected) },
    { label: "Risk Level", render: (o) => o.risk.charAt(0).toUpperCase() + o.risk.slice(1) },
    { label: "Score", render: (o) => `${o.score}/100` },
  ];

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E5E7EB]">
        <h3 className="text-[13px] font-semibold text-[#111827]">Detailed Comparison</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA]">
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-[#667085] uppercase tracking-wider">Metric</th>
              {options.map((o) => (
                <th
                  key={o.id}
                  className={`text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-[#EEF2FF] transition-colors ${
                    selectedId === o.id ? "text-[#3157D5] bg-[#EEF2FF]" : "text-[#667085]"
                  }`}
                  onClick={() => onSelect(o.id)}
                >
                  {o.name}
                  {o.id === bestId && <span className="ml-1 text-[#3157D5]">★</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-[#F1F3F5] hover:bg-[#F7F8FA]">
                <td className="px-5 py-2.5 text-[#667085] font-medium">{row.label}</td>
                {options.map((o) => (
                  <td key={o.id} className={`px-5 py-2.5 font-medium ${selectedId === o.id ? "text-[#3157D5]" : "text-[#111827]"}`}>
                    {row.render(o)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExecutionTimeline({ stepsDone }: { stepsDone: number }) {
  return (
    <div className="space-y-2">
      {EXEC_STEPS.map((step, i) => {
        const done = i < stepsDone;
        const running = i === stepsDone;
        return (
          <div key={step.id} className="flex items-start gap-3 animate-fade-in">
            <div className="shrink-0 mt-0.5">
              {done ? <CheckCircle className="w-4 h-4 text-[#15803D]" /> : running ? <Loader className="w-4 h-4 text-[#2563EB] animate-spin" /> : <Circle className="w-4 h-4 text-[#98A2B3]" />}
            </div>
            <div>
              <p className={`text-[13px] font-mono font-medium ${done ? "text-[#111827]" : running ? "text-[#2563EB]" : "text-[#98A2B3]"}`}>{step.label}</p>
              {(done || running) && <p className="text-[11px] text-[#667085]">{step.detail}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WebMCPActivity({ stepsDone, planId, strategy }: { stepsDone: number; planId: string; strategy: string }) {
  return (
    <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-4">
      <p className="text-[10px] font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">WebMCP Activity (real calls)</p>
      <div className="font-mono text-[12px] space-y-1">
        <div className="text-[#3157D5] font-medium">execute_recovery_plan</div>
        <div className="text-[#667085]">{planId} · {strategy}</div>
        <div className="text-[#98A2B3] text-[11px] mt-2">Status: {stepsDone >= EXEC_STEPS.length ? "completed" : "running"}</div>
        <div className="space-y-1 mt-2">
          {EXEC_STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              {i < stepsDone ? <CheckCircle className="w-3 h-3 text-[#15803D]" /> : i === stepsDone ? <Loader className="w-3 h-3 text-[#2563EB] animate-spin" /> : <Circle className="w-3 h-3 text-[#98A2B3]" />}
              <span className={`text-[11px] ${i < stepsDone ? "text-[#15803D]" : i === stepsDone ? "text-[#2563EB]" : "text-[#98A2B3]"}`}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VerificationScreen({ v, strategy, additionalCost, onBack }: { v: VerificationResult; strategy: string; additionalCost: number; onBack: () => void }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-[#15803D] flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-[11px] font-semibold text-[#15803D] uppercase tracking-wider mb-1">{v.recoveryConfirmed ? "Recovery Confirmed" : "Verification Complete"}</p>
        <p className="text-[24px] font-bold text-[#111827] mb-2">Recovery Verification</p>
        <p className="text-[13px] text-[#667085]">
          verify_recovery re-checked live order data after execution and {v.recoveryConfirmed ? "confirmed the exposure dropped." : "found no improvement."}
        </p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-[#E5E7EB]">
          <div className="p-5">
            <p className="text-[11px] font-semibold text-[#DC2626] uppercase tracking-wider mb-4">Before</p>
            {[
              { label: "Orders at Risk", value: v.before.ordersAtRisk },
              { label: "Revenue Exposure", value: formatCurrency(v.before.revenueAtRisk) },
            ].map((item) => (
              <div key={item.label} className="mb-3">
                <p className="text-[22px] font-bold text-[#DC2626]">{item.value}</p>
                <p className="text-[11px] text-[#667085]">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="p-5">
            <p className="text-[11px] font-semibold text-[#15803D] uppercase tracking-wider mb-4">After</p>
            {[
              { label: "Orders at Risk", value: v.after.ordersAtRisk },
              { label: "Revenue Exposure", value: formatCurrency(v.after.revenueAtRisk) },
            ].map((item) => (
              <div key={item.label} className="mb-3">
                <p className="text-[22px] font-bold text-[#15803D]">{item.value}</p>
                <p className="text-[11px] text-[#667085]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Orders Protected", value: String(v.ordersProtected), color: "text-[#15803D]" },
          { label: "Revenue Protected", value: formatCurrency(v.revenueProtected), color: "text-[#15803D]" },
          { label: "Additional Cost", value: formatCurrency(additionalCost), color: "text-[#D97706]" },
        ].map((m) => (
          <div key={m.label} className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <p className={`text-[22px] font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[11px] text-[#667085] mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <p className="text-[11px] font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">Recovery Complete</p>
        <p className="text-[14px] text-[#111827] leading-relaxed mb-1">
          Shipment recovered using <strong>{strategy}</strong>.
        </p>
        <p className="text-[13px] text-[#667085] mb-1">{v.ordersProtected} orders protected, verified live from order data.</p>
        <p className="text-[13px] text-[#667085] mb-4">
          Revenue exposure reduced from {formatCurrency(v.before.revenueAtRisk)} → {formatCurrency(v.after.revenueAtRisk)}.
        </p>
        <p className="text-[12px] text-[#98A2B3]">Additional recovery cost: {formatCurrency(additionalCost)}</p>
        <Button variant="secondary" size="sm" className="mt-4" icon={<ArrowLeft className="w-3.5 h-3.5" />} onClick={onBack}>
          Back to Control Tower
        </Button>
      </div>
    </div>
  );
}

const FALLBACK_SHIPMENT_ID = "SHP-482";

export default function RecoveryPlanPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const shipmentId = params?.id ?? FALLBACK_SHIPMENT_ID;

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [options, setOptions] = useState<FullOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [execStepsDone, setExecStepsDone] = useState(0);
  const [approving, setApproving] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);

  // Real: fetch the option list, then run the deterministic simulate_recovery_plan
  // for each option so cards/table show live scores instead of static numbers.
  const loadOptions = useCallback(async () => {
    try {
      setLoadError(null);
      setFlowState("loading");
      const { options: found } = await tools.find_recovery_options({ shipmentId });
      const simulated = await Promise.all(
        found.map(async (o) => {
          const sim = await tools.simulate_recovery_plan({ shipmentId, optionId: o.id });
          return { ...o, ...sim } as FullOption;
        })
      );
      setOptions(simulated);
      const best = simulated.reduce((a, b) => (b.score > a.score ? b : a), simulated[0]);
      setSelectedOptionId(best?.id ?? "");
      setFlowState("comparison");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load recovery options. Is the backend running?");
      setFlowState("error");
    }
  }, [shipmentId]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const bestOption = options.length ? options.reduce((a, b) => (b.score > a.score ? b : a), options[0]) : null;
  const selectedOption = options.find((o) => o.id === selectedOptionId) ?? bestOption;

  const handleApprove = async () => {
    if (!selectedOption) return;
    setApproving(true);
    try {
      // Human action — plain backend call, NOT a WebMCP tool.
      await approvalApi.approve(selectedOption.planId);
      setApproving(false);
      setShowApproveModal(false);
      setFlowState("approved");

      await new Promise((r) => setTimeout(r, 500)); // brief pacing only, no fake data
      setFlowState("executing");

      // Real tool call — this is the WRITE tool. Server refuses if not approved.
      const result = await tools.execute_recovery_plan({ planId: selectedOption.planId });
      if (!result.success) {
        throw new Error(result.error.message);
      }
      setExecStepsDone(1);

      await new Promise((r) => setTimeout(r, 400));

      // Real tool call — re-derives before/after from live order data.
      const v = await tools.verify_recovery({ planId: selectedOption.planId });
      setVerification(v);
      setExecStepsDone(2);

      setFlowState("executed");
      await new Promise((r) => setTimeout(r, 900));
      setFlowState("verifying");
      await new Promise((r) => setTimeout(r, 600));
      setFlowState("recovered");
    } catch (err) {
      setApproving(false);
      setLoadError(err instanceof Error ? err.message : "Execution failed");
      setFlowState("error");
    }
  };

  const handleReject = async () => {
    if (!selectedOption) return;
    setShowRejectModal(false);
    try {
      await approvalApi.reject(selectedOption.planId, rejectReason || undefined);
    } catch {
      // Rejection is best-effort on the backend; UI reflects it regardless.
    }
    setFlowState("rejected");
  };

  if (flowState === "loading") {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-2">
        <Loader className="w-5 h-5 animate-spin text-[#2563EB]" />
        <p className="text-[13px] text-[#667085]">Simulating recovery options via WebMCP tools…</p>
      </div>
    );
  }

  if (flowState === "error") {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 p-6">
        <AlertTriangle className="w-8 h-8 text-[#DC2626]" />
        <p className="text-[14px] font-semibold text-[#111827]">Something went wrong</p>
        <p className="text-[13px] text-[#667085] text-center max-w-md">{loadError}</p>
        <Button variant="secondary" size="sm" onClick={loadOptions}>Retry</Button>
      </div>
    );
  }

  if (!selectedOption || !bestOption) return null;

  if (flowState === "recovered" && verification) {
    return (
      <div className="flex flex-col h-full">
        <TopHeader
          title="Recovery Verification"
          subtitle={`${shipmentId} · ${selectedOption.name}`}
          breadcrumbs={[{ label: "Recovery", to: "/recovery" }, { label: selectedOption.planId }, { label: "Verified" }]}
        />
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <VerificationScreen v={verification} strategy={selectedOption.name} additionalCost={selectedOption.additionalCost} onBack={() => router.push("/")} />
        </div>
      </div>
    );
  }

  if (flowState === "executing" || flowState === "approved" || flowState === "executed" || flowState === "verifying") {
    return (
      <div className="flex flex-col h-full">
        <TopHeader
          title={`Recovery Plan ${selectedOption.planId}`}
          subtitle={`${shipmentId} · ${selectedOption.name}`}
          breadcrumbs={[{ label: "Recovery", to: "/recovery" }, { label: selectedOption.planId }, { label: "Executing" }]}
          actions={<Badge variant="primary" dot>Executing</Badge>}
        />
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg">
              <CheckCircle className="w-4 h-4 text-[#3157D5]" />
              <span className="text-[13px] font-medium text-[#3157D5]">Approved</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#98A2B3]" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
              <Loader className="w-4 h-4 text-[#2563EB] animate-spin" />
              <span className="text-[13px] font-medium text-[#2563EB]">Executing</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <p className="text-[11px] font-semibold text-[#98A2B3] uppercase tracking-wider mb-4">Execution Timeline</p>
              <ExecutionTimeline stepsDone={execStepsDone} />
            </div>
            <WebMCPActivity stepsDone={execStepsDone} planId={selectedOption.planId} strategy={selectedOption.name} />
          </div>

          {flowState === "executed" && (
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-[#15803D]" />
                <p className="text-[14px] font-semibold text-[#15803D]">Recovery Executed</p>
              </div>
              <p className="text-[13px] text-[#667085]">execute_recovery_plan and verify_recovery both completed. Moving to verification…</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (flowState === "rejected") {
    return (
      <div className="flex flex-col h-full">
        <TopHeader
          title={`Recovery Plan ${selectedOption.planId}`}
          subtitle="Rejected"
          breadcrumbs={[{ label: "Recovery", to: "/recovery" }, { label: selectedOption.planId }]}
          actions={<Badge variant="critical">REJECTED</Badge>}
        />
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 max-w-lg">
            <XCircle className="w-8 h-8 text-[#DC2626] mb-3" />
            <p className="text-[15px] font-semibold text-[#111827] mb-2">Recovery Plan Rejected</p>
            {rejectReason && <p className="text-[13px] text-[#667085] mb-4">Reason: {rejectReason}</p>}
            <Button variant="secondary" size="sm" onClick={() => setFlowState("comparison")}>Back to Options</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopHeader
        title="Recovery Analysis"
        subtitle={`${shipmentId} · ${selectedOption.name}`}
        breadcrumbs={[{ label: "Recovery", to: "/recovery" }, { label: shipmentId }]}
        actions={<Badge variant="primary">Recommendation Ready</Badge>}
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[20px] font-bold text-[#111827]">Recovery Analysis</h2>
            <p className="text-[13px] text-[#667085]">{shipmentId} · {options.length} strategies simulated via simulate_recovery_plan</p>
          </div>
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />} onClick={() => router.push(`/disruptions/${shipmentId}`)}>
            Back to Disruption
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map((option) => (
            <RecoveryOptionCard
              key={option.id}
              option={option}
              selected={selectedOptionId === option.id}
              isBest={bestOption.id === option.id}
              onSelect={() => setSelectedOptionId(option.id)}
            />
          ))}
        </div>

        <ComparisonTable options={options} selectedId={selectedOptionId} bestId={bestOption.id} onSelect={setSelectedOptionId} />

        <AskBox shipmentId={shipmentId} />

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <p className="text-[11px] font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">Why ChainPilot Recommends This</p>
          <p className="text-[13px] text-[#111827] leading-relaxed">
            {bestOption.name} scores highest ({bestOption.score}/100) among the {options.length} simulated options — balancing cost, recovery speed, risk, and how many of the {bestOption.ordersProtected + bestOption.ordersStillAtRisk} affected orders it protects. All scores are computed by a fixed, deterministic formula, not asserted by the AI.
          </p>
          <div className="mt-4 space-y-2">
            {Object.entries(selectedOption.scoreBreakdown).map(([k, v]) => (
              <ScoreBar key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} value={v as number} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E5E7EB]">
            <span className="text-[12px] text-[#667085]">Recovery Score</span>
            <span className="text-[22px] font-bold text-[#3157D5]">{selectedOption.score}</span>
            <span className="text-[13px] text-[#98A2B3]">/ 100</span>
            <span className="text-[11px] text-[#667085] ml-1">Based on cost, recovery time, risk and customer impact.</span>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <p className="text-[11px] font-semibold text-[#98A2B3] uppercase tracking-wider mb-3">Proposed Recovery Plan</p>
          <ul className="space-y-3">
            {selectedOption.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#3157D5] text-[12px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-[13px] text-[#111827] mt-0.5">{action}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border-2 border-[#3157D5] rounded-xl overflow-hidden">
          <div className="bg-[#EEF2FF] px-5 py-3 flex items-center gap-2 border-b border-[#C7D2FE]">
            <ShieldCheck className="w-4 h-4 text-[#3157D5]" />
            <p className="text-[13px] font-semibold text-[#3157D5]">Human Approval Required</p>
          </div>
          <div className="p-5">
            <p className="text-[13px] text-[#667085] mb-4">
              ChainPilot has prepared a recovery plan (<span className="font-mono">{selectedOption.planId}</span>) but has <strong>not executed it</strong>. execute_recovery_plan will refuse to run until you approve.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 p-4 bg-[#F7F8FA] rounded-lg border border-[#E5E7EB]">
              {[
                { label: "Additional Cost", value: formatCurrency(selectedOption.additionalCost) },
                { label: "Orders Protected", value: String(selectedOption.ordersProtected) },
                { label: "Orders Still At Risk", value: String(selectedOption.ordersStillAtRisk) },
                { label: "Expected Recovery", value: `${selectedOption.recoveryDays} days` },
                { label: "Risk Level", value: selectedOption.risk.charAt(0).toUpperCase() + selectedOption.risk.slice(1) },
                { label: "Strategy", value: selectedOption.name },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[11px] text-[#98A2B3] mb-0.5">{item.label}</p>
                  <p className="text-[13px] font-semibold text-[#111827]">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="primary" size="md" icon={<ShieldCheck className="w-4 h-4" />} onClick={() => setShowApproveModal(true)}>
                Approve & Execute
              </Button>
              <Button variant="outline" size="md" onClick={() => setShowRejectModal(true)} className="text-[#DC2626] border-[#DC2626] hover:bg-[#FEF2F2]">
                Reject Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showApproveModal}
        onClose={() => !approving && setShowApproveModal(false)}
        title="Approve Recovery Plan?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowApproveModal(false)} disabled={approving}>Cancel</Button>
            <Button variant="primary" size="sm" loading={approving} onClick={handleApprove} icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              Approve & Execute
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-[#667085]">You are approving the following actions:</p>
          <ul className="space-y-2">
            {selectedOption.actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-[#111827]">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#3157D5] shrink-0" />
                {a}
              </li>
            ))}
          </ul>
          <div className="mt-4 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg">
            <p className="text-[12px] text-[#D97706] font-medium">Additional recovery cost</p>
            <p className="text-[20px] font-bold text-[#111827] mt-0.5">{formatCurrency(selectedOption.additionalCost)}</p>
          </div>
          <p className="text-[12px] text-[#667085]">This calls the real execute_recovery_plan WebMCP tool, which checks server-side that this plan is approved.</p>
        </div>
      </Modal>

      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Recovery Plan"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleReject}>Reject Plan</Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-[13px] text-[#667085]">Reason (optional)</label>
          <textarea
            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] text-[#111827] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#3157D5] focus:border-transparent resize-none"
            rows={3}
            placeholder="Explain why you're rejecting this plan…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
