import { Activity, User, Cpu } from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { Badge } from "@/components/shared/Badge";
import { mockActivityEvents } from "@/mock/data";
import type { ActivityEvent } from "@/types";

function typeIcon(type: ActivityEvent["type"]) {
  if (type === "ai") return <Cpu className="w-3.5 h-3.5 text-[#3157D5]" />;
  if (type === "human") return <User className="w-3.5 h-3.5 text-[#15803D]" />;
  return <Activity className="w-3.5 h-3.5 text-[#667085]" />;
}

function typeVariant(type: ActivityEvent["type"]) {
  if (type === "ai") return "primary" as const;
  if (type === "human") return "success" as const;
  return "neutral" as const;
}

function typLabel(type: ActivityEvent["type"]) {
  if (type === "ai") return "AI";
  if (type === "human") return "Human";
  return "System";
}

export default function ActivityPage() {
  return (
    <div className="flex flex-col h-full">
      <TopHeader
        title="Activity"
        subtitle="System · Audit Log"
        breadcrumbs={[{ label: "System" }, { label: "Activity" }]}
      />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-2xl space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-[11px] font-semibold text-[#98A2B3] uppercase tracking-wider">Today</p>
          </div>
          {mockActivityEvents.map((event, i) => (
            <div key={event.id} className="flex items-start gap-4 py-3 border-b border-[#F1F3F5] animate-fade-in">
              <span className="text-[11px] text-[#98A2B3] tabular-nums font-mono w-12 shrink-0 mt-0.5">{event.timestamp}</span>
              <div className="w-7 h-7 rounded-full bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                {typeIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[13px] font-medium text-[#111827]">{event.title}</p>
                  <Badge variant={typeVariant(event.type)} size="sm">{typLabel(event.type)}</Badge>
                </div>
                {event.description && (
                  <p className="text-[12px] text-[#667085]">{event.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
