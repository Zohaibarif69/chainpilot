import type { RiskLevel, ShipmentStatus, OrderStatus, RecoveryPlanStatus, PriorityLevel } from "../../types";

type BadgeVariant =
  | "critical"
  | "warning"
  | "success"
  | "info"
  | "neutral"
  | "primary";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  size?: "sm" | "md";
}

const variantClasses: Record<BadgeVariant, string> = {
  critical: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  warning: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
  success: "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]",
  info: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  neutral: "bg-[#F1F3F5] text-[#667085] border-[#E5E7EB]",
  primary: "bg-[#EEF2FF] text-[#3157D5] border-[#C7D2FE]",
};

const dotClasses: Record<BadgeVariant, string> = {
  critical: "bg-[#DC2626]",
  warning: "bg-[#D97706]",
  success: "bg-[#15803D]",
  info: "bg-[#2563EB]",
  neutral: "bg-[#667085]",
  primary: "bg-[#3157D5]",
};

export function Badge({ variant = "neutral", children, dot, size = "sm" }: BadgeProps) {
  const sizeClass = size === "md" ? "px-2.5 py-1 text-[13px]" : "px-2 py-0.5 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClass} ${variantClasses[variant]}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotClasses[variant]} ${variant === "info" ? "pulse-dot" : ""}`} />
      )}
      {children}
    </span>
  );
}

export function riskVariant(risk: RiskLevel): BadgeVariant {
  return risk === "high" ? "critical" : risk === "medium" ? "warning" : "success";
}

export function statusVariant(status: ShipmentStatus): BadgeVariant {
  switch (status) {
    case "delayed": return "warning";
    case "at_risk": return "critical";
    case "on_time": return "success";
    case "recovered": return "success";
    default: return "neutral";
  }
}

export function orderStatusVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case "critical": return "critical";
    case "at_risk": return "warning";
    case "on_time": return "success";
    case "recovered": return "success";
    case "protected": return "success";
    default: return "neutral";
  }
}

export function priorityVariant(priority: PriorityLevel): BadgeVariant {
  switch (priority) {
    case "critical": return "critical";
    case "high": return "warning";
    case "normal": return "neutral";
    default: return "neutral";
  }
}

export function planStatusVariant(status: RecoveryPlanStatus): BadgeVariant {
  switch (status) {
    case "completed": return "success";
    case "approved": return "primary";
    case "executing": return "info";
    case "awaiting_approval": return "warning";
    case "rejected": return "critical";
    case "failed": return "critical";
    case "draft": return "neutral";
    default: return "neutral";
  }
}

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const labels: Record<ShipmentStatus, string> = {
    delayed: "DELAYED",
    at_risk: "AT RISK",
    on_time: "ON TIME",
    recovered: "RECOVERED",
  };
  return <Badge variant={statusVariant(status)}>{labels[status]}</Badge>;
}

export function SeverityBadge({ severity }: { severity: "high" | "medium" | "low" | "critical" }) {
  const v = severity === "critical" || severity === "high" ? "critical" : severity === "medium" ? "warning" : "success";
  return <Badge variant={v}>{severity.toUpperCase()}</Badge>;
}
